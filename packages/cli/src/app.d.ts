/// <reference types="svelte" />

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

// Virtual module declarations
declare module 'virtual:email-list' {
	import type { SafeEmail } from './cli/types.js'
	const emailData: {
		emails: SafeEmail[]
		examples: SafeEmail[]
		documentation: SafeEmail[]
	}
	export default emailData
}

declare module 'virtual:svelte-emails-build-mode' {
	export const isStaticBuild: boolean
}

export {}
