import { isRunnableDevEnvironment, type Plugin, type ViteDevServer } from 'vite'
import { watch, type FSWatcher } from 'chokidar'
import { discoverAll, extractPreviewText, extractCategory } from './discovery.js'
import { readFile } from 'node:fs/promises'
import type { ServerResponse } from 'node:http'
import type { EmailFile, ViewMode } from './types.js'
import { normalizePath, toSafeEmails, toSafeEmail, invalidateModule, debounce } from './utils.js'

const VIRTUAL_MODULE_ID = 'virtual:email-list'
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID

export interface EmailListPluginOptions {
	cwd: string
}

/**
 * All files organized by mode
 */
interface AllFiles {
	emails: EmailFile[]
	examples: EmailFile[]
	documentation: EmailFile[]
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
	let discoveryInterval: ReturnType<typeof setInterval> | null = null
	const sseClients: Set<ServerResponse> = new Set()

	/**
	 * Broadcast an SSE event to all connected clients
	 */
	function broadcastUpdate(event: string, data: unknown): void {
		const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
		for (const client of sseClients) {
			try {
				if (!client.writableEnded) {
					client.write(message)
				}
			} catch {
				sseClients.delete(client)
			}
		}
	}

	return {
		name: 'svelte-emails-list',

		async buildStart() {
			allFiles = await discoverAll(options.cwd)
		},

		resolveId(id) {
			if (id === VIRTUAL_MODULE_ID) {
				return RESOLVED_VIRTUAL_MODULE_ID
			}
		},

		load(id) {
			if (id === RESOLVED_VIRTUAL_MODULE_ID) {
				// Export all modes separately for the virtual module
				return `export default ${JSON.stringify({
					emails: toSafeEmails(allFiles.emails),
					examples: toSafeEmails(allFiles.examples),
					documentation: toSafeEmails(allFiles.documentation)
				}, null, 2)}`
			}
		},

		async configureServer(server) {
			// Discover all files if buildStart hasn't completed yet
			if (allFiles.emails.length === 0 && allFiles.examples.length === 0 && allFiles.documentation.length === 0) {
				allFiles = await discoverAll(options.cwd)
			}

			console.log(`   [svelte-emails] Found ${allFiles.emails.length} email(s), ${allFiles.examples.length} example(s), ${allFiles.documentation.length} doc(s)`)

			// Track watched directories to add new ones dynamically
			const watchedDirs = new Set<string>()

			// Get unique directories containing email files (only user's emails, not CLI's examples/docs)
			function getEmailDirs(): string[] {
				const dirs = new Set<string>()
				for (const file of allFiles.emails) {
					const dir = normalizePath(file.path.substring(0, file.path.lastIndexOf('/')))
					dirs.add(dir)
				}
				return Array.from(dirs)
			}

			// Add directories to the watcher
			function updateWatchedDirs() {
				const currentDirs = getEmailDirs()
				for (const dir of currentDirs) {
					if (!watchedDirs.has(dir)) {
						watchedDirs.add(dir)
						watcher?.add(dir)
						console.log(`   [svelte-emails] Now watching: ${dir}`)
					}
				}
			}

			// Initial directories to watch (only emails from user's project)
			const initialDirs = getEmailDirs()
			initialDirs.forEach((dir) => watchedDirs.add(dir))

			// If no emails found, watch the project root
			const watchPaths = initialDirs.length > 0 
				? initialDirs
				: [normalizePath(options.cwd)]

			// Setup file watcher - only watch specific directories for performance
			watcher = watch(watchPaths, {
				ignored: [
					'**/node_modules/**',
					'**/.git/**',
					'**/.svelte-kit/**'
				],
				ignoreInitial: true,
				persistent: true,
				usePolling: false,
				depth: initialDirs.length > 0 ? 0 : 10,
				awaitWriteFinish: {
					stabilityThreshold: 50,
					pollInterval: 20
				}
			})

			watcher.on('ready', () => {
				console.log(`   [svelte-emails] Watching for changes`)
			})

			watcher.on('error', (error) => {
				console.error(`   [svelte-emails] Watcher error:`, error)
			})

			// Periodic discovery to find new files in new directories
			let lastFilePaths = new Set([
				...allFiles.emails.map((e) => e.path),
				...allFiles.examples.map((e) => e.path),
				...allFiles.documentation.map((e) => e.path)
			])

			discoveryInterval = setInterval(async () => {
				try {
					// Use fast discovery (skip file reads) for periodic checks
					const newAllFiles = await discoverAll(options.cwd, true)
					const newPaths = new Set([
						...newAllFiles.emails.map((e) => e.path),
						...newAllFiles.examples.map((e) => e.path),
						...newAllFiles.documentation.map((e) => e.path)
					])
					
					// Check if there are any new or removed files
					const hasNewFiles = [...newPaths].some((p) => !lastFilePaths.has(p))
					const hasRemovedFiles = [...lastFilePaths].some((p) => !newPaths.has(p))
					
					if (hasNewFiles || hasRemovedFiles) {
						// Do a full discovery with preview text for the UI
						const fullFiles = await discoverAll(options.cwd, false)
						console.log(`   [svelte-emails] Discovered ${fullFiles.emails.length} email(s), ${fullFiles.examples.length} example(s), ${fullFiles.documentation.length} doc(s)`)
						allFiles = fullFiles
						lastFilePaths = new Set([
							...fullFiles.emails.map((e) => e.path),
							...fullFiles.examples.map((e) => e.path),
							...fullFiles.documentation.map((e) => e.path)
						])
						
						// Add any new directories to the watcher
						updateWatchedDirs()
						
						// Broadcast to clients
						broadcastUpdate('emails', {
							emails: toSafeEmails(allFiles.emails),
							examples: toSafeEmails(allFiles.examples),
							documentation: toSafeEmails(allFiles.documentation),
							event: 'discovery',
							path: ''
						})
						
						// Invalidate virtual module
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
					// File added or removed - do full re-discovery
					allFiles = await discoverAll(options.cwd, false)
					lastFilePaths = new Set([
						...allFiles.emails.map((e) => e.path),
						...allFiles.examples.map((e) => e.path),
						...allFiles.documentation.map((e) => e.path)
					])
					
					// Update watched dirs for new files
					if (event === 'add') {
						updateWatchedDirs()
					}
				}

				// For content changes, update the file's metadata (preview, category)
				if (event === 'change') {
					const allFilesFlat = [...allFiles.emails, ...allFiles.examples, ...allFiles.documentation]
					const changedFile = allFilesFlat.find((e) => normalizePath(e.path) === normalizedPath)
					if (changedFile) {
						try {
							// Re-read the file to update preview and category
							const content = await readFile(changedFile.path, 'utf-8')
							const newPreview = extractPreviewText(content)
							const newCategory = extractCategory(content)
							
							// Check if metadata changed
							const metadataChanged = changedFile.previewText !== newPreview || changedFile.category !== newCategory
							
							if (metadataChanged) {
								// Update the file's metadata in place
								changedFile.previewText = newPreview
								changedFile.category = newCategory
								console.log(`   [svelte-emails] Updated metadata for ${changedFile.name}`)
							}
						} catch {
							// Ignore read errors
						}

						// Invalidate both path formats (Windows compatibility)
						invalidateModule(server, changedFile.path)
						invalidateModule(server, normalizedPath)

						broadcastUpdate('content-change', {
							id: changedFile.id,
							path: changedFile.relativePath
						})
					}
				}

				// Broadcast updated list to all SSE clients
				broadcastUpdate('emails', {
					emails: toSafeEmails(allFiles.emails),
					examples: toSafeEmails(allFiles.examples),
					documentation: toSafeEmails(allFiles.documentation),
					event,
					path: normalizedPath
				})

				// Invalidate virtual module for fresh imports
				invalidateModule(server, RESOLVED_VIRTUAL_MODULE_ID)
			}, 50)

			watcher.on('all', (event, filePath) => {
				// Only watch for .email.svelte files (examples/docs are in CLI package, not user's project)
				if (filePath.endsWith('.email.svelte')) {
					handleFileChange(event, filePath)
				}
			})

			// Return middleware configurator
			return () => {
				server.middlewares.use((req, res, next) => {
					// SSE endpoint
					if (req.url?.startsWith('/__svelte-emails/events')) {
						res.setHeader('Content-Type', 'text/event-stream')
						res.setHeader('Cache-Control', 'no-cache')
						res.setHeader('Connection', 'keep-alive')
						res.setHeader('Access-Control-Allow-Origin', '*')
						res.flushHeaders()

						// Send initial state
						res.write(`event: emails\ndata: ${JSON.stringify({
							emails: toSafeEmails(allFiles.emails),
							examples: toSafeEmails(allFiles.examples),
							documentation: toSafeEmails(allFiles.documentation),
							event: 'init',
							path: ''
						})}\n\n`)

						sseClients.add(res)
						req.on('close', () => sseClients.delete(res))
						return
					}

					// API: Get email list
					if (req.url?.startsWith('/__svelte-emails/list')) {
						res.setHeader('Content-Type', 'application/json')
						res.end(JSON.stringify({
							emails: toSafeEmails(allFiles.emails),
							examples: toSafeEmails(allFiles.examples),
							documentation: toSafeEmails(allFiles.documentation)
						}))
						return
					}

					// API: Render email
					if (req.url?.startsWith('/__svelte-emails/render')) {
						handleRenderRequest(req.url, res, server)
						return
					}

					// API: Proxy image (bypasses CORS)
					if (req.url?.startsWith('/__svelte-emails/proxy-image')) {
						handleImageProxy(req.url, res)
						return
					}

					next()
				})
			}
		},

		async closeBundle() {
			if (discoveryInterval) {
				clearInterval(discoveryInterval)
			}
			if (watcher) {
				await watcher.close()
			}
		}
	}

	/**
	 * Handle /render API requests
	 */
	async function handleRenderRequest(
		url: string,
		res: ServerResponse,
		server: ViteDevServer
	): Promise<void> {
		const parsedUrl = new URL(url, 'http://localhost')
		const emailId = parsedUrl.searchParams.get('id')
		const mode = parsedUrl.searchParams.get('mode') as ViewMode | null

		if (!emailId) {
			res.statusCode = 400
			res.end(JSON.stringify({ error: 'Missing email id' }))
			return
		}

		// Search in specific mode if provided, otherwise search all modes
		let searchList: EmailFile[]
		if (mode) {
			searchList = mode === 'emails' ? allFiles.emails 
				: mode === 'examples' ? allFiles.examples 
				: allFiles.documentation
		} else {
			searchList = [...allFiles.emails, ...allFiles.examples, ...allFiles.documentation]
		}
		const email = searchList.find((e) => e.id === emailId)

		if (!email) {
			res.statusCode = 404
			res.end(JSON.stringify({ error: `Email not found: ${emailId}` }))
			return
		}

		// Verify we have a runnable SSR environment
		const ssrEnv = server.environments.ssr
		if (!isRunnableDevEnvironment(ssrEnv)) {
			res.statusCode = 500
			res.end(JSON.stringify({ error: 'SSR environment is not runnable' }))
			return
		}

		try {
			// Start reading source file immediately (parallel with module imports)
			const sourcePromise = readFile(email.path, 'utf-8')

			// Import both modules in parallel. Vite's module runner ensures they
			// share the same module graph state, so render() and the email component
			// will use the same Svelte instance (required for SSR context to work).
			const [mod, svelteEmailsModule] = await Promise.all([
				ssrEnv.runner.import(email.path),
				ssrEnv.runner.import('svelte-emails') as Promise<{
					render: Function
					formatHtml: Function
				}>
			])
			const EmailComponent = mod.default

			// Render the email and wait for source in parallel
			const [rendered, source] = await Promise.all([
				svelteEmailsModule.render(EmailComponent, { placeholders: {} }),
				sourcePromise
			])

			// Send raw HTML - formatting is done client-side in a Web Worker
			// This reduces server response time significantly for complex emails
			res.setHeader('Content-Type', 'application/json')
			res.end(JSON.stringify({
				email: toSafeEmail(email),
				source,
				rendered: {
					...rendered,
					html: rendered.html,  // Raw HTML (formatting done client-side)
					htmlRaw: rendered.html
				},
				renderError: null
			}))
		} catch (err) {
			console.error(`[svelte-emails] Error when handling request for ${emailId}`, err)

			let source = ''
			try {
				source = await readFile(email.path, 'utf-8')
			} catch { /* ignore */ }

			res.setHeader('Content-Type', 'application/json')
			res.end(JSON.stringify({
				email: toSafeEmail(email),
				source,
				rendered: null,
				renderError: err instanceof Error ? err.message : String(err)
			}))
		}
	}

	/**
	 * Handle image proxy requests (bypasses CORS)
	 */
	async function handleImageProxy(
		url: string,
		res: ServerResponse
	): Promise<void> {
		const parsedUrl = new URL(url, 'http://localhost')
		const imageUrl = parsedUrl.searchParams.get('url')

		if (!imageUrl) {
			res.statusCode = 400
			res.end(JSON.stringify({ error: 'Missing url parameter' }))
			return
		}

		try {
			const response = await fetch(imageUrl)
			
			if (!response.ok) {
				res.statusCode = response.status
				res.end(JSON.stringify({ error: `Failed to fetch: ${response.status}` }))
				return
			}

			const contentType = response.headers.get('content-type') || 'application/octet-stream'
			const buffer = await response.arrayBuffer()

			res.setHeader('Content-Type', contentType)
			res.setHeader('Cache-Control', 'public, max-age=31536000') // 1 year
			res.setHeader('Access-Control-Allow-Origin', '*')
			res.end(Buffer.from(buffer))
		} catch (err) {
			console.error(`[svelte-emails] Image proxy error for ${imageUrl}:`, err)
			res.statusCode = 500
			res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }))
		}
	}
}

export { VIRTUAL_MODULE_ID }
