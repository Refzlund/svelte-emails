import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, fetch }) => {
	// Fetch from our Vite middleware API that handles SSR properly
	const res = await fetch(`/__svelte-emails/render?id=${encodeURIComponent(params.email)}`)

	if (!res.ok) {
		const data = await res.json().catch(() => ({ error: 'Unknown error' }))
		error(res.status, data.error || 'Failed to load email')
	}

	return await res.json()
}
