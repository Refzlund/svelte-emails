<script lang="ts">
	import { page } from '$app/state'
	import { onMount } from 'svelte'
	import initialEmails from 'virtual:email-list'
	import { emailStore, type EmailListItem } from '$lib/email-store'

	let { children } = $props()

	// Start with virtual module data, then update via store
	let emails: EmailListItem[] = $state(initialEmails)

	const selectedId = $derived(page.params.email ?? emails[0]?.id)

	onMount(() => {
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
	<link rel="icon" href='/svelte-emails.png' />
</svelte:head>

<div class="container">
	<!-- Sidebar -->
	<aside class="sidebar">
		<header class="sidebar-header">
			<span class="logo">📧</span>
			<span class="title">*.email.svelte</span>
		</header>

		<nav class="email-list">
			{#each emails as email}
				<a
					href="/{email.id}"
					class="email-item"
					class:selected={selectedId === email.id}
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
				<span>⚡</span> Examples
			</a>
			<a
				href="https://github.com/Refzlund/svelte-emails/blob/main/ARCHITECTURE.md"
				target="_blank"
				rel="noopener"
			>
				<span>📖</span> Documentation
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
		background: #1a1a2e;
		display: flex;
		flex-direction: column;
		border-right: 1px solid rgba(255, 255, 255, 0.1);
	}

	.sidebar-header {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 16px 20px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.logo {
		font-size: 20px;
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
		padding: 8px;
	}

	.email-item {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 12px 16px;
		border-radius: 8px;
		text-decoration: none;
		color: rgba(255, 255, 255, 0.7);
		transition: all 0.15s ease;
	}

	.email-item:hover {
		background: rgba(255, 255, 255, 0.05);
		color: #fff;
	}

	.email-item.selected {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #fff;
	}

	.email-name {
		font-weight: 600;
		font-size: 14px;
	}

	.email-preview {
		font-size: 12px;
		opacity: 0.7;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
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
		padding: 12px 16px;
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
		background: #f5f5f5;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}
</style>
