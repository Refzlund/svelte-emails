<!-- @component
Codeblock component for displaying multi-line code.

Renders as `<pre><code>` with proper styling from StyleConfig.Codeblock.
Content is HTML-escaped automatically - do NOT pass pre-escaped content.

Supports optional syntax highlighting via Shiki (requires `shiki` to be installed):
- `highlight`: Programming language for syntax highlighting (e.g., 'typescript', 'html')
- `theme`: Shiki theme name (defaults to 'github-light')

@example
```svelte
// Basic usage (no highlighting)
<Text.Codeblock content={`
function greet(name) {
  return "Hello, " + name + "!";
}
`} />

// With syntax highlighting
<Text.Codeblock
  highlight="javascript"
  content={`
function greet(name) {
  return "Hello, " + name + "!";
}
`}
/>

// With custom theme
<Text.Codeblock
  highlight="typescript"
  theme="nord"
  content={`const message: string = "Hello!"`}
/>
```

@see styles.ts for Codeblock styling configuration
@see shiki.ts for syntax highlighting implementation
-->
<script lang='ts'>
	import { onDestroy } from 'svelte'
	import type { TextAttributes } from '../../style-attributes'
	import { getEmailParent, addChild, normalizeAttrs, normalizeContent, generateMarkerId, type Mail, type ContentValue } from '../../context'

	export interface Props extends TextAttributes {
		/** Code content (will be HTML-escaped unless highlight is used) */
		content: ContentValue
		/**
		 * Programming language for syntax highlighting.
		 * Requires `shiki` to be installed.
		 * @example 'typescript', 'javascript', 'html', 'css', 'svelte'
		 */
		highlight?: string
		/**
		 * Shiki theme for syntax highlighting.
		 * Defaults to 'github-light' for email readability.
		 * @see https://shiki.style/themes
		 */
		theme?: string
	}

	const { content, highlight, theme, ...attrs }: Props = $props()

	const normalizedContent = $derived(normalizeContent(content, 'Text.Codeblock'))

	const parent = getEmailParent()
	const markerId = generateMarkerId()

	const node: Mail.TextNode = $state({
		type: 'text',
		variant: 'codeblock',
		attrs: normalizeAttrs(attrs),
		get content() { return normalizedContent ?? '' },
		get highlight() { return highlight },
		get highlightTheme() { return theme }
	})

	onDestroy(addChild(parent, node, markerId))
</script>

<svelte-email-marker id={markerId}></svelte-email-marker>
