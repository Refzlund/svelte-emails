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
	import { getEmailParent, setEmailParent, addChild, normalizeAttrs, type Mail } from '../context'
	import { parseColumnTemplate, parseRowTemplate, parseGap } from '../rendering/parse-attrs'

	interface Props extends DivAttributes {
		/** Content to render inside the container */
		children?: Snippet
	}

	const { children, cols, rows, responsive, ...attrs }: Props = $props()

	// Get parent and register this node
	const parent = getEmailParent()

	// Determine direction from boolean attrs
	const direction: 'cols' | 'rows' | undefined = $derived(cols ? 'cols' : rows ? 'rows' : undefined)

	// Don't auto-add w-full - let the renderer handle default widths
	// This allows parent grids to control child widths via auto-calculation
	// normalizeAttrs converts value-attributes (bg="#fff") to bracket syntax (bg-[#fff])
	const attrKeys = normalizeAttrs(attrs)

	// Parse column/row templates from attrs
	const colWidths = $derived(parseColumnTemplate(attrKeys))
	const rowHeights = $derived(parseRowTemplate(attrKeys))
	const gap = $derived(parseGap(attrKeys))

	const node: Mail.DivNode = $state({
		type: 'div',
		attrs: attrKeys,
		children: [],
		get direction() { return direction },
		get responsiveGrid() { return responsive },
		get colWidths() { return colWidths },
		get rowHeights() { return rowHeights },
		get gap() { return gap }
	})

	// Add to parent's children and setup cleanup
	onDestroy(addChild(parent, node))

	// Set this node as parent for nested children
	setEmailParent(node)
</script>

{@render children?.()}