<!-- @component
Heading 6 text component.

@example
```svelte
<Text.H6 content='Small Label' />
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

	const normalizedContent = $derived(normalizeContent(content, 'Text.H6'))

	const parent = getEmailParent()
	const markerId = generateMarkerId()

	const node: Mail.TextNode = $state({
		type: 'text',
		variant: 'h6',
		attrs: normalizeAttrs(attrs),
		get content() { return normalizedContent ?? '' }
	})

	onDestroy(addChild(parent, node, markerId))
</script>

<svelte-email-marker id={markerId}></svelte-email-marker>