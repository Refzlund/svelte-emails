<!-- @component
Heading 1 text component.

Uses preset styling for H1 headings with optional horizontal rule.

@example
```svelte
<Text.H1 content='Main Heading' />
<Text.H1 content='Centered Heading' justify-center />
```

@see Text.svelte for content formatting syntax
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

	const normalizedContent = $derived(normalizeContent(content, 'Text.H1'))

	const parent = getEmailParent()
	const collector = getEmailRoot()
	const markerId = generateMarkerId()

	const node: Mail.TextNode = $state({
		type: 'text',
		variant: 'h1',
		attrs: normalizeAttrs(attrs),
		get content() { return normalizedContent ?? '' }
	})

	// Synchronous registration for SSR (effects don't run during SSR)
	addChild(parent, node, markerId, collector)

	// Effect handles client-side lifecycle (see Text.svelte for explanation)
	$effect(() => {
		untrack(() => addChild(parent, node, markerId, collector))
		return () => untrack(() => removeChild(parent, markerId, collector))
	})
</script>

<svelte-email-marker id={markerId}></svelte-email-marker>