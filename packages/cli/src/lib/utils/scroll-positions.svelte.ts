/**
 * Global scroll position cache for email previews.
 * Persists scroll positions across navigation between emails.
 * 
 * Keys are formatted as `${mode}:${emailId}` to namespace by view mode.
 */

/** Scroll positions keyed by `${mode}:${emailId}` */
const scrollPositions: Record<string, number> = $state({})

/** Tracks which key was last restored to prevent duplicate restores */
const restoreState = $state({ lastKey: undefined as string | undefined })

/** Save scroll position for a key */
export function saveScrollPosition(key: string, position: number) {
	scrollPositions[key] = position
}

/** Get scroll position for a key */
export function getScrollPosition(key: string): number | undefined {
	return scrollPositions[key]
}

/** Check and update lastRestoredKey, returns true if this is a new key */
export function shouldRestore(key: string): boolean {
	if (key === restoreState.lastKey) return false
	restoreState.lastKey = key
	return true
}
