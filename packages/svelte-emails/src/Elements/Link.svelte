<!-- @component
Link component for inline text links.

Unlike `<Button>` (styled CTA block element), `<Link>` is for 
inline anchor links within text content.

@example
```svelte
	<Text>
		Visit <Link href='https://example.com'>our website</Link> for more info.
	</Text>

	<Link href='https://example.com' content='Click here' text-[#2563eb] />
```

@see Button.svelte for styled call-to-action buttons
-->
<script lang='ts'>
	import { onDestroy } from 'svelte'
	import type { Snippet } from 'svelte'
	import type { LinkAttributes } from '../style-attributes'
	import { getEmailParent, setEmailParent, addChild, type Mail } from '../context'

	interface Props extends LinkAttributes {
		/** Link destination URL */
		href: string
		/** Link text (alternative to children) */
		content?: string
		/** Link text content */
		children?: Snippet
	}

	const { href, content, children, ...attrs }: Props = $props()

	const parent = getEmailParent()

	const node: Mail.LinkNode = {
		type: 'link',
		href,
		attrs: Object.keys(attrs),
		children: [],
		...(content && { content })
	}

	onDestroy(addChild(parent, node))
	setEmailParent(node)
</script>

{@render children?.()}
