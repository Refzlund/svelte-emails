/// <reference types="vite/client" />

declare module 'virtual:email-list' {
	interface EmailListItem {
		id: string
		name: string
		relativePath: string
		previewText: string
	}
	const emails: EmailListItem[]
	export default emails
}
