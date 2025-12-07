/**
 * Client-side cache for email data.
 * Used by the +page.ts load function for instant navigation.
 */

import { browser } from '$app/environment'
import { base } from '$app/paths'
import type { ViewMode } from '../cli/types.js'
// @ts-ignore - virtual module
import { isStaticBuild } from 'virtual:svelte-emails-build-mode'

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

// In static build mode, cache is permanent (no expiry)
export const CACHE_MAX_AGE = isStaticBuild ? Infinity : 5 * 60 * 1000 // 5 minutes for dev, forever for static

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
	
	// Use static JSON in build mode, API endpoint in dev mode
	const url = isStaticBuild 
		? `${base}/_data/${mode}/${emailId}.json`
		: `/__svelte-emails/render?id=${encodeURIComponent(emailId)}&mode=${mode}`
	
	fetch(url)
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
