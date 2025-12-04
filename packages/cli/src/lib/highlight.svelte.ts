import type { HighlightLang, HighlightRequest, HighlightResponse } from './highlight-types.js'
import { generateVersion } from './utils/index.js'

export type { HighlightLang }

interface CacheEntry {
	version: string
	html: string
}

type HighlightType = 'source' | 'html' | 'text'

// Cache: Map<emailId:type, CacheEntry>
const cache = new Map<string, CacheEntry>()

// Worker pool - one worker per highlight type for parallel processing
const workers = new Map<HighlightType, Worker>()
const pendingRequests = new Map<string, {
	resolve: (html: string) => void
	reject: (error: Error) => void
}>()

function getWorker(type: HighlightType): Worker {
	let worker = workers.get(type)
	if (!worker) {
		worker = new Worker(
			new URL('./highlight-worker.ts', import.meta.url),
			{ type: 'module' }
		)
		worker.onmessage = (e: MessageEvent<HighlightResponse>) => {
			const pending = pendingRequests.get(e.data.id)
			if (pending) {
				pending.resolve(e.data.html)
				pendingRequests.delete(e.data.id)
			}
		}
		worker.onerror = (e) => {
			console.error('[highlight-worker] Error:', e)
			// Reject all pending requests for this worker
			for (const [id, pending] of pendingRequests) {
				if (id.startsWith(`${type}:`)) {
					pending.reject(new Error(`Worker error: ${e.message}`))
					pendingRequests.delete(id)
				}
			}
		}
		workers.set(type, worker)
	}
	return worker
}

function getCacheKey(emailId: string, type: HighlightType): string {
	return `${emailId}:${type}`
}

export interface HighlightState {
	source: string | null
	html: string | null
	text: string | null
}

export interface LoadingState {
	source: boolean
	html: boolean
	text: boolean
}

export function createHighlightManager() {
	let state = $state<HighlightState>({
		source: null,
		html: null,
		text: null
	})

	let loading = $state<LoadingState>({
		source: false,
		html: false,
		text: false
	})

	let currentEmailId: string | null = null

	async function highlightInWorker(
		type: HighlightType,
		code: string,
		lang: HighlightLang,
		emailId: string
	): Promise<string> {
		const cacheKey = getCacheKey(emailId, type)
		const version = generateVersion(code)

		// Check cache
		const cached = cache.get(cacheKey)
		if (cached && cached.version === version) {
			return cached.html
		}

		// Request highlighting from worker
		const requestId = `${cacheKey}:${Date.now()}`
		const worker = getWorker(type)

		return new Promise((resolve, reject) => {
			pendingRequests.set(requestId, {
				resolve: (html) => {
					// Store in cache
					cache.set(cacheKey, { version, html })
					resolve(html)
				},
				reject
			})

			worker.postMessage({
				id: requestId,
				code,
				lang
			} satisfies HighlightRequest)
		})
	}

	async function highlight(
		emailId: string,
		source: string,
		html: string | null,
		text: string | null
	) {
		currentEmailId = emailId

		// Check if all are already cached with correct version
		const sourceVersion = generateVersion(source)
		const htmlVersion = html ? generateVersion(html) : null
		const textVersion = text ? generateVersion(text) : null

		const sourceCached = cache.get(getCacheKey(emailId, 'source'))
		const htmlCached = cache.get(getCacheKey(emailId, 'html'))
		const textCached = cache.get(getCacheKey(emailId, 'text'))

		// Set cached values immediately if available
		if (sourceCached?.version === sourceVersion) {
			state.source = sourceCached.html
		} else {
			state.source = null
			loading.source = true
		}

		if (html && htmlCached?.version === htmlVersion) {
			state.html = htmlCached.html
		} else if (html) {
			state.html = null
			loading.html = true
		}

		if (text && textCached?.version === textVersion) {
			state.text = textCached.html
		} else if (text) {
			state.text = null
			loading.text = true
		}

		// Start workers for non-cached items in parallel
		const tasks: Promise<void>[] = []

		if (loading.source) {
			tasks.push(
				highlightInWorker('source', source, 'svelte', emailId).then((result) => {
					if (currentEmailId === emailId) {
						state.source = result
						loading.source = false
					}
				})
			)
		}

		if (html && loading.html) {
			tasks.push(
				highlightInWorker('html', html, 'html', emailId).then((result) => {
					if (currentEmailId === emailId) {
						state.html = result
						loading.html = false
					}
				})
			)
		}

		if (text && loading.text) {
			tasks.push(
				highlightInWorker('text', text, 'markdown', emailId).then((result) => {
					if (currentEmailId === emailId) {
						state.text = result
						loading.text = false
					}
				})
			)
		}

		await Promise.all(tasks)
	}

	return {
		get state() { return state },
		get loading() { return loading },
		highlight,
		clear() {
			currentEmailId = null
			state = { source: null, html: null, text: null }
			loading = { source: false, html: false, text: false }
		}
	}
}
