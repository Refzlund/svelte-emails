import { browser } from '$app/environment'
import { base } from '$app/paths'
import type { SafeEmail, ViewMode } from '../cli/types.js'
// @ts-ignore - virtual module
import { isStaticBuild } from 'virtual:svelte-emails-build-mode'

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
let isInitialized = false
const listeners = new Set<Listener>()

function notify() {
	for (const listener of listeners) {
		listener()
	}
}

/**
 * Load email list from static JSON (for static builds)
 */
async function loadStaticEmailList(): Promise<void> {
	if (!browser || isInitialized) return
	
	try {
		const res = await fetch(`${base}/_data/email-list.json`)
		if (!res.ok) return
		
		const data = await res.json()
		emails = data.emails || []
		examples = data.examples || []
		documentation = data.documentation || []
		lastListUpdateTime = Date.now()
		isInitialized = true
		notify()
	} catch {
		// Silent fail for static builds - email list just won't load
	}
}

function connect() {
	if (eventSource || !browser) return
	
	// In static build mode, don't connect to SSE
	if (isStaticBuild) {
		loadStaticEmailList()
		return
	}

	eventSource = new EventSource('/__svelte-emails/events')

	eventSource.addEventListener('emails', (event) => {
		const data = JSON.parse(event.data)
		emails = data.emails || []
		examples = data.examples || []
		documentation = data.documentation || []
		lastListUpdateTime = Date.now()
		isInitialized = true
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
	/** Whether this is a static build (no live reload) */
	get isStaticBuild() {
		return isStaticBuild
	},
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
	},
	/**
	 * Ensure email list is loaded (for static builds)
	 */
	async ensureLoaded(): Promise<void> {
		if (isStaticBuild && !isInitialized) {
			await loadStaticEmailList()
		}
	}
}
