<!-- @component
Button component for call-to-action links.

Renders as a styled `<a>` element with button-like appearance.
For rounded buttons in Outlook Windows, VML fallbacks may be used.

TODO(QUESTION): Button and Link have nearly identical implementations.
The only differences are:
1. The node `type` ('button' vs 'link')
2. Component documentation/semantic meaning

Consider:
- Is this intentional duplication for semantic clarity?
- Could a shared internal component reduce duplication?
- The actual visual difference is handled in renderer.ts based on type

The semantic distinction matters for email styling (Button = CTA block,
Link = inline), but the component code is 95% identical.

@example
```svelte
	<Button href='https://example.com' content='Click Me' />
	<Button href='https://example.com' content='Get Started' bg-[#2563eb] text-[#ffffff] />
	<Button href='https://example.com' content='Sign Up' bg-[#2563eb] text-[#ffffff] rounded-lg />
```

@see EMAIL_CLIENT_SUPPORT.md for border-radius limitations in Outlook
-->
<script lang='ts'>
	import { untrack } from 'svelte'
	import type { Snippet } from 'svelte'
	import type { ButtonAttributes } from '../style-attributes'
	import { getEmailParent, getEmailRoot, setEmailParent, addChild, removeChild, normalizeAttrs, generateMarkerId, normalizeOptionalContent, type Mail, type ContentValue } from '../context'

	interface Props extends ButtonAttributes {
		/** URL the button links to */
		href: string
		/** Button label text (alternative to children) */
		content?: ContentValue
		/** Button label content */
		children?: Snippet
	}

	const { href, content, children, ...attrs }: Props = $props()

	const normalizedContent = $derived(normalizeOptionalContent(content))

	const parent = getEmailParent()
	const collector = getEmailRoot()
	const markerId = generateMarkerId()

	const node: Mail.ButtonNode = $state({
		type: 'button',
		attrs: normalizeAttrs(attrs),
		children: [],
		get href() { return href },
		get content() { return normalizedContent }
	})

	// Synchronous registration for SSR (effects don't run during SSR)
	addChild(parent, node, markerId, collector)

	// Effect handles client-side lifecycle (see Text.svelte for explanation)
	$effect(() => {
		untrack(() => addChild(parent, node, markerId, collector))
		return () => untrack(() => removeChild(parent, markerId, collector))
	})

	setEmailParent(node)
</script>

<svelte-email-marker id={markerId}></svelte-email-marker>
{@render children?.()}