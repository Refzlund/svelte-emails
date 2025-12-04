/**
 * Context management for the svelte-emails virtual layout tree.
 * 
 * Components register themselves via Svelte's createContext, forming a tree structure
 * that gets transformed into email-safe HTML.
 * 
 * @see ARCHITECTURE.md for detailed information about the component registration flow.
 */

import { getContext, setContext } from 'svelte'

// ============================================================================
// Stable Context Keys (for SSR compatibility)
// ============================================================================

/**
 * Stable key for the email root collector context.
 * Using Symbol.for() guarantees the same symbol instance across ALL module
 * instances - even when Vite's SSR runner loads the same module multiple times.
 * This is critical for SSR because getContext() must find the same key that
 * render()'s context Map was set with.
 */
export const EMAIL_ROOT_CONTEXT_KEY = Symbol.for('svelte-emails:root-collector')
export const EMAIL_PARENT_CONTEXT_KEY = Symbol.for('svelte-emails:parent-node')

// ============================================================================
// IR (Intermediate Representation) Types
// ============================================================================

/**
 * Mail namespace containing all IR node types for the virtual layout tree.
 */
export namespace Mail {
	/**
	 * Base node type for all IR nodes
	 */
	export interface BaseNode<T extends string> {
		type: T
		/** Tailwind-like utility attributes (e.g., 'p-4', 'bg-[#fff]') */
		attrs: string[]
	}

	/**
	 * Email root node - the top-level container
	 */
	export interface EmailNode extends BaseNode<'email'> {
		subject?: string
		preview?: string
		/** Body/wrapper background color (full width, defaults to #ffffff) */
		bodyBackground?: string
		/** Content container max width in pixels (defaults to 600) */
		maxWidth?: number
		/** Mobile breakpoint in pixels for responsive styles (defaults to 480) */
		mobileBreakpoint?: number
		children: IRNode[]
	}

	/**
	 * Generic container node (Div)
	 * Can also act as a grid layout when direction is set.
	 */
	export interface DivNode extends BaseNode<'div'> {
		/** Layout direction: 'cols' for horizontal, 'rows' for vertical, undefined for normal flow */
		direction?: 'cols' | 'rows'
		/** Collapse columns to single-column on mobile (only applies when direction='cols') */
		responsiveGrid?: boolean
		/** Column widths for grid layout, parsed from `cols-[40%_20%_20%_20%]` */
		colWidths?: string[]
		/** Row heights for grid layout, parsed from `rows-[100px_auto_50px]` */
		rowHeights?: string[]
		/** Gap between children in grid layout, parsed from `gap-4` or `gap-[20px]` */
		gap?: string
		children: IRNode[]
	}

	/**
	 * Text node with variant support
	 */
	export interface TextNode extends BaseNode<'text'> {
		content: string
		variant: 'default' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'paragraph' | 'small'
	}

	/**
	 * Button node - renders as styled anchor
	 */
	export interface ButtonNode extends BaseNode<'button'> {
		href: string
		content?: string
		children: IRNode[]
	}

	/**
	 * Image node
	 */
	export interface ImgNode extends BaseNode<'img'> {
		src: string
		alt?: string
		width?: number | string
		height?: number | string
		/** Optional link URL - makes the image clickable */
		href?: string
	}

	/**
	 * Spacer node - spacing between elements
	 * Behavior adapts based on layout context:
	 * - vertical: height-based, full width (default/rows layout)
	 * - horizontal: width-based, 1px height (cols layout)
	 * - table-cell: width-based, minimal height (Table.Row)
	 */
	export interface SpacerNode extends BaseNode<'spacer'> {
		size?: string
		/** Layout context computed from parent - determines dimension behavior */
		layoutContext?: 'vertical' | 'horizontal' | 'table-cell'
	}

	/**
	 * Divider node - horizontal rule
	 */
	export interface DividerNode extends BaseNode<'divider'> {}

	/**
	 * Line break node
	 */
	export interface BrNode extends BaseNode<'br'> {}

	/**
	 * Link node - inline anchor element
	 */
	export interface LinkNode extends BaseNode<'link'> {
		href: string
		content?: string
		children: IRNode[]
	}

	/**
	 * Unsubscribe link node
	 */
	export interface UnsubscribeNode extends BaseNode<'unsubscribe'> {
		href: string
		email?: string
		content?: string
		children: IRNode[]
	}

