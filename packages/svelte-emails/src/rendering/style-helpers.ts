/**
 * Style configuration helpers.
 * 
 * Utilities for building inline CSS from StyleConfig objects and other
 * style-related operations that were previously duplicated across files.
 */

import type { StyleConfig } from './types'
import type { CellAttrs } from './parse-attrs'

// ============================================================================
// Quote Escaping
// ============================================================================

/**
 * Escape double quotes in CSS values for safe inclusion in HTML style attributes.
 * Converts double quotes to single quotes in CSS values like font-family.
 * 
 * CSS allows both single and double quotes, so 'font-family: "Segoe UI"' becomes
 * 'font-family: 'Segoe UI'' which is valid CSS and doesn't conflict with 
 * double-quoted HTML attributes.
 * 
 * @param value - CSS property value
 * @returns Value with double quotes converted to single quotes
 */
function escapeQuotesForStyleAttr(value: unknown): string {
	return String(value).replace(/"/g, "'")
}

// ============================================================================
// Config to Style Mapping
// ============================================================================

/**
 * Mapping from config property names to CSS property names.
 * Used by buildStyleFromConfig to convert config objects to inline styles.
 */
type ConfigMapping = Record<string, string>

/**
 * Build an inline style string from a StyleConfig section.
 * 
 * Converts config object properties to CSS properties based on the provided mapping.
 * Only includes properties that exist and have truthy values.
 * 
 * @param config - The StyleConfig section (e.g., context.style.Link)
 * @param mapping - Map of config property names to CSS property names
 * @returns Inline style string (e.g., "color: #333; text-decoration: underline")
 * 
 * @example
 * ```ts
 * // Simple mapping
 * buildStyleFromConfig(context.style.Link, {
 *   color: 'color',
 *   textDecoration: 'text-decoration'
 * })
 * // → "color: #0066cc; text-decoration: underline"
 * 
 * // With fontWeight (number → string conversion handled)
 * buildStyleFromConfig(context.style.Button, {
 *   color: 'color',
 *   background: 'background-color',
 *   padding: 'padding',
 *   borderRadius: 'border-radius',
 *   fontWeight: 'font-weight'
 * })
 * ```
 */
export function buildStyleFromConfig<T extends object>(
	config: T | undefined,
	mapping: ConfigMapping
): string {
	if (!config) return ''

	const styles: string[] = []

	for (const [configKey, cssProperty] of Object.entries(mapping)) {
		const value = (config as Record<string, unknown>)[configKey]
		if (value !== undefined && value !== null && value !== '') {
			styles.push(`${cssProperty}: ${escapeQuotesForStyleAttr(value)}`)
		}
	}

	return styles.join('; ')
}

/**
 * Build a CSS object from a StyleConfig section.
 * 
 * Similar to buildStyleFromConfig but returns an object instead of a string.
 * Useful when you need to merge with other CSS properties.
 * 
 * @param config - The StyleConfig section
 * @param mapping - Map of config property names to CSS property names (camelCase)
 * @returns CSS properties object
 * 
 * @example
 * ```ts
 * const defaultCss = buildCssFromConfig(context.style.Button, {
 *   color: 'color',
 *   background: 'backgroundColor',
 *   padding: 'padding'
 * })
 * const mergedCss = { ...defaultCss, ...parsed.css }
 * ```
 */
export function buildCssFromConfig<T extends object>(
	config: T | undefined,
	mapping: ConfigMapping
): Record<string, string> {
	if (!config) return {}

	const css: Record<string, string> = {}

	for (const [configKey, cssProperty] of Object.entries(mapping)) {
		const value = (config as Record<string, unknown>)[configKey]
		if (value !== undefined && value !== null && value !== '') {
			css[cssProperty] = String(value)
		}
	}

	return css
}

// ============================================================================
// Common Config Mappings
// ============================================================================

/**
 * Pre-defined config mappings for common StyleConfig sections.
 * These can be used directly with buildStyleFromConfig/buildCssFromConfig.
 */
export const CONFIG_MAPPINGS = {
	/** Link config → inline style */
	Link: {
		color: 'color',
		textDecoration: 'text-decoration'
	},

	/** Code (inline) config → inline style */
	Code: {
		color: 'color',
		background: 'background-color',
		padding: 'padding',
		borderRadius: 'border-radius',
		fontFamily: 'font-family',
		size: 'font-size'
	},

	/** Codeblock config → inline style */
	Codeblock: {
		color: 'color',
		background: 'background-color',
		padding: 'padding',
		borderRadius: 'border-radius',
		fontFamily: 'font-family',
		size: 'font-size',
		lineHeight: 'line-height'
	},

	/** Button config → CSS object (camelCase) */
	ButtonCss: {
		color: 'color',
		background: 'backgroundColor',
		padding: 'padding',
		borderRadius: 'borderRadius',
		fontWeight: 'fontWeight'
	},

	/** Unsubscribe config → CSS object (camelCase) */
	UnsubscribeCss: {
		color: 'color',
		size: 'fontSize'
	},

	/** Link config → CSS object (camelCase) */
	LinkCss: {
		color: 'color',
		textDecoration: 'textDecoration'
	},

	/** Divider config mapping (special handling needed) */
	Divider: {
		color: 'borderColor',
		thickness: 'borderWidth',
		style: 'borderStyle'
	}
} as const

// ============================================================================
// Highlight Style Helper
// ============================================================================

/**
 * Build highlight span style from config and inline hex color.
 * Used in markdown parsing for [#hex]text[/] syntax.
 * 
 * @param config - StyleConfig.Highlight section
 * @param bgHex - Background hex color from inline syntax
 * @returns Inline style string
 */
export function buildHighlightStyle(
	config: StyleConfig['Highlight'] | undefined,
	bgHex: string
): string {
	const styles: string[] = []
	if (config?.color) {
		styles.push(`color: ${config.color}`)
	}
	styles.push(`background-color: #${bgHex}`)
	return styles.join('; ')
}

// ============================================================================
// Cell Rendering Helpers
// ============================================================================

/**
 * Build HTML attributes string for a table cell (<td> or <th>).
 * Combines colspan, rowspan, width, and other attributes.
 * 
 * @param cellAttrs - Extracted cell attributes from extractCellAttrs()
 * @param fallbackWidth - Optional width from column template if cell has no explicit width
 * @returns Array of attribute strings (e.g., ['colspan="2"', 'width="50%"'])
 */
function buildCellHtmlAttrs(
	cellAttrs: CellAttrs,
	fallbackWidth?: string
): string[] {
	const attrs: string[] = []

	if (cellAttrs.colspan) attrs.push(`colspan="${cellAttrs.colspan}"`)
	if (cellAttrs.rowspan) attrs.push(`rowspan="${cellAttrs.rowspan}"`)

	const width = cellAttrs.width ?? fallbackWidth
	if (width) attrs.push(`width="${width}"`)

	return attrs
}

/**
 * Build CSS styles array for a table cell.
 * Handles alignment, width (for CSS), and optionally valign.
 * 
 * @param cellAttrs - Extracted cell attributes
 * @param options - Additional options for building styles
 * @returns Array of style strings (e.g., ['vertical-align: top', 'text-align: center'])
 */
function buildCellStyles(
	cellAttrs: CellAttrs,
	options: {
		fallbackWidth?: string
		includeWidth?: boolean
		defaultValign?: 'top' | 'middle' | 'bottom'
		defaultTextAlign?: 'left' | 'center' | 'right'
	} = {}
): string[] {
	const { fallbackWidth, includeWidth = true, defaultValign, defaultTextAlign } = options
	const styles: string[] = []

	// Alignment
	const valign = cellAttrs.valign ?? defaultValign
	if (valign) styles.push(`vertical-align: ${valign}`)
	
	// Text align (explicit or default - important for <th> which defaults to center)
	const textAlign = cellAttrs.textAlign ?? defaultTextAlign
	if (textAlign) styles.push(`text-align: ${textAlign}`)

	// Width (as CSS for modern clients)
	if (includeWidth) {
		const width = cellAttrs.width ?? fallbackWidth
		if (width) styles.push(`width: ${width}`)
	}

	return styles
}

/**
 * Build a complete table cell (<td> or <th>) HTML string.
 * 
 * @param tag - 'td' or 'th'
 * @param content - Inner HTML content
 * @param cellAttrs - Extracted cell attributes
 * @param options - Additional options
 * @returns Complete cell HTML string
 * 
 * @example
 * ```ts
 * buildCell('td', '<p>Content</p>', { colspan: 2, valign: 'top' })
 * // → '<td colspan="2" style="vertical-align: top"><p>Content</p></td>'
 * ```
 */
export function buildCell(
	tag: 'td' | 'th',
	content: string,
	cellAttrs: CellAttrs,
	options: {
		fallbackWidth?: string
		defaultValign?: 'top' | 'middle' | 'bottom'
		defaultTextAlign?: 'left' | 'center' | 'right'
		extraStyles?: string[]
		extraAttrs?: string[]
	} = {}
): string {
	const { fallbackWidth, defaultValign, defaultTextAlign, extraStyles = [], extraAttrs = [] } = options

	const htmlAttrs = [...buildCellHtmlAttrs(cellAttrs, fallbackWidth), ...extraAttrs]
	const styles = [...buildCellStyles(cellAttrs, { fallbackWidth, defaultValign, defaultTextAlign }), ...extraStyles]

	const attrsStr = htmlAttrs.length > 0 ? ' ' + htmlAttrs.join(' ') : ''
	const styleAttr = styles.length > 0 ? ` style="${styles.join('; ')}"` : ''

	return `<${tag}${attrsStr}${styleAttr}>${content}</${tag}>`
}

// ============================================================================
// Row Style Transfer Helper
// ============================================================================

/**
 * CSS properties from a row that need to be transferred to cells.
 * In email clients, <tr> doesn't support padding or borders reliably.
 */
interface RowStylesForCells {
	padding?: string
	paddingTop?: string
	paddingRight?: string
	paddingBottom?: string
	paddingLeft?: string
	borderWidth?: string
	borderStyle?: string
	borderColor?: string
	borderTopWidth?: string
	borderTopStyle?: string
	borderBottomWidth?: string
	borderBottomStyle?: string
	borderLeftWidth?: string
	borderLeftStyle?: string
	borderRightWidth?: string
	borderRightStyle?: string
}

/**
 * Build cell styles from row styles that need to be transferred.
 * In email, <tr> doesn't support padding or borders, so we apply them to cells.
 * 
 * @param rowStyles - Extracted row styles (padding, border properties)
 * @param cellPosition - Position info for edge borders (left on first, right on last)
 * @param options - Additional style options
 * @returns Array of style strings to add to cell
 */
export function buildCellStylesFromRow(
	rowStyles: RowStylesForCells,
	cellPosition: { isFirst: boolean; isLast: boolean },
	options: {
		rowBackground?: string
		tableBorderColor?: string
	} = {}
): string[] {
	const { rowBackground, tableBorderColor } = options
	const styles: string[] = []

	// Padding from row
	if (rowStyles.padding) styles.push(`padding: ${rowStyles.padding}`)
	if (rowStyles.paddingTop) styles.push(`padding-top: ${rowStyles.paddingTop}`)
	if (rowStyles.paddingRight) styles.push(`padding-right: ${rowStyles.paddingRight}`)
	if (rowStyles.paddingBottom) styles.push(`padding-bottom: ${rowStyles.paddingBottom}`)
	if (rowStyles.paddingLeft) styles.push(`padding-left: ${rowStyles.paddingLeft}`)

	// Background from row
	if (rowBackground) styles.push(`background-color: ${rowBackground}`)

	// Border from row - full border applies to all sides
	if (rowStyles.borderWidth && rowStyles.borderColor) {
		const style = rowStyles.borderStyle ?? 'solid'
		styles.push(`border: ${rowStyles.borderWidth} ${style} ${rowStyles.borderColor}`)
	} else {
		// Directional borders
		if (rowStyles.borderTopWidth && rowStyles.borderColor) {
			const style = rowStyles.borderTopStyle ?? 'solid'
			styles.push(`border-top: ${rowStyles.borderTopWidth} ${style} ${rowStyles.borderColor}`)
		}
		if (rowStyles.borderBottomWidth && rowStyles.borderColor) {
			const style = rowStyles.borderBottomStyle ?? 'solid'
			styles.push(`border-bottom: ${rowStyles.borderBottomWidth} ${style} ${rowStyles.borderColor}`)
		}
		// Edge borders only on first/last cells
		if (rowStyles.borderLeftWidth && rowStyles.borderColor && cellPosition.isFirst) {
			const style = rowStyles.borderLeftStyle ?? 'solid'
			styles.push(`border-left: ${rowStyles.borderLeftWidth} ${style} ${rowStyles.borderColor}`)
		}
		if (rowStyles.borderRightWidth && rowStyles.borderColor && cellPosition.isLast) {
			const style = rowStyles.borderRightStyle ?? 'solid'
			styles.push(`border-right: ${rowStyles.borderRightWidth} ${style} ${rowStyles.borderColor}`)
		}
	}

	// Border from parent table
	if (tableBorderColor) {
		styles.push(`border: 1px solid ${tableBorderColor}`)
	}

	return styles
}

/**
 * Extract row styles that need to be transferred to cells.
 * Returns both the row styles object and a cleaned CSS object for the <tr>.
 * 
 * @param css - Parsed CSS from row attributes
 * @returns Object with rowStyles for cells and cleanedCss for <tr>
 */
export function extractRowStylesForCells(
	css: Record<string, string>
): { rowStyles: RowStylesForCells; cleanedCss: Record<string, string> } {
	const rowStyles: RowStylesForCells = {}
	const cleanedCss = { ...css }

	// Extract and remove padding
	if (css.padding) { rowStyles.padding = css.padding; delete cleanedCss.padding }
	if (css.paddingTop) { rowStyles.paddingTop = css.paddingTop; delete cleanedCss.paddingTop }
	if (css.paddingRight) { rowStyles.paddingRight = css.paddingRight; delete cleanedCss.paddingRight }
	if (css.paddingBottom) { rowStyles.paddingBottom = css.paddingBottom; delete cleanedCss.paddingBottom }
	if (css.paddingLeft) { rowStyles.paddingLeft = css.paddingLeft; delete cleanedCss.paddingLeft }

	// Extract and remove borders
	if (css.borderWidth) { rowStyles.borderWidth = css.borderWidth; delete cleanedCss.borderWidth }
	if (css.borderStyle) { rowStyles.borderStyle = css.borderStyle; delete cleanedCss.borderStyle }
	if (css.borderColor) { rowStyles.borderColor = css.borderColor; delete cleanedCss.borderColor }
	if (css.borderTopWidth) { rowStyles.borderTopWidth = css.borderTopWidth; delete cleanedCss.borderTopWidth }
	if (css.borderTopStyle) { rowStyles.borderTopStyle = css.borderTopStyle; delete cleanedCss.borderTopStyle }
	if (css.borderBottomWidth) { rowStyles.borderBottomWidth = css.borderBottomWidth; delete cleanedCss.borderBottomWidth }
	if (css.borderBottomStyle) { rowStyles.borderBottomStyle = css.borderBottomStyle; delete cleanedCss.borderBottomStyle }
	if (css.borderLeftWidth) { rowStyles.borderLeftWidth = css.borderLeftWidth; delete cleanedCss.borderLeftWidth }
	if (css.borderLeftStyle) { rowStyles.borderLeftStyle = css.borderLeftStyle; delete cleanedCss.borderLeftStyle }
	if (css.borderRightWidth) { rowStyles.borderRightWidth = css.borderRightWidth; delete cleanedCss.borderRightWidth }
	if (css.borderRightStyle) { rowStyles.borderRightStyle = css.borderRightStyle; delete cleanedCss.borderRightStyle }

	return { rowStyles, cleanedCss }
}