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
	wrapWithResponsive,
	parseMarkdown,
	interpolatePlaceholders,
	escapeHtml,
	formatFootnotes,
	htmlAttrs,
	presentationTable,
	remToPx,
	extractWidthFromAttrs,
	extractValignFromAttrs,
	extractTextAlignFromAttrs,
	extractResponsiveFromAttrs,
	extractColspanFromAttrs,
	extractRowspanFromAttrs,
	MOBILE_BREAKPOINT
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
// Main Render Function
// ============================================================================

/**
 * Render an IR tree to HTML and plain text output.
 * 
 * @param root - The root EmailNode of the IR tree
 * @param options - Render options (variables, style config, etc.)
 * @returns Object containing html, text, and headers outputs
 */
export function renderTree(root: Mail.EmailNode, options: RenderOptions = {}): RenderOutput {
	// Merge user style with base preset for complete defaults
	const style = merge(basePreset, options.style) as StyleConfig

	const context: RenderContext = {
		placeholders: options.placeholders ?? {},
		footnotes: [],
		headers: {},
		style
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
	const headHtml = buildHeadSection(node, context)

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
 */
function buildHeadSection(node: Mail.EmailNode, context: RenderContext): string {
	const subject = node.subject 
		? interpolatePlaceholders(node.subject, context)
		: ''

	// Only media query CSS - everything else is inlined
	// This is the inline-first approach for maximum email client compatibility
	const css = [
		`@media screen and (max-width:${MOBILE_BREAKPOINT}px){`,
		`.email-container{width:100%!important}`,
		`.responsive-grid td{display:block!important;width:100%!important}`,
		`.responsive-grid td>table{display:table!important;width:100%!important}`,
		`.responsive-grid td>table>tbody>tr>td{display:table-cell!important}`,
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

	// Table attrs: always 100% width to fill container, height if specified
	// Note: Actual width constraint comes from parent (Grid's <td> or margin wrapper)
	const tableAttrs: Record<string, string> = {
		width: '100%'
	}
	if (parsed.css.height) {
		tableAttrs.height = parsed.css.height
	}

	// Build CSS without width (width is controlled by parent)
	// Clone parsed.css and remove width to avoid "40% of 40%" in nested contexts
	const cssWithoutWidth = { ...parsed.css }
	delete cssWithoutWidth.width

	// Build the table cell with inline styles (excluding width)
	const inlineStyle = toInlineCSS(cssWithoutWidth, inherited)
	let html = presentationTable(childrenHtml, tableAttrs, { style: inlineStyle })

	// Wrap with margin table if margin attrs exist
	if (parsed.margin) {
		html = wrapWithMargin(html, parsed.margin)
	}

	// Wrap with responsive class if needed
	if (parsed.responsive) {
		html = wrapWithResponsive(html, parsed.responsive)
	}

	return html
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
		
		// Extract width, valign, responsive, and span from each child's attrs to apply to <td>
		let colIndex = 0
		const cells = node.children.map((child, index) => {
			// Extract responsive visibility BEFORE rendering - we'll apply it to <td>, not the child
			const childResponsive = extractResponsiveFromAttrs(child.attrs)
			
			// Filter out responsive attrs from child so it doesn't double-wrap
			const childAttrsFiltered = childResponsive 
				? child.attrs.filter((a) => a !== 'mobile-only' && a !== 'desktop-only')
				: child.attrs
			const childForRender = { ...child, attrs: childAttrsFiltered }
			
			const childHtml = renderNodeToHtml(childForRender, childInherited, context, rootSize)
			
			// Extract width, valign, and span from child's attrs for the <td>
			const childWidth = extractWidthFromAttrs(child.attrs, rootSize)
			const childValign = extractValignFromAttrs(child.attrs) ?? 'top'
			const colspan = extractColspanFromAttrs(child.attrs)
			const rowspan = extractRowspanFromAttrs(child.attrs)
			
			// Width priority: explicit child width > effectiveColWidths[index] > none
			let width = childWidth
			if (!width && effectiveColWidths && effectiveColWidths[colIndex]) {
				width = effectiveColWidths[colIndex]
			}
			
			const widthAttr = width ? ` width="${width}"` : ''
			const classAttr = childResponsive ? ` class="${childResponsive}"` : ''
			// For mobile-only, start hidden; for desktop-only, start visible
			const styleAttr = childResponsive === 'mobile-only' ? ' style="display: none;"' : ''
			const colspanAttr = colspan ? ` colspan="${colspan}"` : ''
			const rowspanAttr = rowspan ? ` rowspan="${rowspan}"` : ''
			
			// Advance column index by colspan
			colIndex += colspan ?? 1
			
			const cell = `<td valign="${childValign}"${widthAttr}${colspanAttr}${rowspanAttr}${classAttr}${styleAttr}>${childHtml}</td>`
			
			// Insert gap spacer between cells (not before first)
			if (gap && index > 0) {
				return `<td width="${gap}"></td>${cell}`
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
		html = presentationTable(html, { width: '100%' }, { style: wrapperStyle })
	}

	// Wrap with margin if needed
	if (parsed.margin) {
		html = wrapWithMargin(html, parsed.margin)
	}

	// Wrap with responsive class if needed
	if (parsed.responsive) {
		html = wrapWithResponsive(html, parsed.responsive)
	}

	return html
}

// ============================================================================
// HTML Rendering - Content Nodes
// ============================================================================

/**
 * Render a Text node with markdown parsing.
 * 
 * IMPLEMENTATION:
 * 1. Apply variant-specific styling from StyleConfig
 * 2. Parse attributes with inherited styles
 * 3. Interpolate variables in content: [[var]] → value
 * 4. Parse markdown syntax: **bold**, *italic*, etc.
 * 5. Output appropriate tag based on variant:
 *    - 'h1'-'h6' → <h1>-<h6>
 *    - 'paragraph' → <p>
 *    - 'small' → <small>
 *    - 'default' → <span>
 * 
 * @see ARCHITECTURE.md "Content Parsing" for markdown syntax
 * @see ARCHITECTURE.md "Variable Interpolation" for [[var]] syntax
 */
function renderTextNode(
	node: Mail.TextNode,
	inherited: InheritedStyles,
	context: RenderContext,
	rootSize: number
): string {
	const parsed = parseAttrs(node.attrs, inherited, rootSize)
	
	// Apply variant-specific styles from StyleConfig
	const variantStyles = getTextVariantStyles(node.variant, context, rootSize)
	const mergedCss = { ...variantStyles, ...parsed.css }

	// Process content: variables first, then markdown
	let content = interpolatePlaceholders(node.content, context)
	content = parseMarkdown(content, context)

	const inlineStyle = toInlineCSS(mergedCss, inherited)
	const styleAttr = inlineStyle ? ` style="${inlineStyle}"` : ''

	// Choose tag based on variant
	const tag = getTextTag(node.variant)
	let html = `<${tag}${styleAttr}>${content}</${tag}>`

	// Wrap with margin if needed
	if (parsed.margin) {
		html = wrapWithMargin(html, parsed.margin)
	}

	return html
}

/**
 * Get the HTML tag for a text variant.
 */
function getTextTag(variant: Mail.TextNode['variant']): string {
	switch (variant) {
		case 'h1': return 'h1'
		case 'h2': return 'h2'
		case 'h3': return 'h3'
		case 'h4': return 'h4'
		case 'h5': return 'h5'
		case 'h6': return 'h6'
		case 'paragraph': return 'p'
		case 'small': return 'small'
		default: return 'span'
	}
}

/**
 * Get variant-specific styles from StyleConfig.
 * These are merged with explicit attrs (attrs take precedence).
 * 
 * Resets browser defaults for text elements since we use inline-first approach:
 * - h1-h6: margin, font-size, font-weight (browsers apply defaults)
 * - p: margin
 * - small: font-size (browsers make it smaller)
 */
function getTextVariantStyles(
	variant: Mail.TextNode['variant'],
	context: RenderContext,
	rootSize: number
): Record<string, string> {
	const textConfig = context.style.Text
	const css: Record<string, string> = {}

	// Reset browser defaults based on element type
	switch (variant) {
		case 'h1':
		case 'h2':
		case 'h3':
		case 'h4':
		case 'h5':
		case 'h6':
			// Headings have browser default margin, font-size, font-weight
			css.margin = '0'
			css.padding = '0'
			css.fontSize = 'inherit'
			css.fontWeight = 'inherit'
			break
		case 'paragraph':
			// Paragraphs have browser default margin
			css.margin = '0'
			css.padding = '0'
			break
		case 'small':
			// Small has browser default smaller font-size
			css.fontSize = 'inherit'
			break
	}

	if (!textConfig) return css

	// Apply base text color if set
	if (textConfig.color) {
		css.color = textConfig.color
	}

	// Get variant-specific config
	let variantConfig: { size?: string; weight?: string | number; lineHeight?: string | number; color?: string } | undefined

	switch (variant) {
		case 'h1': variantConfig = textConfig.H1; break
		case 'h2': variantConfig = textConfig.H2; break
		case 'h3': variantConfig = textConfig.H3; break
		case 'h4': variantConfig = textConfig.H4; break
		case 'h5': variantConfig = textConfig.H5; break
		case 'h6': variantConfig = textConfig.H6; break
		case 'paragraph': variantConfig = textConfig.Paragraph; break
		case 'small': variantConfig = textConfig.Small; break
		default: break
	}

	if (variantConfig) {
		if (variantConfig.size) {
			css.fontSize = remToPx(variantConfig.size, rootSize)
		}
		if (variantConfig.weight !== undefined) {
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
function renderButtonNode(
	node: Mail.ButtonNode,
	inherited: InheritedStyles,
	context: RenderContext,
	rootSize: number
): string {
	const parsed = parseAttrs(node.attrs, inherited, rootSize)

	// Get button defaults from StyleConfig
	const buttonConfig = context.style.Button
	const defaultCss: Record<string, string> = {
		display: 'inline-block',
		textDecoration: 'none'
	}
	if (buttonConfig) {
		if (buttonConfig.color) defaultCss.color = buttonConfig.color
		if (buttonConfig.background) defaultCss.backgroundColor = buttonConfig.background
		if (buttonConfig.padding) defaultCss.padding = buttonConfig.padding
		if (buttonConfig.borderRadius) defaultCss.borderRadius = buttonConfig.borderRadius
		if (buttonConfig.fontWeight) defaultCss.fontWeight = String(buttonConfig.fontWeight)
	}

	// Merge: defaults < parsed (attrs win)
	const mergedCss = { ...defaultCss, ...parsed.css }
	const inlineStyle = toInlineCSS(mergedCss, inherited)

	// Process href and content with variables
	const href = interpolatePlaceholders(node.href, context)
	// Use content prop if available, otherwise render children
	const childInherited = extractInheritable(parsed, inherited)
	const content = node.content 
		? parseMarkdown(interpolatePlaceholders(node.content, context), context)
		: renderChildren(node.children, childInherited, context, rootSize)

	let html = `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" style="${inlineStyle}">${content}</a>`

	if (parsed.margin) {
		html = wrapWithMargin(html, parsed.margin)
	}

	return html
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
	// - height: auto maintains aspect ratio
	const resetCss: Record<string, string> = {
		display: 'block',
		maxWidth: '100%',
		height: 'auto'
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

	if (parsed.margin) {
		html = wrapWithMargin(html, parsed.margin)
	}

	return html
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
	const parsed = parseAttrs(node.attrs, inherited, rootSize)

	// Get defaults from StyleConfig.Link
	const linkConfig = context.style.Link
	const defaultCss: Record<string, string> = {}
	if (linkConfig) {
		if (linkConfig.color) defaultCss.color = linkConfig.color
		if (linkConfig.textDecoration) defaultCss.textDecoration = linkConfig.textDecoration
	}

	const mergedCss = { ...defaultCss, ...parsed.css }
	const inlineStyle = toInlineCSS(mergedCss, inherited)
	const styleAttr = inlineStyle ? ` style="${inlineStyle}"` : ''

	const href = interpolatePlaceholders(node.href, context)
	// Use content prop if available, otherwise render children
	const childInherited = extractInheritable(parsed, inherited)
	const content = node.content
		? parseMarkdown(interpolatePlaceholders(node.content, context), context)
		: renderChildren(node.children, childInherited, context, rootSize)

	return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer"${styleAttr}>${content}</a>`
}

/**
 * Render an Unsubscribe link node.
 * 
 * IMPLEMENTATION:
 * - Special styling from StyleConfig.Unsubscribe
 * - May add List-Unsubscribe header for email clients
 * - Typically smaller/muted text in footer
 */
function renderUnsubscribeNode(
	node: Mail.UnsubscribeNode,
	inherited: InheritedStyles,
	context: RenderContext,
	rootSize: number
): string {
	const parsed = parseAttrs(node.attrs, inherited, rootSize)

	// Get defaults from StyleConfig.Unsubscribe
	const config = context.style.Unsubscribe
	const defaultCss: Record<string, string> = {}
	if (config) {
		if (config.color) defaultCss.color = config.color
		if (config.size) defaultCss.fontSize = config.size
	}

	const mergedCss = { ...defaultCss, ...parsed.css }
	const inlineStyle = toInlineCSS(mergedCss, inherited)
	const styleAttr = inlineStyle ? ` style="${inlineStyle}"` : ''

	const href = interpolatePlaceholders(node.href, context)
	// Use content prop if available, otherwise render children
	const childInherited = extractInheritable(parsed, inherited)
	const content = node.content
		? escapeHtml(interpolatePlaceholders(node.content, context))
		: renderChildren(node.children, childInherited, context, rootSize)

	// Add List-Unsubscribe header
	if (href) {
		context.headers['List-Unsubscribe'] = `<${href}>`
		// Also add mailto if email provided
		if (node.email) {
			context.headers['List-Unsubscribe'] = `<mailto:${node.email}>, <${href}>`
		}
	}

	return `<a href="${escapeHtml(href)}"${styleAttr}>${content}</a>`
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
	// Node's cellPadding takes precedence over config
	const cellPadding = node.cellPadding ?? tableConfig?.cellPadding ?? '8px'

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
				borderColor: needCellBorders ? borderColor : undefined
			})
		}
		return renderTableRowNode(node.children[index] as Mail.TableRowNode, childInherited, context, rootSize, {
			colWidths: node.colWidths,
			borderColor: needCellBorders ? borderColor : undefined
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

	let html = `<table cellpadding="${cellPadding}" cellspacing="0" border="0"${widthAttr}${heightAttr}${finalStyle}>${rowsHtml}</table>`

	if (parsed.margin) {
		html = wrapWithMargin(html, parsed.margin)
	}

	return html
}

/**
 * Options passed from Table to Row for rendering cells.
 */
interface TableRowRenderOptions {
	rowBackground?: string
	colWidths?: string[]
	borderColor?: string
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
 */
function renderTableRowNode(
	node: Mail.TableRowNode,
	inherited: InheritedStyles,
	context: RenderContext,
	rootSize: number,
	options: TableRowRenderOptions = {}
): string {
	const { rowBackground, colWidths, borderColor } = options
	const parsed = parseAttrs(node.attrs, inherited, rootSize)
	const cellTag = node.header ? 'th' : 'td'

	// Apply row background if provided (for striped tables)
	const bgStyle = rowBackground ? `background-color: ${rowBackground}` : ''
	const rowInherited = rowBackground 
		? { ...inherited, backgroundColor: rowBackground }
		: inherited

	const childInherited = extractInheritable(parsed, rowInherited)

	// Extract padding from row - padding on <tr> doesn't work, apply to cells
	const rowPadding = parsed.css.padding
	const rowPaddingTop = parsed.css.paddingTop
	const rowPaddingBottom = parsed.css.paddingBottom
	const rowPaddingLeft = parsed.css.paddingLeft
	const rowPaddingRight = parsed.css.paddingRight

	// Extract border styles from row - borders on <tr> don't work reliably in email clients
	// Apply to cells instead (top border on all cells, bottom border on all cells)
	const rowBorderColor = parsed.css.borderColor
	const rowBorderTopWidth = parsed.css.borderTopWidth
	const rowBorderBottomWidth = parsed.css.borderBottomWidth
	const rowBorderTopStyle = parsed.css.borderTopStyle ?? (rowBorderTopWidth ? 'solid' : undefined)
	const rowBorderBottomStyle = parsed.css.borderBottomStyle ?? (rowBorderBottomWidth ? 'solid' : undefined)
	const rowBorderLeftWidth = parsed.css.borderLeftWidth
	const rowBorderRightWidth = parsed.css.borderRightWidth
	const rowBorderLeftStyle = parsed.css.borderLeftStyle ?? (rowBorderLeftWidth ? 'solid' : undefined)
	const rowBorderRightStyle = parsed.css.borderRightStyle ?? (rowBorderRightWidth ? 'solid' : undefined)
	// Full border shorthand
	const rowBorderWidth = parsed.css.borderWidth
	const rowBorderStyle = parsed.css.borderStyle ?? (rowBorderWidth ? 'solid' : undefined)

	// Track column index for width assignment
	let colIndex = 0
	const totalChildren = node.children.length

	// Each child becomes a cell
	const cellsHtml = node.children.map((child, childIndex) => {
		const cellHtml = renderNodeToHtml(child, childInherited, context, rootSize)
		
		// Build cell attributes
		const cellStyles: string[] = []
		const cellAttrs: string[] = []

		// Apply row padding to cells (since <tr> doesn't support padding)
		if (rowPadding) cellStyles.push(`padding: ${rowPadding}`)
		if (rowPaddingTop) cellStyles.push(`padding-top: ${rowPaddingTop}`)
		if (rowPaddingBottom) cellStyles.push(`padding-bottom: ${rowPaddingBottom}`)
		if (rowPaddingLeft) cellStyles.push(`padding-left: ${rowPaddingLeft}`)
		if (rowPaddingRight) cellStyles.push(`padding-right: ${rowPaddingRight}`)

		// Background from row
		if (bgStyle) cellStyles.push(bgStyle)

		// Apply row border styles to cells (since <tr> doesn't support borders)
		// Full border (border-*) applies to all sides
		if (rowBorderWidth && rowBorderColor) {
			cellStyles.push(`border: ${rowBorderWidth} ${rowBorderStyle} ${rowBorderColor}`)
		} else {
			// Directional borders (border-y, border-x, etc.)
			// Top and bottom borders apply to all cells
			if (rowBorderTopWidth && rowBorderColor) {
				cellStyles.push(`border-top: ${rowBorderTopWidth} ${rowBorderTopStyle} ${rowBorderColor}`)
			}
			if (rowBorderBottomWidth && rowBorderColor) {
				cellStyles.push(`border-bottom: ${rowBorderBottomWidth} ${rowBorderBottomStyle} ${rowBorderColor}`)
			}
			// Left border only on first cell, right border only on last cell
			if (rowBorderLeftWidth && rowBorderColor && childIndex === 0) {
				cellStyles.push(`border-left: ${rowBorderLeftWidth} ${rowBorderLeftStyle} ${rowBorderColor}`)
			}
			if (rowBorderRightWidth && rowBorderColor && childIndex === totalChildren - 1) {
				cellStyles.push(`border-right: ${rowBorderRightWidth} ${rowBorderRightStyle} ${rowBorderColor}`)
			}
		}

		// Border from parent Table's borderColor option (for cell borders)
		if (borderColor) {
			cellStyles.push(`border: 1px solid ${borderColor}`)
		}

		// Extract colspan and rowspan from child's attrs
		const colspan = extractColspanFromAttrs(child.attrs)
		const rowspan = extractRowspanFromAttrs(child.attrs)
		
		if (colspan) cellAttrs.push(`colspan="${colspan}"`)
		if (rowspan) cellAttrs.push(`rowspan="${rowspan}"`)

		// Extract alignment from child - must be on <td> to work, not on inline content
		// vertical-align: controls vertical positioning within cell
		// text-align: controls horizontal alignment of content
		const childValign = extractValignFromAttrs(child.attrs)
		const childTextAlign = extractTextAlignFromAttrs(child.attrs)
		if (childValign) {
			cellStyles.push(`vertical-align: ${childValign}`)
		}
		if (childTextAlign) {
			cellStyles.push(`text-align: ${childTextAlign}`)
		}

		// Width: explicit child width takes precedence, otherwise use colWidths[index]
		// Apply as HTML attribute for Outlook compatibility, and as CSS for modern clients
		const childWidth = extractWidthFromAttrs(child.attrs, rootSize)
		let cellWidth: string | undefined
		if (childWidth) {
			cellWidth = childWidth
		} else if (colWidths && colWidths[colIndex]) {
			cellWidth = colWidths[colIndex]
		}
		
		if (cellWidth) {
			cellAttrs.push(`width="${cellWidth}"`)
			cellStyles.push(`width: ${cellWidth}`)
		}

		// Advance column index by colspan
		colIndex += colspan ?? 1

		const styleAttr = cellStyles.length > 0 ? ` style="${cellStyles.join('; ')}"` : ''
		const attrsStr = cellAttrs.length > 0 ? ' ' + cellAttrs.join(' ') : ''
		
		return `<${cellTag}${attrsStr}${styleAttr}>${cellHtml}</${cellTag}>`
	}).join('')

	// For <tr>, exclude padding and borders (already applied to cells)
	// <tr> doesn't support padding or borders reliably in email clients
	const rowCss = { ...parsed.css }
	delete rowCss.padding
	delete rowCss.paddingTop
	delete rowCss.paddingBottom
	delete rowCss.paddingLeft
	delete rowCss.paddingRight
	// Remove border properties - they're applied to cells instead
	delete rowCss.borderWidth
	delete rowCss.borderStyle
	delete rowCss.borderColor
	delete rowCss.borderTopWidth
	delete rowCss.borderTopStyle
	delete rowCss.borderBottomWidth
	delete rowCss.borderBottomStyle
	delete rowCss.borderLeftWidth
	delete rowCss.borderLeftStyle
	delete rowCss.borderRightWidth
	delete rowCss.borderRightStyle
	
	const inlineStyle = toInlineCSS(rowCss, inherited)
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
	
	// Strip HTML-specific markdown syntax while preserving standard markdown
	content = stripHtmlSpecificMarkdown(content)
	
	// Convert literal \n to actual newlines (for plain text)
	content = content.replace(/\\n/g, '\n')
	
	// Add heading markers based on variant
	switch (node.variant) {
		case 'h1': return `# ${content}`
		case 'h2': return `## ${content}`
		case 'h3': return `### ${content}`
		case 'h4': return `#### ${content}`
		case 'h5': return `##### ${content}`
		case 'h6': return `###### ${content}`
		default: return content
	}
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

function renderButtonNodeToText(node: Mail.ButtonNode, context: RenderContext): string {
	const href = interpolatePlaceholders(node.href, context)
	let content = node.content 
		? interpolatePlaceholders(node.content, context)
		: node.children.map((c) => renderNodeToText(c, context)).join('')
	content = content.trim() || 'Link'
	return `[${content}](${href})`
}

function renderImgNodeToText(node: Mail.ImgNode, context: RenderContext): string {
	const src = interpolatePlaceholders(node.src, context)
	const alt = node.alt ? interpolatePlaceholders(node.alt, context) : 'Image'
	return `![${alt}](${src})`
}

function renderLinkNodeToText(node: Mail.LinkNode, context: RenderContext): string {
	const href = interpolatePlaceholders(node.href, context)
	let content = node.content 
		? interpolatePlaceholders(node.content, context)
		: node.children.map((c) => renderNodeToText(c, context)).join('')
	content = content.trim() || 'Link'
	return `[${content}](${href})`
}

function renderUnsubscribeNodeToText(node: Mail.UnsubscribeNode, context: RenderContext): string {
	const href = interpolatePlaceholders(node.href, context)
	const content = node.content 
		? interpolatePlaceholders(node.content, context)
		: node.children.map((c) => renderNodeToText(c, context)).join('')
	return `${content}: ${href}`
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
