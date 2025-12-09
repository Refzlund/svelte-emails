<!-- @component
Generic container component with optional grid layout.

Div is a versatile container that accepts all styling attributes.
Renders as a table cell in the final HTML for email compatibility.

**Grid Layout:** Use `cols` or `rows` to arrange children in a grid.
- `cols` — Horizontal layout (children side by side)
- `rows` — Vertical layout (children stacked)
- `responsive` — Collapse columns to single-column on mobile (only with `cols`)

**Column/Row Templates:** Define sizes in two ways:
- Value syntax: `cols="35% 65%"` or `rows="100px auto"`
- Bracket syntax: `cols-[35%_65%]` or `rows-[100px_auto]`

**Gap Spacing:** Use `gap-*` (gap-1 through gap-12) or `gap-[20px]` for custom values.

**Spanning:** Children can span multiple columns with `span-*` (e.g., `span-2`).

**Style Inheritance:** Typography and color styles on Div are inherited by children.

@see ARCHITECTURE.md for style inheritance details
-->
<script lang='ts'>
	import { untrack } from 'svelte'
	import type { Snippet } from 'svelte'
	import type { DivAttributes } from '../style-attributes'
	import { getEmailParent, getEmailRoot, setEmailParent, addChild, removeChild, normalizeAttrs, generateMarkerId, type Mail } from '../context'
	import { parseColumnTemplate, parseRowTemplate, parseGap } from '../rendering/parse-attrs'

	interface Props extends DivAttributes {
		/** Content to render inside the container */
		children?: Snippet
	}

	const { children, cols, rows, responsive, ...attrs }: Props = $props()

	// Get parent and collector for tree registration
	const parent = getEmailParent()
	const collector = getEmailRoot()

	// Generate unique marker ID for DOM-based ordering
	const markerId = generateMarkerId()

	// Determine direction from boolean attrs
	const direction: 'cols' | 'rows' | undefined = $derived(cols ? 'cols' : rows ? 'rows' : undefined)

	// Don't auto-add w-full - let the renderer handle default widths
	// This allows parent grids to control child widths via auto-calculation
	// normalizeAttrs converts value-attributes (bg="#fff") to bracket syntax (bg-[#fff])
	// Include cols/rows if they are strings (e.g., cols="35% 65%") so they get normalized
	const attrsWithColsRows = $derived({
		...attrs,
		...(typeof cols === 'string' ? { cols } : {}),
		...(typeof rows === 'string' ? { rows } : {})
	})
	const attrKeys = $derived(normalizeAttrs(attrsWithColsRows))

	// Parse column/row templates from attrs
	const colWidths = $derived(parseColumnTemplate(attrKeys))
	const rowHeights = $derived(parseRowTemplate(attrKeys))
	const gap = $derived(parseGap(attrKeys))

	const node: Mail.DivNode = $state({
		type: 'div',
		get attrs() { return attrKeys },
		children: [],
		get direction() { return direction },
		get responsiveGrid() { return responsive },
		get colWidths() { return colWidths },
		get rowHeights() { return rowHeights },
		get gap() { return gap }
	})

	// Synchronous registration for SSR (effects don't run during SSR)
	addChild(parent, node, markerId, collector)

	// Effect handles client-side lifecycle (see Text.svelte for explanation)
	$effect(() => {
		untrack(() => addChild(parent, node, markerId, collector))
		return () => untrack(() => removeChild(parent, markerId, collector))
	})

	// Set this node as parent for nested children
	setEmailParent(node)
</script>

<svelte-email-marker id={markerId}></svelte-email-marker>
{@render children?.()}