	/**
	 * Table node - for tabular data
	 * 
	 * Optional `colWidths` defines column widths for all rows.
	 * Parsed from `cols-[40%_20%_20%_20%]` attribute.
	 */
	export interface TableNode extends BaseNode<'table'> {
		border?: boolean
		borderOuter?: boolean
		cellBorder?: boolean
		striped?: boolean
		compact?: boolean
		colWidths?: string[]
		cellPadding?: string
		children: TableRowNode[]
	}

	/**
	 * Table row node
	 */
	export interface TableRowNode extends BaseNode<'table-row'> {
		header?: boolean
		children: IRNode[]
	}

	/**
	 * Union of all IR node types
	 */
	export type IRNode =
		| EmailNode
		| DivNode
		| TextNode
		| ButtonNode
		| ImgNode
		| SpacerNode
		| DividerNode
		| BrNode
		| LinkNode
		| UnsubscribeNode
		| TableNode
		| TableRowNode

	/**
	 * Nodes that can contain children
	 */
	export type IRParentNode =
		| EmailNode
		| DivNode
		| ButtonNode
		| LinkNode
		| UnsubscribeNode
		| TableNode
		| TableRowNode
}

// ============================================================================
// Collector Types
// ============================================================================

/**
 * Collector interface for gathering the IR tree.
 * Used by Email.Preview and render() to collect the component tree.
 */
export interface Collector {
	/** Register the root Email node */
	registerRoot(node: Mail.EmailNode): void
}

// ============================================================================
// Context Functions
// ============================================================================

/**
 * Get the root collector context.
 * Works in both client (preview) and server (render) modes.
 */
export function getEmailRoot(): Collector {
	return getContext<Collector>(EMAIL_ROOT_CONTEXT_KEY)
}

/**
 * Set the root collector context.
 * Called by Email.Preview (client) or passed via render() context option (server).
 */
export function setEmailRoot(collector: Collector): Collector {
	return setContext(EMAIL_ROOT_CONTEXT_KEY, collector)
}

/**
 * Get the current parent node context.
 */
export function getEmailParent(): Mail.IRParentNode {
	return getContext<Mail.IRParentNode>(EMAIL_PARENT_CONTEXT_KEY)
}

/**
 * Set the current parent node context.
 */
