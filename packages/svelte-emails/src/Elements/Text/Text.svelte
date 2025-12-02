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
	import { getEmailParent, addChild, type Mail } from '../../context'

	interface Props extends TextAttributes {
		/** Text content with markdown-like syntax support */
		content: string
	}

	const { content, ...attrs }: Props = $props()

	// Get parent and register this node
	const parent = getEmailParent()

	const node: Mail.TextNode = $state({
		type: 'text',
		content,
		variant: 'default',
		attrs: Object.keys(attrs)
	})

	// Add to parent's children and setup cleanup
	onDestroy(addChild(parent, node))
</script>