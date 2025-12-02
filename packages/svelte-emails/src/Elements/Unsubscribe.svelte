<!-- @component
Unsubscribe link component for email footers.

Renders as a specially styled anchor link, typically used for 
CAN-SPAM compliance unsubscribe functionality.

@example
```svelte
	<Unsubscribe href='https://example.com/unsubscribe?token=abc123'>
		Press here to unsubscribe
	</Unsubscribe>

	<Unsubscribe href='...' text-[#6b7280] text-xs>
		Click to unsubscribe from these emails
	</Unsubscribe>
```
-->
<script lang='ts'>
	import { onDestroy } from 'svelte'
	import type { Snippet } from 'svelte'
	import type { TextAttributes } from '../style-attributes'
	import { getEmailParent, setEmailParent, addChild, type Mail } from '../context'

	interface Props extends TextAttributes {
		/** Unsubscribe URL */
		href: string
		/** Link text content */
		children?: Snippet
	}

	const { href, children, ...attrs }: Props = $props()

	const parent = getEmailParent()

	const node: Mail.UnsubscribeNode = $state({
		type: 'unsubscribe',
		href,
		attrs: Object.keys(attrs),
		children: []
	})

	onDestroy(addChild(parent, node))
	setEmailParent(node)
</script>

{@render children?.()}
