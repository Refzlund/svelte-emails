export type HighlightLang = 'svelte' | 'html' | 'markdown'

export interface HighlightRequest {
	id: string
	code: string
	lang: HighlightLang
}

export interface HighlightResponse {
	id: string
	html: string
}
