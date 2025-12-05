/**
 * Sidebar state and navigation logic.
 * 
 * Extracts reactive state and navigation functions from Sidebar.svelte
 * for better separation of concerns and testability.
 */

import { page } from '$app/state'
import { pushState, goto } from '$app/navigation'
import initialData from 'virtual:email-list'
import { emailStore } from '../email-store.js'
import type { SafeEmail, ViewMode } from '../../cli/types.js'

export type { ViewMode }

export interface NavFolder {
	name: string
	items: SafeEmail[]
}

export interface NavStructure {
	uncategorized: SafeEmail[]
	folders: NavFolder[]
}

/**
 * Create sidebar state with reactive email lists.
 * Automatically subscribes to SSE updates on mount.
 */
export function createSidebarState() {
	// Start with virtual module data, then update via store
	let emails = $state<SafeEmail[]>(initialData.emails || [])
	let examples = $state<SafeEmail[]>(initialData.examples || [])
	let documentation = $state<SafeEmail[]>(initialData.documentation || [])

	// Track collapsed folders (by category name)
	let collapsedFolders = $state<Record<string, boolean>>({})

	// Derive view mode from current URL path
	const viewMode: ViewMode = $derived.by(() => {
		const path = page.url.pathname
		if (path.startsWith('/examples')) return 'examples'
		if (path.startsWith('/documentation')) return 'documentation'
		return 'emails'
	})

	// Get the current list based on view mode
	const currentList = $derived.by(() => {
		switch (viewMode) {
			case 'emails': return emails
			case 'examples': return examples
			case 'documentation': return documentation
		}
	})

	// Group items by category and sort alphabetically
	const navStructure: NavStructure = $derived.by(() => {
		const uncategorized: SafeEmail[] = []
		const folderMap = new Map<string, SafeEmail[]>()

		for (const item of currentList) {
			if (item.category) {
				const existing = folderMap.get(item.category) || []
				existing.push(item)
				folderMap.set(item.category, existing)
			} else {
				uncategorized.push(item)
			}
		}

		// Sort items within each group alphabetically
		uncategorized.sort((a, b) => a.name.localeCompare(b.name))

		// Convert map to sorted array of folders
		const folders: NavFolder[] = []
		for (const [name, items] of folderMap) {
			items.sort((a, b) => a.name.localeCompare(b.name))
			folders.push({ name, items })
		}
		// Sort folders alphabetically by name
		folders.sort((a, b) => a.name.localeCompare(b.name))

		return { uncategorized, folders }
	})

	// Get the title based on view mode
	const navTitle = $derived.by(() => {
		switch (viewMode) {
			case 'emails': return '*.email.svelte'
			case 'examples': return 'Examples'
			case 'documentation': return 'Documentation'
		}
	})

	// Get empty state message based on view mode
	const emptyStateMessage = $derived.by(() => {
		switch (viewMode) {
			case 'emails': return { title: 'No *.email.svelte files found', hint: 'Create a file ending with .email.svelte' }
			case 'examples': return { title: 'No examples found', hint: 'Examples are bundled with svelte-emails CLI' }
			case 'documentation': return { title: 'No documentation found', hint: 'Documentation is bundled with svelte-emails CLI' }
		}
	})

	// Get the URL prefix for current mode
	const urlPrefix = $derived.by(() => {
		switch (viewMode) {
			case 'emails': return ''
			case 'examples': return '/examples'
			case 'documentation': return '/documentation'
		}
	})

	// Get selected ID from URL params or shallow routing state
	const selectedId = $derived.by(() => {
		// First check shallow routing state (set by pushState)
		const stateId = (page.state as any)?.emailId
		if (stateId) return stateId
		// Extract ID from the [...params] catch-all route
		const params = page.params.params
		if (params) {
			const segments = params.split('/')
			// For examples/documentation, ID is after the mode prefix
			if (segments[0] === 'examples' || segments[0] === 'documentation') {
				return segments.slice(1).join('/') || undefined
			}
			// For emails, the whole params is the ID
			return segments.join('/')
		}
		// Default to first item in current list
		return currentList[0]?.id
	})

	// Handle instant navigation via shallow routing
	function handleItemClick(e: MouseEvent, itemId: string) {
		e.preventDefault()
		// Build URL based on current view mode
		const basePath = urlPrefix ? `${urlPrefix}/${itemId}` : `/${itemId}`
		const url = new URL(basePath, window.location.origin)
		// Preserve current query params (e.g., ?mode=html)
		const currentMode = new URL(window.location.href).searchParams.get('mode')
		if (currentMode) {
			url.searchParams.set('mode', currentMode)
		}
		pushState(url.pathname + url.search, { emailId: itemId, mode: viewMode })
	}

	// Toggle folder collapsed state
	function toggleFolder(folderName: string) {
		collapsedFolders[folderName] = !collapsedFolders[folderName]
	}

	// Navigate to a specific view mode
	function navigateToMode(mode: ViewMode) {
		if (mode === viewMode) {
			// Already in this mode, go back to emails
			if (emails.length > 0) {
				goto(`/${emails[0].id}`)
			} else {
				goto('/')
			}
			return
		}
		
		// Navigate to the new mode
		const list = mode === 'emails' ? emails : mode === 'examples' ? examples : documentation
		if (list.length > 0) {
			const prefix = mode === 'emails' ? '' : `/${mode}`
			goto(`${prefix}/${list[0].id}`)
		} else {
			// Navigate to mode root even if empty
			const prefix = mode === 'emails' ? '/' : `/${mode}`
			goto(prefix)
		}
	}

	// Check if a folder is collapsed
	function isFolderCollapsed(folderName: string): boolean {
		return collapsedFolders[folderName] ?? false
	}

	// Get alternating row index across all items (for zebra striping)
	function getGlobalIndex(folderIndex: number, itemIndex: number): number {
		// Count items before this one
		let count = navStructure.uncategorized.length
		for (let i = 0; i < folderIndex; i++) {
			count += navStructure.folders[i].items.length + 1 // +1 for folder header
		}
		return count + itemIndex + 1 // +1 for current folder header
	}

	// Subscribe to store updates
	function subscribeToUpdates() {
		return emailStore.subscribe(() => {
			// Always update from store when it has data
			if (emailStore.lastListUpdateTime > 0) {
				emails = [...emailStore.emails]
				examples = [...emailStore.examples]
				documentation = [...emailStore.documentation]
			}
		})
	}

	return {
		// Derived state (read-only)
		get viewMode() { return viewMode },
		get currentList() { return currentList },
		get navStructure() { return navStructure },
		get navTitle() { return navTitle },
		get emptyStateMessage() { return emptyStateMessage },
		get urlPrefix() { return urlPrefix },
		get selectedId() { return selectedId },

		// Actions
		handleItemClick,
		toggleFolder,
		navigateToMode,
		isFolderCollapsed,
		getGlobalIndex,
		subscribeToUpdates
	}
}
