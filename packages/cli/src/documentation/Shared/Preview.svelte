<script lang='ts'>
	import type { Snippet } from 'svelte'
	import { Div } from 'svelte-emails'
	import { colors } from '../theme'

	let { children }: { children: Snippet } = $props()
</script>

<Div bg={colors.codeBg} bg-opacity-50 border-opacity-50 border-dashed p-4 rounded border={colors.border}>
	{@render children()}
</Div>
