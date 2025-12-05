import { browser } from '$app/environment'
import type { SafeEmail, ViewMode } from '../cli/types.js'

export type { ViewMode }

type Listener = () => void

// Singleton SSE connection and state
let eventSource: EventSource | null = null
let emails: SafeEmail[] = []
let examples: SafeEmail[] = []
let documentation: SafeEmail[] = []
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

	eventSource = new EventSource('/__svelte-emails/events')

	eventSource.addEventListener('emails', (event) => {
		const data = JSON.parse(event.data)
		emails = data.emails || []
		examples = data.examples || []
		documentation = data.documentation || []
		lastListUpdateTime = Date.now()
		notify()
	})

	eventSource.addEventListener('content-change', (event) => {
		const data = JSON.parse(event.data)
		lastContentChangeId = data.id
		lastContentChangeTime = Date.now()
		notify()
	})

	eventSource.onopen = () => {
		// Connected
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
	get examples() {
		return examples
	},
	get documentation() {
		return documentation
	},
	/**
	 * Get files for a specific mode
	 */
	getByMode(mode: ViewMode): SafeEmail[] {
		switch (mode) {
			case 'emails': return emails
			case 'examples': return examples
			case 'documentation': return documentation
		}
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
