import type { PageLoad } from './$types'
import type { ViewMode } from '$lib/email-store'

// Disable SSR for instant client-side navigation
export const ssr = false

export const load: PageLoad = async ({ params }) => {
	const segments = params.params?.split('/') ?? []
	
	let mode: ViewMode = 'emails'
	let itemId: string | undefined = undefined
	
	if (segments[0] === 'examples') {
		mode = 'examples'
		itemId = segments.slice(1).join('/') || undefined
	} else if (segments[0] === 'documentation') {
		mode = 'documentation'
		itemId = segments.slice(1).join('/') || undefined
	} else {
		mode = 'emails'
		itemId = segments.join('/') || undefined
	}
	
	return { mode, itemId }
}
