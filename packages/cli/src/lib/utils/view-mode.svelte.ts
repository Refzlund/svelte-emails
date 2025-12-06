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
import * as icons from '$lib/Icons.svelte'

/** View mode for the email viewer tabs */
export type ViewMode = 'preview' | 'source' | 'html' | 'raw' | 'text'

/** All available tab modes in order */
export const TAB_MODES: ViewMode[] = ['preview', 'source', 'html', 'raw', 'text']

/** Tab configuration for UI rendering */
export interface TabConfig {
	mode: ViewMode
	label: string
	icon: typeof icons.contentView
	shortcut: string
}

/** Centralized tab configuration used by both desktop and mobile components */
export const TABS: TabConfig[] = [
	{ mode: 'preview', label: 'Preview', icon: icons.contentView, shortcut: 'Alt+1' },
	{ mode: 'source', label: 'Source', icon: icons.code, shortcut: 'Alt+2' },
	{ mode: 'html', label: 'HTML', icon: icons.document, shortcut: 'Alt+3' },
	{ mode: 'raw', label: 'Raw', icon: icons.document, shortcut: '' },
	{ mode: 'text', label: 'Text', icon: icons.codeText, shortcut: 'Alt+4' }
]

/** Get tab configuration by mode */
export function getTabConfig(mode: ViewMode): TabConfig {
	return TABS.find((t) => t.mode === mode) ?? TABS[0]
}

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
