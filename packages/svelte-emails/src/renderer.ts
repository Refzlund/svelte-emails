/**
 * IR Tree to HTML/Text Renderer
 * 
 * Converts the virtual layout tree (IR) into email-safe HTML and plain text.
 * Handles style inheritance, opacity blending, margin emulation, and all
 * email client compatibility concerns during traversal.
 * 
 * This is the main entry point. Implementation details are split into:
 * - ./rendering/types.ts      - Type definitions
 * - ./rendering/CONSTANTS.ts  - Spacing/typography scales
 * - ./rendering/parse-attrs.ts - Attribute parsing
 * - ./rendering/colors.ts     - Color blending utilities
 * - ./rendering/html-helpers.ts - HTML generation helpers
 * - ./rendering/content.ts    - Markdown/variable processing
 * 
 * @see ARCHITECTURE.md for rendering pipeline details
 */

import type { Mail } from './context'
import type {
	RenderOutput,
	RenderOptions,
	InheritedStyles,
	RenderContext,
	ParsedAttrs,
StyleConfig
} from './rendering'
import {
	parseAttrs,
	extractInheritable,
	toInlineCSS,
	wrapWithMargin,
	applyWrappers,
	parseMarkdown,
	interpolatePlaceholders,
	escapeHtml,
	formatFootnotes,
	htmlAttrs,
	presentationTable,
	remToPx,
	extractWidthFromAttrs,
	extractCellAttrs,
	buildCssFromConfig,
	buildCell,
	buildCellStylesFromRow,
	extractRowStylesForCells,
	CONFIG_MAPPINGS,
	DEFAULT_MOBILE_BREAKPOINT
} from './rendering'
import { getRootSize, merge, basePreset } from './styles'

// Re-export types for consumers
export type { RenderOutput, RenderOptions } from './rendering'

// ============================================================================
// Constants
// ============================================================================

/**
 * HTML document template components.
 * @see ARCHITECTURE.md "HTML Document Structure" for explanation of each part.
 */
const DOCTYPE = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">'

const HTML_OPEN = '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">'

/**
 * Default email content width in pixels.
 * 600px is the industry standard for email content width.
 */
const DEFAULT_CONTENT_WIDTH = 600

// ============================================================================
// Text Variant Lookup
// ============================================================================

/**
 * Text variant metadata for unified rendering.
 * Replaces multiple switch statements with a single lookup.
 */
interface TextVariantInfo {
	/** HTML tag to render */
	tag: string
	/** Key in StyleConfig.Text for variant-specific config */
	configKey: 'H1' | 'H2' | 'H3' | 'H4' | 'H5' | 'H6' | 'Paragraph' | 'Small' | null
	/** Key in StyleConfig for Code/Codeblock (top-level, not under Text) */
	topLevelConfigKey?: 'Code' | 'Codeblock'
	/** Markdown prefix for plain text output */
	markdownPrefix: string
	/** CSS resets for browser defaults on this element */
	browserResets: Record<string, string>
	/** Whether content should be escaped (no markdown parsing) */
	escapeContent?: boolean
}

const TEXT_VARIANTS: Record<Mail.TextNode['variant'], TextVariantInfo> = {
	h1: {
		tag: 'h1',
		configKey: 'H1',
		markdownPrefix: '# ',
		browserResets: { margin: '0', padding: '0', fontSize: 'inherit', fontWeight: 'inherit' }
	},
	h2: {
		tag: 'h2',
		configKey: 'H2',
		markdownPrefix: '## ',
		browserResets: { margin: '0', padding: '0', fontSize: 'inherit', fontWeight: 'inherit' }
	},
	h3: {
		tag: 'h3',
		configKey: 'H3',
		markdownPrefix: '### ',
		browserResets: { margin: '0', padding: '0', fontSize: 'inherit', fontWeight: 'inherit' }
	},
	h4: {
		tag: 'h4',
		configKey: 'H4',
		markdownPrefix: '#### ',
		browserResets: { margin: '0', padding: '0', fontSize: 'inherit', fontWeight: 'inherit' }
	},
	h5: {
		tag: 'h5',
		configKey: 'H5',
		markdownPrefix: '##### ',
		browserResets: { margin: '0', padding: '0', fontSize: 'inherit', fontWeight: 'inherit' }
	},
	h6: {
		tag: 'h6',
		configKey: 'H6',
		markdownPrefix: '###### ',
		browserResets: { margin: '0', padding: '0', fontSize: 'inherit', fontWeight: 'inherit' }
	},
	paragraph: {
		tag: 'p',
		configKey: 'Paragraph',
		markdownPrefix: '',
		browserResets: { margin: '0', padding: '0' }
	},
	small: {
		tag: 'small',
		configKey: 'Small',
		markdownPrefix: '',
		browserResets: { fontSize: 'inherit' }
	},
	code: {
		tag: 'code',
		configKey: null,
		topLevelConfigKey: 'Code',
		markdownPrefix: '',
		browserResets: {},
		escapeContent: true
	},
	codeblock: {
		tag: 'pre',
		configKey: null,
		topLevelConfigKey: 'Codeblock',
		markdownPrefix: '',
		browserResets: { margin: '0', padding: '0' },
		escapeContent: true
	},
	default: {
		tag: 'span',
		configKey: null,
		markdownPrefix: '',
		browserResets: {}
	}
}

// ============================================================================
// Main Render Function
// ============================================================================

/**
 * Render an IR tree to HTML and plain text output.
 * 
 * This function is async to support Shiki syntax highlighting.
 * If no nodes use highlighting, the async overhead is minimal.
 * 
 * @param root - The root EmailNode of the IR tree
 * @param options - Render options (variables, style config, etc.)
 * @returns Promise resolving to object containing html, text, and headers outputs
 */
export async function renderTree(root: Mail.EmailNode, options: RenderOptions = {}): Promise<RenderOutput> {
	// Merge styles in order: basePreset -> Email.style -> render options.style
	// This allows Email to set defaults that can be overridden at render time
	const style = merge(merge(basePreset, root.style), options.style) as StyleConfig

	const context: RenderContext = {
		placeholders: options.placeholders ?? {},
		footnotes: [],
		headers: {},
		style
	}

	// Pre-process: collect and highlight all code nodes with syntax highlighting
	const highlightCache = await preprocessHighlighting(root)
	if (highlightCache.size > 0) {
		context.highlightCache = highlightCache
	}

	// Get root size for rem-to-px conversion
	const rootSize = getRootSize(style)

	// Initialize inherited styles from config
	// These serve as defaults for the entire tree
	const defaultColor = style.root?.color ?? '#000000'
	const defaultInherited: InheritedStyles = {
		backgroundColor: style.root?.background ?? '#ffffff',
		color: defaultColor,
		borderColor: defaultColor, // Border inherits from text color
		fontFamily: style.root?.fontFamily,
		baseFontFamily: style.root?.fontFamily, // For font-base to reset to
		monoFontFamily: style.root?.monoFontFamily, // For font-mono
		fontSize: `${rootSize}px`,
		lineHeight: typeof style.root?.lineHeight === 'number' 
			? String(style.root.lineHeight) 
			: style.root?.lineHeight,
		opacity: 1
	}

	const html = renderNodeToHtml(root, defaultInherited, context, rootSize)
	const text = renderNodeToText(root, context)

	return { html, text, headers: context.headers }
}

// ============================================================================
// Syntax Highlighting Pre-processor
// ============================================================================

/**
 * Generate a cache key for a highlighted code node.
 * Uses content, language, and theme to create a unique key.
 */
function getHighlightCacheKey(content: string, lang: string, theme?: string): string {
	return `${lang}:${theme ?? 'default'}:${content}`
}

/**
 * Pre-process the IR tree to collect and highlight all code nodes.
 * Returns a Map of cache keys to highlighted HTML.
 * 
 * This is called before rendering to handle async Shiki operations.
 * The results are cached so the synchronous renderer can access them.
 */
