<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<style>
	:global(body), :global(html) {
		margin: 0;
		padding: 0;
		height: 100%;
		width: 100%;
	}

	:global(*) {
		box-sizing: border-box;
	}
</style>