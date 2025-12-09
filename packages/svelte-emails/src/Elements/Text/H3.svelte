<!-- @component
Heading 3 text component.

@example
```svelte
<Text.H3 content='Subsection Heading' />
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

	const normalizedContent = $derived(normalizeContent(content, 'Text.H3'))

	const parent = getEmailParent()
	const collector = getEmailRoot()
	const markerId = generateMarkerId()

	const node: Mail.TextNode = $state({
		type: 'text',
		variant: 'h3',
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