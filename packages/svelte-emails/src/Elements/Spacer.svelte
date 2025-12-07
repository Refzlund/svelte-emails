<!-- @component
Context-aware Spacer component for spacing between elements.

Automatically adapts its behavior based on parent layout:
- **Vertical (default/rows):** Height-based spacing, full width. Default: 2rem
- **Horizontal (cols):** Width-based spacing, 1px height. Default: 2rem
- **Table cell (Table.Row):** Empty cell placeholder, no default size

Use `h-*` or `w-*` attributes to override the default size based on context.

@example Vertical spacing (default)
```svelte
<Text content='Above' />
<Spacer />
<Text content='Below (default 2rem gap)' />

<Text content='Above' />
<Spacer h-8 />
<Text content='Below (custom height)' />
```

@example Horizontal spacing in cols
```svelte
<Div cols>
  <Div><Text content='Left' /></Div>
  <Spacer />
  <Div><Text content='Right (default 2rem gap)' /></Div>
</Div>

<Div cols>
  <Div><Text content='Left' /></Div>
  <Spacer w-12 />
  <Div><Text content='Right (custom width)' /></Div>
</Div>
```

@example Empty cell placeholder in Table.Row
```svelte
<Table cols-[40%_20%_20%_20%]>
  <Table.Row>
    <Spacer span-2 />
    <Div span-2><Text content='Content in right columns' /></Div>
  </Table.Row>
</Table>
```

@see ARCHITECTURE.md for detailed context-aware behavior documentation
-->
<script lang='ts'>
	import { onDestroy } from 'svelte'
	import type { Attributes, SpanAttributes, SafeWidthAttributes, ResponsiveAttributes } from '../style-attributes'
	import { getEmailParent, addChild, normalizeAttrs, type Mail } from '../context'

	type SpacerScales = 
		| 'h-0' | 'h-0.25' | 'h-0.5' | 'h-0.75' | 'h-1' | 'h-1.5' 
		| 'h-2' | 'h-2.5' | 'h-3' | 'h-3.5'
		| 'h-4' | 'h-5' | 'h-6' | 'h-7' | 'h-8' | 'h-9' 
		| 'h-10' | 'h-11' | 'h-12' | 'h-14' | 'h-16' 
		| 'h-20' | 'h-24' | 'h-28' 
		| 'h-32' | 'h-36' | 'h-40' | 'h-44' | 'h-48' | 'h-52' | 'h-56' | 'h-60' 
		| 'h-64' | 'h-72' | 'h-80' | 'h-96'

	type WidthScales = 
		| 'w-0' | 'w-0.25' | 'w-0.5' | 'w-0.75' | 'w-1' | 'w-1.5' 
		| 'w-2' | 'w-2.5' | 'w-3' | 'w-3.5'
		| 'w-4' | 'w-5' | 'w-6' | 'w-7' | 'w-8' | 'w-9' 
		| 'w-10' | 'w-11' | 'w-12' | 'w-14' | 'w-16' 
		| 'w-20' | 'w-24' | 'w-28' 
		| 'w-32' | 'w-36' | 'w-40' | 'w-44' | 'w-48' | 'w-52' | 'w-56' | 'w-60' 
		| 'w-64' | 'w-72' | 'w-80' | 'w-96'

	interface Props extends 
		Attributes<SpacerScales | `h-[${string}]` | WidthScales | `w-[${string}]`>,
		SpanAttributes,
		SafeWidthAttributes,
		ResponsiveAttributes {
		/** Spacer size (alternative to h-* or w-* attributes) */
		size?: string
	}

	const { size, ...attrs }: Props = $props()

	const parent = getEmailParent()

	/**
	 * Compute layout context from parent type:
	 * - table-row → table-cell context (empty cell placeholder)
	 * - div with direction='cols' → horizontal context
	 * - everything else → vertical context (default)
	 */
	const layoutContext = $derived.by((): 'vertical' | 'horizontal' | 'table-cell' => {
		if (parent.type === 'table-row') {
			return 'table-cell'
		}
		if (parent.type === 'div' && parent.direction === 'cols') {
			return 'horizontal'
		}
		return 'vertical'
	})

	const node: Mail.SpacerNode = $state({
		type: 'spacer',
		attrs: normalizeAttrs(attrs),
		get layoutContext() { return layoutContext },
		get size() { return size }
	})

	onDestroy(addChild(parent, node))
</script>