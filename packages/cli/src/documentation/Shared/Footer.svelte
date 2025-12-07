<script lang='ts' module>
	
	import { Div, Text } from 'svelte-emails'
	import { colors } from '../theme'

	export { footer }
	
</script>

{#snippet footer()}
	<Div mt-12 p-6 bg={colors.codeBg} align-center border-t={colors.border}>
		<Text.Small content="Issues or questions? Visit the repository on Github at [refzlund/svelte-emails](https://github.com/refzlund/svelte-emails)" text={colors.textMuted} />
	</Div>
{/snippet}