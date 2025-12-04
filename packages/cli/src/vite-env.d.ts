/// <reference types="vite/client" />

declare module 'virtual:email-list' {
	import type { ViewMode } from './cli/types.js'
	
	interface EmailListItem {
		id: string
		name: string
		relativePath: string
		previewText: string
		mode: ViewMode
	}
	
	interface EmailListData {
		emails: EmailListItem[]
		examples: EmailListItem[]
		documentation: EmailListItem[]
	}
	
	const data: EmailListData
	export default data
}
