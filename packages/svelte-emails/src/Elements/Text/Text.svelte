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
	import { untrack } from 'svelte'
	import type { TextAttributes } from '../../style-attributes'
	import { getEmailParent, getEmailRoot, addChild, removeChild, normalizeAttrs, normalizeContent, generateMarkerId, type Mail, type ContentValue } from '../../context'

	export interface Props extends TextAttributes {
		/** Text content with markdown-like syntax support */
		content: ContentValue
	}

	const { content, ...attrs }: Props = $props()

	const normalizedContent = $derived(normalizeContent(content, 'Text'))

	// Get parent and collector for tree registration
	const parent = getEmailParent()
	const collector = getEmailRoot()

	// Generate unique marker ID for DOM-based ordering
	const markerId = generateMarkerId()

	const node: Mail.TextNode = $state({
		type: 'text',
		variant: 'default',
		attrs: normalizeAttrs(attrs),
		get content() { return normalizedContent ?? '' }
	})

	// Synchronous registration for SSR (effects don't run during SSR)
	addChild(parent, node, markerId, collector)

	// Effect handles client-side lifecycle:
	// - Re-adds on mount (idempotent, skipped if already present)
	// - Cleanup removes on unmount (e.g., {#if} toggling)
	// The effect body MUST run addChild to ensure correct ordering relative to cleanup
	$effect(() => {
		untrack(() => addChild(parent, node, markerId, collector))
		return () => untrack(() => removeChild(parent, markerId, collector))
	})
</script>

<svelte-email-marker id={markerId}></svelte-email-marker>