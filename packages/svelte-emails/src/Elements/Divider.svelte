<!-- @component
Divider component for horizontal rules/separators.

Renders as a bordered table cell for email compatibility.

**Styling via attributes:**
- Color: `border-[#hex]` (e.g., `border-[#e5e7eb]`)
- Thickness: `border-{0|1|2|4|8}` or `border-[2px]`
- Style: `border-solid`, `border-dashed`, `border-dotted`, `border-double`

Falls back to `StyleConfig.Divider` defaults if not specified.

@example
```svelte
<Text content='Section 1' />
<Divider />
<Text content='Section 2' />

<Divider border-[#e5e7eb] border-2 />
<Divider border-dashed border-[#ccc] />
```

@see style presets for divider customization options
-->
<script lang='ts'>
	import { onDestroy } from 'svelte'
	import type { Attributes } from '../style-attributes'
	import { getEmailParent, addChild, normalizeAttrs, type Mail } from '../context'

	type DividerBorderWidth = 'border-0' | 'border-1' | 'border-2' | 'border-4' | 'border-8'

	/**
	 * Divider styling via attributes:
	 * - Color: `border-[#hex]` (e.g., `border-[#e5e7eb]`)
	 * - Thickness: `border-{0|1|2|4|8}` or `border-[2px]`
	 * - Style: `border-solid`, `border-dashed`, `border-dotted`, `border-double`
	 */
	interface Props extends Attributes<
		| DividerBorderWidth
		| `border-[${string}]`
		| 'border-solid' | 'border-dashed' | 'border-dotted' | 'border-double'
	> {}

	const { ...attrs }: Props = $props()

	const parent = getEmailParent()

	const node: Mail.DividerNode = {
		type: 'divider',
		attrs: normalizeAttrs(attrs)
	}

	onDestroy(addChild(parent, node))
</script>