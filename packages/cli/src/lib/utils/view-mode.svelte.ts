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

import { replaceState } from '$app/navigation'
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
	let value = $state<ViewMode>(parseMode(page.url.searchParams.get('mode')))

	// Sync with URL changes (e.g., browser back/forward)
	// Only sync FROM URL, not when we're setting it ourselves
	$effect(() => {
		const urlMode = page.url.searchParams.get('mode')
		const newMode = parseMode(urlMode)
		// Always sync - the URL is the source of truth after replaceState
		value = newMode
	})

	// Return object with getters - this creates live bindings that Svelte can track
	return {
		get value() { return value },
		get isRaw() { return value === 'raw' },
		set(newMode: ViewMode) {
			value = newMode
			// Update URL using SvelteKit's replaceState to properly sync with router
			const url = new URL(window.location.href)
			if (newMode === 'preview') {
				url.searchParams.delete('mode')
			} else {
				url.searchParams.set('mode', newMode)
			}
			// Use SvelteKit's replaceState - preserve existing page state
			replaceState(url, page.state)
		}
	}
}
