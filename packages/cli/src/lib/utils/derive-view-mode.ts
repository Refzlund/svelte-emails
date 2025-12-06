/**
 * Shared utilities for deriving view mode and item ID from URL.
 * 
 * Centralizes the logic that was duplicated in sidebar.svelte.ts and ResponsiveLayout.svelte
 */

import { base } from '$app/paths'
import { page } from '$app/state'
import type { ViewMode } from '../../cli/types.js'

/**
 * Derive view mode from current URL path.
 * Handles base path stripping and route matching.
 */
export function deriveViewMode(): ViewMode {
	const path = base ? page.url.pathname.replace(base, '') : page.url.pathname
	if (path.startsWith('/examples')) return 'examples'
	if (path.startsWith('/documentation')) return 'documentation'
	return 'emails'
}

/**
 * Derive item ID from URL params or shallow routing state.
 */
export function deriveItemId(): string | undefined {
	// First check shallow routing state (set by pushState for instant navigation)
	const stateId = (page.state as { emailId?: string })?.emailId
	if (stateId) return stateId
	
	// Fall back to URL params
	const params = page.params.params
	if (params) {
		const segments = params.split('/')
		if (segments[0] === 'examples' || segments[0] === 'documentation') {
			return segments.slice(1).join('/') || undefined
		}
		return segments.join('/')
	}
	return undefined
}

/**
 * Get URL prefix for a given view mode (includes base path for deployments).
 */
export function getUrlPrefixForMode(mode: ViewMode): string {
	switch (mode) {
		case 'emails': return base
		case 'examples': return `${base}/examples`
		case 'documentation': return `${base}/documentation`
	}
}
