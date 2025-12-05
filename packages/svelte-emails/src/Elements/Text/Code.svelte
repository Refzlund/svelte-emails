<!-- @component
Inline code component for displaying code within text.

Renders as <code> with proper styling from StyleConfig.Code.
Content is HTML-escaped automatically - do NOT pass pre-escaped content.

For inline code within markdown content, use backticks in the content prop.
This component is for standalone inline code elements.

@see styles.ts for Code styling configuration
-->
<script lang='ts'>
	import { onDestroy } from 'svelte'
	import type { TextAttributes } from '../../style-attributes'
	import { getEmailParent, addChild, normalizeAttrs, type Mail } from '../../context'

	export interface Props extends TextAttributes {
		/** Code content (will be HTML-escaped) */
		content: string
	}

	const { content, ...attrs }: Props = $props()

	const parent = getEmailParent()

	const node: Mail.TextNode = $state({
		type: 'text',
		variant: 'code',
		attrs: normalizeAttrs(attrs),
		get content() { return content }
	})

	onDestroy(addChild(parent, node))
</script>
