<!-- @component
Unsubscribe link component for email footers.

Renders as a specially styled anchor link for CAN-SPAM compliance.

**Props:**
- `href` — Unsubscribe URL (required)
- `content` — Static text content (alternative to children)
- `email` — Email address for mailto: in List-Unsubscribe header

If both `href` and `email` are provided, the List-Unsubscribe header
will include both: `<mailto:email>, <href>`

@example
```svelte
<Unsubscribe href='https://example.com/unsubscribe?token=abc123' content='Press here to unsubscribe' />

<Unsubscribe 
	href='https://example.com/unsubscribe' 
	email='unsubscribe@example.com'
	content='Unsubscribe'
	text-[#6b7280] 
	text-xs
/>
```
-->
<script lang='ts'>
	import { onDestroy } from 'svelte'
	import type { Snippet } from 'svelte'
	import type { TextAttributes } from '../style-attributes'
	import { getEmailParent, setEmailParent, addChild, normalizeAttrs, generateMarkerId, normalizeOptionalContent, type Mail, type ContentValue } from '../context'

	interface Props extends TextAttributes {
		/** Unsubscribe URL */
		href: string
		/** Static text content (alternative to children snippet) */
		content?: ContentValue
		/** Email address for mailto: in List-Unsubscribe header */
		email?: string
		/** Link text content */
		children?: Snippet
	}

	const { href, content, email, children, ...attrs }: Props = $props()

	const normalizedContent = $derived(normalizeOptionalContent(content))

	const parent = getEmailParent()
	const markerId = generateMarkerId()

	const node: Mail.UnsubscribeNode = $state({
		type: 'unsubscribe',
		attrs: normalizeAttrs(attrs),
		children: [],
		get href() { return href },
		get content() { return normalizedContent },
		get email() { return email }
	})

	onDestroy(addChild(parent, node, markerId))
	setEmailParent(node)
</script>

<svelte-email-marker id={markerId}></svelte-email-marker>
{@render children?.()}
