import { render } from 'svelte-emails'
import MyEmail from './MyEmail.email.svelte'

export async function load() {
	const output = await render(MyEmail, {
		placeholders: { first_name: 'John' },
		props: {}
	})

	return {
		serverOutput: output
	}
}
