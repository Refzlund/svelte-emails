/**
 * Context management for the svelte-emails virtual layout tree.
 * 
 * Components register themselves via Svelte's createContext, forming a tree structure
 * that gets transformed into email-safe HTML.
 * 
 * @see ARCHITECTURE.md for detailed information about the component registration flow.
 */

import { createContext } from 'svelte'

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
	 * Spacer node - vertical spacing
	 */
	export interface SpacerNode extends BaseNode<'spacer'> {
		size?: string
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
// Context Definitions
// ============================================================================

/**
 * Module-level collector for SSR fallback.
 * When using svelte/server's render(), the Svelte 5 context API may not work
 * reliably, so we use a module-level variable as a fallback.
 */
let ssrCollector: Collector | null = null

/**
 * Set the SSR collector (called before SSR render).
 */
export function setSSRCollector(collector: Collector | null): void {
	ssrCollector = collector
}

/**
 * Get the SSR collector.
 */
export function getSSRCollector(): Collector | null {
	return ssrCollector
}

/**
 * Context for the root collector.
 * Set by Email.Preview or render(), accessed by Email component.
 */
export const [getEmailRoot, setEmailRoot] = createContext<Collector>()

/**
 * Context for the current parent node.
 * Each component gets its parent, registers itself, then sets itself as parent for children.
 */
export const [getEmailParent, setEmailParent] = createContext<Mail.IRParentNode>()

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Add a child node to a parent node.
 * Handles the type narrowing for different parent types.
 * 
 * Returns a cleanup function that removes the child from the parent.
 * This should be called in `onDestroy` to support dynamic content
 * (e.g., conditional rendering with {#if} or {#each} blocks).
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

	// Return cleanup function to remove child from parent
	return () => {
		const index = children.indexOf(child)
		if (index !== -1) children.splice(index, 1)
	}
}
