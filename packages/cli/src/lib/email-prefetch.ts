/**
 * Email data prefetch cache.
 * Caches rendered email data and prefetches adjacent emails for instant navigation.
 */

import type { SafeEmail } from '$cli/types.js'

export interface RenderedEmail {
	html: string
	htmlRaw: string
	text: string
}

export interface EmailData {
	email: SafeEmail
	source: string
	rendered: RenderedEmail | null
	renderError: string | null
	timestamp: number
}

// Cache of prefetched email data
const emailDataCache = new Map<string, EmailData>()

// Currently prefetching IDs to avoid duplicate fetches
const prefetching = new Set<string>()

// Max age for cached data (5 minutes)
const MAX_CACHE_AGE = 5 * 60 * 1000

/**
 * Get cached email data if available and fresh
 */
export function getCachedEmailData(emailId: string): EmailData | null {
	const cached = emailDataCache.get(emailId)
	if (!cached) return null

	// Check if cache is still fresh
	if (Date.now() - cached.timestamp > MAX_CACHE_AGE) {
		emailDataCache.delete(emailId)
		return null
	}

	return cached
}

/**
 * Store email data in cache
 */
export function cacheEmailData(data: EmailData): void {
	emailDataCache.set(data.email.id, {
		...data,
		timestamp: Date.now()
	})
}

/**
 * Prefetch email data in the background
 */
export async function prefetchEmail(emailId: string): Promise<void> {
	// Skip if already cached or currently fetching
	if (emailDataCache.has(emailId) || prefetching.has(emailId)) {
		return
	}

	prefetching.add(emailId)

	try {
		const res = await fetch(`/__svelte-emails/render?id=${encodeURIComponent(emailId)}`)
		if (res.ok) {
			const data = await res.json()
			cacheEmailData({
				...data,
				timestamp: Date.now()
			})
		}
	} catch {
		// Silently ignore prefetch errors
	} finally {
		prefetching.delete(emailId)
	}
}

/**
 * Prefetch adjacent emails (prev/next) for instant navigation
 */
export function prefetchAdjacentEmails(
	currentId: string,
	emailIds: string[],
	count: number = 2
): void {
	const currentIndex = emailIds.indexOf(currentId)
	if (currentIndex === -1) return

	// Collect adjacent IDs (prev and next)
	const adjacentIds: string[] = []

	for (let i = 1; i <= count; i++) {
		// Previous emails
		if (currentIndex - i >= 0) {
			adjacentIds.push(emailIds[currentIndex - i])
		}
		// Next emails
		if (currentIndex + i < emailIds.length) {
			adjacentIds.push(emailIds[currentIndex + i])
		}
	}

	// Prefetch with small delays to not overwhelm
	adjacentIds.forEach((id, index) => {
		setTimeout(() => prefetchEmail(id), index * 100)
	})
}

/**
 * Invalidate cached data for an email (e.g., after content change)
 */
export function invalidateEmailCache(emailId: string): void {
	emailDataCache.delete(emailId)
}

/**
 * Clear entire cache
 */
export function clearEmailCache(): void {
	emailDataCache.clear()
	prefetching.clear()
}
