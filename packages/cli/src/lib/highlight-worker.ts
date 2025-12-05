import type { HighlightRequest, HighlightResponse } from './highlight-types.js'

// Cache the highlighter instance - create once and reuse
// This dramatically improves performance by avoiding repeated initialization
let highlighterPromise: Promise<unknown> | null = null
let shikiAvailable: boolean | null = null

/**
 * Escape HTML for safe display in code blocks.
 */
function escapeHtml(code: string): string {
	return code
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
}

/**
 * Create a plain code block without syntax highlighting.
 */
function createPlainCodeBlock(code: string): string {
	const escaped = escapeHtml(code)
	return `<pre class="shiki github-dark" style="background:#0d1117;color:#e6edf3"><code>${escaped}</code></pre>`
}

async function getHighlighter(): Promise<unknown> {
	if (!highlighterPromise) {
		highlighterPromise = (async () => {
			try {
				// Dynamic imports to make shiki truly optional
				const [{ createHighlighterCore }, { createJavaScriptRegexEngine }] = await Promise.all([
					import('shiki/core'),
					import('shiki/engine/javascript')
				])
				
				const highlighter = await createHighlighterCore({
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
				
				shikiAvailable = true
				return highlighter
			} catch {
				shikiAvailable = false
				console.info(
					'[highlight-worker] Shiki is not installed. Syntax highlighting is disabled. ' +
					'Install with: npm install shiki @shikijs/langs @shikijs/themes'
				)
				return null
			}
		})()
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

		// If shiki isn't available, return plain code
		if (!highlighter || shikiAvailable === false) {
			self.postMessage({ id, html: createPlainCodeBlock(code) } satisfies HighlightResponse)
			continue
		}

		try {
			// @ts-ignore - highlighter type is dynamic
			const html = highlighter.codeToHtml(code, {
				lang,
				theme: 'github-dark'
			})
			self.postMessage({ id, html } satisfies HighlightResponse)
		} catch {
			// On error, send back unhighlighted code wrapped in pre/code
			self.postMessage({ id, html: createPlainCodeBlock(code) } satisfies HighlightResponse)
		}
	}

	isProcessing = false
}

self.onmessage = async (e: MessageEvent<HighlightRequest>) => {
	pendingQueue.push(e.data)
	processQueue()
}
