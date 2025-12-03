<!-- @component
Table row component for use inside `Table`.

**Header Rows:** Use `header` attribute to mark header rows (renders as `<th>` cells).

**Style Inheritance:** Styles on Table.Row are inherited by child elements.
This includes typography (`font-bold`, `text-*`), colors (`text-[#...]`, `bg-[#...]`),
and alignment (`align-*`, `justify-*`). Children can override with their own attributes.

@see Table.svelte for full table usage
@see ARCHITECTURE.md for style inheritance details
-->
<script lang='ts'>
	import { onDestroy } from 'svelte'
	import type { Snippet } from 'svelte'
	import type { TableRowAttributes } from '../../style-attributes'
	import { getEmailParent, setEmailParent, addChild, normalizeAttrs, type Mail } from '../../context'

	export interface Props extends TableRowAttributes {
		/** Row cells (Text or other components) */
		children?: Snippet
	}

	const { children, ...attrs }: Props = $props()

	const parent = getEmailParent()

	// Extract header flag
	const header = $derived(attrs.header === true)

	const node: Mail.TableRowNode = $state({
		type: 'table-row',
		attrs: normalizeAttrs(attrs),
		children: [],
		get header() { return header }
	})

	onDestroy(addChild(parent, node))
	setEmailParent(node)
</script>

{@render children?.()}
