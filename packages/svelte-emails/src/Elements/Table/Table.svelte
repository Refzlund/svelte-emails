<!-- @component
Table component for displaying tabular data with proper table semantics.

Unlike Div with `cols`/`rows` (which is for layout), Table is for data display.
Use `Table.Row` for each row. Row styles are inherited by child elements.

**Column Widths:** Use `cols-[...]` to define column widths (e.g., `cols-[40%_30%_30%]`).

**Border Options:**
- `border` — Full borders (outer + cells)
- `border-outer` — Outer border only
- `cell-border` — Cell borders only (between rows/columns)
- `border-0` — No borders

**Other Attributes:**
- `striped` — Alternating row backgrounds
- `cell-padding-*` — Cell padding (e.g., `cell-padding-4`, `cell-padding-[12px]`)
- `compact` — Reduced cell padding

**Cell Spanning:** Children can span multiple columns with `span-*` (e.g., `span-2`).

**Markdown Tables:** Also supported in Text `content` props using pipe syntax.

@see ARCHITECTURE.md for style inheritance details
-->
<script lang='ts'>
	import { onDestroy } from 'svelte'
	import type { Snippet } from 'svelte'
	import type { TableAttributes } from '../../style-attributes'
	import { getEmailParent, setEmailParent, addChild, type Mail } from '../../context'
	import { parseColumnTemplate, parseCellPadding } from '../../rendering/parse-attrs'

	interface Props extends TableAttributes {
		/** Table rows (Table.Row components) */
		children?: Snippet
	}

	const { children, ...attrs }: Props = $props()

	const parent = getEmailParent()
	const attrKeys = Object.keys(attrs)

	// Parse column template from attrs
	const colWidths = parseColumnTemplate(attrKeys)

	// Extract table flags from attrs
	const border = 'border' in attrs
	const borderOuter = 'border-outer' in attrs
	const cellBorder = 'cell-border' in attrs
	const striped = 'striped' in attrs
	const compact = 'compact' in attrs

	// Parse cell padding from attrs
	const cellPadding = parseCellPadding(attrKeys)

	const node: Mail.TableNode = {
		type: 'table',
		attrs: attrKeys,
		children: [],
		...(colWidths && { colWidths }),
		...(border && { border }),
		...(borderOuter && { borderOuter }),
		...(cellBorder && { cellBorder }),
		...(striped && { striped }),
		...(compact && { compact }),
		...(cellPadding !== undefined && { cellPadding })
	}

	onDestroy(addChild(parent, node))
	setEmailParent(node)
</script>

{@render children?.()}
