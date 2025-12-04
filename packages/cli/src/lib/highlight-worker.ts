import { createHighlighterCore, type HighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import type { HighlightRequest, HighlightResponse } from './highlight-types.js'

// Cache the highlighter instance - create once and reuse
// This dramatically improves performance by avoiding repeated initialization
let highlighterPromise: Promise<HighlighterCore> | null = null

async function getHighlighter(): Promise<HighlighterCore> {
	if (!highlighterPromise) {
		highlighterPromise = createHighlighterCore({
			themes: [
				// @ts-ignore - dynamic import works at runtime
				import('@shikijs/themes/github-dark')
			],
			langs: [
				// @ts-ignore - dynamic import works at runtime
				import('@shikijs/langs/svelte'),
				// @ts-ignore - dynamic import works at runtime
				import('@shikijs/langs/html'),
				// @ts-ignore - dynamic import works at runtime
				import('@shikijs/langs/markdown')
			],
			// JavaScript engine is faster to initialize than WASM Oniguruma
			engine: createJavaScriptRegexEngine()
		})
	}
	return highlighterPromise
}

// Queue to process requests in order while highlighter initializes
const pendingQueue: HighlightRequest[] = []
let isProcessing = false

async function processQueue() {
	if (isProcessing) return
	isProcessing = true

	const highlighter = await getHighlighter()

	while (pendingQueue.length > 0) {
		const request = pendingQueue.shift()!
		const { id, code, lang } = request

		try {
			const html = highlighter.codeToHtml(code, {
				lang,
				theme: 'github-dark'
			})
			self.postMessage({ id, html } satisfies HighlightResponse)
		} catch {
			// On error, send back unhighlighted code wrapped in pre/code
			const escaped = code
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
			self.postMessage({
				id,
				html: `<pre class="shiki github-dark" style="background:#0d1117;color:#e6edf3"><code>${escaped}</code></pre>`
			} satisfies HighlightResponse)
		}
	}

	isProcessing = false
}

self.onmessage = async (e: MessageEvent<HighlightRequest>) => {
	pendingQueue.push(e.data)
	processQueue()
}