async function preprocessHighlighting(root: Mail.IRNode): Promise<Map<string, string>> {
	const cache = new Map<string, string>()
	const nodesToHighlight: Array<{ content: string; lang: string; theme?: string; key: string }> = []

	// Collect all nodes that need highlighting
	function collectNodes(node: Mail.IRNode): void {
		if (node.type === 'text' && (node.variant === 'code' || node.variant === 'codeblock') && node.highlight) {
			const key = getHighlightCacheKey(node.content, node.highlight, node.highlightTheme)
			if (!nodesToHighlight.some((n) => n.key === key)) {
				nodesToHighlight.push({
					content: node.content,
					lang: node.highlight,
					theme: node.highlightTheme,
					key
				})
			}
		}

		// Recurse into children for container nodes
		if ('children' in node && Array.isArray(node.children)) {
			for (const child of node.children) {
				collectNodes(child)
			}
		}
	}

	collectNodes(root)

	// If no nodes need highlighting, return empty cache
	if (nodesToHighlight.length === 0) {
		return cache
	}

	// Lazy-load Shiki and highlight all code in parallel
	try {
		const { highlightCode } = await import('./shiki')
		
		const results = await Promise.all(
			nodesToHighlight.map(async (node) => {
				try {
					const result = await highlightCode(node.content, {
						lang: node.lang,
						theme: node.theme
					})
					return { key: node.key, html: result.html }
				} catch (err) {
					// On error, fall back to plain escaped content
					console.warn(`Shiki highlighting failed for language "${node.lang}":`, err)
					return { key: node.key, html: null }
				}
			})
		)

		// Populate cache with successful results
		for (const result of results) {
			if (result.html) {
				cache.set(result.key, result.html)
			}
		}
	} catch {
		// Shiki not installed - return empty cache, renderer will use plain escaping
		console.warn(
			'Shiki is not installed. Syntax highlighting is disabled. ' +
			'Install it with: npm install shiki'
		)
	}

	return cache
}

// ============================================================================
// HTML Rendering - Main Dispatcher
// ============================================================================

/**
 * Render a single IR node to HTML string.
 * Uses type-based dispatch to call the appropriate renderer.
 * Recursively renders children with updated inherited styles.
 * 
 * IMPLEMENTATION:
 * - Switch on node.type for exhaustive handling
 * - Each renderer follows the same pattern:
 *   1. parseAttrs() to convert Tailwind attrs to CSS
 *   2. Extract margin for wrapper emulation  
 *   3. Compute childInherited for passing to children
 *   4. Render children recursively
 *   5. Generate HTML with inline styles
 *   6. Wrap with margin table if margin attrs exist
 * 
 * TODO(OPTIMIZATION): Most renderers repeat this exact pattern:
 * ```ts
 * const parsed = parseAttrs(node.attrs, inherited, rootSize)
 * const childInherited = extractInheritable(parsed, inherited)
 * const childrenHtml = renderChildren(node.children, childInherited, context, rootSize)
 * const inlineStyle = toInlineCSS(parsed.css, inherited)
 * let html = `<tag style="${inlineStyle}">${childrenHtml}</tag>`
 * if (parsed.margin) html = wrapWithMargin(html, parsed.margin)
 * return html
 * ```
 * 
 * Consider extracting a `createBaseRenderer()` factory or `renderWithStandardFlow()`
 * helper that handles the boilerplate, leaving renderers to only specify:
 * - The HTML tag(s) to use
 * - Any special attribute/CSS handling
 * - Any config lookups (StyleConfig.Button, etc.)
 * 
 * This would reduce code in: renderDivNode, renderTextNode, renderButtonNode,
 * renderImgNode, renderLinkNode, renderUnsubscribeNode, etc.
 */
function renderNodeToHtml(
	node: Mail.IRNode,
	inherited: InheritedStyles,
	context: RenderContext,
	rootSize: number
): string {
	switch (node.type) {
		case 'email':
			return renderEmailNode(node, inherited, context, rootSize)
		case 'div':
			return renderDivNode(node, inherited, context, rootSize)
		case 'text':
			return renderTextNode(node, inherited, context, rootSize)
		case 'button':
			return renderButtonNode(node, inherited, context, rootSize)
		case 'img':
			return renderImgNode(node, inherited, context, rootSize)
		case 'spacer':
			return renderSpacerNode(node, inherited, context, rootSize)
		case 'divider':
			return renderDividerNode(node, inherited, context, rootSize)
		case 'br':
			return renderBrNode(node, inherited, context, rootSize)
		case 'link':
			return renderLinkNode(node, inherited, context, rootSize)
		case 'unsubscribe':
			return renderUnsubscribeNode(node, inherited, context, rootSize)
		case 'table':
			return renderTableNode(node, inherited, context, rootSize)
		case 'table-row':
			return renderTableRowNode(node, inherited, context, rootSize)
		default: {
			// TypeScript exhaustive check - if we reach here, we forgot a case
			const _exhaustive: never = node
			console.warn(`Unknown node type: ${(node as Mail.BaseNode<string>).type}`)
			return ''
		}
	}
}

/**
 * Helper to render all children of a container node.
 */
function renderChildren(
	children: Mail.IRNode[],
	inherited: InheritedStyles,
	context: RenderContext,
	rootSize: number
): string {
	return children
		.map((child) => renderNodeToHtml(child, inherited, context, rootSize))
		.join('')
}

// ============================================================================
// HTML Rendering - Email Root Node
// ============================================================================

/**
 * Render an Email root node to complete HTML document.
 * 
 * IMPLEMENTATION:
 * 1. Generate DOCTYPE and <html> with VML namespaces
 * 2. Build <head> with:
 *    - Meta tags (charset, viewport, x-apple-disable-message-reformatting)
 *    - MSO-specific XML for Outlook (PixelsPerInch)
 *    - Reset styles and responsive media queries
 * 3. Build <body> with:
 *    - Hidden preview text div (for inbox preview)
 *    - Outer wrapper table (100% width, body background)
 *    - Inner content table (max-width container, content background)
 * 4. Render children into the content area
 * 
 * Background layers:
 * - body-bg-[#...] → Outer wrapper (full width) - defaults to #ffffff
 * - bg-[#...] → Content container (centered area) - defaults to transparent
 * 
 * @see ARCHITECTURE.md "HTML Document Structure" for template details
 */
function renderEmailNode(
	node: Mail.EmailNode,
	inherited: InheritedStyles,
	context: RenderContext,
	rootSize: number
): string {
	// Body background from body-bg-[#...] or default white
	const bodyBgColor = node.bodyBackground ?? '#ffffff'
	
	// Content width from max-w-* or default 600px
	const contentWidth = node.maxWidth ?? DEFAULT_CONTENT_WIDTH
	
	// Mobile breakpoint from mobile-threshold-* or default 480px
	const mobileBreakpoint = node.mobileBreakpoint ?? DEFAULT_MOBILE_BREAKPOINT

	// Parse attrs for content container styling (bg-[#...] goes here)
	// Use bodyBgColor as the inherited background for opacity blending
	const inheritedWithBodyBg = { ...inherited, backgroundColor: bodyBgColor }
	const parsed = parseAttrs(node.attrs, inheritedWithBodyBg, rootSize)
	
	// Content background from bg-[#...] - may be undefined (transparent)
	const contentBgColor = parsed.backgroundColor

	// For children, inherit from content background if set, otherwise body background
	const effectiveBgForChildren = contentBgColor ?? bodyBgColor
	const childInherited = extractInheritable(parsed, {
		...inherited,
		backgroundColor: effectiveBgForChildren
	})

	// Render children
	const childrenHtml = renderChildren(node.children, childInherited, context, rootSize)

	// Build head section (only media queries - reset styles are inlined)
	const headHtml = buildHeadSection(node, context, mobileBreakpoint)

	// Build body with wrapper tables
	const bodyStyle = `margin: 0; padding: 0; width: 100%; background-color: ${bodyBgColor};`
	
	// Preview text (hidden, appears in inbox list)
	const previewHtml = node.preview 
		? buildPreviewText(interpolatePlaceholders(node.preview, context))
		: ''

	// Build content container style
	// Include content background if specified, plus any other parsed styles
	const contentCss = { ...parsed.css }
	if (contentBgColor) {
		contentCss.backgroundColor = contentBgColor
	}
	const contentStyle = toInlineCSS(contentCss, inheritedWithBodyBg)

	// Outer wrapper centers content, inner wrapper constrains width
	// Use width="100%" with max-width for responsive behavior
	// MSO conditional sets fixed width for Outlook which ignores max-width
	// Note: Output is minified for smaller email size; use mode="html" in Render.svelte for pretty view
	const bodyHtml = `<body style="${bodyStyle}">${previewHtml}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${bodyBgColor};"><tr><td align="center" valign="top" style="padding: 0;"><!--[if mso]><table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" width="${contentWidth}"><tr><td align="center" valign="top" width="${contentWidth}"><![endif]--><table role="presentation" class="email-container" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: ${contentWidth}px;"><tr><td style="${contentStyle}">${childrenHtml}</td></tr></table><!--[if mso]></td></tr></table><![endif]--></td></tr></table></body>`

	return `${DOCTYPE}${HTML_OPEN}${headHtml}${bodyHtml}</html>`
}

/**
 * Build the <head> section with meta tags, MSO XML, and styles.
 * Output is minified for smaller email size.
 * 
 * Only includes media query styles since all other styles are inlined.
 * Reset styles (body, table, img) are applied inline to relevant elements.
 * 
 * @param node - Email node for subject extraction
 * @param context - Render context for variable interpolation
 * @param mobileBreakpoint - Breakpoint in px for responsive styles
 */
