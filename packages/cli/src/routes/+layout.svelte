<script lang="ts">
	import { page } from '$app/state'
	import { pushState, goto } from '$app/navigation'
	import { onMount } from 'svelte'
	import initialData from 'virtual:email-list'
	import { emailStore, type EmailListItem, type ViewMode } from '$lib/email-store'
	import * as icons from '$lib/Icons.svelte'

	let { children } = $props()

	// Start with virtual module data, then update via store
	let emails: EmailListItem[] = $state(initialData.emails || [])
	let examples: EmailListItem[] = $state(initialData.examples || [])
	let documentation: EmailListItem[] = $state(initialData.documentation || [])

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
		// For examples/documentation routes, use the 'file' param
		if (page.params.file) return page.params.file
		// For email routes, use the 'email' param
		if (page.params.email) return page.params.email
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
		pushState(url.pathname + url.search, { emailId: itemId })
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

	onMount(() => {
		// Unregister any old service workers
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.getRegistrations().then((registrations) => {
				for (const registration of registrations) {
					registration.unregister()
				}
			})
		}

		// Subscribe to store updates
		const unsubscribe = emailStore.subscribe(() => {
			// Always update from store when it has data
			if (emailStore.lastListUpdateTime > 0) {
				emails = [...emailStore.emails]
				examples = [...emailStore.examples]
				documentation = [...emailStore.documentation]
			}
		})

		return unsubscribe
	})
</script>

<svelte:head>
	<title>svelte-emails</title>
	<style>
		* {
			margin: 0;
			padding: 0;
			box-sizing: border-box;
		}
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
		}
	</style>
	<link rel="stylesheet" href="/theme.css" />
	<link rel="icon" href='/svelte-emails.png' />
</svelte:head>

<div class="container">
	<!-- Sidebar -->
	<aside class="sidebar">
		<header class="sidebar-header">
			<img src="/svelte-emails.png" alt="svelte-emails logo" width="24" height="24" />
			<span class="title">{navTitle}</span>
		</header>

		<nav class="email-list">
			{#each currentList as item, i}
				<a
					href="{urlPrefix}/{item.id}"
					class="email-item"
					class:selected={selectedId === item.id}
					class:even={i % 2 === 0}
					class:odd={i % 2 === 1}
					onclick={(e) => handleItemClick(e, item.id)}
				>
					<span class="email-name">{item.name}</span>
					{#if item.previewText}
						<span class="email-preview">{item.previewText}</span>
					{/if}
				</a>
			{/each}

			{#if currentList.length === 0}
				<div class="empty-state">
					<p>{emptyStateMessage.title}</p>
					<p class="hint">{emptyStateMessage.hint}</p>
				</div>
			{/if}
		</nav>

		<footer class="sidebar-footer">
			<button
				class="mode-toggle"
				class:active={viewMode === 'examples'}
				onclick={() => navigateToMode('examples')}
			>
				{@render icons.sparkleAction({ size: 24, opacity: viewMode === 'examples' ? 1 : .5 })}
				Examples
			</button>
			<button
				class="mode-toggle"
				class:active={viewMode === 'documentation'}
				onclick={() => navigateToMode('documentation')}
			>
				{@render icons.bookInformation({ size: 24, opacity: viewMode === 'documentation' ? 1 : .5 })}
				Documentation
			</button>
		</footer>
	</aside>

	<!-- Main content -->
	<main class="main">
		{@render children()}
	</main>
</div>

<style>
	.container {
		display: flex;
		height: 100vh;
		width: 100vw;
		overflow: hidden;
	}

	.sidebar {
		width: 320px;
		min-width: 320px;
		background: var(--nav-bg);
		display: flex;
		flex-direction: column;
	}

	.sidebar-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		height: 70px;
		padding: 0px 20px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.title {
		font-size: 14px;
		font-weight: 600;
		color: #fff;
		font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
	}

	.email-list {
		flex: 1;
		overflow-y: auto;
	}

	.email-item {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: var(--nav-item-padding-y) var(--nav-item-padding-x);
		text-decoration: none;
		color: var(--nav-item-text);
		transition: background 0.15s ease;
		border-left: var(--nav-item-selected-border-width) solid transparent;
	}

	.email-item.even {
		background: var(--nav-item-even);
	}

	.email-item.odd {
		background: var(--nav-item-odd);
	}

	.email-item:hover {
		background: var(--nav-item-selected);
	}

	.email-item.selected {
		background: var(--nav-item-selected);
		border-left-color: var(--nav-item-selected-border);
	}

	.email-name {
		font-weight: 400;
		font-size: 14px;
	}

	.email-item.selected .email-name {
		font-weight: 700;
	}

	.email-preview {
		font-size: 12px;
		opacity: var(--nav-item-preview-opacity);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.email-item.selected .email-preview {
		opacity: var(--nav-item-preview-opacity-selected);
	}

	.empty-state {
		padding: 24px 16px;
		text-align: center;
		color: rgba(255, 255, 255, 0.5);
	}

	.empty-state p {
		margin-bottom: 8px;
	}

	.empty-state .hint {
		font-size: 12px;
		opacity: 0.7;
	}

	.sidebar-footer {
		padding: 10px 8px;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.sidebar-footer .mode-toggle {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		border-radius: 6px;
		text-decoration: none;
		color: rgba(255, 255, 255, 0.6);
		font-size: 13px;
		transition: all 0.15s ease;
		background: transparent;
		border: none;
		cursor: pointer;
		width: 100%;
		text-align: left;
	}

	.sidebar-footer .mode-toggle:hover {
		background: rgba(255, 255, 255, 0.05);
		color: #fff;
	}

	.sidebar-footer .mode-toggle.active {
		background: rgba(255, 255, 255, 0.1);
		color: #fff;
	}

	.main {
		flex: 1;
		background: var(--nav-top-bg);
		border-left: 1px solid var(--nav-top-border-left);
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}
</style>
