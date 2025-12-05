<script lang="ts">
	import { goto } from '$app/navigation'
	import { page } from '$app/state'
	import { onMount } from 'svelte'
	import { EmailViewer } from '$lib/components'
	import { emailStore, type ViewMode } from '$lib/email-store'
	import type { PageData } from './$types'
	import emailData from 'virtual:email-list'

	interface Props {
		data: PageData
	}

	const { data }: Props = $props()

	// Get mode and itemId from shallow routing state or fall back to data/params
	const currentMode = $derived<ViewMode>(
		(page.state as any)?.mode ?? data.mode
	)
	
	const currentItemId = $derived<string | undefined>(
		(page.state as any)?.emailId ?? data.itemId
	)

	// Handle redirect for index pages (no itemId)
	onMount(() => {
		if (currentItemId) return // Already have an item, no redirect needed
		
		if (currentMode === 'emails') {
			if (emailData.emails.length > 0) {
				goto(`/${emailData.emails[0].id}`, { replaceState: true })
			}
		} else if (currentMode === 'examples') {
			if (emailStore.examples.length > 0) {
				goto(`/examples/${emailStore.examples[0].id}`, { replaceState: true })
			}
		} else if (currentMode === 'documentation') {
			if (emailStore.documentation.length > 0) {
				goto(`/documentation/${emailStore.documentation[0].id}`, { replaceState: true })
			}
		}
	})
</script>

{#if currentItemId}
	<EmailViewer mode={currentMode} itemId={currentItemId} />
{:else if currentMode === 'emails' && emailData.emails.length === 0}
	<div class="welcome">
		<h1>svelte-emails</h1>
		<p>No email templates found.</p>
		<p class="hint">Create a file ending with <code>.email.svelte</code> to get started.</p>
	</div>
{:else}
	<div class="empty-view">
		<p>
			{#if currentMode === 'emails'}
				Loading...
			{:else if currentMode === 'examples'}
				Select an example from the sidebar
			{:else}
				Select a documentation page from the sidebar
			{/if}
		</p>
	</div>
{/if}

<style>
	.welcome {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		text-align: center;
		padding: 24px;
		color: #666;
	}

	.welcome h1 {
		font-size: 32px;
		margin-bottom: 16px;
		color: #333;
	}

	.welcome p {
		margin-bottom: 8px;
	}

	.welcome .hint {
		font-size: 14px;
		color: #999;
	}

	.welcome code {
		background: #f0f0f0;
		padding: 2px 6px;
		border-radius: 4px;
		font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
	}

	.empty-view {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: rgba(255, 255, 255, 0.5);
		font-size: 14px;
	}
</style>