function buildHeadSection(node: Mail.EmailNode, context: RenderContext, mobileBreakpoint: number): string {
	const subject = node.subject 
		? interpolatePlaceholders(node.subject, context)
		: ''

	// Only media query CSS - everything else is inlined
	// This is the inline-first approach for maximum email client compatibility
	const css = [
		`@media screen and (max-width:${mobileBreakpoint}px){`,
		`.email-container{width:100%!important}`,
		// Responsive grid: content cells stack vertically
		`.responsive-grid td.content-cell{display:block!important;width:auto!important;box-sizing:border-box!important}`,
		`.responsive-grid td.content-cell>table{display:table!important;width:100%!important}`,
		`.responsive-grid td.content-cell>table>tbody>tr>td{display:table-cell!important}`,
		// Gap handling: hide spacer cells, add vertical margin to stacked cells
		`.responsive-grid td.gap-spacer{display:none!important}`,
		`.responsive-grid td.content-cell.has-gap{margin-top:var(--gap)!important}`,
		// Gap-as-padding fallback: switch horizontal padding to vertical
		`.responsive-grid td.responsive-gap-first{padding-right:0!important;padding-bottom:var(--gap-half)!important}`,
		`.responsive-grid td.responsive-gap-middle{padding-left:0!important;padding-right:0!important;padding-top:var(--gap-half)!important;padding-bottom:var(--gap-half)!important}`,
		`.responsive-grid td.responsive-gap-last{padding-left:0!important;padding-top:var(--gap-half)!important}`,
		// Visibility toggles
		`.mobile-only{display:table-cell!important;max-height:none!important;overflow:visible!important;width:auto!important}`,
		`td.mobile-only{display:table-cell!important}`,
		`div.mobile-only{display:block!important}`,
		`.desktop-only{display:none!important;width:0!important;max-width:0!important;height:0!important;overflow:hidden!important;mso-hide:all!important;font-size:0!important;line-height:0!important}`,
		`td.desktop-only{display:none!important;padding:0!important;width:0!important;max-width:0!important}`,
		'}'
	].join('')

	return `<head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="x-apple-disable-message-reformatting"><meta http-equiv="X-UA-Compatible" content="IE=edge"><title>${escapeHtml(subject)}</title><!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]--><style>${css}</style></head>`
}

/**
 * Build hidden preview text that appears in inbox list.
 * Uses zero-width characters to pad and prevent body content from appearing.
 */
function buildPreviewText(preview: string): string {
	// Zero-width non-joiners pad the preview and prevent body content leakage
	const padding = '&#847; '.repeat(50)
	return `<div style="display:none;max-height:0;overflow:hidden">${escapeHtml(preview)}${padding}</div>`
}

// ============================================================================
// HTML Rendering - Container Nodes
// ============================================================================

/**
 * Render a Div node as HTML table.
 * 
 * IMPLEMENTATION:
 * - Normal mode (no direction): Single cell containing all children
 * - Grid mode (direction='cols'): Single <tr> with multiple <td> (horizontal layout)
 * - Grid mode (direction='rows'): Multiple <tr> with single <td> each (vertical layout)
 * - `responsiveGrid` flag: Adds class for media query stacking (cols only)
 * - Width on <td> is critical for email clients (especially Outlook)
 * - Default width is 100% unless explicitly overridden via attrs
 * - Padding/background are applied correctly based on mode
 * 
 * Note: When this Div is a child of another grid Div, the parent's <td> already
 * has the width. We avoid "40% of 40%" by not applying width to the inner table.
 * 
 * @see ARCHITECTURE.md for grid and responsive implementation details
 */
function renderDivNode(
	node: Mail.DivNode,
	inherited: InheritedStyles,
	context: RenderContext,
	rootSize: number
): string {
	const parsed = parseAttrs(node.attrs, inherited, rootSize)
	const childInherited = extractInheritable(parsed, inherited)

	// Check if this is a grid layout (has direction)
	if (node.direction) {
		return renderDivAsGrid(node, parsed, childInherited, inherited, context, rootSize)
	}

	// Normal Div: single cell containing all children
	const childrenHtml = renderChildren(node.children, childInherited, context, rootSize)

	// Table attrs: use explicit width if provided, otherwise 100% to fill container
	// Note: When Div has explicit width (w="300px" or w-[300px]), respect it
	// When no width, default to 100% to fill parent container
	const tableAttrs: Record<string, string> = {
		width: parsed.css.width ?? '100%'
	}
	if (parsed.css.height) {
		tableAttrs.height = parsed.css.height
	}

	// Build CSS without width/height (these are on table/td attributes, not inline style)
	// Clone parsed.css and remove width to avoid duplication
	const cssWithoutDimensions = { ...parsed.css }
	delete cssWithoutDimensions.width
	delete cssWithoutDimensions.height

	// Build td attributes - vertical alignment and height need to be HTML attributes for email
	const tdAttrs: Record<string, string> = {}
	if (parsed.css.verticalAlign) {
		tdAttrs.valign = parsed.css.verticalAlign
		delete cssWithoutDimensions.verticalAlign // Don't duplicate in inline style
	}
	// Height on <td> must be an HTML attribute for email clients
	if (parsed.css.height) {
		tdAttrs.height = parsed.css.height
	}

	// Build the table cell with inline styles (excluding width/height)
	const inlineStyle = toInlineCSS(cssWithoutDimensions, inherited)
	if (inlineStyle) {
		tdAttrs.style = inlineStyle
	}
	const html = presentationTable(childrenHtml, tableAttrs, tdAttrs)

	return applyWrappers(html, parsed)
}

/**
 * Render a Div with grid direction as HTML table with multiple cells.
 * Helper function for renderDivNode when direction is set.
 * 
 * Column widths from `cols-[40%_30%_30%]`:
 * - Stored in `node.colWidths` as array of strings
 * - Applied to cells by index (only for direction='cols')
 * - Child explicit width takes precedence
 * 
 * Cells can span multiple columns via `span-*` attribute.
 * 
 * TODO(REDUNDANCY): Cell rendering logic is duplicated between:
 * - renderDivAsGrid() - for layout grids
 * - renderTableRowNode() - for data tables
 * 
 * Both do similar work:
 * 1. Extract width/valign/colspan/rowspan from child attrs
 * 2. Build <td> with those attributes
 * 3. Optionally add responsive classes
 * 4. Handle gap spacing between cells
 * 
 * Consider extracting a `renderCell(child, options)` helper that both can use.
 * Options would include: colWidths, borderColor, responsive, gap, etc.
 */
