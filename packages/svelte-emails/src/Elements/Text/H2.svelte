<!-- @component
Heading 2 text component.

@example
```svelte
<Text.H2 content='Section Heading' />
```

@see Text.svelte for content formatting syntax
-->
<script lang='ts'>
	import { onDestroy } from 'svelte'
	import type { TextAttributes } from '../../style-attributes'
	import { getEmailParent, addChild, normalizeAttrs, type Mail } from '../../context'

	interface Props extends TextAttributes {
		/** Text content with markdown-like syntax support */
		content: string
	}

	const { content, ...attrs }: Props = $props()

	const parent = getEmailParent()

	const node: Mail.TextNode = {
		type: 'text',
		content,
		variant: 'h2',
		attrs: normalizeAttrs(attrs)
	}

	onDestroy(addChild(parent, node))
</script>