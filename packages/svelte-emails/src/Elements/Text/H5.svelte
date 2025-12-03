<!-- @component
Heading 5 text component.

@example
```svelte
<Text.H5 content='Label Heading' />
```

@see Text.svelte for content formatting syntax
-->
<script lang='ts'>
	import { onDestroy } from 'svelte'
	import type { TextAttributes } from '../../style-attributes'
	import { getEmailParent, addChild, normalizeAttrs, type Mail } from '../../context'

	export interface Props extends TextAttributes {
		/** Text content with markdown-like syntax support */
		content: string
	}

	const { content, ...attrs }: Props = $props()

	const parent = getEmailParent()

	const node: Mail.TextNode = $state({
		type: 'text',
		variant: 'h5',
		attrs: normalizeAttrs(attrs),
		get content() { return content }
	})

	onDestroy(addChild(parent, node))
</script>