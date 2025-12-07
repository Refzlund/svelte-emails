import { isRunnableDevEnvironment, type Plugin, type ViteDevServer, type ModuleNode } from 'vite'
import { watch, type FSWatcher } from 'chokidar'
import { discoverAll, extractPreviewText, extractCategory, extractOrder, getCliSrcDir } from './discovery.js'
import { readFile } from 'node:fs/promises'
import type { ServerResponse } from 'node:http'
import type { EmailFile, ViewMode } from './types.js'
import { normalizePath, toSafeEmails, toSafeEmail, invalidateModule, debounce, sortByOrder } from './utils.js'
import { join } from 'node:path'

const VIRTUAL_MODULE_ID = 'virtual:email-list'
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID

/** Virtual module for static build mode detection */
const VIRTUAL_BUILD_MODE_ID = 'virtual:svelte-emails-build-mode'

/** Common watcher ignore patterns */
const WATCHER_IGNORE = ['**/node_modules/**', '**/.git/**', '**/.svelte-kit/**']

export interface EmailListPluginOptions {
	cwd: string
	/**
	 * Watch bundled examples/documentation folders for changes.
	 * Only enable this during library development (e.g., `bun dev` in the CLI package).
	 * When false (default), examples/docs are treated as static bundled content.
	 */
	watchBundled?: boolean
}

/** All files organized by mode */
interface AllFiles {
	emails: EmailFile[]
	examples: EmailFile[]
	documentation: EmailFile[]
}

/** Get all file paths from AllFiles */
function getAllPaths(files: AllFiles): Set<string> {
	return new Set([
		...files.emails.map((e) => e.path),
		...files.examples.map((e) => e.path),
		...files.documentation.map((e) => e.path)
	])
}

/** Get all files as flat array */
function getAllFilesFlat(files: AllFiles): EmailFile[] {
	return [...files.emails, ...files.examples, ...files.documentation]
}

/** Convert AllFiles to safe format for client */
function toSafeAllFiles(files: AllFiles) {
	return {
		emails: toSafeEmails(files.emails),
		examples: toSafeEmails(files.examples),
		documentation: toSafeEmails(files.documentation)
	}
}

/** Create a chokidar watcher with standard options */
function createWatcher(paths: string[], depth: number): FSWatcher {
	return watch(paths, {
		ignored: WATCHER_IGNORE,
		ignoreInitial: true,
		persistent: true,
		usePolling: false,
		depth,
		awaitWriteFinish: { stabilityThreshold: 50, pollInterval: 20 }
	})
}

/**
 * Vite plugin that provides:
 * - Virtual module with email file list
 * - API endpoints for rendering emails via SSR
 * - SSE for live updates when files change
 */
