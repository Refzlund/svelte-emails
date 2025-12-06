<script lang="ts">
	import { onMount } from 'svelte'
	import { ResponsiveLayout } from '$lib/components'
	import { handleKeyboardShortcut } from '$lib/utils/keyboard-shortcuts'

	onMount(() => {
		// Unregister any old service workers
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.getRegistrations().then((registrations) => {
				for (const registration of registrations) {
					registration.unregister()
				}
			})
		}
	})

	function handleKeydown(e: KeyboardEvent) {
		handleKeyboardShortcut(e)
	}
</script>

<svelte:window onkeydown={handleKeydown} />

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

<ResponsiveLayout />
