import type { PageLoad } from './$types'

// Disable SSR for instant client-side navigation
export const ssr = false

export const load: PageLoad = async ({ params }) => {
	return { emailId: params.file }
}