export function emailListPlugin(options: EmailListPluginOptions): Plugin {
	let allFiles: AllFiles = { emails: [], examples: [], documentation: [] }
	let watcher: FSWatcher | null = null
	let bundledWatcher: FSWatcher | null = null
	let discoveryInterval: ReturnType<typeof setInterval> | null = null
	const sseClients: Set<ServerResponse> = new Set()

	// Detect if we're in static build mode
	const isStaticBuild = process.env.SVELTE_EMAILS_BUILD === '1'

	/** Broadcast an SSE event to all connected clients */
	function broadcastUpdate(event: string, data: unknown): void {
		const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
		for (const client of sseClients) {
			try {
				if (!client.writableEnded) client.write(message)
			} catch {
				sseClients.delete(client)
			}
		}
	}

	/** Broadcast email list update */
	function broadcastEmailList(event: string, path: string): void {
		broadcastUpdate('emails', { ...toSafeAllFiles(allFiles), event, path })
	}

	return {
		name: 'svelte-emails-list',

		async buildStart() {
			allFiles = await discoverAll(options.cwd)
		},

		resolveId(id) {
			if (id === VIRTUAL_MODULE_ID) return RESOLVED_VIRTUAL_MODULE_ID
			if (id === VIRTUAL_BUILD_MODE_ID) return '\0' + VIRTUAL_BUILD_MODE_ID
		},

		load(id) {
			if (id === RESOLVED_VIRTUAL_MODULE_ID) {
				return `export default ${JSON.stringify(toSafeAllFiles(allFiles), null, 2)}`
			}
			if (id === '\0' + VIRTUAL_BUILD_MODE_ID) {
				return `export const isStaticBuild = ${isStaticBuild};`
			}
		},

		async configureServer(server) {
			// Discover all files if buildStart hasn't completed yet
			if (getAllFilesFlat(allFiles).length === 0) {
				allFiles = await discoverAll(options.cwd)
			}

			console.log(`   [svelte-emails] Found ${allFiles.emails.length} email(s), ${allFiles.examples.length} example(s), ${allFiles.documentation.length} doc(s)`)

			// Track watched directories to add new ones dynamically
			const watchedDirs = new Set<string>()

			// Get unique directories containing email files (only user's emails)
			function getEmailDirs(): string[] {
				const dirs = new Set<string>()
				for (const file of allFiles.emails) {
					dirs.add(normalizePath(file.path.substring(0, file.path.lastIndexOf('/'))))
				}
				return Array.from(dirs)
			}

			// Add directories to the watcher
			function updateWatchedDirs(): void {
				for (const dir of getEmailDirs()) {
					if (!watchedDirs.has(dir)) {
						watchedDirs.add(dir)
						watcher?.add(dir)
						console.log(`   [svelte-emails] Now watching: ${dir}`)
					}
				}
			}

			// Initial directories to watch
			const initialDirs = getEmailDirs()
			initialDirs.forEach((dir) => watchedDirs.add(dir))

			// If no emails found, watch the project root
			const watchPaths = initialDirs.length > 0 ? initialDirs : [normalizePath(options.cwd)]

			// Setup file watcher (depth:0 for user dirs, we dynamically add new dirs)
			watcher = createWatcher(watchPaths, initialDirs.length > 0 ? 0 : 10)

			// If watchBundled is enabled, add separate watcher for bundled content
			if (options.watchBundled) {
				const cliSrcDir = getCliSrcDir()
				const examplesDir = normalizePath(join(cliSrcDir, 'examples'))
				const documentationDir = normalizePath(join(cliSrcDir, 'documentation'))

				bundledWatcher = createWatcher([examplesDir, documentationDir], 10)
				bundledWatcher.on('all', (event, filePath) => {
					if (filePath.endsWith('.svelte')) handleFileChange(event, filePath)
				})

				console.log(`   [svelte-emails] Watching bundled examples: ${examplesDir}`)
				console.log(`   [svelte-emails] Watching bundled documentation: ${documentationDir}`)
			}

			watcher.on('ready', () => console.log(`   [svelte-emails] Watching for changes`))
			watcher.on('error', (error) => console.error(`   [svelte-emails] Watcher error:`, error))

			// Periodic discovery to find new files in new directories
			let lastFilePaths = getAllPaths(allFiles)

			discoveryInterval = setInterval(async () => {
				try {
					const newAllFiles = await discoverAll(options.cwd, true)
					const newPaths = getAllPaths(newAllFiles)

					const hasChanges = [...newPaths].some((p) => !lastFilePaths.has(p)) ||
						[...lastFilePaths].some((p) => !newPaths.has(p))

					if (hasChanges) {
						allFiles = await discoverAll(options.cwd, false)
						lastFilePaths = getAllPaths(allFiles)
						console.log(`   [svelte-emails] Discovered ${allFiles.emails.length} email(s), ${allFiles.examples.length} example(s), ${allFiles.documentation.length} doc(s)`)

						updateWatchedDirs()
						broadcastEmailList('discovery', '')
						invalidateModule(server, RESOLVED_VIRTUAL_MODULE_ID)
					}
				} catch {
					// Ignore discovery errors
				}
			}, 3000)

			// Debounced handler to coalesce rapid file events
			const handleFileChange = debounce(async (event: string, filePath: string) => {
				const normalizedPath = normalizePath(filePath)
				console.log(`   [svelte-emails] [${event}] ${normalizedPath}`)

				if (event === 'add' || event === 'unlink') {
					allFiles = await discoverAll(options.cwd, false)
					lastFilePaths = getAllPaths(allFiles)
					if (event === 'add') updateWatchedDirs()
				}

				if (event === 'change') {
					const changedFile = getAllFilesFlat(allFiles).find((e) => normalizePath(e.path) === normalizedPath)
					if (changedFile) {
						try {
							const content = await readFile(changedFile.path, 'utf-8')
							const newPreview = extractPreviewText(content)
							const newCategory = extractCategory(content)
							const newOrder = extractOrder(content)

							if (changedFile.previewText !== newPreview || changedFile.category !== newCategory || changedFile.order !== newOrder) {
								changedFile.previewText = newPreview
								changedFile.category = newCategory
								changedFile.order = newOrder
								// Re-sort the list when metadata changes
								const list = changedFile.mode === 'emails' ? allFiles.emails
									: changedFile.mode === 'examples' ? allFiles.examples
									: allFiles.documentation
								const sorted = sortByOrder(list)
								list.length = 0
								list.push(...sorted)
								console.log(`   [svelte-emails] Updated metadata for ${changedFile.name}`)
							}
						} catch { /* Ignore read errors */ }

						invalidateModule(server, changedFile.path)
						invalidateModule(server, normalizedPath)
						broadcastUpdate('content-change', { id: changedFile.id, path: changedFile.relativePath })
					}
				}

				broadcastEmailList(event, normalizedPath)
				invalidateModule(server, RESOLVED_VIRTUAL_MODULE_ID)
			}, 50)

			watcher.on('all', (event, filePath) => {
				const isEmailFile = filePath.endsWith('.email.svelte')
				const isBundledSvelteFile = options.watchBundled && filePath.endsWith('.svelte')
				if (isEmailFile || isBundledSvelteFile) handleFileChange(event, filePath)
			})

			// Return middleware configurator
			return () => {
				server.middlewares.use((req, res, next) => {
					const url = req.url
					if (!url?.startsWith('/__svelte-emails/')) return next()

					if (url.startsWith('/__svelte-emails/events')) {
						res.setHeader('Content-Type', 'text/event-stream')
						res.setHeader('Cache-Control', 'no-cache')
						res.setHeader('Connection', 'keep-alive')
						res.setHeader('Access-Control-Allow-Origin', '*')
						res.flushHeaders()
						res.write(`event: emails\ndata: ${JSON.stringify({ ...toSafeAllFiles(allFiles), event: 'init', path: '' })}\n\n`)
						sseClients.add(res)
						req.on('close', () => sseClients.delete(res))
						return
					}

					if (url.startsWith('/__svelte-emails/list')) {
						res.setHeader('Content-Type', 'application/json')
						res.end(JSON.stringify(toSafeAllFiles(allFiles)))
						return
					}

					if (url.startsWith('/__svelte-emails/render')) {
						handleRenderRequest(url, res, server)
						return
					}

					if (url.startsWith('/__svelte-emails/proxy-image')) {
						handleImageProxy(url, res)
						return
					}

					next()
				})
			}
		},

		async closeBundle() {
			if (discoveryInterval) clearInterval(discoveryInterval)
			await watcher?.close()
			await bundledWatcher?.close()
		},

		/**
		 * Handle HMR updates for imported files
		 * When a non-email .svelte file changes (e.g., Footer.svelte), find all .email.svelte
		 * files that import it (directly or transitively) and notify the client to refresh them.
		 */
		handleHotUpdate({ file, modules }) {
			// Only handle .svelte files that are NOT email files
			// (email files are already handled by the chokidar watcher)
			if (!file.endsWith('.svelte') || file.endsWith('.email.svelte')) {
				return
			}

			const normalizedPath = normalizePath(file)
			const allEmailFiles = getAllFilesFlat(allFiles)
			const emailPathSet = new Set(allEmailFiles.map((e) => normalizePath(e.path)))

			// Find all .email.svelte files that import this changed file (directly or transitively)
			const affectedEmails = new Set<string>()

			/**
			 * Walk up the importer chain from a module to find email files
			 */
			function findEmailImporters(mod: ModuleNode, visited = new Set<string>()): void {
				const modFile = mod.file ? normalizePath(mod.file) : null
				if (!modFile || visited.has(modFile)) return
				visited.add(modFile)

				// Check if this module is an email file
				if (emailPathSet.has(modFile)) {
					affectedEmails.add(modFile)
					return // Don't need to traverse further up from an email file
				}

				// Check all modules that import this one
				for (const importer of mod.importers) {
					findEmailImporters(importer, visited)
				}
			}

			// Start from all modules affected by this file change
			for (const mod of modules) {
				findEmailImporters(mod)
			}

			// Notify clients about affected email files
			if (affectedEmails.size > 0) {
				for (const emailPath of affectedEmails) {
					const emailFile = allEmailFiles.find((e) => normalizePath(e.path) === emailPath)
					if (emailFile) {
						console.log(`   [svelte-emails] Dependency changed: ${normalizedPath} → refreshing ${emailFile.name}`)
						broadcastUpdate('content-change', { id: emailFile.id, path: emailFile.relativePath })
					}
				}
			}

			// Let Vite handle normal HMR
			return
		}
	}

	/** Handle /render API requests */
	async function handleRenderRequest(url: string, res: ServerResponse, server: ViteDevServer): Promise<void> {
		const parsedUrl = new URL(url, 'http://localhost')
		const emailId = parsedUrl.searchParams.get('id')
		const mode = parsedUrl.searchParams.get('mode') as ViewMode | null

		if (!emailId) {
			res.statusCode = 400
			return void res.end(JSON.stringify({ error: 'Missing email id' }))
		}

		const searchList = mode
			? (mode === 'emails' ? allFiles.emails : mode === 'examples' ? allFiles.examples : allFiles.documentation)
			: getAllFilesFlat(allFiles)
		const email = searchList.find((e) => e.id === emailId)

		if (!email) {
			res.statusCode = 404
			return void res.end(JSON.stringify({ error: `Email not found: ${emailId}` }))
		}

		const ssrEnv = server.environments.ssr
		if (!isRunnableDevEnvironment(ssrEnv)) {
			res.statusCode = 500
			return void res.end(JSON.stringify({ error: 'SSR environment is not runnable' }))
		}

		try {
			const sourcePromise = readFile(email.path, 'utf-8')
			const [mod, svelteEmailsModule] = await Promise.all([
				ssrEnv.runner.import(email.path),
				ssrEnv.runner.import('svelte-emails') as Promise<{ render: Function; formatHtml: Function }>
			])

			const [rendered, source] = await Promise.all([
				svelteEmailsModule.render(mod.default, { placeholders: {} }),
				sourcePromise
			])

			res.setHeader('Content-Type', 'application/json')
			res.end(JSON.stringify({
				email: toSafeEmail(email),
				source,
				rendered: { ...rendered, html: rendered.html, htmlRaw: rendered.html },
				renderError: null
			}))
		} catch (err) {
			console.error(`[svelte-emails] Error when handling request for ${emailId}`, err)

			let source = ''
			try { source = await readFile(email.path, 'utf-8') } catch { /* ignore */ }

			res.setHeader('Content-Type', 'application/json')
			res.end(JSON.stringify({
				email: toSafeEmail(email),
				source,
				rendered: null,
				renderError: err instanceof Error ? err.message : String(err)
			}))
		}
	}

	/** Handle image proxy requests (bypasses CORS) */
	async function handleImageProxy(url: string, res: ServerResponse): Promise<void> {
		const imageUrl = new URL(url, 'http://localhost').searchParams.get('url')

		if (!imageUrl) {
			res.statusCode = 400
			return void res.end(JSON.stringify({ error: 'Missing url parameter' }))
		}

		try {
			const response = await fetch(imageUrl)

			if (!response.ok) {
				res.statusCode = response.status
				return void res.end(JSON.stringify({ error: `Failed to fetch: ${response.status}` }))
			}

			res.setHeader('Content-Type', response.headers.get('content-type') || 'application/octet-stream')
			res.setHeader('Cache-Control', 'public, max-age=31536000')
			res.setHeader('Access-Control-Allow-Origin', '*')
			res.end(Buffer.from(await response.arrayBuffer()))
		} catch (err) {
			console.error(`[svelte-emails] Image proxy error for ${imageUrl}:`, err)
			res.statusCode = 500
			res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }))
		}
	}
}

export { VIRTUAL_MODULE_ID, VIRTUAL_BUILD_MODE_ID }
