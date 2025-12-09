<script lang='ts'>
	import { Email, Text } from 'svelte-emails'

	interface Props {
		text?: string
	}

	let { text }: Props = $props()

	const upperText = $derived(text?.toUpperCase() ?? '')
</script>

<Email preview='Issue Test'>
	{#if upperText}
		<Text content={upperText} />
	{:else}
		<Text content='NO TEXT PROVIDED' />
	{/if}
</Email>
