<!-- @component
Paragraph text component.

Handles multi-line text with proper line break handling.
Ideal for body copy and longer text blocks.

@example
```svelte
	<Text.Paragraph content='
		Hi there [[first_name]],

		We are releasing 3 cool features this month!
		1. Feature one
		2. Feature two
		3. Feature three
	' />
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

	const node: Mail.TextNode = {
		type: 'text',
		content,
		variant: 'paragraph',
		attrs: normalizeAttrs(attrs)
	}

	onDestroy(addChild(parent, node))
</script>