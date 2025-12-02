<!-- @component
Spacer component for vertical/horizontal spacing between elements.

Renders as an empty table cell with a specified height.
Use this instead of margins for reliable spacing in email.

In grid contexts (inside `<Div cols>` or `<Table>`), can also be used
with `span-*` to create empty cells spanning multiple columns.

@example Basic spacing
```svelte
<Text content='Above' />
<Spacer />
<Text content='Below (default spacing)' />

<Text content='Above' />
<Spacer h-8 />
<Text content='Below (custom spacing)' />
```

@example Spanning columns in a table
```
<Table cols-[40%_20%_20%_20%]>
  <Table.Row>
    <Spacer span-2 />
    <Div span-2>Content in right columns</Div>
  </Table.Row>
</Table>
```

@see ARCHITECTURE.md for why margins are emulated
-->
<script lang='ts'>
	import { onDestroy } from 'svelte'
	import type { Attributes, SpanAttributes, SafeWidthAttributes, ResponsiveAttributes } from '../style-attributes'
	import { getEmailParent, addChild, type Mail } from '../context'

	type SpacerScales = 
		| 'h-0' | 'h-0.25' | 'h-0.5' | 'h-0.75' | 'h-1' | 'h-1.5' 
		| 'h-2' | 'h-2.5' | 'h-3' | 'h-3.5'
		| 'h-4' | 'h-5' | 'h-6' | 'h-7' | 'h-8' | 'h-9' 
		| 'h-10' | 'h-11' | 'h-12' | 'h-14' | 'h-16' 
		| 'h-20' | 'h-24' | 'h-28' 
		| 'h-32' | 'h-36' | 'h-40' | 'h-44' | 'h-48' | 'h-52' | 'h-56' | 'h-60' 
		| 'h-64' | 'h-72' | 'h-80' | 'h-96'

	interface Props extends 
		Attributes<SpacerScales | `h-[${string}]`>,
		SpanAttributes,
		SafeWidthAttributes,
		ResponsiveAttributes {
		/** Spacer size (alternative to h-* attributes) */
		size?: string
	}

	const { size, ...attrs }: Props = $props()

	const parent = getEmailParent()

	const node: Mail.SpacerNode = $state({
		type: 'spacer',
		size,
		attrs: Object.keys(attrs)
	})

	onDestroy(addChild(parent, node))
</script>