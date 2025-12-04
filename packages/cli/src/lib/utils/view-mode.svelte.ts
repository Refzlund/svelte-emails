/**
 * URL-synced view mode state for email viewer tabs.
 * 
 * Manages the current view mode (preview/source/html/raw/text) and syncs it
 * with the URL query parameter `?mode=...`. This enables:
 * - Shareable links to specific views
 * - Browser back/forward navigation
 * - Page refresh preserves view state
 * 
 * The 'preview' mode is the default and has no query parameter.
 * 
 * @see ARCHITECTURE_CLI.md for usage details
 */

import { goto } from '$app/navigation'
import { page } from '$app/state'

export type ViewMode = 'preview' | 'source' | 'html' | 'raw' | 'text'

const validModes: ViewMode[] = ['source', 'html', 'raw', 'text']

function parseMode(urlMode: string | null): ViewMode {
	if (urlMode && validModes.includes(urlMode as ViewMode)) {
		return urlMode as ViewMode
	}
	return 'preview'
}

export function createViewMode() {
	let mode: ViewMode = $state(parseMode(page.url.searchParams.get('mode')))

	// Sync with URL changes (e.g., browser back/forward)
	$effect(() => {
		const urlMode = page.url.searchParams.get('mode')
		const newMode = parseMode(urlMode)
		if (newMode !== mode) {
			mode = newMode
		}
	})

	return {
		get current() {
			return mode
		},
		get isRaw() {
			return mode === 'raw'
		},
		set(newMode: ViewMode) {
			mode = newMode
			const url = new URL(page.url)
			if (newMode === 'preview') {
				url.searchParams.delete('mode')
			} else {
				url.searchParams.set('mode', newMode)
			}
			goto(url.toString(), { replaceState: true, keepFocus: true, noScroll: true })
		}
	}
}
