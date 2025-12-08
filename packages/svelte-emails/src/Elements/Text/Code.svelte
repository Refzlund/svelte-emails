<!-- @component
Inline code component for displaying code within text.

Renders as <code> with proper styling from StyleConfig.Code.
Content is HTML-escaped automatically - do NOT pass pre-escaped content.

For inline code within markdown content, use backticks in the content prop.
This component is for standalone inline code elements.

Supports optional syntax highlighting via Shiki (requires `shiki` to be installed):
- `highlight`: Programming language for syntax highlighting (e.g., 'typescript', 'html')
- `theme`: Shiki theme name (defaults to 'github-light')

@example
```svelte
// Basic usage (no highlighting)
<Text.Code content="npm install svelte-emails" />

// With syntax highlighting
<Text.Code highlight="typescript" content="const x: number = 42" />

// With custom theme
<Text.Code highlight="bash" theme="nord" content="npm install shiki" />
```

@see styles.ts for Code styling configuration
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
		 * @example 'typescript', 'javascript', 'html', 'css', 'bash'
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

	const normalizedContent = $derived(normalizeContent(content, 'Text.Code'))

	const parent = getEmailParent()
	const markerId = generateMarkerId()

	const node: Mail.TextNode = $state({
		type: 'text',
		variant: 'code',
		attrs: normalizeAttrs(attrs),
		get content() { return normalizedContent ?? '' },
		get highlight() { return highlight },
		get highlightTheme() { return theme }
	})

	onDestroy(addChild(parent, node, markerId))
</script>

<svelte-email-marker id={markerId}></svelte-email-marker>
