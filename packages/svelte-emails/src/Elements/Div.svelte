<!-- @component
Generic container component with optional grid layout.

Div is a versatile container that accepts all styling attributes.
Renders as a table cell in the final HTML for email compatibility.

**Grid Layout:** Use `cols` or `rows` to arrange children in a grid.
- `cols` — Horizontal layout (children side by side)
- `rows` — Vertical layout (children stacked)
- `responsive` — Collapse columns to single-column on mobile (only with `cols`)

**Column/Row Templates:** Define sizes using `cols-[...]` or `rows-[...]`.
Widths are underscore-separated (e.g., `cols-[40%_30%_30%]`).

**Gap Spacing:** Use `gap-*` (gap-1 through gap-12) or `gap-[20px]` for custom values.

**Spanning:** Children can span multiple columns with `span-*` (e.g., `span-2`).

**Style Inheritance:** Typography and color styles on Div are inherited by children.

@see ARCHITECTURE.md for style inheritance details
-->
<script lang='ts'>
	import { onDestroy } from 'svelte'
	import type { Snippet } from 'svelte'
	import type { DivAttributes } from '../style-attributes'
	import { getEmailParent, setEmailParent, addChild, type Mail } from '../context'
	import { parseColumnTemplate, parseRowTemplate, parseGap } from '../rendering/parse-attrs'

	interface Props extends DivAttributes {
		/** Content to render inside the container */
		children?: Snippet
	}

	const { children, cols, rows, responsive, ...attrs }: Props = $props()

	// Get parent and register this node
	const parent = getEmailParent()

	// Determine direction from boolean attrs
	const direction: 'cols' | 'rows' | undefined = cols ? 'cols' : rows ? 'rows' : undefined

	// Don't auto-add w-full - let the renderer handle default widths
	// This allows parent grids to control child widths via auto-calculation
	const attrKeys = Object.keys(attrs)

	// Parse column/row templates from attrs
	const colWidths = parseColumnTemplate(attrKeys)
	const rowHeights = parseRowTemplate(attrKeys)
	const gap = parseGap(attrKeys)

	const node: Mail.DivNode = $state({
		type: 'div',
		direction,
		responsiveGrid: responsive,
		attrs: attrKeys,
		children: [],
		...(colWidths && { colWidths }),
		...(rowHeights && { rowHeights }),
		...(gap && { gap })
	})

	// Add to parent's children and setup cleanup
	onDestroy(addChild(parent, node))

	// Set this node as parent for nested children
	setEmailParent(node)
</script>

{@render children?.()}