<script lang="ts">
	import { page } from '$app/state'
	import { onMount } from 'svelte'
	import initialEmails from 'virtual:email-list'
	import { emailStore, type EmailListItem } from '$lib/email-store'
	import * as icons from '$lib/Icons.svelte'

	let { children } = $props()

	// Start with virtual module data, then update via store
	let emails: EmailListItem[] = $state(initialEmails)

	const selectedId = $derived(page.params.email ?? emails[0]?.id)

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
			const storeEmails = emailStore.emails
			if (storeEmails.length > 0 || emailStore.lastListUpdateTime > 0) {
				// Use store emails (could be empty if all files deleted)
				emails = [...storeEmails]
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
			<span class="title">*.email.svelte</span>
		</header>

		<nav class="email-list" data-sveltekit-preload-data="hover">
			{#each emails as email, i}
				<a
					href="/{email.id}"
					class="email-item"
					class:selected={selectedId === email.id}
					class:even={i % 2 === 0}
					class:odd={i % 2 === 1}
				>
					<span class="email-name">{email.name}</span>
					{#if email.previewText}
						<span class="email-preview">{email.previewText}</span>
					{/if}
				</a>
			{/each}

			{#if emails.length === 0}
				<div class="empty-state">
					<p>No *.email.svelte files found</p>
					<p class="hint">Create a file ending with .email.svelte</p>
				</div>
			{/if}
		</nav>

		<footer class="sidebar-footer">
			<a
				href="https://github.com/Refzlund/svelte-emails#readme"
				target="_blank"
				rel="noopener"
			>
				{@render icons.sparkleAction({ size: 24, opacity: .5 })}
				Examples
			</a>
			<a
				href="https://github.com/Refzlund/svelte-emails/blob/main/ARCHITECTURE.md"
				target="_blank"
				rel="noopener"
			>
				{@render icons.bookInformation({ size: 24, opacity: .5 })}
				Documentation
			</a>
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

	.sidebar-footer a {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		border-radius: 6px;
		text-decoration: none;
		color: rgba(255, 255, 255, 0.6);
		font-size: 13px;
		transition: all 0.15s ease;
	}

	.sidebar-footer a:hover {
		background: rgba(255, 255, 255, 0.05);
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
