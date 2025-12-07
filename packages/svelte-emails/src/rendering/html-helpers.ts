/**
 * HTML generation helpers for email rendering.
 * 
 * Provides utilities for generating table-based layouts,
 * inline styles, and email-safe HTML structures.
 * 
 * @see ARCHITECTURE.md for HTML output strategy details
 */

import type { InheritedStyles, ParsedAttrs } from './types'

// ============================================================================
// Style String Generation
// ============================================================================

/**
 * CSS properties that should be inherited from parent to child elements.
 * These are applied by toInlineCSS when not explicitly set.
 */
const INHERITABLE_PROPERTIES = [
	'color',
	'fontFamily',
	'fontSize',
	'fontWeight',
	'fontStyle',
	'textDecoration',
	'textTransform',
	'textAlign',
	'lineHeight',
	'letterSpacing',
	'whiteSpace',
	'wordBreak',
	'verticalAlign',
	'visibility'
] as const

/**
 * Convert a camelCase CSS property name to kebab-case.
 * 
 * @example
 * ```ts
 * toKebabCase('backgroundColor') // → 'background-color'
 * toKebabCase('borderTopWidth')  // → 'border-top-width'
 * ```
 */
function toKebabCase(str: string): string {
	return str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
}

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
function escapeQuotesForStyleAttr(value: string): string {
	return value.replace(/"/g, "'")
}

/**
 * Convert parsed attributes to inline CSS string.
 * Applies inherited values where needed for typography properties.
 * Escapes double quotes to single quotes for HTML attribute safety.
 * 
 * @param css - CSS property-value record
 * @param inherited - Optional inherited styles to apply as defaults
 * @returns Inline style string (e.g., "padding: 16px; color: #333")
 * 
 * @example
 * ```ts
 * toInlineCSS({ padding: '16px', color: '#333' })
 * // → 'padding: 16px; color: #333'
 * 
 * toInlineCSS({ padding: '16px' }, { color: '#333', fontSize: '14px' })
 * // → 'padding: 16px; color: #333; font-size: 14px'
 * 
 * toInlineCSS({ fontFamily: '"Segoe UI", Arial' })
 * // → "font-family: 'Segoe UI', Arial" (quotes escaped for HTML safety)
 * ```
 */
export function toInlineCSS(
	css: Record<string, string>,
	inherited?: InheritedStyles
): string {
	const finalCss = { ...css }

	// Apply inherited typography properties if not explicitly set
	if (inherited) {
		for (const prop of INHERITABLE_PROPERTIES) {
			if (!finalCss[prop] && inherited[prop]) {
				finalCss[prop] = inherited[prop]
			}
		}
	}

	return Object.entries(finalCss)
		.filter(([_, value]) => value !== undefined && value !== '')
		.map(([property, value]) => `${toKebabCase(property)}: ${escapeQuotesForStyleAttr(value)}`)
		.join('; ')
}

// ============================================================================
// HTML Attribute Helpers
// ============================================================================

/**
 * Generate HTML attributes string from key-value pairs.
 * Handles boolean attributes and escapes quotes.
 * 
 * @param attributes - Record of attribute name to value
 * @returns Attribute string (e.g., 'width="100" height="50"')
 * 
 * @example
 * ```ts
 * htmlAttrs({ width: 100, height: 50, disabled: true })
 * // → 'width="100" height="50" disabled'
 * 
 * htmlAttrs({ class: 'foo', 'data-id': undefined })
 * // → 'class="foo"' (undefined values are filtered out)
 * ```
 */
export function htmlAttrs(
	attributes: Record<string, string | number | boolean | undefined>
): string {
	return Object.entries(attributes)
		.filter(([_, value]) => value !== undefined && value !== false)
		.map(([key, value]) => {
			if (value === true) return key
			return `${key}="${String(value).replace(/"/g, '&quot;')}"`
		})
		.join(' ')
}

// ============================================================================
// Presentation Tables
// ============================================================================

/**
 * Create a presentation table (role="presentation", zero padding/border).
 * These tables are used for layout, not data, and are announced as such by screen readers.
 * 
 * @param content - Inner HTML content
 * @param tableAttrs - Additional table attributes
 * @param tdAttrs - Additional td attributes
 * @returns Complete table HTML string
 * 
 * @example
 * ```ts
 * presentationTable('<p>Hello</p>')
 * // → '<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td><p>Hello</p></td></tr></table>'
 * 
 * presentationTable('<p>Hello</p>', { width: '100%' }, { style: 'padding: 16px' })
 * // → '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td style="padding: 16px"><p>Hello</p></td></tr></table>'
 * ```
 */
export function presentationTable(
	content: string,
	tableAttrs: Record<string, string> = {},
	tdAttrs: Record<string, string> = {}
): string {
	const baseTableAttrs = {
		role: 'presentation',
		cellpadding: '0',
		cellspacing: '0',
		border: '0',
		...tableAttrs
	}

	const tableAttrStr = htmlAttrs(baseTableAttrs)
	const tdAttrStr = Object.keys(tdAttrs).length > 0 ? ` ${htmlAttrs(tdAttrs)}` : ''
	
	// When table has height, propagate to <tr> for proper height chain
	const trStyle = tableAttrs.height ? ` style="height: ${tableAttrs.height}"` : ''

	return `<table ${tableAttrStr}><tr${trStyle}><td${tdAttrStr}>${content}</td></tr></table>`
}

// ============================================================================
// Gap Spacer Tables
// ============================================================================

/**
 * Create a gap spacer table for vertical spacing.
 * Used when implementing gap between children as content (not table rows).
 * 
 * @param gap - Gap size (e.g., "16px", "1rem")
 * @returns HTML table with fixed height for spacing
 * 
 * @example
 * ```ts
 * gapSpacerTable('16px')
 * // → '<table role="presentation" width="100%" ...><tr><td style="height: 16px; ...">...</td></tr></table>'
 * ```
 */
export function gapSpacerTable(gap: string): string {
	return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="height: ${gap}; line-height: ${gap}; font-size: 0;">&nbsp;</td></tr></table>`
}

// ============================================================================
// Margin Emulation
// ============================================================================

/**
 * Wrap element HTML with a margin-emulating table structure.
 * Margins are unreliable in email, so we use wrapper padding instead.
 * 
 * For horizontal centering (mx-auto), applies align="center" and margin: 0 auto.
 * 
 * @param innerHtml - The element's HTML content
 * @param margin - Margin values to emulate
 * @returns Wrapped HTML with margin structure
 * 
 * @example
 * ```ts
 * wrapWithMargin('<p>Content</p>', { top: '16px', bottom: '16px' })
 * // → '<table ...><tr><td style="padding-top: 16px; padding-bottom: 16px"><p>Content</p></td></tr></table>'
 * 
 * wrapWithMargin('<div>Centered</div>', { left: 'auto', right: 'auto' })
 * // → '<table ... align="center" style="margin: 0 auto"><tr><td><div>Centered</div></td></tr></table>'
 * ```
 */
export function wrapWithMargin(
	innerHtml: string,
	margin: NonNullable<ParsedAttrs['margin']>
): string {
	// Build padding style for the outer wrapper cell
	const paddingStyles: string[] = []

	if (margin.top && margin.top !== 'auto') {
		paddingStyles.push(`padding-top: ${margin.top}`)
	}
	if (margin.right && margin.right !== 'auto') {
		paddingStyles.push(`padding-right: ${margin.right}`)
	}
	if (margin.bottom && margin.bottom !== 'auto') {
		paddingStyles.push(`padding-bottom: ${margin.bottom}`)
	}
	if (margin.left && margin.left !== 'auto') {
		paddingStyles.push(`padding-left: ${margin.left}`)
	}

	// Handle horizontal centering (mx-auto)
	const isCentered = margin.left === 'auto' && margin.right === 'auto'
	const tableAlign = isCentered ? ' align="center"' : ''
	const tableStyle = isCentered ? ' style="margin: 0 auto"' : ''
	// Wrapper table should be 100% width unless centered (centered needs fixed width)
	const tableWidth = isCentered ? '' : ' width="100%"'

	const wrapperStyle = paddingStyles.length > 0 
		? ` style="${paddingStyles.join('; ')}"` 
		: ''

	return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"${tableWidth}${tableAlign}${tableStyle}><tr><td${wrapperStyle}>${innerHtml}</td></tr></table>`
}

// ============================================================================
// Style Inheritance Helpers
// ============================================================================

/**
 * Compute inherited styles for child nodes from parsed attributes.
 * Explicit attributes override inherited values.
 * 
 * @param parsed - Parsed attributes from current node
 * @param inherited - Current inherited styles from parent
 * @returns InheritedStyles to pass to children
 */
export function extractInheritable(
	parsed: ParsedAttrs,
	inherited: InheritedStyles
): InheritedStyles {
	// Compute new color value (explicit or inherited)
	const newColor = parsed.css.color || inherited.color

	return {
		// Background (for opacity blending)
		backgroundColor: parsed.backgroundColor || inherited.backgroundColor,

		// Color
		color: newColor,

		// Border color (inherits from text color if not explicitly set)
		borderColor: parsed.css.borderColor || inherited.borderColor || newColor,

		// Font properties
		fontFamily: parsed.css.fontFamily || inherited.fontFamily,
		baseFontFamily: inherited.baseFontFamily, // Always pass through (not settable via attrs)
		monoFontFamily: inherited.monoFontFamily, // Always pass through (not settable via attrs)
		fontSize: parsed.css.fontSize || inherited.fontSize,
		fontWeight: parsed.css.fontWeight || inherited.fontWeight,
		fontStyle: parsed.css.fontStyle || inherited.fontStyle,
		fontVariant: parsed.css.fontVariant || inherited.fontVariant,

		// Text properties
		textDecoration: parsed.css.textDecoration || inherited.textDecoration,
		textTransform: parsed.css.textTransform || inherited.textTransform,
		textAlign: parsed.css.textAlign || inherited.textAlign,
		textIndent: parsed.css.textIndent || inherited.textIndent,

		// Spacing
		lineHeight: parsed.css.lineHeight || inherited.lineHeight,
		letterSpacing: parsed.css.letterSpacing || inherited.letterSpacing,
		wordSpacing: parsed.css.wordSpacing || inherited.wordSpacing,

		// Whitespace
		whiteSpace: parsed.css.whiteSpace || inherited.whiteSpace,
		wordBreak: parsed.css.wordBreak || inherited.wordBreak,
		overflowWrap: parsed.css.overflowWrap || inherited.overflowWrap,

		// Vertical alignment
		verticalAlign: parsed.css.verticalAlign || inherited.verticalAlign,

		// Visibility
		visibility: parsed.css.visibility || inherited.visibility,

		// List properties
		listStyleType: parsed.css.listStyleType || inherited.listStyleType,
		listStylePosition: parsed.css.listStylePosition || inherited.listStylePosition,

		// Other
		cursor: parsed.css.cursor || inherited.cursor,
		direction: parsed.css.direction || inherited.direction,

		// Opacity compounds
		opacity: (parsed.opacity ?? 1) * inherited.opacity
	}
}

// ============================================================================
// Responsive Wrappers
// ============================================================================

/**
 * Wrap element HTML with responsive visibility class.
 * 
 * For mobile-only: Element is hidden by default, shown on mobile via media query.
 * For desktop-only: Element is shown by default, hidden on mobile via media query.
 * 
 * The media queries are defined in the <head> section of the email.
 * 
 * @param html - The element's HTML content
 * @param responsive - The responsive mode ('mobile-only' or 'desktop-only')
 * @returns Wrapped HTML with responsive class
 * 
 * @example
 * ```ts
 * wrapWithResponsive('<p>Mobile content</p>', 'mobile-only')
 * // → '<div class="mobile-only" style="display: none;">...</div>'
 * 
 * wrapWithResponsive('<p>Desktop content</p>', 'desktop-only')
 * // → '<div class="desktop-only">...</div>'
 * ```
 */
function wrapWithResponsive(
	html: string,
	responsive: 'mobile-only' | 'desktop-only'
): string {
	if (responsive === 'mobile-only') {
		// Hidden by default, revealed by media query
		return `<div class="mobile-only" style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">${html}</div>`
	} else {
		// Shown by default, hidden by media query
		return `<div class="desktop-only">${html}</div>`
	}
}

/**
 * Apply standard post-processing wrappings to rendered HTML.
 * Combines margin emulation and responsive wrapping in a consistent order.
 * 
 * Order of wrapping (inside → outside):
 * 1. Base HTML
 * 2. Margin wrapper (if margin exists)
 * 3. Responsive wrapper (if responsive mode specified)
 * 
 * @param html - The base rendered HTML
 * @param parsed - Parsed attributes containing margin and responsive info
 * @returns Wrapped HTML with all applicable layers
 * 
 * @example
 * ```ts
 * applyWrappers('<p>Content</p>', { margin: { top: '16px' }, responsive: 'mobile-only' })
 * // → wrapped with margin table, then responsive div
 * 
 * applyWrappers('<p>Content</p>', { margin: undefined, responsive: undefined })
 * // → '<p>Content</p>' (no wrapping)
 * ```
 */
export function applyWrappers(
	html: string,
	parsed: Pick<ParsedAttrs, 'margin' | 'responsive'>
): string {
	let result = html
	if (parsed.margin) {
		result = wrapWithMargin(result, parsed.margin)
	}
	if (parsed.responsive) {
		result = wrapWithResponsive(result, parsed.responsive)
	}
	return result
}
