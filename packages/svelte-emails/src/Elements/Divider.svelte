<!-- @component
Divider component for horizontal rules/separators.

Renders as a bordered table cell for email compatibility.

**Styling via attributes:**
- Color: `border={color}` or `border-[#hex]` (e.g., `border-[#e5e7eb]`)
- Thickness: `border-{0|1|2|4|8}` or `border-[2px]`
- Style: `border-solid`, `border-dashed`, `border-dotted`, `border-double`

Falls back to `StyleConfig.Divider` defaults if not specified.

@example
```svelte
<Text content='Section 1' />
<Divider />
<Text content='Section 2' />

<Divider border={colors.border} />
<Divider border-[#e5e7eb] border-2 />
<Divider border-dashed border-[#ccc] />
```

@see style presets for divider customization options
-->
<script lang='ts'>
	import { untrack } from 'svelte'
	import type { Attributes } from '../style-attributes'
	import { getEmailParent, getEmailRoot, addChild, removeChild, normalizeAttrs, generateMarkerId, type Mail } from '../context'

	type DividerBorderWidth = 'border-0' | 'border-1' | 'border-2' | 'border-4' | 'border-8'

	/**
	 * Divider styling via attributes:
	 * - Color: `border={color}` or `border-[#hex]` (e.g., `border-[#e5e7eb]`)
	 * - Thickness: `border-{0|1|2|4|8}` or `border-[2px]`
	 * - Style: `border-solid`, `border-dashed`, `border-dotted`, `border-double`
	 */
	export interface Props extends Attributes<
		| DividerBorderWidth
		| `border-[${string}]`
		| 'border-solid' | 'border-dashed' | 'border-dotted' | 'border-double'
	> {
		/** Border color as a hex string (e.g., '#e5e7eb') */
		border?: string
	}

	const { border, ...attrs }: Props = $props()

	const parent = getEmailParent()
	const collector = getEmailRoot()
	const markerId = generateMarkerId()

	// Convert border prop to attribute syntax if provided
	const attrs_ = $derived.by(() => {
		const normalizedAttrs = normalizeAttrs(attrs)
		if (border) {
			normalizedAttrs.push(`border-[${border}]`)
		}
		return normalizedAttrs
	})

	const node: Mail.DividerNode = $state({
		type: 'divider',
		get attrs() { return attrs_ }
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