import { codeToHtml } from 'shiki'
import type { HighlightRequest, HighlightResponse } from './highlight-types.js'

self.onmessage = async (e: MessageEvent<HighlightRequest>) => {
	const { id, code, lang } = e.data

	const html = await codeToHtml(code, {
		lang,
		theme: 'github-dark'
	})

	self.postMessage({ id, html } satisfies HighlightResponse)
}
