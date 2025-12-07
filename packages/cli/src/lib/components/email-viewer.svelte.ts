/**
 * EmailViewer state and fetch logic.
 * 
 * Extracts reactive state and data fetching from EmailViewer.svelte
 * for better separation of concerns and reduced component complexity.
 */

import { untrack } from 'svelte'
import { base } from '$app/paths'
import { emailStore, type ViewMode } from '../email-store.js'
import {
	getCached,
	setCache,
	setCacheFormattedHtml,
	invalidateCache,
	prefetchAdjacentEmails,
	type EmailRenderData
} from '../page-cache.js'
import { formatHtml } from 'svelte-emails'

export type { EmailRenderData }

/**
 * Create email viewer state with reactive data fetching.
 */
export function createEmailViewerState(
	getMode: () => ViewMode,
	getItemId: () => string | undefined
) {
	// Local state for content
	let email = $state<EmailRenderData['email'] | null>(null)
	let source = $state<string | null>(null)
	let rendered = $state<EmailRenderData['rendered'] | null>(null)
	let formattedHtml = $state<string | null>(null)
	let renderError = $state<string | null>(null)
	let isLoading = $state(false)
	let isRerendering = $state(false)

	/**
	 * Process email render result - format HTML if needed and update state
	 */
	function processRenderResult(result: EmailRenderData, id: string, mode: ViewMode) {
		email = result.email
		source = result.source
		rendered = result.rendered
		renderError = result.renderError

		// Use cached formatted HTML or format now
		if (result.formattedHtml) {
			formattedHtml = result.formattedHtml
		} else if (result.rendered?.html) {
			const formatted = formatHtml(result.rendered.html)
			formattedHtml = formatted
			result.formattedHtml = formatted
			setCacheFormattedHtml(id, formatted, mode)
		} else {
			formattedHtml = null
		}
	}

	/**
	 * Fetch email data from server (dev mode) or static JSON (build mode)
	 */
	async function fetchEmail(id: string, mode: ViewMode): Promise<EmailRenderData | null> {
		// In static build mode, fetch from pre-rendered JSON files
		if (emailStore.isStaticBuild) {
			const res = await fetch(`${base}/_data/${mode}/${id}.json`)
			
			if (!res.ok) {
				throw new Error(`Email not found: ${id}`)
			}
			
			const result = await res.json()
			return result
		}
		
		// Dev mode: fetch from Vite SSR endpoint
		const res = await fetch(`/__svelte-emails/render?id=${encodeURIComponent(id)}&mode=${mode}`)
		
		if (!res.ok) {
			const err = await res.json().catch(() => ({ error: 'Unknown error' }))
			throw new Error(err.error || 'Failed to load')
		}
		
		const result = await res.json()
		result.formattedHtml = null
		return result
	}

	// Fetch content when itemId changes
	$effect(() => {
		const id = getItemId()
		const mode = getMode()
		
		if (!id) {
			isLoading = false
			return
		}

		// Check if we already have this item loaded
		if (email?.id === id) {
			return
		}

		// Check cache first for instant display
		const cached = getCached(id, mode)
		if (cached) {
			processRenderResult(cached.data, id, mode)
			isLoading = false
			return
		}

		// Fetch from server
		isLoading = true
		renderError = null
		
		fetchEmail(id, mode)
			.then((result) => {
				// Check if this is still the current item
				if (getItemId() !== id) return
				if (!result) return
				
				processRenderResult(result, id, mode)
				setCache(id, result, mode)
				isLoading = false
			})
			.catch((err) => {
				if (getItemId() !== id) return
				renderError = err.message || 'Failed to load'
				isLoading = false
			})
	})

	// Prefetch adjacent items for instant navigation
	$effect(() => {
		if (!email) return
		const mode = getMode()
		const list = emailStore.getByMode(mode)
		const ids = list.map((e: { id: string }) => e.id)
		if (ids.length > 0) {
			untrack(() => prefetchAdjacentEmails(email!.id, ids, 2, mode))
		}
	})

	// Setup content change listener (no-op in static build mode)
	function setupContentChangeListener() {
		// In static build mode, no live reload
		if (emailStore.isStaticBuild) {
			return () => {} // no-op cleanup
		}
		
		let lastSeenTime = emailStore.lastContentChangeTime

		return emailStore.subscribe(() => {
			const itemId = getItemId()
			const mode = getMode()
			
			if (
				emailStore.lastContentChangeId === itemId &&
				emailStore.lastContentChangeTime > lastSeenTime
			) {
				lastSeenTime = emailStore.lastContentChangeTime

				invalidateCache(itemId!, mode)
				isRerendering = true

				fetchEmail(itemId!, mode)
					.then((result) => {
						if (!result) return
						processRenderResult(result, itemId!, mode)
						setCache(itemId!, result, mode)
						isRerendering = false
					})
					.catch((err) => {
						renderError = err.message || 'Failed to load'
						isRerendering = false
					})
			}
		})
	}

	return {
		// Reactive state
		get email() { return email },
		get source() { return source },
		get rendered() { return rendered },
		get formattedHtml() { return formattedHtml },
		get renderError() { return renderError },
		get isLoading() { return isLoading },
		get isRerendering() { return isRerendering },
		
		// Actions
		setupContentChangeListener
	}
}
