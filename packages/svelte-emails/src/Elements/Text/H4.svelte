<!-- @component
Heading 4 text component.

@example
```svelte
<Text.H4 content='Minor Heading' />
<Text.H4 content='Centered Heading' justify-center />
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
		variant: 'h4',
		attrs: Object.keys(attrs)
	})

	onDestroy(addChild(parent, node))
</script>