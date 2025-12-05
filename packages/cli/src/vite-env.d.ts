/// <reference types="vite/client" />

declare module 'virtual:email-list' {
	import type { SafeEmail } from './cli/types.js'
	
	interface EmailListData {
		emails: SafeEmail[]
		examples: SafeEmail[]
		documentation: SafeEmail[]
	}
	
	const data: EmailListData
	export default data
}
