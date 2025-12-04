import { browser } from '$app/environment'
import { getCached } from '$lib/page-cache'
import type { PageLoad } from './$types'

// Disable SSR for instant client-side navigation
export const ssr = false

export const load: PageLoad = async ({ params }) => {
	const emailId = params.email

	// On client, check cache first for instant navigation
	if (browser) {
		const cached = getCached(emailId)
		if (cached) {
			return cached.data
		}
	}

	// Return immediately with just the email ID
	// The component will fetch the actual content client-side
	return {
		emailId,
		email: null,
		source: null,
		rendered: null,
		renderError: null
	}
}