function renderDivAsGrid(
	node: Mail.DivNode,
	parsed: ParsedAttrs,
	childInherited: InheritedStyles,
	inherited: InheritedStyles,
	context: RenderContext,
	rootSize: number
): string {
	const isResponsive = node.responsiveGrid
	const isColumns = node.direction === 'cols'
	const gap = node.gap // e.g., "16px" from gap-4

	// Width: use explicit attr if provided, otherwise default to 100%
	const tableWidth = parsed.css.width ?? '100%'
	// Height: only apply if explicitly set
	const heightAttr = parsed.css.height ? ` height="${parsed.css.height}"` : ''
	
	let innerHtml: string

	if (isColumns) {
		// Horizontal layout: single row, multiple cells
		// Calculate auto-widths if cols-[...] not specified
		let autoWidths: string[] | undefined
		
		if (!node.colWidths && node.children.length > 0) {
			// No explicit column template - auto-calculate widths
			// First, find children with explicit widths and sum them
			let usedPercentage = 0
			let childrenWithoutWidth = 0
			let hasFixedWidthChildren = false
			
			for (const child of node.children) {
				const childWidth = extractWidthFromAttrs(child.attrs, rootSize)
				if (childWidth && childWidth.endsWith('%')) {
					usedPercentage += parseFloat(childWidth)
				} else if (childWidth) {
					// Has a fixed width (px, etc.) - don't give siblings 100%
					hasFixedWidthChildren = true
				} else {
					childrenWithoutWidth++
				}
			}
			
			// Calculate remaining percentage to distribute
			// BUT: if there are fixed-width children and no percentage children,
			// don't assign 100% to remaining children - let them auto-size
			const remainingPercentage = Math.max(0, 100 - usedPercentage)
			let autoWidth: string | undefined
			
			if (childrenWithoutWidth > 0) {
				if (hasFixedWidthChildren && usedPercentage === 0) {
					// Mixed fixed + auto: don't set width, let table auto-size
					autoWidth = undefined
				} else {
					// Percentage-based distribution
					autoWidth = `${(remainingPercentage / childrenWithoutWidth).toFixed(2)}%`
				}
			}
			
			// Build auto-widths array (only if we have something to distribute)
			if (autoWidth || hasFixedWidthChildren) {
				autoWidths = node.children.map((child) => {
					const childWidth = extractWidthFromAttrs(child.attrs, rootSize)
					return childWidth ?? autoWidth!
				})
			}
		}
		
		// Use explicit colWidths or calculated autoWidths
		const effectiveColWidths = node.colWidths ?? autoWidths
		
		// When we have explicit percentage-based colWidths AND a gap, we can't use
		// separate gap cells (35% + gap + 65% > 100%). Instead, implement gap using
		// cell padding distributed evenly: each cell gets half the gap on each side
		// (except first cell has no left padding, last cell has no right padding).
		// This preserves the intended percentage ratios AND equal content areas.
		const hasPercentageWidths = effectiveColWidths?.some(w => w?.endsWith('%'))
		const useGapAsPadding = gap && hasPercentageWidths
		
		// Calculate half gap for even distribution (parse px value and divide)
		let halfGap: string | undefined
		if (useGapAsPadding && gap) {
			const gapMatch = gap.match(/^(\d+(?:\.\d+)?)(px|rem|em)?$/)
			if (gapMatch) {
				const value = parseFloat(gapMatch[1])
				const unit = gapMatch[2] || 'px'
				halfGap = `${value / 2}${unit}`
			} else {
				// Fallback for complex values: use calc (limited email support)
				halfGap = `calc(${gap} / 2)`
			}
		}
		
		// Extract width, valign, responsive, and span from each child's attrs to apply to <td>
		const childCount = node.children.length
		
		// Check if any child will be unwrapped (h-full Div) - if so, use gap spacer cells
		const hasUnwrappedChildren = node.children.some(child => {
			const attrs = extractCellAttrs(child.attrs, rootSize)
			return child.type === 'div' && !child.direction && attrs.height === '100%'
		})
		// Use gap spacer cells instead of padding when children are unwrapped
		const useGapCells = gap && hasUnwrappedChildren
		const effectiveUseGapAsPadding = useGapAsPadding && !useGapCells
		
		let colIndex = 0
		const cells = node.children.map((child, index) => {
			// Extract all cell-related attrs in single pass
			const cellAttrs = extractCellAttrs(child.attrs, rootSize)
			
			// Filter out responsive attrs from child so it doesn't double-wrap
			const childAttrsFiltered = cellAttrs.responsive 
				? child.attrs.filter((a) => a !== 'mobile-only' && a !== 'desktop-only')
				: child.attrs
			const childForRender = { ...child, attrs: childAttrsFiltered }
			
			// Special case: when child is a Div with h-full, apply its styles to the <td>
			// and render its children directly. This makes equal-height columns work.
			let childHtml: string
			let cellStylesCss: Record<string, string> = {}
			
			if (child.type === 'div' && !child.direction && cellAttrs.height === '100%') {
				const childParsed = parseAttrs(childForRender.attrs, childInherited, rootSize)
				const childChildInherited = extractInheritable(childParsed, childInherited)
				childHtml = renderChildren(child.children, childChildInherited, context, rootSize)
				
				// Apply child's visual styles to the cell (excluding dimensions)
				const { width: _w, height: _h, verticalAlign: _v, ...visualCss } = childParsed.css
				cellStylesCss = { ...visualCss }
			} else {
				childHtml = renderNodeToHtml(childForRender, childInherited, context, rootSize)
			}
			
			// Width priority: explicit child width > effectiveColWidths[index] > none
			let width = cellAttrs.width
			if (!width && effectiveColWidths && effectiveColWidths[colIndex]) {
				width = effectiveColWidths[colIndex]
			}
			
			const widthAttr = width ? ` width="${width}"` : ''
			
			// Build class list
			const classes: string[] = []
			if (cellAttrs.responsive) classes.push(cellAttrs.responsive)
			if (cellAttrs.responsive === 'mobile-only') cellStylesCss.display = 'none'
			
			// Apply gap as padding (only when not using gap cells)
			if (effectiveUseGapAsPadding && halfGap) {
				const isFirst = index === 0
				const isLast = index === childCount - 1
				if (!isFirst) cellStylesCss.paddingLeft = halfGap
				if (!isLast) cellStylesCss.paddingRight = halfGap
				
				if (isResponsive) {
					cellStylesCss['--gap-half'] = halfGap
					if (isFirst) classes.push('responsive-gap-first')
					else if (isLast) classes.push('responsive-gap-last')
					else classes.push('responsive-gap-middle')
				}
			}
			
			const colspanAttr = cellAttrs.colspan ? ` colspan="${cellAttrs.colspan}"` : ''
			const rowspanAttr = cellAttrs.rowspan ? ` rowspan="${cellAttrs.rowspan}"` : ''
			const valign = cellAttrs.valign ?? 'top'
			
			colIndex += cellAttrs.colspan ?? 1
			
			// Add content-cell class for responsive targeting
			if (isResponsive) {
				classes.push('content-cell')
				// Add has-gap class + CSS variable for margin-top on mobile (gap cells approach)
				if (gap && index > 0 && !effectiveUseGapAsPadding) {
					classes.push('has-gap')
					cellStylesCss['--gap'] = gap
				}
			}
			
			const classAttr = classes.length > 0 ? ` class="${classes.join(' ')}"` : ''
			const styleStr = toInlineCSS(cellStylesCss, inherited)
			const styleAttr = styleStr ? ` style="${styleStr}"` : ''
			
			const cell = `<td valign="${valign}"${widthAttr}${colspanAttr}${rowspanAttr}${classAttr}${styleAttr}>${childHtml}</td>`
			
			// Insert gap spacer between cells when using gap cells approach
			if (gap && index > 0 && !effectiveUseGapAsPadding) {
				return `<td class="gap-spacer" style="width: ${gap}; min-width: ${gap}; font-size: 0; line-height: 0;">&nbsp;</td>${cell}`
			}
			return cell
		}).join('')
		innerHtml = `<tr>${cells}</tr>`
	} else {
		// Vertical layout: multiple rows, single cell each
		// Row heights from `rows-[...]` can be applied here
		innerHtml = node.children.map((child, index) => {
			const childHtml = renderNodeToHtml(child, childInherited, context, rootSize)
			
			// Apply row height from rowHeights array if available
			const styles: string[] = []
			if (node.rowHeights && node.rowHeights[index]) {
				styles.push(`height: ${node.rowHeights[index]}`)
			}
			const styleAttr = styles.length > 0 ? ` style="${styles.join('; ')}"` : ''
			
			const row = `<tr><td${styleAttr}>${childHtml}</td></tr>`
			
			// Insert gap spacer row between rows (not before first)
			if (gap && index > 0) {
				return `<tr><td style="height: ${gap};"></td></tr>${row}`
			}
			return row
		}).join('')
	}

	// Separate styles: padding/background go on wrapper, others on inner table
	// Tables don't support padding directly in email clients
	const { padding, paddingTop, paddingRight, paddingBottom, paddingLeft, backgroundColor, ...innerCss } = parsed.css
	const hasPaddingOrBg = padding || paddingTop || paddingRight || paddingBottom || paddingLeft || backgroundColor

	const innerStyle = toInlineCSS(innerCss, inherited)
	const innerStyleAttr = innerStyle ? ` style="${innerStyle}"` : ''
	const classAttr = isResponsive && isColumns ? ' class="responsive-grid"' : ''

	let html = `<table role="presentation" width="${tableWidth}"${heightAttr} cellpadding="0" cellspacing="0" border="0"${classAttr}${innerStyleAttr}>${innerHtml}</table>`

	// Wrap with padding/background table if needed
	if (hasPaddingOrBg) {
		const wrapperCss: Record<string, string> = {}
		if (padding) wrapperCss.padding = padding
		if (paddingTop) wrapperCss.paddingTop = paddingTop
		if (paddingRight) wrapperCss.paddingRight = paddingRight
		if (paddingBottom) wrapperCss.paddingBottom = paddingBottom
		if (paddingLeft) wrapperCss.paddingLeft = paddingLeft
		if (backgroundColor) wrapperCss.backgroundColor = backgroundColor
		
		const wrapperStyle = toInlineCSS(wrapperCss, inherited)
		// Preserve height on wrapper table when h-full is set
		const wrapperTableAttrs: Record<string, string> = { width: '100%' }
		if (parsed.css.height) {
			wrapperTableAttrs.height = parsed.css.height
		}
		html = presentationTable(html, wrapperTableAttrs, { style: wrapperStyle })
	}

	return applyWrappers(html, parsed)
}

// ============================================================================
// HTML Rendering - Content Nodes
// ============================================================================

