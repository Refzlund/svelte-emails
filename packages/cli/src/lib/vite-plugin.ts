import type { Plugin, ViteDevServer } from 'vite'
import { watch, type FSWatcher } from 'chokidar'
import { discoverEmails } from './discovery.js'
import { readFileSync } from 'node:fs'
import type { ServerResponse } from 'node:http'
import type { EmailFile } from './types.js'
import { normalizePath, toSafeEmails, toSafeEmail, invalidateModule, debounce } from './utils.js'

const VIRTUAL_MODULE_ID = 'virtual:email-list'
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID

export interface EmailListPluginOptions {
	cwd: string
}

/**
 * Vite plugin that provides:
 * - Virtual module with email file list
 * - API endpoints for rendering emails via SSR
 * - SSE for live updates when files change
 */
export function emailListPlugin(options: EmailListPluginOptions): Plugin {
	let emails: EmailFile[] = []
	let watcher: FSWatcher | null = null
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
			emails = await discoverEmails(options.cwd)
		},

		resolveId(id) {
			if (id === VIRTUAL_MODULE_ID) {
				return RESOLVED_VIRTUAL_MODULE_ID
			}
		},

		load(id) {
			if (id === RESOLVED_VIRTUAL_MODULE_ID) {
				return `export default ${JSON.stringify(toSafeEmails(emails), null, 2)}`
			}
		},

		async configureServer(server) {
			// Discover emails if buildStart hasn't completed yet
			// (can happen in dev mode due to async plugin lifecycle)
			if (emails.length === 0) {
				emails = await discoverEmails(options.cwd)
			}

			const watchDir = normalizePath(options.cwd)
			console.log(`   [svelte-emails] Found ${emails.length} email(s)`)

			// Setup file watcher with native FS events (low CPU)
			watcher = watch(watchDir, {
				ignored: [
					'**/node_modules/**',
					'**/.svelte-kit/**',
					'**/dist/**',
					'**/build/**'
				],
				ignoreInitial: true,
				persistent: true,
				usePolling: false,
				awaitWriteFinish: {
					stabilityThreshold: 50,
					pollInterval: 20
				}
			})

			watcher.on('ready', () => {
				console.log(`   [svelte-emails] Watching for *.email.svelte changes`)
			})

			watcher.on('error', (error) => {
				console.error(`   [svelte-emails] Watcher error:`, error)
			})

			// Debounced handler to coalesce rapid file events
			const handleFileChange = debounce(async (event: string, filePath: string) => {
				const normalizedPath = normalizePath(filePath)
				console.log(`   [svelte-emails] [${event}] ${normalizedPath}`)

				// Re-discover emails to get updated list
				emails = await discoverEmails(options.cwd)

				// Broadcast updated list to all SSE clients
				broadcastUpdate('emails', {
					emails: toSafeEmails(emails),
					event,
					path: normalizedPath
				})

				// Invalidate virtual module for fresh imports
				invalidateModule(server, RESOLVED_VIRTUAL_MODULE_ID)

				// For content changes, invalidate specific module and notify
				if (event === 'change') {
					const changedEmail = emails.find((e) => normalizePath(e.path) === normalizedPath)
					if (changedEmail) {
						// Invalidate both path formats (Windows compatibility)
						invalidateModule(server, changedEmail.path)
						invalidateModule(server, normalizedPath)

						broadcastUpdate('content-change', {
							id: changedEmail.id,
							path: changedEmail.relativePath
						})
					}
				}
			}, 50)

			watcher.on('all', (event, filePath) => {
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
							emails: toSafeEmails(emails),
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
						res.end(JSON.stringify(toSafeEmails(emails)))
						return
					}

					// API: Render email
					if (req.url?.startsWith('/__svelte-emails/render')) {
						handleRenderRequest(req.url, res, server)
						return
					}

					next()
				})
			}
		},

		async closeBundle() {
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

		if (!emailId) {
			res.statusCode = 400
			res.end(JSON.stringify({ error: 'Missing email id' }))
			return
		}

		const email = emails.find((e) => e.id === emailId)

		if (!email) {
			res.statusCode = 404
			res.end(JSON.stringify({ error: `Email not found: ${emailId}` }))
			return
		}

		try {
			invalidateModule(server, email.path)

			const mod = await server.ssrLoadModule(email.path)
			const EmailComponent = mod.default
			const { render } = await server.ssrLoadModule('svelte-emails')

			const rendered = await render(EmailComponent, { placeholders: {} })
			const source = readFileSync(email.path, 'utf-8')

			res.setHeader('Content-Type', 'application/json')
			res.end(JSON.stringify({
				email: toSafeEmail(email),
				source,
				rendered,
				renderError: null
			}))
		} catch (err) {
			let source = ''
			try {
				source = readFileSync(email.path, 'utf-8')
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
}

export { VIRTUAL_MODULE_ID }
