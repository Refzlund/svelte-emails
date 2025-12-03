<script lang="ts">
	import { goto } from '$app/navigation'
	import { onMount } from 'svelte'
	import emails from 'virtual:email-list'

	onMount(() => {
		if (emails.length > 0) {
			goto(`/${emails[0].id}`, { replaceState: true })
		}
	})
</script>

{#if emails.length === 0}
	<div class="welcome">
		<h1>📧 svelte-emails</h1>
		<p>No email templates found.</p>
		<p class="hint">Create a file ending with <code>.email.svelte</code> to get started.</p>
	</div>
{:else}
	<div class="loading">
		<p>Loading...</p>
	</div>
{/if}

<style>
	.welcome, .loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		text-align: center;
		padding: 24px;
		color: #666;
	}

	h1 {
		font-size: 32px;
		margin-bottom: 16px;
		color: #333;
	}

	p {
		margin-bottom: 8px;
	}

	.hint {
		font-size: 14px;
		color: #999;
	}

	code {
		background: #f0f0f0;
		padding: 2px 6px;
		border-radius: 4px;
		font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
	}
</style>