/**
 * Render a Text node with markdown parsing or syntax highlighting.
 * 
 * IMPLEMENTATION:
 * 1. Apply variant-specific styling from StyleConfig
 * 2. Parse attributes with inherited styles
 * 3. Interpolate variables in content: [[var]] → value
 * 4. For code/codeblock with highlight: use pre-highlighted content from cache
 * 5. For regular code/codeblock: escape HTML and preserve whitespace
 * 6. For other variants: parse markdown syntax
 * 7. Output appropriate tag based on variant
 * 
 * @see ARCHITECTURE.md "Content Parsing" for markdown syntax
 * @see ARCHITECTURE.md "Variable Interpolation" for [[var]] syntax
 * @see ARCHITECTURE.md "Syntax Highlighting" for Shiki integration
 */
function renderTextNode(
	node: Mail.TextNode,
	inherited: InheritedStyles,
	context: RenderContext,
	rootSize: number
): string {
	const parsed = parseAttrs(node.attrs, inherited, rootSize)
	const variantInfo = TEXT_VARIANTS[node.variant]
	
	// Apply browser resets + variant-specific styles from StyleConfig
	const variantStyles = getTextVariantStyles(node.variant, context, rootSize)
	const mergedCss = { ...variantInfo.browserResets, ...variantStyles, ...parsed.css }

	// Process content
	let content: string

	if (variantInfo.escapeContent) {
		// For code/codeblock: check for syntax highlighting first
		const cacheKey = node.highlight && context.highlightCache
			? getHighlightCacheKey(node.content, node.highlight, node.highlightTheme)
			: null
		const highlightedHtml = cacheKey ? context.highlightCache?.get(cacheKey) : undefined
		
		if (highlightedHtml) {
			// Use pre-highlighted content from cache
			content = highlightedHtml
		} else {
			// Fall back to plain escaped content
			content = escapeHtml(interpolatePlaceholders(node.content, context))
		}
	} else {
		// For other variants: variables first, then markdown
		content = parseMarkdown(interpolatePlaceholders(node.content, context), context)
	}

	const inlineStyle = toInlineCSS(mergedCss, inherited)
	const styleAttr = inlineStyle ? ` style="${inlineStyle}"` : ''

	// Check if content contains block-level elements (lists, tables, etc.)
	// Block elements cannot be inside <p> tags - use <div> instead
	// Skip this check for code/codeblock since they escape content
	const hasBlockElements = !variantInfo.escapeContent && /<(?:ul|ol|table|blockquote|pre|div|hr)[>\s]/i.test(content)
	const tag = hasBlockElements ? 'div' : variantInfo.tag

	// Build HTML output
	let html: string
	if (node.variant === 'codeblock') {
		// For codeblock: wrap in <pre><code>
		// When highlighted, Shiki already outputs <pre><code> structure, but we've stripped it
		// to get just the spans. So we re-wrap with our styled <pre>.
		html = `<pre${styleAttr}><code>${content}</code></pre>`
	} else if (node.variant === 'code') {
		// For inline code: just <code> tag
		html = `<code${styleAttr}>${content}</code>`
	} else {
		html = `<${tag}${styleAttr}>${content}</${tag}>`
	}

	return applyWrappers(html, parsed)
}

/**
 * Get variant-specific styles from StyleConfig.
 * These are merged with explicit attrs (attrs take precedence).
 */
function getTextVariantStyles(
	variant: Mail.TextNode['variant'],
	context: RenderContext,
	rootSize: number
): Record<string, string> {
	const textConfig = context.style.Text
	const css: Record<string, string> = {}
	const variantInfo = TEXT_VARIANTS[variant]
	
	// Handle top-level config (Code, Codeblock)
	if (variantInfo.topLevelConfigKey) {
		const config = context.style[variantInfo.topLevelConfigKey]
		if (!config) return css

		if (config.color) css.color = config.color
		if (config.background) css.backgroundColor = config.background
		if (config.padding) css.padding = config.padding
		// Legacy borderRadius (deprecated, use border.radius)
		if (config.borderRadius) css.borderRadius = config.borderRadius
		if (config.fontFamily) css.fontFamily = config.fontFamily
		if (config.size) css.fontSize = remToPx(config.size, rootSize)
		if ('lineHeight' in config && config.lineHeight !== undefined) {
			css.lineHeight = typeof config.lineHeight === 'number'
				? String(config.lineHeight)
				: config.lineHeight
		}
		// Whitespace properties (for codeblock)
		if ('whiteSpace' in config && config.whiteSpace) css.whiteSpace = config.whiteSpace
		if ('wordWrap' in config && config.wordWrap) css.wordWrap = config.wordWrap
		if ('overflowWrap' in config && config.overflowWrap) css.overflowWrap = config.overflowWrap
		// Border object (for code and codeblock)
		if ('border' in config && config.border) {
			const border = config.border
			const borderStyle = border.style ?? 'solid'
			
			if (border.width && border.color) {
				// Check if width is directional or uniform
				if (typeof border.width === 'object') {
					// Directional widths
					const { top, right, bottom, left } = border.width
					if (top) css.borderTop = `${top} ${borderStyle} ${border.color}`
					if (right) css.borderRight = `${right} ${borderStyle} ${border.color}`
					if (bottom) css.borderBottom = `${bottom} ${borderStyle} ${border.color}`
					if (left) css.borderLeft = `${left} ${borderStyle} ${border.color}`
				} else {
					// Uniform width
					css.border = `${border.width} ${borderStyle} ${border.color}`
				}
			}
			// border.radius overrides legacy borderRadius
			if (border.radius) css.borderRadius = border.radius
		}

		return css
	}

	if (!textConfig) return css

	// Apply base text color if set
	if (textConfig.color) {
		css.color = textConfig.color
	}

	// Get variant-specific config using TEXT_VARIANTS lookup
	if (!variantInfo.configKey) return css

	const variantConfig = textConfig[variantInfo.configKey]
	if (!variantConfig) return css

	if (variantConfig.size) {
		css.fontSize = remToPx(variantConfig.size, rootSize)
	}
	if ('weight' in variantConfig && variantConfig.weight !== undefined) {
		css.fontWeight = String(variantConfig.weight)
	}
	if (variantConfig.lineHeight !== undefined) {
		css.lineHeight = typeof variantConfig.lineHeight === 'number'
			? String(variantConfig.lineHeight)
			: variantConfig.lineHeight
	}
	if (variantConfig.color) {
		css.color = variantConfig.color
	}

	return css
}

/**
 * Render a Button node as styled anchor.
 * 
 * IMPLEMENTATION:
 * - Renders as <a> with button styling (background, padding, rounded)
 * - Inherits Button styles from StyleConfig
 * - Content supports variables and markdown
 * - Button href supports variables: [[tracking_id]]
 * 
 * Note: For VML-based Outlook buttons with rounded corners,
 * we'd need conditional comments. Current impl uses CSS only.
 */

// ============================================================================
// Anchor Node Helper
// ============================================================================

interface AnchorRenderOptions {
	/** Config key to get default styles from context.style */
	configKey: 'Button' | 'Link' | 'Unsubscribe'
	/** Config mapping to build CSS object from config */
	configMapping: Record<string, string>
	/** Extra default CSS to apply before config and parsed attrs */
	extraDefaults?: Record<string, string>
	/** Whether to add target="_blank" rel="noopener noreferrer" */
	targetBlank?: boolean
	/** Whether content should be parsed as markdown (vs escaped HTML) */
	parseMarkdownContent?: boolean
	/** Whether margin wrapping is supported */
	supportMargin?: boolean
	/** Callback for side effects (e.g., setting headers) */
	onRender?: (href: string, node: AnchorLikeNode, context: RenderContext) => void
}

type AnchorLikeNode = (Mail.ButtonNode | Mail.LinkNode | Mail.UnsubscribeNode) & {
	href: string
	content?: string
	children: Mail.IRNode[]
	email?: string // Only on Unsubscribe
}

/**
 * Unified anchor renderer for Button, Link, and Unsubscribe nodes.
 * 
 * These nodes share the same structure:
 * 1. Parse attrs and get config defaults
 * 2. Merge defaults with parsed CSS
 * 3. Process href with variable interpolation
 * 4. Process content (markdown or plain) or render children
 * 5. Build <a> tag with styles
 * 6. Optionally wrap with margin
 */
