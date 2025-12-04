<script lang="ts">
	import { goto } from '$app/navigation'
	import { onMount } from 'svelte'
	import { emailStore } from '$lib/email-store'

	// Redirect to first example if available
	onMount(() => {
		if (emailStore.examples.length > 0) {
			goto(`/examples/${emailStore.examples[0].id}`, { replaceState: true })
		}
	})
</script>

<div class="empty-view">
	<p>Select an example from the sidebar</p>
</div>

<style>
	.empty-view {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: rgba(255, 255, 255, 0.5);
		font-size: 14px;
	}
</style>
