<!-- @component
Divider component for horizontal rules/separators.

Renders as an `<hr>` or bordered table cell depending on styling needs.

@example
```svelte
	<Text content='Section 1' />
	<Divider />
	<Text content='Section 2' />

	<Divider border-[#e5e7eb] border-2 />
```

@see style presets for divider customization options
-->
<script lang='ts'>
	import { onDestroy } from 'svelte'
	import type { Attributes } from '../style-attributes'
	import { getEmailParent, addChild, type Mail } from '../context'

	type DividerBorderWidth = 'border-0' | 'border-1' | 'border-2' | 'border-4' | 'border-8'

	interface Props extends Attributes<
		| DividerBorderWidth
		| `border-[${string}]`
		| 'border-solid' | 'border-dashed' | 'border-dotted' | 'border-double'
	> {
		/** Divider color (alternative to border-[#...] attribute) */
		color?: string
		/** Divider thickness (alternative to border-* attribute) */
		thickness?: string
		/** Divider style */
		style?: 'solid' | 'dashed' | 'dotted' | 'double'
	}

	const { color, thickness, style, ...attrs }: Props = $props()

	const parent = getEmailParent()

	const node: Mail.DividerNode = $state({
		type: 'divider',
		attrs: Object.keys(attrs)
	})

	onDestroy(addChild(parent, node))
</script>