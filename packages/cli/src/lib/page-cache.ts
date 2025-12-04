/**
 * Client-side cache for email data.
 * Used by the +page.ts load function for instant navigation.
 */

import { browser } from '$app/environment'
import type { ViewMode } from '../cli/types.js'

export interface EmailRenderData {
	email: {
		id: string
		name: string
		relativePath: string
		previewText: string
	}
	source: string
	rendered: {
		html: string
		htmlRaw: string
		text: string
	} | null
	/** Formatted (prettified) HTML - computed client-side */
	formattedHtml: string | null
	renderError: string | null
}

interface CachedData {
	data: EmailRenderData
	timestamp: number
}

// Client-side cache for instant navigation
const clientCache = new Map<string, CachedData>()
const prefetching = new Set<string>()

export const CACHE_MAX_AGE = 5 * 60 * 1000 // 5 minutes

/**
 * Create a cache key from emailId and mode
 */
export function cacheKey(emailId: string, mode: ViewMode = 'emails'): string {
	return `${mode}:${emailId}`
}

/**
 * Get cached email data if available and fresh
 */
export function getCached(emailId: string, mode: ViewMode = 'emails'): CachedData | undefined {
	const key = cacheKey(emailId, mode)
	const cached = clientCache.get(key)
	if (cached && Date.now() - cached.timestamp < CACHE_MAX_AGE) {
		return cached
	}
	if (cached) {
		clientCache.delete(key)
	}
	return undefined
}

/**
 * Store email data in cache
 */
export function setCache(emailId: string, data: EmailRenderData, mode: ViewMode = 'emails') {
	clientCache.set(cacheKey(emailId, mode), { data, timestamp: Date.now() })
}

/**
 * Update the formatted HTML in cache (after client-side formatting)
 */
export function setCacheFormattedHtml(emailId: string, formattedHtml: string, mode: ViewMode = 'emails') {
	const cached = clientCache.get(cacheKey(emailId, mode))
	if (cached) {
		cached.data.formattedHtml = formattedHtml
	}
}

/**
 * Invalidate cache (called by file watcher)
 */
export function invalidateCache(emailId?: string, mode?: ViewMode) {
	if (emailId && mode) {
		clientCache.delete(cacheKey(emailId, mode))
	} else if (emailId) {
		// Invalidate all modes for this ID
		for (const m of ['emails', 'examples', 'documentation'] as ViewMode[]) {
			clientCache.delete(cacheKey(emailId, m))
		}
	} else {
		clientCache.clear()
	}
}

/**
 * Prefetch an email in the background
 */
export function prefetchEmail(emailId: string, mode: ViewMode = 'emails') {
	if (!browser) return
	const key = cacheKey(emailId, mode)
	if (clientCache.has(key) || prefetching.has(key)) return
	
	prefetching.add(key)
	
	fetch(`/__svelte-emails/render?id=${encodeURIComponent(emailId)}&mode=${mode}`)
		.then(async (res) => {
			if (res.ok) {
				const data = await res.json()
				setCache(emailId, data, mode)
			}
		})
		.catch(() => {})
		.finally(() => prefetching.delete(key))
}

/**
 * Prefetch adjacent emails for instant navigation
 */
export function prefetchAdjacentEmails(
	currentId: string,
	emailIds: string[],
	count: number = 2,
	mode: ViewMode = 'emails'
) {
	if (!browser) return
	
	const currentIndex = emailIds.indexOf(currentId)
	if (currentIndex === -1) return

	const adjacentIds: string[] = []

	for (let i = 1; i <= count; i++) {
		if (currentIndex - i >= 0) adjacentIds.push(emailIds[currentIndex - i])
		if (currentIndex + i < emailIds.length) adjacentIds.push(emailIds[currentIndex + i])
	}

	// Prefetch with small delays to not overwhelm
	adjacentIds.forEach((id, index) => {
		setTimeout(() => prefetchEmail(id, mode), index * 50)
	})
}
