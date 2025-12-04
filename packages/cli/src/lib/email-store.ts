import { browser } from '$app/environment'
import type { SafeEmail } from '../cli/types.js'

export type { SafeEmail as EmailListItem }

type Listener = () => void

// Singleton SSE connection and state
let eventSource: EventSource | null = null
let emails: SafeEmail[] = []
let lastContentChangeId: string | null = null
let lastContentChangeTime = 0
let lastListUpdateTime = 0
const listeners = new Set<Listener>()

function notify() {
	for (const listener of listeners) {
		listener()
	}
}

function connect() {
	if (eventSource || !browser) return

	console.log('[svelte-emails] Connecting to SSE...')
	eventSource = new EventSource('/__svelte-emails/events')

	eventSource.addEventListener('emails', (event) => {
		const data = JSON.parse(event.data)
		console.log('[svelte-emails] Received emails update:', data.event, data.emails.length, 'emails')
		emails = data.emails
		lastListUpdateTime = Date.now()
		notify()
	})

	eventSource.addEventListener('content-change', (event) => {
		const data = JSON.parse(event.data)
		console.log('[svelte-emails] Content changed:', data.id)
		lastContentChangeId = data.id
		lastContentChangeTime = Date.now()
		notify()
	})

	eventSource.onopen = () => {
		console.log('[svelte-emails] SSE connected')
	}

	eventSource.onerror = (e) => {
		console.warn('[svelte-emails] SSE error, will auto-reconnect', e)
	}
}

// Auto-connect in browser
if (browser) {
	connect()
}

export const emailStore = {
	get emails() {
		return emails
	},
	get lastContentChangeId() {
		return lastContentChangeId
	},
	get lastContentChangeTime() {
		return lastContentChangeTime
	},
	get lastListUpdateTime() {
		return lastListUpdateTime
	},
	subscribe(listener: Listener) {
		listeners.add(listener)
		return () => listeners.delete(listener)
	}
}
