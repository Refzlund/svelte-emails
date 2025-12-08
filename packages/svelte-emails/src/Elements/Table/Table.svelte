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
	import { getEmailParent, setEmailParent, addChild, normalizeAttrs, generateMarkerId, type Mail } from '../../context'
	import { parseColumnTemplate, parseCellPadding } from '../../rendering/parse-attrs'

	export interface Props extends TableAttributes {
		/** Table rows (Table.Row components) */
		children?: Snippet
	}

	const { children, ...attrs }: Props = $props()

	const parent = getEmailParent()
	const markerId = generateMarkerId()
	// normalizeAttrs converts value-attributes (bg="#fff") to bracket syntax (bg-[#fff])
	const attrKeys = normalizeAttrs(attrs)

	// Parse column template from attrs
	const colWidths = $derived(parseColumnTemplate(attrKeys))

	// Extract table flags from attrs
	const border = $derived(attrs.border === true)
	const borderOuter = $derived(attrs['border-outer'] === true)
	const cellBorder = $derived(attrs['cell-border'] === true)
	const striped = $derived(attrs.striped === true)
	const compact = $derived(attrs.compact === true)

	// Parse cell padding from attrs
	const cellPadding = $derived(parseCellPadding(attrKeys))

	const node: Mail.TableNode = $state({
		type: 'table',
		attrs: attrKeys,
		children: [],
		get colWidths() { return colWidths },
		get border() { return border },
		get borderOuter() { return borderOuter },
		get cellBorder() { return cellBorder },
		get striped() { return striped },
		get compact() { return compact },
		get cellPadding() { return cellPadding }
	})

	onDestroy(addChild(parent, node, markerId))
	setEmailParent(node)
</script>

<svelte-email-marker id={markerId}></svelte-email-marker>
{@render children?.()}
