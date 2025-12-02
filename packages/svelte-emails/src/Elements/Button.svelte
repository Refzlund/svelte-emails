<!-- @component
Button component for call-to-action links.

Renders as a styled `<a>` element with button-like appearance.
For rounded buttons in Outlook Windows, VML fallbacks may be used.

@example
```svelte
	<Button href='https://example.com'>Click Me</Button>
	<Button href='https://example.com' content='Get Started' bg-[#2563eb] text-[#ffffff] />
	<Button href='https://example.com' bg-[#2563eb] text-[#ffffff] rounded-lg>
		Get Started
	</Button>
```

@see EMAIL_CLIENT_SUPPORT.md for border-radius limitations in Outlook
-->
<script lang='ts'>
	import { onDestroy } from 'svelte'
	import type { Snippet } from 'svelte'
	import type { ButtonAttributes } from '../style-attributes'
	import { getEmailParent, setEmailParent, addChild, type Mail } from '../context'

	interface Props extends ButtonAttributes {
		/** URL the button links to */
		href: string
		/** Button label text (alternative to children) */
		content?: string
		/** Button label content */
		children?: Snippet
	}

	const { href, content, children, ...attrs }: Props = $props()

	const parent = getEmailParent()

	const node: Mail.ButtonNode = $state({
		type: 'button',
		href,
		content,
		attrs: Object.keys(attrs),
		children: []
	})

	onDestroy(addChild(parent, node))
	setEmailParent(node)
</script>

{@render children?.()}