/**
 * Responsive state utilities for mobile detection.
 * 
 * Provides reactive state that tracks viewport size and determines
 * if the app should render in mobile or desktop mode.
 * 
 * Mobile threshold: 768px
 */

import { browser } from '$app/environment'

const MOBILE_BREAKPOINT = 768

/**
 * Create responsive state with reactive mobile detection.
 * Uses matchMedia for efficient viewport tracking.
 */
export function createResponsiveState() {
	// Default to desktop for SSR, will hydrate correctly
	let isMobile = $state(false)

	if (browser) {
		const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)
		isMobile = mediaQuery.matches

		$effect(() => {
			const handleChange = (e: MediaQueryListEvent) => {
				isMobile = e.matches
			}

			mediaQuery.addEventListener('change', handleChange)
			return () => mediaQuery.removeEventListener('change', handleChange)
		})
	}

	return {
		get isMobile() { return isMobile },
		get isDesktop() { return !isMobile }
	}
}

/** Mobile breakpoint in pixels */
export const MOBILE_BREAKPOINT_PX = MOBILE_BREAKPOINT
