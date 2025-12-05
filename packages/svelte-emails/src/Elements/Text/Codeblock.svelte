<!-- @component
Codeblock component for displaying multi-line code.

Renders as `<pre><code>` with proper styling from StyleConfig.Codeblock.
Content is HTML-escaped automatically - do NOT pass pre-escaped content.

@example
```svelte
<Text.Codeblock content={`
function greet(name) {
  return "Hello, " + name + "!";
}
`} />
```

@see styles.ts for Codeblock styling configuration
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
		variant: 'codeblock',
		attrs: normalizeAttrs(attrs),
		get content() { return content }
	})

	onDestroy(addChild(parent, node))
</script>
