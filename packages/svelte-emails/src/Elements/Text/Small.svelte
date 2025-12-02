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
	import { getEmailParent, addChild, type Mail } from '../../context'

	interface Props extends TextAttributes {
		/** Text content with markdown-like syntax support */
		content: string
	}

	const { content, ...attrs }: Props = $props()

	const parent = getEmailParent()

	const node: Mail.TextNode = $state({
		type: 'text',
		content,
		variant: 'small',
		attrs: Object.keys(attrs)
	})

	onDestroy(addChild(parent, node))
</script>