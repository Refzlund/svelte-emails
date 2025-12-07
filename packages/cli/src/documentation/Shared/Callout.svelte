<script lang='ts' module>
	import { Div, Text } from 'svelte-emails'
	import { colors } from '../theme'

	export type CalloutType = 'note' | 'tip' | 'important' | 'warning' | 'caution'

	const calloutConfig: Record<CalloutType, { icon: string; label: string; bg: string; border: string; text: string }> = {
		note: {
			icon: '📝',
			label: 'Note',
			bg: colors.codeBg,
			border: colors.border,
			text: colors.textMuted
		},
		tip: {
			icon: '💡',
			label: 'Tip',
			bg: colors.infoBg,
			border: colors.info,
			text: colors.text
		},
		important: {
			icon: '❗',
			label: 'Important',
			bg: '#fef2f2',
			border: colors.danger,
			text: colors.text
		},
		warning: {
			icon: '⚠️',
			label: 'Warning',
			bg: '#fffbeb',
			border: colors.warning,
			text: colors.text
		},
		caution: {
			icon: '🚧',
			label: 'Caution',
			bg: '#fff7ed',
			border: '#f97316',
			text: colors.text
		}
	}

	export { callout }
</script>

{#snippet callout(type: CalloutType, content: string)}
	{@const config = calloutConfig[type]}
	<Div bg={config.bg} p-4 rounded border={config.border}>
		<Text.Small content={`**${config.icon} ${config.label}:** ${content}`} text={config.text} />
	</Div>
{/snippet}
