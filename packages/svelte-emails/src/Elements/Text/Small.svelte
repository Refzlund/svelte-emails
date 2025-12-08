<!-- @component
Small text component.

Renders smaller text, useful for disclaimers, fine print, or secondary information.

@example
```svelte
<Text.Small content='--Smaller [{colors.skyblue}]text[/] with [some link](https://example.org/)--' />
<Text.Small content='Terms and conditions apply.' />
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

	const normalizedContent = $derived(normalizeContent(content, 'Text.Small'))

	const parent = getEmailParent()
	const markerId = generateMarkerId()

	const node: Mail.TextNode = $state({
		type: 'text',
		variant: 'small',
		attrs: normalizeAttrs(attrs),
		get content() { return normalizedContent ?? '' }
	})

	onDestroy(addChild(parent, node, markerId))
</script>

<svelte-email-marker id={markerId}></svelte-email-marker>