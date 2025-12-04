/**
 * Client-side cache for email data.
 * Used by the +page.ts load function for instant navigation.
 */

import { browser } from '$app/environment'

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
 * Get cached email data if available and fresh
 */
export function getCached(emailId: string): CachedData | undefined {
	const cached = clientCache.get(emailId)
	if (cached && Date.now() - cached.timestamp < CACHE_MAX_AGE) {
		return cached
	}
	if (cached) {
		clientCache.delete(emailId)
	}
	return undefined
}

/**
 * Store email data in cache
 */
export function setCache(emailId: string, data: EmailRenderData) {
	clientCache.set(emailId, { data, timestamp: Date.now() })
}

/**
 * Update the formatted HTML in cache (after client-side formatting)
 */
export function setCacheFormattedHtml(emailId: string, formattedHtml: string) {
	const cached = clientCache.get(emailId)
	if (cached) {
		cached.data.formattedHtml = formattedHtml
	}
}

/**
 * Invalidate cache (called by file watcher)
 */
export function invalidateCache(emailId?: string) {
	if (emailId) {
		clientCache.delete(emailId)
	} else {
		clientCache.clear()
	}
}

/**
 * Prefetch an email in the background
 */
export function prefetchEmail(emailId: string) {
	if (!browser) return
	if (clientCache.has(emailId) || prefetching.has(emailId)) return
	
	prefetching.add(emailId)
	
	fetch(`/__svelte-emails/render?id=${encodeURIComponent(emailId)}`)
		.then(async (res) => {
			if (res.ok) {
				const data = await res.json()
				setCache(emailId, data)
			}
		})
		.catch(() => {})
		.finally(() => prefetching.delete(emailId))
}

/**
 * Prefetch adjacent emails for instant navigation
 */
export function prefetchAdjacentEmails(currentId: string, emailIds: string[], count: number = 2) {
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
		setTimeout(() => prefetchEmail(id), index * 50)
	})
}