function renderAnchorLikeNode(
	node: AnchorLikeNode,
	inherited: InheritedStyles,
	context: RenderContext,
	rootSize: number,
	options: AnchorRenderOptions
): string {
	const parsed = parseAttrs(node.attrs, inherited, rootSize)

	// Build default CSS from config
	const config = context.style[options.configKey]
	const configCss = buildCssFromConfig(config, options.configMapping)
	
	// Merge: extraDefaults < configCss < parsed.css (attrs win)
	const defaultCss = { ...options.extraDefaults, ...configCss }
	const mergedCss = { ...defaultCss, ...parsed.css }
	const inlineStyle = toInlineCSS(mergedCss, inherited)
	const styleAttr = inlineStyle ? ` style="${inlineStyle}"` : ''

	// Process href with variables
	const href = interpolatePlaceholders(node.href, context)

	// Build content: use content prop if available, otherwise render children
	const childInherited = extractInheritable(parsed, inherited)
	let content: string
	if (node.content) {
		const interpolated = interpolatePlaceholders(node.content, context)
		content = options.parseMarkdownContent
			? parseMarkdown(interpolated, context)
			: escapeHtml(interpolated)
	} else {
		content = renderChildren(node.children, childInherited, context, rootSize)
	}

	// Run side effect callback if provided
	options.onRender?.(href, node, context)

	// Build anchor tag
	const targetAttr = options.targetBlank ? ' target="_blank" rel="noopener noreferrer"' : ''
	let html = `<a href="${escapeHtml(href)}"${targetAttr}${styleAttr}>${content}</a>`

	// Wrap with margin if supported and needed
	if (options.supportMargin && parsed.margin) {
		html = wrapWithMargin(html, parsed.margin)
	}

	return html
}

function renderButtonNode(
	node: Mail.ButtonNode,
	inherited: InheritedStyles,
	context: RenderContext,
	rootSize: number
): string {
	return renderAnchorLikeNode(node, inherited, context, rootSize, {
		configKey: 'Button',
		configMapping: CONFIG_MAPPINGS.ButtonCss,
		extraDefaults: {
			display: 'inline-block',
			textDecoration: 'none'
		},
		targetBlank: true,
		parseMarkdownContent: true,
		supportMargin: true
	})
}

/**
 * Render an Image node.
 * 
 * IMPLEMENTATION:
 * - Always include width, height, alt for email compatibility
 * - Images may be blocked; alt text should be descriptive
 * - src should be absolute HTTPS URL (use [[var]] for dynamic)
 * - border="0" prevents blue link borders in some clients
 */
function renderImgNode(
	node: Mail.ImgNode,
	inherited: InheritedStyles,
	context: RenderContext,
	rootSize: number
): string {
	const parsed = parseAttrs(node.attrs, inherited, rootSize)

	// Process src and alt with variables
	const src = interpolatePlaceholders(node.src, context)
	const alt = node.alt ? interpolatePlaceholders(node.alt, context) : ''

	// Reset browser defaults for images:
	// - display: block removes bottom gap (inline images have text baseline gap)
	// - max-width: 100% prevents overflow
	// - height: auto maintains aspect ratio (only when no explicit height)
	// - aspect-ratio preserves dimensions before image loads (when both width and height are set)
	const resetCss: Record<string, string> = {
		display: 'block',
		maxWidth: '100%'
	}

	// When both width and height are specified, use aspect-ratio to prevent layout shift
	// before the image loads. Otherwise, use height: auto for fluid scaling.
	if (node.width && node.height) {
		resetCss.aspectRatio = `${node.width} / ${node.height}`
		resetCss.height = 'auto'
	} else if (!node.height) {
		resetCss.height = 'auto'
	}

	// Center block images when parent has text-align: center
	// (text-align doesn't affect block elements, so we use margin: 0 auto)
	if (inherited.textAlign === 'center') {
		resetCss.marginLeft = 'auto'
		resetCss.marginRight = 'auto'
	} else if (inherited.textAlign === 'right') {
		resetCss.marginLeft = 'auto'
		resetCss.marginRight = '0'
	}

	const mergedCss = { ...resetCss, ...parsed.css }

	const attrs: Record<string, string | number | undefined> = {
		src,
		alt,
		border: 0
	}

	// Add dimensions if provided
	if (node.width) attrs.width = node.width
	if (node.height) attrs.height = node.height

	// Add inline styles (reset styles + parsed attrs)
	const inlineStyle = toInlineCSS(mergedCss, inherited)
	if (inlineStyle) attrs.style = inlineStyle

	let html = `<img ${htmlAttrs(attrs)}>`

	// Wrap in anchor if href is provided (clickable image)
	if (node.href) {
		const href = interpolatePlaceholders(node.href, context)
		html = `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${html}</a>`
	}

	return applyWrappers(html, parsed)
}

// ============================================================================
// HTML Rendering - Spacing & Divider Nodes
// ============================================================================

/**
 * Render a Spacer node with context-aware dimensions.
 * 
 * Behavior depends on layoutContext (computed from parent in Spacer.svelte):
 * 
 * - vertical (default/rows layout):
 *   • Uses height for spacing (default: 2rem)
 *   • Width: 100%
 *   • Creates vertical gap between stacked elements
 * 
 * - horizontal (cols layout):
 *   • Uses width for spacing (default: 2rem)
 *   • Height: 1px (minimal)
 *   • Creates horizontal gap between side-by-side elements
 * 
 * - table-cell (Table.Row):
 *   • Uses width for sizing (no default)
 *   • Height: 1px (minimal)
 *   • Acts as empty cell placeholder
 */
function renderSpacerNode(
	node: Mail.SpacerNode,
	inherited: InheritedStyles,
	context: RenderContext,
	rootSize: number
): string {
	const parsed = parseAttrs(node.attrs, inherited, rootSize)
	const layoutContext = node.layoutContext ?? 'vertical'

	// Get default size from config
	const configSize = context.style.Spacer?.size ?? '2rem'

	if (layoutContext === 'vertical') {
		// Vertical: height-based spacing, full width
		const height = parsed.css.height ?? node.size ?? configSize
		return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="height: ${height}; line-height: ${height}; font-size: 0;">&nbsp;</td></tr></table>`
	}

	if (layoutContext === 'horizontal') {
		// Horizontal: width-based spacing, minimal height
		const width = parsed.css.width ?? node.size ?? configSize
		return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="width: ${width}; height: 1px; line-height: 1px; font-size: 0;">&nbsp;</td></tr></table>`
	}

	// table-cell: width-based, minimal height, no default size
	// Used as empty cell placeholder - the cell itself provides the spacing via column widths
	const width = parsed.css.width ?? node.size
	const widthStyle = width ? `width: ${width}; ` : ''
	return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="${widthStyle}height: 1px; line-height: 1px; font-size: 0;">&nbsp;</td></tr></table>`
}

/**
 * Render a Divider node as horizontal rule.
 * 
 * IMPLEMENTATION:
 * - Uses border-top on empty <td> for consistent rendering
 * - Styling from StyleConfig.Divider (color, thickness, style)
 * - Attrs can override defaults
 */
function renderDividerNode(
	node: Mail.DividerNode,
	inherited: InheritedStyles,
	context: RenderContext,
	rootSize: number
): string {
	const parsed = parseAttrs(node.attrs, inherited, rootSize)

	// Get defaults from StyleConfig
	const config = context.style.Divider
	const color = parsed.css.borderColor ?? config?.color ?? '#cccccc'
	const thickness = parsed.css.borderWidth ?? config?.thickness ?? '1px'
	const style = parsed.css.borderStyle ?? config?.style ?? 'solid'

	const borderStyle = `border-top: ${thickness} ${style} ${color}`

	return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="${borderStyle}"></td></tr></table>`
}

/**
 * Render a line break node.
 */
function renderBrNode(
	_node: Mail.BrNode,
	_inherited: InheritedStyles,
	_context: RenderContext,
	_rootSize: number
): string {
	return '<br>'
}

// ============================================================================
// HTML Rendering - Link Nodes
// ============================================================================

/**
 * Render a Link node (inline anchor).
 * 
 * IMPLEMENTATION:
 * - Inline <a> element (not block-level like Button)
 * - Styling from StyleConfig.Link (color, textDecoration)
 * - Content supports variables and markdown
 */
function renderLinkNode(
	node: Mail.LinkNode,
	inherited: InheritedStyles,
	context: RenderContext,
	rootSize: number
): string {
	return renderAnchorLikeNode(node, inherited, context, rootSize, {
		configKey: 'Link',
		configMapping: CONFIG_MAPPINGS.LinkCss,
		targetBlank: true,
		parseMarkdownContent: true
	})
}

/**
 * Render an Unsubscribe link node.
 * 
 * IMPLEMENTATION:
 * - Special styling from StyleConfig.Unsubscribe
 * - Adds List-Unsubscribe header for email clients
 * - Content is escaped (not markdown) for safety
 */
function renderUnsubscribeNode(
	node: Mail.UnsubscribeNode,
	inherited: InheritedStyles,
	context: RenderContext,
	rootSize: number
): string {
	return renderAnchorLikeNode(node, inherited, context, rootSize, {
		configKey: 'Unsubscribe',
		configMapping: CONFIG_MAPPINGS.UnsubscribeCss,
		targetBlank: false,
		parseMarkdownContent: false,
		onRender: (href, n) => {
			if (href) {
				const unsubNode = n as Mail.UnsubscribeNode
				context.headers['List-Unsubscribe'] = unsubNode.email
					? `<mailto:${unsubNode.email}>, <${href}>`
					: `<${href}>`
			}
		}
	})
}

