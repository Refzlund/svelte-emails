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
	import { getEmailParent, addChild, normalizeAttrs, normalizeContent, generateMarkerId, type Mail, type ContentValue } from '../../context'

	export interface Props extends TextAttributes {
		/** Text content with markdown-like syntax support */
		content: ContentValue
	}

	const { content, ...attrs }: Props = $props()

	const normalizedContent = $derived(normalizeContent(content, 'Text.Paragraph'))

	const parent = getEmailParent()

	// Generate unique marker ID for DOM-based ordering
	const markerId = generateMarkerId()

	const node: Mail.TextNode = $state({
		type: 'text',
		variant: 'paragraph',
		attrs: normalizeAttrs(attrs),
		get content() { return normalizedContent ?? '' }
	})

	// Always register - renderer handles null/empty content gracefully
	onDestroy(addChild(parent, node, markerId))
</script>

<svelte-email-marker id={markerId}></svelte-email-marker>