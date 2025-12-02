import { render } from 'svelte-emails'
import MyEmail from './MyEmail.email.svelte'

export function load() {
	const output = render(MyEmail, {
		vars: { first_name: 'John' },
		props: {}
	})

	return {
		serverOutput: output
	}
}
