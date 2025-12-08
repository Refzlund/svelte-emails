<!-- @component
Text component for rendering text content with extended markdown-like syntax.

Supports inline formatting:
- `**bold**` → `<strong>`
- `*italic*` → `<em>`
- `~~strikethrough~~` → `<s>`
- `__underline__` → `<u>`
- `[text](url)` → `<a>`
- `^superscript^` → `<sup>`
- `_subscript_` → `<sub>`
- `` `code` `` → `<code>`
- `(#hex)text(/)` → colored text
- `[#hex]text[/]` → highlighted text
- `--small text--` → `<small>`
- Markdown tables

Variable interpolation: `[[variable_name]]` replaced at render time.

@example
```svelte
	<Text content='Hello **world**!' />
	<Text content='Visit [our site](https://example.com)' />
	<Text content='Hello [[first_name]]!' />
	<Text content='(#ff0000)Red text(/)' />
```

@see README.md for full markdown syntax reference
@see ARCHITECTURE.md for content parsing details
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

	const normalizedContent = $derived(normalizeContent(content, 'Text'))

	// Get parent and register this node
	const parent = getEmailParent()

	// Generate unique marker ID for DOM-based ordering
	const markerId = generateMarkerId()

	const node: Mail.TextNode = $state({
		type: 'text',
		variant: 'default',
		attrs: normalizeAttrs(attrs),
		get content() { return normalizedContent ?? '' }
	})

	// Always register - renderer handles null/empty content gracefully
	onDestroy(addChild(parent, node, markerId))
</script>

<svelte-email-marker id={markerId}></svelte-email-marker>