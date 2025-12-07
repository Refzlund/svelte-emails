<!-- @component
Link component for inline text links.

Unlike `<Button>` (styled CTA block element), `<Link>` is for 
inline anchor links within text content.

@example
```svelte
	// Prefer inline markdown links within Text
	<Text content='Visit [our website](https://example.com) for more info.' />

	// Or use Link component with content prop
	<Link href='https://example.com' content='Click here' text-[#2563eb] />
```

@see Button.svelte for styled call-to-action buttons
-->
<script lang='ts'>
	import { onDestroy } from 'svelte'
	import type { Snippet } from 'svelte'
	import type { LinkAttributes } from '../style-attributes'
	import { getEmailParent, setEmailParent, addChild, normalizeAttrs, generateMarkerId, normalizeOptionalContent, type Mail, type ContentValue } from '../context'

	interface Props extends LinkAttributes {
		/** Link destination URL */
		href: string
		/** Link text (alternative to children) */
		content?: ContentValue
		/** Link text content */
		children?: Snippet
	}

	const { href, content, children, ...attrs }: Props = $props()

	const normalizedContent = $derived(normalizeOptionalContent(content))

	const parent = getEmailParent()
	const markerId = generateMarkerId()

	const node: Mail.LinkNode = $state({
		type: 'link',
		attrs: normalizeAttrs(attrs),
		children: [],
		get href() { return href },
		get content() { return normalizedContent }
	})

	onDestroy(addChild(parent, node, markerId))
	setEmailParent(node)
</script>

<svelte-email-marker id={markerId}></svelte-email-marker>
{@render children?.()}
