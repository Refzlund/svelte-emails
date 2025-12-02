import _Email from './Email.svelte'
import _Render from './Render.svelte'
import Div from './Elements/Div.svelte'
import _Text from './Elements/Text/Text.svelte'
import _TextH1 from './Elements/Text/H1.svelte'
import _TextH2 from './Elements/Text/H2.svelte'
import _TextH3 from './Elements/Text/H3.svelte'
import _TextH4 from './Elements/Text/H4.svelte'
import _TextH5 from './Elements/Text/H5.svelte'
import _TextH6 from './Elements/Text/H6.svelte'
import _TextParagraph from './Elements/Text/Paragraph.svelte'
import _TextSmall from './Elements/Text/Small.svelte'
import Button from './Elements/Button.svelte'
import Link from './Elements/Link.svelte'
import Img from './Elements/Img.svelte'
import Spacer from './Elements/Spacer.svelte'
import Divider from './Elements/Divider.svelte'
import Br from './Elements/Br.svelte'
import Unsubscribe from './Elements/Unsubscribe.svelte'
import _Table from './Elements/Table/Table.svelte'
import _TableRow from './Elements/Table/Row.svelte'

// Import render utilities
import { renderTree } from './renderer'
import type { RenderOutput, RenderOptions } from './renderer'
import type { Mail, Collector } from './context'
import { setSSRCollector } from './context'
import type { StyleConfig } from './styles'
import type { Component } from 'svelte'
import { render as svelteRender } from 'svelte/server'

const Email = Object.assign(_Email, { 
	Render: _Render
})

const Text = Object.assign(_Text, {
	H1: _TextH1,
	H2: _TextH2,
	H3: _TextH3,
	H4: _TextH4,
	H5: _TextH5,
	H6: _TextH6,
	Paragraph: _TextParagraph,
	Small: _TextSmall
})

const Table = Object.assign(_Table, {
	Row: _TableRow
})

// ============================================================================
// Server-Side Render Function
// ============================================================================

/**
 * Options for the render() function.
 */
export interface RenderEmailOptions<TProps extends Record<string, unknown> = Record<string, unknown>> {
	/** Variables for content interpolation (e.g., { first_name: 'Alice' }) */
	vars?: Record<string, string>
	/** Style configuration (component theming, rem base size, etc.) */
	style?: StyleConfig
	/** Props to pass to the email component */
	props?: TProps
}

/**
 * Render an email component to HTML and plain text.
 * 
 * This function instantiates the Svelte component server-side,
 * collects the IR tree, and converts it to email-safe HTML.
 * 
 * @param EmailComponent - The email component to render (must contain <Email> at root)
 * @param options - Render options (vars, style, props)
 * @returns Object containing html, text, and headers
 * 
 * @example
 * ```ts
 * import { render } from 'svelte-emails'
 * import MyEmail from './MyEmail.email.svelte'
 * 
 * const result = await render(MyEmail, {
 *   vars: { first_name: 'Alice', order_id: '12345' },
 *   style: presets.minimal,
 *   props: { orderTotal: 99.99 }
 * })
 * 
 * console.log(result.html)  // Full HTML document
 * console.log(result.text)  // Plain text version
 * console.log(result.headers)  // { 'List-Unsubscribe': '...' }
 * ```
 */
export function render<TProps extends Record<string, unknown> = Record<string, unknown>>(
	EmailComponent: Component<TProps>,
	options: RenderEmailOptions<TProps> = {}
): RenderOutput {
	const { vars = {}, style, props = {} as TProps } = options

	// Create a collector to capture the IR tree
	let root: Mail.EmailNode | null = null
	const collector: Collector = {
		registerRoot(node: Mail.EmailNode) {
			root = node
		}
	}

	// Set the SSR collector before rendering
	// This is used as a fallback when Svelte's context API doesn't work in SSR
	setSSRCollector(collector)

	try {
		// Use Svelte's server-side render directly with the email component
		svelteRender(EmailComponent, {
			props: props as Record<string, unknown>
		})
	} finally {
		// Clear the SSR collector after rendering
		setSSRCollector(null)
	}

	// Check if root was collected
	if (!root) {
		throw new Error(
			'render() failed: No <Email> component found in the component tree. ' +
			'Make sure your email component contains an <Email> component at its root.'
		)
	}

	// Render the IR tree to HTML and text
	return renderTree(root, { vars, style })
}

export {
	Email,
	Div,
	Text,
	Button,
	Link,
	Img,
	Spacer,
	Divider,
	Br,
	Unsubscribe,
	Table,
	renderTree
}

// Re-export render types
export type { RenderOutput, RenderOptions }

// Re-export context for advanced usage
export * from './context'

// Re-export style utilities and presets
export { merge, presets, getRootSize } from './styles'
export type {
	StyleConfig,
	RootStyle,
	TextStyle,
	HeadingStyle,
	LinkStyle,
	ButtonStyle,
	SpacerStyle,
	DividerStyle,
	CodeStyle,
	CodeblockStyle,
	HighlightStyle,
	UnsubscribeStyle,
	TableStyle
} from './styles'

// Re-export all style attribute types
export type * from './style-attributes'