// ============================================================================
// HTML Rendering - Table Data Nodes
// ============================================================================

/**
 * Render a Table node for tabular data.
 * 
 * IMPLEMENTATION:
 * - Unlike Grid (for layout), Table is for actual data display
 * - Uses proper table semantics (not role="presentation")
 * - Styling from StyleConfig.Table
 * - Width is applied as HTML attribute for Outlook compatibility
 * - Children must be Table.Row nodes
 * 
 * Border semantics:
 * - `border` → Full table border (outer + cell borders)
 * - `borderOuter` → Only outer table border
 * - `cellBorder` → Only cell borders (between rows/columns)
 * 
 * Column widths from `cols-[40%_20%_20%_20%]`:
 * - Stored in `node.colWidths` as array of strings
 * - Applied to cells in each row by index
 * - Child explicit width takes precedence
 */
function renderTableNode(
	node: Mail.TableNode,
	inherited: InheritedStyles,
	context: RenderContext,
	rootSize: number
): string {
	const parsed = parseAttrs(node.attrs, inherited, rootSize)
	const childInherited = extractInheritable(parsed, inherited)

	// Get table config
	const tableConfig = context.style.Table
	const borderColor = parsed.css.borderColor ?? tableConfig?.borderColor ?? '#e5e7eb'
	// Node's cellPadding takes precedence, then check compact flag, then default
	const cellPadding = node.cellPadding 
		?? (node.compact ? tableConfig?.compactCellPadding : tableConfig?.cellPadding) 
		?? '8px'

	// Build border styles based on node flags
	// border: outer + cell borders
	// borderOuter: only outer border
	// cellBorder: only cell borders (no outer)
	let tableBorderStyle = ''
	let needCellBorders = false

	if (node.border) {
		tableBorderStyle = `border: 1px solid ${borderColor}; border-collapse: collapse;`
		needCellBorders = true
	} else if (node.borderOuter) {
		tableBorderStyle = `border: 1px solid ${borderColor}; border-collapse: collapse;`
		needCellBorders = false
	} else if (node.cellBorder) {
		tableBorderStyle = 'border-collapse: collapse;'
		needCellBorders = true
	}

	// Render rows with column widths and border info
	const rowsHtml = node.children.map((child, index) => {
		// For striped tables, alternate row background
		if (node.striped && child.type === 'table-row' && !child.header && index % 2 === 1) {
			const stripeColor = tableConfig?.stripedBackground ?? '#f9fafb'
			const rowInherited = { ...childInherited, backgroundColor: stripeColor }
			return renderTableRowNode(child, rowInherited, context, rootSize, {
				rowBackground: stripeColor,
				colWidths: node.colWidths,
				borderColor: needCellBorders ? borderColor : undefined,
				cellPadding
			})
		}
		return renderTableRowNode(node.children[index] as Mail.TableRowNode, childInherited, context, rootSize, {
			colWidths: node.colWidths,
			borderColor: needCellBorders ? borderColor : undefined,
			cellPadding
		})
	}).join('')

	// Extract width/height for table attributes (Outlook needs these on <table>)
	// If colWidths uses percentages, table needs explicit width for them to work
	let tableWidth = parsed.css.width
	let tableLayoutFixed = ''
	if (!tableWidth && node.colWidths) {
		// Default to 100% if cols-[...] is specified but no explicit width
		tableWidth = '100%'
		// Use fixed table layout for predictable column widths
		tableLayoutFixed = 'table-layout: fixed;'
	}
	const widthAttr = tableWidth ? ` width="${tableWidth}"` : ''
	const heightAttr = parsed.css.height ? ` height="${parsed.css.height}"` : ''

	const inlineStyle = toInlineCSS(parsed.css, inherited)
	const styleValue = [tableLayoutFixed, tableBorderStyle, inlineStyle].filter(Boolean).join(' ')
	const styleAttr = styleValue ? ` style="${styleValue}"` : ''

	// Add width: 100% to style if we defaulted it
	let finalStyle = styleAttr
	if (!parsed.css.width && node.colWidths) {
		if (finalStyle) {
			finalStyle = finalStyle.replace(/style="/, 'style="width: 100%; ')
		} else {
			finalStyle = ' style="width: 100%"'
		}
	}

	const html = `<table cellpadding="0" cellspacing="0" border="0"${widthAttr}${heightAttr}${finalStyle}>${rowsHtml}</table>`

	return applyWrappers(html, parsed)
}

/**
 * Options passed from Table to Row for rendering cells.
 */
interface TableRowRenderOptions {
	rowBackground?: string
	colWidths?: string[]
	borderColor?: string
	cellPadding?: string
}

/**
 * Render a Table Row node.
 * 
 * IMPLEMENTATION:
 * - If header=true, children render as <th>
 * - Otherwise, children render as <td>
 * - Each direct child becomes a cell
 * - Row styles are inherited by children
 * - Column widths from parent Table are applied by index
 * - Cells can span multiple columns via `span-*` attribute
 * - Cells can span multiple rows via `row-span-*` attribute
 * - Border styles on row are applied to cells (<tr> doesn't support borders reliably)
 * 
 * TODO(COMPLEXITY): This function is ~150 lines and handles many concerns:
 * - Row background for striping
 * - Padding transfer from row to cells
 * - Border transfer from row to cells (5+ border properties)
 * - Column width application
 * - Colspan/rowspan extraction
 * - Alignment extraction
 * 
 * Consider splitting into smaller functions:
 * - `buildCellStyles(parsed, options)` - handles padding, borders, background
 * - `buildCellAttrs(child, colWidths, colIndex)` - handles width, colspan, rowspan
 * - `renderTableCell(child, cellTag, styles, attrs)` - assembles the <td>/<th>
 * 
 * This would make the main function a coordinator:
 * ```ts
 * function renderTableRowNode(...) {
 *   const cellStyles = buildCellStyles(parsed, { rowBackground, borderColor })
 *   const cells = node.children.map((child, i) => {
 *     const attrs = buildCellAttrs(child, colWidths, colIndex)
 *     return renderTableCell(child, cellTag, cellStyles, attrs)
 *   })
 *   return `<tr>${cells.join('')}</tr>`
 * }
 * ```
 */
function renderTableRowNode(
	node: Mail.TableRowNode,
	inherited: InheritedStyles,
	context: RenderContext,
	rootSize: number,
	options: TableRowRenderOptions = {}
): string {
	const { rowBackground, colWidths, borderColor, cellPadding } = options
	const parsed = parseAttrs(node.attrs, inherited, rootSize)
	const cellTag = node.header ? 'th' : 'td'

	// Apply row background if provided (for striped tables)
	const rowInherited = rowBackground 
		? { ...inherited, backgroundColor: rowBackground }
		: inherited

	const childInherited = extractInheritable(parsed, rowInherited)

	// Extract row styles that need to be transferred to cells
	// (padding and borders don't work on <tr> in email clients)
	const { rowStyles, cleanedCss } = extractRowStylesForCells(parsed.css)

	// Track column index for width assignment
	let colIndex = 0
	const totalChildren = node.children.length

	// Check if row has any explicit padding
	const rowHasPadding = rowStyles.padding || rowStyles.paddingTop ||
		rowStyles.paddingRight || rowStyles.paddingBottom || rowStyles.paddingLeft

	// Each child becomes a cell
	const cellsHtml = node.children.map((child, childIndex) => {
		const cellHtml = renderNodeToHtml(child, childInherited, context, rootSize)
		
		// Get row styles transferred to this cell
		const rowTransferStyles = buildCellStylesFromRow(
			rowStyles,
			{ isFirst: childIndex === 0, isLast: childIndex === totalChildren - 1 },
			{ rowBackground, tableBorderColor: borderColor }
		)

		// Add table-level cell padding if specified AND row doesn't have explicit padding
		// This allows row padding (py-2, pb-2) to override table cell-padding
		if (cellPadding && !rowHasPadding) {
			rowTransferStyles.push(`padding: ${cellPadding}`)
		}

		// Extract cell-related attrs
		const childCellAttrs = extractCellAttrs(child.attrs, rootSize)
		
		// Determine cell width
		const fallbackWidth = colWidths?.[colIndex]
		
		// Advance column index by colspan
		colIndex += childCellAttrs.colspan ?? 1

		// Build cell using helper
		// For <th> cells, default text-align to left (browsers default to center)
		return buildCell(cellTag, cellHtml, childCellAttrs, {
			fallbackWidth,
			extraStyles: rowTransferStyles,
			defaultTextAlign: cellTag === 'th' ? 'left' : undefined
		})
	}).join('')

	const inlineStyle = toInlineCSS(cleanedCss, inherited)
	const styleAttr = inlineStyle ? ` style="${inlineStyle}"` : ''

	return `<tr${styleAttr}>${cellsHtml}</tr>`
}

// ============================================================================
// Plain Text Rendering
// ============================================================================

/**
 * Render a single IR node to plain text (markdown-formatted).
 * 
 * IMPLEMENTATION:
 * - Parallel to renderNodeToHtml, but outputs markdown/plain text
 * - Links become [text](url)[^n] with footnote references
 * - Images become ![alt](url)
 * - Tables become pretty markdown tables
 * - Bold/italic preserved as markdown syntax
 * - Variables are interpolated (same as HTML)
 * 
 * @see ARCHITECTURE.md "Plain Text Output" for format details
 * 
 * TODO(CONSIDERATION): The HTML and text renderers are parallel but separate.
 * This means:
 * - Adding a new node type requires updating BOTH dispatchers
 * - Similar logic is duplicated (variable interpolation, content processing)
 * 
 * Alternative approach: Single renderer with output format parameter:
 * ```ts
 * function renderNode(node, inherited, context, options: { format: 'html' | 'text' }) {
 *   // Shared logic here
 * }
 * ```
 * 
 * However, the current approach has benefits:
 * - Clear separation of concerns
 * - HTML renderer can be complex without affecting text output
 * - Text output is simpler and doesn't need all the HTML machinery
 * 
 * The trade-off is acceptable given the complexity difference between formats.
 */
function renderNodeToText(node: Mail.IRNode, context: RenderContext): string {
	switch (node.type) {
		case 'email':
			return renderEmailNodeToText(node, context)
		case 'div':
			return renderContainerToText(node, context)
		case 'text':
			return renderTextNodeToText(node, context)
		case 'button':
			return renderButtonNodeToText(node, context)
		case 'img':
			return renderImgNodeToText(node, context)
		case 'spacer':
			return '\n'
		case 'divider':
			return '\n---\n'
		case 'br':
			return '\n'
		case 'link':
			return renderLinkNodeToText(node, context)
		case 'unsubscribe':
			return renderUnsubscribeNodeToText(node, context)
		case 'table':
			return renderTableNodeToText(node, context)
		case 'table-row':
			return renderTableRowNodeToText(node, context)
		default:
			return ''
	}
}

function renderEmailNodeToText(node: Mail.EmailNode, context: RenderContext): string {
	const childrenText = node.children
		.map((c) => renderNodeToText(c, context))
		.filter((text) => text.trim() !== '') // Remove empty sections
		.join('\n\n')
	
	// Collapse 3+ newlines to 2, trim result
	const normalized = childrenText.replace(/\n{3,}/g, '\n\n').trim()
	const footnotes = formatFootnotes(context.footnotes)
	return normalized + footnotes
}

function renderContainerToText(
	node: Mail.DivNode,
	context: RenderContext
): string {
	return node.children.map((c) => renderNodeToText(c, context)).join('\n')
}

function renderTextNodeToText(node: Mail.TextNode, context: RenderContext): string {
	// Interpolate variables
	let content = interpolatePlaceholders(node.content, context)
	
	// For code variants, don't strip markdown syntax - return raw content
	if (node.variant === 'code') {
		return `\`${content}\``
	}
	if (node.variant === 'codeblock') {
		return `\`\`\`\n${content}\n\`\`\``
	}
	
	// Strip HTML-specific markdown syntax while preserving standard markdown
	content = stripHtmlSpecificMarkdown(content)
	
	// Convert literal \n to actual newlines (for plain text)
	content = content.replace(/\\n/g, '\n')
	
	// Add heading markers based on variant using TEXT_VARIANTS lookup
	const prefix = TEXT_VARIANTS[node.variant].markdownPrefix
	return prefix ? `${prefix}${content}` : content
}

/**
 * Strip HTML-specific extended markdown syntax for plain text output.
 * Preserves standard markdown (bold, italic, links, etc.)
 * Strips color syntax, underline, small text, etc.
 */
function stripHtmlSpecificMarkdown(content: string): string {
	let result = content

	// Strip formatting from list markers at start of line
	// **1.** text → 1. text, *-* text → - text, etc.
	result = result.replace(/^(\*\*|\*|__|_)(\d+\.|[a-zA-Z]\.|[ivxIVX]+\.|-|\*)(\*\*|\*|__|_)\s*/gm, '$2 ')

	// Remove colored text: (#hex)text(/) → just text
	result = result.replace(/\(#[0-9a-fA-F]{3,6}\)([^(]+)\(\/\)/g, '$1')

	// Remove highlighted text: [#hex]text[/] → just text
	result = result.replace(/\[#[0-9a-fA-F]{3,6}\]([^[]+)\[\/\]/g, '$1')

	// Convert underline to plain text: __text__ → text
	result = result.replace(/__([^_]+)__/g, '$1')

	// Convert small text to plain: --text-- → text
	result = result.replace(/--([^-]+)--/g, '$1')

	// Convert superscript to plain: ^text^ → text
	result = result.replace(/\^([^^]+)\^/g, '$1')

	// Convert subscript to plain: _text_ → text
	result = result.replace(/(?<=\s|^)_([^_]+)_(?=\s|$)/g, '$1')

	return result
}

/**
 * Shared helper for rendering link-like nodes to plain text.
 * Used by Button, Link, and Unsubscribe nodes.
 * 
 * @param node - Node with href, optional content, and children
 * @param context - Render context for interpolation
 * @param format - Output format: 'markdown' for [text](url), 'plain' for text: url
 */
function renderLinkLikeToText(
	node: { href: string; content?: string; children: Mail.IRNode[] },
	context: RenderContext,
	format: 'markdown' | 'plain' = 'markdown'
): string {
	const href = interpolatePlaceholders(node.href, context)
	let content = node.content
		? interpolatePlaceholders(node.content, context)
		: node.children.map((c) => renderNodeToText(c, context)).join('')
	content = content.trim() || 'Link'

	return format === 'markdown'
		? `[${content}](${href})`
		: `${content}: ${href}`
}

function renderButtonNodeToText(node: Mail.ButtonNode, context: RenderContext): string {
	return renderLinkLikeToText(node, context, 'markdown')
}

function renderImgNodeToText(node: Mail.ImgNode, context: RenderContext): string {
	const src = interpolatePlaceholders(node.src, context)
	const alt = node.alt ? interpolatePlaceholders(node.alt, context) : 'Image'
	return `![${alt}](${src})`
}

function renderLinkNodeToText(node: Mail.LinkNode, context: RenderContext): string {
	return renderLinkLikeToText(node, context, 'markdown')
}

function renderUnsubscribeNodeToText(node: Mail.UnsubscribeNode, context: RenderContext): string {
	return renderLinkLikeToText(node, context, 'plain')
}

/**
 * Normalize cell content for markdown table (replace newlines with space).
 */
function normalizeCellContent(text: string): string {
	return text.replace(/\n/g, ' ').trim()
}

function renderTableNodeToText(node: Mail.TableNode, context: RenderContext): string {
	if (node.children.length === 0) return ''

	// Pre-render all cells and normalize content
	const renderedRows = node.children.map((row) => 
		row.children.map((cell) => normalizeCellContent(renderNodeToText(cell, context)))
	)

	// Calculate column widths based on actual content
	const columnCount = Math.max(...renderedRows.map((r) => r.length))
	const columnWidths: number[] = []
	for (let i = 0; i < columnCount; i++) {
		const maxWidth = Math.max(...renderedRows.map((r) => (r[i] ?? '').length), 3)
		columnWidths.push(maxWidth)
	}

	// Build rows with proper padding
	const formatRow = (cells: string[]): string => {
		const paddedCells = columnWidths.map((width, i) => {
			const cell = cells[i] ?? ''
			return cell.padEnd(width)
		})
		return '| ' + paddedCells.join(' | ') + ' |'
	}

	// Build separator row
	const separator = '|' + columnWidths.map((w) => '-'.repeat(w + 2)).join('|') + '|'

	// Build output with separator after first row (header)
	const [firstRow, ...restRows] = renderedRows
	const rows = [formatRow(firstRow), separator, ...restRows.map(formatRow)]
	return rows.join('\n')
}

function renderTableRowNodeToText(node: Mail.TableRowNode, context: RenderContext): string {
	// This function is now only used when rows are rendered outside of renderTableNodeToText
	const cells = node.children.map((c) => normalizeCellContent(renderNodeToText(c, context)))
	return '| ' + cells.join(' | ') + ' |'
}