export function setEmailParent(node: Mail.IRParentNode): Mail.IRParentNode {
	return setContext(EMAIL_PARENT_CONTEXT_KEY, node)
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Detect if we're running in SSR mode.
 * In SSR, we don't want cleanup functions to run because:
 * 1. SSR is a one-time render, there's no "unmounting"
 * 2. Svelte's onDestroy runs during SSR (unlike other lifecycle hooks)
 * 3. Running cleanup would remove children we just added
 */
const isSSR = typeof window === 'undefined'

// ============================================================================
// Attribute Normalization
// ============================================================================

/**
 * Attribute prefixes that support value syntax.
 * These are the prefixes that can be used with either:
 * - Bracket syntax: `bg-[#ffffff]` (works as boolean attribute)
 * - Value syntax: `bg="#ffffff"` (works with Svelte variables)
 * 
 * The value syntax is converted to bracket syntax during normalization.
 */
const VALUE_ATTR_PREFIXES = [
	// Sizing
	'w', 'h', 'min-w', 'max-w', 'min-h',
	// Spacing
	'p', 'pt', 'pr', 'pb', 'pl', 'px', 'py',
	'm', 'mt', 'mr', 'mb', 'ml', 'mx', 'my',
	// Colors
	'text', 'bg', 'text-opacity', 'bg-opacity', 'border-opacity',
	// Typography
	'leading', 'tracking',
	// Borders
	'border', 'border-t', 'border-r', 'border-b', 'border-l', 'border-x', 'border-y',
	'rounded', 'rounded-t', 'rounded-r', 'rounded-b', 'rounded-l',
	'rounded-tl', 'rounded-tr', 'rounded-br', 'rounded-bl',
	// Layout
	'span', 'row-span', 'cols', 'rows', 'gap', 'cell-padding',
	// Email
	'body-bg', 'mobile-threshold',
	// Effects
	'opacity'
] as const

/**
 * Normalize attributes from component props to consistent string format.
 * 
 * Converts value-style attributes (e.g., `bg="#ffffff"`) to bracket syntax
 * (e.g., `bg-[#ffffff]`) while preserving boolean attributes as-is.
 * 
 * This allows using Svelte variables with style attributes:
 * ```svelte
 * <script>
 *   let color = '#ff0000'
 * </script>
 * <Div bg={color}>  <!-- Works! Converted to bg-[#ff0000] -->
 * ```
 * 
 * Special handling for `cols` and `rows`: spaces are converted to underscores
 * to match the bracket syntax format (e.g., `cols="20% 50% 30%"` → `cols-[20%_50%_30%]`).
 * 
 * @param attrs - The attrs object from $props() spread
 * @returns Array of normalized attribute strings
 * 
 * @example
 * ```ts
 * // Boolean attributes (existing Tailwind-like syntax)
 * normalizeAttrs({ 'bg-[#fff]': true, 'p-4': true })
 * // → ['bg-[#fff]', 'p-4']
 * 
 * // Value attributes (new syntax for variables)
 * normalizeAttrs({ bg: '#fff', p: '1rem' })
 * // → ['bg-[#fff]', 'p-[1rem]']
 * 
 * // cols/rows with spaces (converted to underscores)
 * normalizeAttrs({ cols: '20% 50% 30%' })
 * // → ['cols-[20%_50%_30%]']
 * 
 * // Mixed
 * normalizeAttrs({ 'p-4': true, bg: '#fff' })
 * // → ['p-4', 'bg-[#fff]']
 * ```
 */
export function normalizeAttrs(attrs: Record<string, unknown>): string[] {
	const result: string[] = []

	for (const [key, value] of Object.entries(attrs)) {
		// Boolean attribute (existing syntax): { 'bg-[#fff]': true }
		if (value === true) {
			result.push(key)
			continue
		}

		// Skip false/null/undefined values
		if (value === false || value === null || value === undefined) {
			continue
		}

		// Value attribute: { bg: '#fff' } → 'bg-[#fff]'
		// Check if the key is a valid value-attribute prefix
		if (typeof value === 'string' || typeof value === 'number') {
			// Check for exact match against known value attribute prefixes
			const isValueAttr = (VALUE_ATTR_PREFIXES as readonly string[]).includes(key)

			if (isValueAttr) {
				// For numeric values, convert to string
				let strValue = String(value)
				
				// Special handling for cols/rows: convert spaces to underscores
				// This allows `cols="20% 50% 30%"` to work like `cols-[20%_50%_30%]`
				if (key === 'cols' || key === 'rows') {
					strValue = strValue.replace(/\s+/g, '_')
				}
				
				// Check if value is already wrapped in brackets
				if (strValue.startsWith('[') && strValue.endsWith(']')) {
					result.push(`${key}-${strValue}`)
				} else {
					result.push(`${key}-[${strValue}]`)
				}
			}
			// Unknown attributes with values are silently ignored
			// (they're not style attributes we recognize)
		}
	}

	return result
}

/**
 * Add a child node to a parent node.
 * Handles the type narrowing for different parent types.
 * 
 * Returns a cleanup function that removes the child from the parent.
 * This should be called in `onDestroy` to support dynamic content
 * (e.g., conditional rendering with {#if} or {#each} blocks).
 * 
 * Note: In SSR mode, returns a no-op function because onDestroy runs
 * during SSR and would otherwise remove children immediately after adding.
 * 
 * Note: TableNode only accepts TableRowNode children - this is enforced
 * at runtime with an error if violated.
 * 
 * @example
 * ```svelte
 * <script lang='ts'>
 *   import { onDestroy } from 'svelte'
 *   import { getEmailParent, addChild } from '../context'
 *   
 *   const parent = getEmailParent()
 *   const node = { type: 'div', attrs: [], children: [] }
 *   onDestroy(addChild(parent, node))
 * </script>
 * ```
 */
export function addChild(parent: Mail.IRParentNode, child: Mail.IRNode): () => void {
	// Validate table children must be rows
	if (parent.type === 'table' && child.type !== 'table-row') {
		throw new Error(
			`<Table> can only contain <Table.Row> children, got <${child.type}>. ` +
			`Wrap your content in <Table.Row> components.`
		)
	}

	const children = parent.children as Mail.IRNode[]
	children.push(child)

	// In SSR, return no-op because onDestroy runs during SSR
	// and would remove children we just added
	if (isSSR) {
		return () => {}
	}

	// In browser, return cleanup function to remove child from parent
	// This supports dynamic content (conditional rendering, {#each}, etc.)
	return () => {
		const index = children.indexOf(child)
		if (index !== -1) children.splice(index, 1)
	}
}
