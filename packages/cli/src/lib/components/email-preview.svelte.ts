/**
 * Shared state and logic for email preview components.
 * 
 * Used by both EmailPreview (desktop with resize) and MobileEmailPreview (full-width).
 * Handles image caching, scroll position persistence, and cursor glow effect.
 */

import { createImageCache } from '../image-cache.svelte.js'
import { saveScrollPosition, getScrollPosition, shouldRestore } from '../utils/scroll-positions.svelte.js'

/**
 * Create preview state for email rendering with image caching and scroll persistence.
 */
export function createPreviewState(
	getHtml: () => string,
	getScrollKey: () => string | undefined
) {
	const imageCache = createImageCache()

	// Process HTML for image caching
	$effect(() => {
		imageCache.processHtml(getHtml())
	})

	// Derive the content to display (with cached images)
	const contentHtml = $derived(imageCache.processedHtml || getHtml())

	// Cursor glow effect - use viewport coordinates for fixed overlay
	let mouseX = $state(0)
	let mouseY = $state(0)

	function handleMouseMove(e: { clientX: number; clientY: number }) {
		mouseX = e.clientX
		mouseY = e.clientY
	}

	return {
		get contentHtml() { return contentHtml },
		get mouseX() { return mouseX },
		get mouseY() { return mouseY },
		handleMouseMove
	}
}

/**
 * Create scroll position persistence for email previews.
 */
export function createScrollPersistence(getScrollKey: () => string | undefined) {
	// Track pending scroll restoration
	let pendingScrollKey = $state<string | undefined>(undefined)

	// When scrollKey changes, mark it as pending restoration
	$effect(() => {
		const key = getScrollKey()
		if (!key) return
		
		if (shouldRestore(key)) {
			pendingScrollKey = key
		}
	})

	/**
	 * Save current scroll position
	 */
	function savePosition(container: HTMLElement | undefined) {
		const key = getScrollKey()
		if (key && container) {
			saveScrollPosition(key, container.scrollTop)
		}
	}

	/**
	 * Restore scroll position when content is ready.
	 * Call this from an effect that tracks iframeHeight.
	 * Returns true if restoration was performed.
	 */
	function restorePosition(container: HTMLElement | undefined, contentReady: boolean): boolean {
		const key = pendingScrollKey
		
		if (!key || !container || !contentReady) return false
		
		pendingScrollKey = undefined
		const savedPosition = getScrollPosition(key)
		
		requestAnimationFrame(() => {
			if (container) {
				container.scrollTop = savedPosition ?? 0
			}
		})
		
		return true
	}

	return {
		get pendingScrollKey() { return pendingScrollKey },
		savePosition,
		restorePosition
	}
}
