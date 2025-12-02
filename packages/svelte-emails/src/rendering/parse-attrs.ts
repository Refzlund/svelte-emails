/**
 * Tailwind-like attribute parsing system.
 * 
 * Converts utility class strings (e.g., 'p-4', 'bg-[#fff]', 'text-sm')
 * into CSS property-value pairs for inline styling.
 * 
 * All rem values are converted to px at parse time for email compatibility.
 * The root size (default: 16px) controls this conversion.
 * 
 * @see ARCHITECTURE.md for the complete attribute parsing specification
 */

import type { InheritedStyles, ParsedAttrs } from './types'
import {
	SPACING_SCALE,
	FONT_SIZES,
	FONT_WEIGHTS,
	LINE_HEIGHTS,
	LETTER_SPACINGS,
	BORDER_RADII,
	BORDER_WIDTHS,
	MAX_WIDTHS,
	DEFAULT_ROOT_SIZE
} from './CONSTANTS'
import { blendColor, parseColorWithOpacity } from './colors'

// ============================================================================
// Unit Conversion
// ============================================================================

/**
 * Convert a CSS value with rem units to px.
 * Handles values like '1rem', '1.5rem', '0.25rem'.
 * Non-rem values are passed through unchanged.
 * 
 * @param value - CSS value that may contain rem units
 * @param rootSize - Base font size for rem calculation (default: 16)
 * @returns Value with rem converted to px
 * 
 * @example
 * ```ts
 * remToPx('1rem', 16)     // → '16px'
 * remToPx('1.5rem', 16)   // → '24px'
 * remToPx('100%', 16)     // → '100%' (unchanged)
 * remToPx('1', 16)        // → '1' (unitless, unchanged)
 * ```
 */
export function remToPx(value: string, rootSize: number = DEFAULT_ROOT_SIZE): string {
	// Match rem values (e.g., '1rem', '0.5rem', '1.25rem')
	const match = value.match(/^([\d.]+)rem$/)
	if (match) {
		const remValue = parseFloat(match[1])
		const pxValue = remValue * rootSize
		// Round to avoid floating point issues, but keep precision for small values
		const rounded = Math.round(pxValue * 100) / 100
		return `${rounded}px`
	}
	return value
}

// ============================================================================
// Main Parser
// ============================================================================

/**
 * Parse utility attributes into CSS properties.
 * Converts Tailwind-like attrs (p-4, bg-[#fff], text-sm, etc.) into CSS.
 * All rem values are converted to px for email client compatibility.
 * 
 * @param attrs - Array of utility attribute strings from the node
 * @param inherited - Inherited styles for color blending
 * @param rootSize - Base font size for rem→px conversion (default: 16)
 * @returns Parsed CSS properties and extracted values for special handling
 * 
 * @example
 * ```ts
 * const parsed = parseAttrs(['p-4', 'bg-[#fff]', 'text-sm'], inherited, 16)
 * // → { css: { padding: '16px', backgroundColor: '#fff', fontSize: '14px', lineHeight: '20px' } }
 * ```
 */
export function parseAttrs(
	attrs: string[],
	inherited: InheritedStyles,
	rootSize: number = DEFAULT_ROOT_SIZE
): ParsedAttrs {
	const result: ParsedAttrs = { css: {} }

	// Pre-parse color opacity modifiers first so they're available when parsing colors
	for (const attr of attrs) {
		parseColorOpacity(attr, result)
	}

	// Parse all other attributes
	for (const attr of attrs) {
		parseAttr(attr, result, inherited, rootSize)
	}

	// Apply inherited border color with opacity if border-opacity-* was used 
	// but no explicit border-[#color] was specified
	if (result.borderOpacity !== undefined && !result.css.borderColor) {
		// Use inherited border color (which defaults to text color)
		const inheritedBorderColor = inherited.borderColor ?? inherited.color ?? '#000000'
		const finalOpacity = result.borderOpacity * inherited.opacity
		if (finalOpacity < 1) {
			result.css.borderColor = blendColor(inheritedBorderColor, inherited.backgroundColor, finalOpacity)
		} else {
			result.css.borderColor = inheritedBorderColor
		}
	}

	return result
}

/**
 * Parse a single attribute and add to result.
 */
function parseAttr(
	attr: string,
	result: ParsedAttrs,
	inherited: InheritedStyles,
	rootSize: number
): void {
	// Try each parser in order of likelihood/frequency
	if (parsePadding(attr, result, rootSize)) return
	if (parseMargin(attr, result, rootSize)) return
	if (parseWidth(attr, result, rootSize)) return
	if (parseHeight(attr, result, rootSize)) return
	if (parseMinMaxWidth(attr, result, rootSize)) return
	if (parseMinHeight(attr, result, rootSize)) return
	if (parseColor(attr, result, inherited)) return
	if (parseAlignment(attr, result)) return
	if (parseJustify(attr, result)) return
	if (parseTypography(attr, result, rootSize)) return
	if (parseBorder(attr, result, inherited, rootSize)) return
	if (parseDisplay(attr, result)) return
	if (parseOpacity(attr, result)) return
	if (parseResponsive(attr, result)) return
}

// ============================================================================
// Padding Parser
// ============================================================================

/**
 * Parse padding attributes: p-*, px-*, py-*, pt-*, pr-*, pb-*, pl-*
 * 
 * Patterns:
 * - p-{scale}    → padding: {value}
 * - p-[value]    → padding: value (arbitrary, rem converted to px)
 * - px-{scale}   → padding-left + padding-right
 * - py-{scale}   → padding-top + padding-bottom
 * - pt-{scale}   → padding-top
 * - pr-{scale}   → padding-right
 * - pb-{scale}   → padding-bottom
 * - pl-{scale}   → padding-left
 */
export function parsePadding(attr: string, result: ParsedAttrs, rootSize: number): boolean {
	// p-[value]
	let match = attr.match(/^p-\[([^\]]+)\]$/)
	if (match) {
		result.css.padding = remToPx(match[1], rootSize)
		return true
	}

	// p-{scale}
	match = attr.match(/^p-(\d+(?:\.\d+)?)$/)
	if (match) {
		const value = SPACING_SCALE[match[1]]
		if (value) result.css.padding = remToPx(value, rootSize)
		return true
	}

	// px-[value] / px-{scale}
	match = attr.match(/^px-(?:\[([^\]]+)\]|(\d+(?:\.\d+)?))$/)
	if (match) {
		const value = match[1] ? remToPx(match[1], rootSize) : remToPx(SPACING_SCALE[match[2]], rootSize)
		if (value) {
			result.css.paddingLeft = value
			result.css.paddingRight = value
		}
		return true
	}

	// py-[value] / py-{scale}
	match = attr.match(/^py-(?:\[([^\]]+)\]|(\d+(?:\.\d+)?))$/)
	if (match) {
		const value = match[1] ? remToPx(match[1], rootSize) : remToPx(SPACING_SCALE[match[2]], rootSize)
		if (value) {
			result.css.paddingTop = value
			result.css.paddingBottom = value
		}
		return true
	}

	// pt-*, pr-*, pb-*, pl-*
	match = attr.match(/^p([trbl])-(?:\[([^\]]+)\]|(\d+(?:\.\d+)?))$/)
	if (match) {
		const side = { t: 'Top', r: 'Right', b: 'Bottom', l: 'Left' }[match[1]]
		const value = match[2] ? remToPx(match[2], rootSize) : remToPx(SPACING_SCALE[match[3]], rootSize)
		if (side && value) {
			result.css[`padding${side}`] = value
		}
		return true
	}

	return false
}

// ============================================================================
// Margin Parser
// ============================================================================

/**
 * Parse margin attributes: m-*, mx-*, my-*, mt-*, mr-*, mb-*, ml-*
 * Margins are extracted for wrapper emulation, not added to css.
 * 
 * Note: Email clients don't reliably support margin.
 * We emulate margins using wrapper table padding.
 */
export function parseMargin(attr: string, result: ParsedAttrs, rootSize: number): boolean {
	const ensureMargin = () => {
		if (!result.margin) result.margin = {}
	}

	// m-auto
	if (attr === 'm-auto') {
		ensureMargin()
		result.margin!.top = 'auto'
		result.margin!.right = 'auto'
		result.margin!.bottom = 'auto'
		result.margin!.left = 'auto'
		return true
	}

	// m-[value]
	let match = attr.match(/^m-\[([^\]]+)\]$/)
	if (match) {
		ensureMargin()
		const value = remToPx(match[1], rootSize)
		result.margin!.top = value
		result.margin!.right = value
		result.margin!.bottom = value
		result.margin!.left = value
		return true
	}

	// m-{scale}
	match = attr.match(/^m-(\d+(?:\.\d+)?)$/)
	if (match) {
		const value = remToPx(SPACING_SCALE[match[1]], rootSize)
		if (value) {
			ensureMargin()
			result.margin!.top = value
			result.margin!.right = value
			result.margin!.bottom = value
			result.margin!.left = value
		}
		return true
	}

	// mx-auto
	if (attr === 'mx-auto') {
		ensureMargin()
		result.margin!.left = 'auto'
		result.margin!.right = 'auto'
		return true
	}

	// mx-[value] / mx-{scale}
	match = attr.match(/^mx-(?:\[([^\]]+)\]|(\d+(?:\.\d+)?))$/)
	if (match) {
		const value = match[1] ? remToPx(match[1], rootSize) : remToPx(SPACING_SCALE[match[2]], rootSize)
		if (value) {
			ensureMargin()
			result.margin!.left = value
			result.margin!.right = value
		}
		return true
	}

	// my-auto
	if (attr === 'my-auto') {
		ensureMargin()
		result.margin!.top = 'auto'
		result.margin!.bottom = 'auto'
		return true
	}

	// my-[value] / my-{scale}
	match = attr.match(/^my-(?:\[([^\]]+)\]|(\d+(?:\.\d+)?))$/)
	if (match) {
		const value = match[1] ? remToPx(match[1], rootSize) : remToPx(SPACING_SCALE[match[2]], rootSize)
		if (value) {
			ensureMargin()
			result.margin!.top = value
			result.margin!.bottom = value
		}
		return true
	}

	// mt-*, mr-*, mb-*, ml-* (including auto)
	match = attr.match(/^m([trbl])-(auto|\[([^\]]+)\]|(\d+(?:\.\d+)?))$/)
	if (match) {
		const sideMap = { t: 'top', r: 'right', b: 'bottom', l: 'left' } as const
		const side = sideMap[match[1] as keyof typeof sideMap]
		let value: string
		if (match[2] === 'auto') {
			value = 'auto'
		} else if (match[3]) {
			value = remToPx(match[3], rootSize)
		} else {
			value = remToPx(SPACING_SCALE[match[4]], rootSize)
		}
		if (side && value) {
			ensureMargin()
			result.margin![side] = value
		}
		return true
	}

	return false
}

// ============================================================================
// Width Parser
// ============================================================================

/**
 * Parse width attributes: w-*, w-full, w-screen, w-auto, w-[value]
 */
export function parseWidth(attr: string, result: ParsedAttrs, rootSize: number): boolean {
	if (attr === 'w-full' || attr === 'w-screen') {
		result.css.width = '100%'
		return true
	}

	if (attr === 'w-auto') {
		result.css.width = 'auto'
		return true
	}

	// w-[value]
	let match = attr.match(/^w-\[([^\]]+)\]$/)
	if (match) {
		result.css.width = remToPx(match[1], rootSize)
		return true
	}

	// w-{scale}
	match = attr.match(/^w-(\d+(?:\.\d+)?)$/)
	if (match) {
		const value = SPACING_SCALE[match[1]]
		if (value) result.css.width = remToPx(value, rootSize)
		return true
	}

	return false
}

// ============================================================================
// Height Parser
// ============================================================================

/**
 * Parse height attributes: h-*, h-full, h-screen, h-auto, h-[value]
 */
export function parseHeight(attr: string, result: ParsedAttrs, rootSize: number): boolean {
	if (attr === 'h-full' || attr === 'h-screen') {
		result.css.height = '100%'
		return true
	}

	if (attr === 'h-auto') {
		result.css.height = 'auto'
		return true
	}

	// h-[value]
	let match = attr.match(/^h-\[([^\]]+)\]$/)
	if (match) {
		result.css.height = remToPx(match[1], rootSize)
		return true
	}

	// h-{scale}
	match = attr.match(/^h-(\d+(?:\.\d+)?)$/)
	if (match) {
		const value = SPACING_SCALE[match[1]]
		if (value) result.css.height = remToPx(value, rootSize)
		return true
	}

	return false
}

// ============================================================================
// Min/Max Width Parser
// ============================================================================

/**
 * Parse min/max width attributes.
 * Note: Outlook ignores min-width and max-width, but useful for modern clients.
 */
export function parseMinMaxWidth(attr: string, result: ParsedAttrs, rootSize: number): boolean {
	// min-w-full
	if (attr === 'min-w-full') {
		result.css.minWidth = '100%'
		return true
	}

	// min-w-[value]
	let match = attr.match(/^min-w-\[([^\]]+)\]$/)
	if (match) {
		result.css.minWidth = remToPx(match[1], rootSize)
		return true
	}

	// min-w-{scale}
	match = attr.match(/^min-w-(\d+(?:\.\d+)?)$/)
	if (match) {
		const value = SPACING_SCALE[match[1]]
		if (value) result.css.minWidth = remToPx(value, rootSize)
		return true
	}

	// max-w-none
	if (attr === 'max-w-none') {
		result.css.maxWidth = 'none'
		return true
	}

	// max-w-full
	if (attr === 'max-w-full') {
		result.css.maxWidth = '100%'
		return true
	}

	// max-w-[value]
	match = attr.match(/^max-w-\[([^\]]+)\]$/)
	if (match) {
		result.css.maxWidth = remToPx(match[1], rootSize)
		return true
	}

	// max-w-{preset} (xs, sm, md, lg, xl, 2xl, etc.)
	match = attr.match(/^max-w-(\d?xl|xs|sm|md|lg)$/)
	if (match) {
		const value = MAX_WIDTHS[match[1]]
		if (value) result.css.maxWidth = remToPx(value, rootSize)
		return true
	}

	// max-w-{scale}
	match = attr.match(/^max-w-(\d+(?:\.\d+)?)$/)
	if (match) {
		const value = SPACING_SCALE[match[1]]
		if (value) result.css.maxWidth = remToPx(value, rootSize)
		return true
	}

	return false
}

// ============================================================================
// Min Height Parser
// ============================================================================

/**
 * Parse min height attributes.
 */
export function parseMinHeight(attr: string, result: ParsedAttrs, rootSize: number): boolean {
	if (attr === 'min-h-full' || attr === 'min-h-screen') {
		result.css.minHeight = '100%'
		return true
	}

	// min-h-[value]
	let match = attr.match(/^min-h-\[([^\]]+)\]$/)
	if (match) {
		result.css.minHeight = remToPx(match[1], rootSize)
		return true
	}

	// min-h-{scale}
	match = attr.match(/^min-h-(\d+(?:\.\d+)?)$/)
	if (match) {
		const value = SPACING_SCALE[match[1]]
		if (value) result.css.minHeight = remToPx(value, rootSize)
		return true
	}

	return false
}

// ============================================================================
// Color Parser
// ============================================================================

/**
 * Parse color attributes: text-[#...], bg-[#...]
 * Handles opacity modifiers and color blending.
 * 
 * Opacity is emulated by blending against background color since
 * email clients don't reliably support rgba() or CSS opacity.
 */
export function parseColor(
	attr: string,
	result: ParsedAttrs,
	inherited: InheritedStyles
): boolean {
	// text-inherit, text-current, text-transparent
	if (attr === 'text-inherit') {
		result.css.color = 'inherit'
		return true
	}
	if (attr === 'text-current') {
		result.css.color = 'currentColor'
		return true
	}
	if (attr === 'text-transparent') {
		result.css.color = 'transparent'
		return true
	}

	// bg-inherit, bg-current, bg-transparent
	if (attr === 'bg-inherit') {
		result.css.backgroundColor = 'inherit'
		return true
	}
	if (attr === 'bg-current') {
		result.css.backgroundColor = 'currentColor'
		return true
	}
	if (attr === 'bg-transparent') {
		result.css.backgroundColor = 'transparent'
		return true
	}

	// text-[#hex] or text-[#hex]/opacity
	let match = attr.match(/^text-\[(#[0-9a-fA-F]{3,8})\](?:\/(\d+|\[[\d.]+\]))?$/)
	if (match) {
		const { color, opacity } = parseColorWithOpacity(match[1], match[2])
		// Apply text-opacity-* modifier if present, then inherited opacity
		const modifierOpacity = result.textOpacity ?? 1
		const finalOpacity = opacity * modifierOpacity * inherited.opacity
		if (finalOpacity < 1) {
			result.css.color = blendColor(color, inherited.backgroundColor, finalOpacity)
		} else {
			result.css.color = color
		}
		return true
	}

	// bg-[#hex] or bg-[#hex]/opacity
	match = attr.match(/^bg-\[(#[0-9a-fA-F]{3,8})\](?:\/(\d+|\[[\d.]+\]))?$/)
	if (match) {
		const { color, opacity } = parseColorWithOpacity(match[1], match[2])
		// Apply bg-opacity-* modifier if present, then inherited opacity
		const modifierOpacity = result.bgOpacity ?? 1
		const finalOpacity = opacity * modifierOpacity * inherited.opacity
		if (finalOpacity < 1) {
			const blended = blendColor(color, inherited.backgroundColor, finalOpacity)
			result.css.backgroundColor = blended
			result.backgroundColor = blended
		} else {
			result.css.backgroundColor = color
			result.backgroundColor = color
		}
		return true
	}

	return false
}

// ============================================================================
// Alignment Parser
// ============================================================================

/**
 * Parse alignment attributes: align-*
 * Combines text-align and vertical-align for table cell positioning.
 */
export function parseAlignment(attr: string, result: ParsedAttrs): boolean {
	const alignments: Record<string, { textAlign: string; verticalAlign: string }> = {
		// Top row
		'align-top-left': { textAlign: 'left', verticalAlign: 'top' },
		'align-top': { textAlign: 'center', verticalAlign: 'top' },
		'align-top-right': { textAlign: 'right', verticalAlign: 'top' },
		// Middle row (with aliases)
		'align-left': { textAlign: 'left', verticalAlign: 'middle' },
		'align-middle-left': { textAlign: 'left', verticalAlign: 'middle' },
		'align-middle': { textAlign: 'center', verticalAlign: 'middle' },
		'align-center': { textAlign: 'center', verticalAlign: 'middle' },
		'align-right': { textAlign: 'right', verticalAlign: 'middle' },
		'align-middle-right': { textAlign: 'right', verticalAlign: 'middle' },
		// Bottom row
		'align-bottom-left': { textAlign: 'left', verticalAlign: 'bottom' },
		'align-bottom': { textAlign: 'center', verticalAlign: 'bottom' },
		'align-bottom-right': { textAlign: 'right', verticalAlign: 'bottom' }
	}

	if (attr in alignments) {
		const { textAlign, verticalAlign } = alignments[attr]
		result.css.textAlign = textAlign
		result.css.verticalAlign = verticalAlign
		return true
	}

	return false
}

// ============================================================================
// Justify Parser
// ============================================================================

/**
 * Parse justify attributes: justify-*
 */
export function parseJustify(attr: string, result: ParsedAttrs): boolean {
	const justifications: Record<string, string> = {
		'justify-left': 'left',
		'justify-center': 'center',
		'justify-right': 'right',
		'justify-full': 'justify'
	}

	if (attr in justifications) {
		result.css.textAlign = justifications[attr]
		return true
	}

	return false
}

// ============================================================================
// Typography Parser
// ============================================================================

/**
 * Parse typography attributes: text-*, font-*, italic, underline, etc.
 */
export function parseTypography(attr: string, result: ParsedAttrs, rootSize: number): boolean {
	// Font size presets: text-xs, text-sm, etc.
	let match = attr.match(/^text-(xs|sm|base|lg|xl|\d+xl)$/)
	if (match) {
		const preset = FONT_SIZES[match[1]]
		if (preset) {
			result.css.fontSize = remToPx(preset.fontSize, rootSize)
			result.css.lineHeight = remToPx(preset.lineHeight, rootSize)
		}
		return true
	}

	// Font size arbitrary: text-[value]
	// Note: This can conflict with text-[#color], so we check it doesn't start with #
	match = attr.match(/^text-\[([^#][^\]]*)\]$/)
	if (match) {
		result.css.fontSize = remToPx(match[1], rootSize)
		return true
	}

	// Font weight: font-*
	match = attr.match(/^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/)
	if (match) {
		result.css.fontWeight = FONT_WEIGHTS[match[1]]
		return true
	}

	// Font style
	if (attr === 'italic') {
		result.css.fontStyle = 'italic'
		return true
	}
	if (attr === 'not-italic') {
		result.css.fontStyle = 'normal'
		return true
	}

	// Text decoration
	if (attr === 'underline') {
		result.css.textDecoration = 'underline'
		return true
	}
	if (attr === 'overline') {
		result.css.textDecoration = 'overline'
		return true
	}
	if (attr === 'line-through') {
		result.css.textDecoration = 'line-through'
		return true
	}
	if (attr === 'no-underline') {
		result.css.textDecoration = 'none'
		return true
	}

	// Text transform
	if (attr === 'uppercase') {
		result.css.textTransform = 'uppercase'
		return true
	}
	if (attr === 'lowercase') {
		result.css.textTransform = 'lowercase'
		return true
	}
	if (attr === 'capitalize') {
		result.css.textTransform = 'capitalize'
		return true
	}
	if (attr === 'normal-case') {
		result.css.textTransform = 'none'
		return true
	}

	// Line height presets: leading-*
	match = attr.match(/^leading-(none|tight|snug|normal|relaxed|loose)$/)
	if (match) {
		result.css.lineHeight = LINE_HEIGHTS[match[1]]
		return true
	}

	// Line height scale: leading-{scale}
	match = attr.match(/^leading-(\d+(?:\.\d+)?)$/)
	if (match) {
		const value = SPACING_SCALE[match[1]]
		if (value) result.css.lineHeight = remToPx(value, rootSize)
		return true
	}

	// Line height arbitrary: leading-[value]
	match = attr.match(/^leading-\[([^\]]+)\]$/)
	if (match) {
		result.css.lineHeight = remToPx(match[1], rootSize)
		return true
	}

	// Letter spacing presets: tracking-*
	match = attr.match(/^tracking-(tighter|tight|normal|wide|wider|widest)$/)
	if (match) {
		result.css.letterSpacing = LETTER_SPACINGS[match[1]]
		return true
	}

	// Letter spacing arbitrary: tracking-[value]
	match = attr.match(/^tracking-\[([^\]]+)\]$/)
	if (match) {
		result.css.letterSpacing = remToPx(match[1], rootSize)
		return true
	}

	// Whitespace
	match = attr.match(/^whitespace-(normal|nowrap|pre|pre-line|pre-wrap)$/)
	if (match) {
		result.css.whiteSpace = match[1]
		return true
	}

	return false
}

// ============================================================================
// Border Parser
// ============================================================================

/**
 * Parse border attributes: border-*, rounded-*
 * Note: border-radius is not supported in Outlook Windows.
 */
export function parseBorder(
	attr: string,
	result: ParsedAttrs,
	inherited: InheritedStyles,
	rootSize: number
): boolean {
	// Border width shortcuts
	if (attr === 'border') {
		result.css.borderWidth = '1px'
		result.css.borderStyle = 'solid'
		return true
	}

	// Border width scale: border-{0|1|2|4|8}
	let match = attr.match(/^border-([0-8])$/)
	if (match) {
		result.css.borderWidth = BORDER_WIDTHS[match[1]] || `${match[1]}px`
		if (match[1] !== '0') result.css.borderStyle = 'solid'
		return true
	}

	// Border width arbitrary: border-[value]
	match = attr.match(/^border-\[(\d+(?:px)?)\]$/)
	if (match) {
		result.css.borderWidth = match[1].includes('px') ? match[1] : `${match[1]}px`
		result.css.borderStyle = 'solid'
		return true
	}

	// Border per-side: border-{t|r|b|l}
	match = attr.match(/^border-([trbl])(?:-([0-8]|\[([^\]]+)\]))?$/)
	if (match) {
		const sideMap = { t: 'Top', r: 'Right', b: 'Bottom', l: 'Left' }
		const side = sideMap[match[1] as keyof typeof sideMap]
		const value = match[3] || (match[2] ? BORDER_WIDTHS[match[2]] : '1px')
		result.css[`border${side}Width`] = value
		if (value !== '0') result.css[`border${side}Style`] = 'solid'
		return true
	}

	// Border x/y: border-{x|y}
	match = attr.match(/^border-([xy])(?:-([0-8]|\[([^\]]+)\]))?$/)
	if (match) {
		const value = match[3] || (match[2] ? BORDER_WIDTHS[match[2]] : '1px')
		if (match[1] === 'x') {
			result.css.borderLeftWidth = value
			result.css.borderRightWidth = value
			if (value !== '0') {
				result.css.borderLeftStyle = 'solid'
				result.css.borderRightStyle = 'solid'
			}
		} else {
			result.css.borderTopWidth = value
			result.css.borderBottomWidth = value
			if (value !== '0') {
				result.css.borderTopStyle = 'solid'
				result.css.borderBottomStyle = 'solid'
			}
		}
		return true
	}

	// Border color: border-[#hex] or border-[#hex]/opacity
	match = attr.match(/^border-\[(#[0-9a-fA-F]{3,8})\](?:\/(\d+|\[[\d.]+\]))?$/)
	if (match) {
		const { color, opacity } = parseColorWithOpacity(match[1], match[2])
		// Apply border-opacity-* modifier if present, then inherited opacity
		const modifierOpacity = result.borderOpacity ?? 1
		const finalOpacity = opacity * modifierOpacity * inherited.opacity
		if (finalOpacity < 1) {
			result.css.borderColor = blendColor(color, inherited.backgroundColor, finalOpacity)
		} else {
			result.css.borderColor = color
		}
		return true
	}

	// Border color keywords
	if (attr === 'border-transparent') {
		result.css.borderColor = 'transparent'
		return true
	}
	if (attr === 'border-inherit') {
		result.css.borderColor = 'inherit'
		return true
	}
	if (attr === 'border-current') {
		result.css.borderColor = 'currentColor'
		return true
	}

	// Border style
	match = attr.match(/^border-(solid|dashed|dotted|double|hidden|none)$/)
	if (match) {
		result.css.borderStyle = match[1]
		return true
	}

	// Border radius
	if (attr === 'rounded') {
		result.css.borderRadius = remToPx(BORDER_RADII[''], rootSize)
		return true
	}

	match = attr.match(/^rounded-(none|sm|md|lg|xl|2xl|3xl|full)$/)
	if (match) {
		result.css.borderRadius = remToPx(BORDER_RADII[match[1]], rootSize)
		return true
	}

	// Rounded arbitrary: rounded-[value]
	match = attr.match(/^rounded-\[([^\]]+)\]$/)
	if (match) {
		result.css.borderRadius = remToPx(match[1], rootSize)
		return true
	}

	// Rounded per-side: rounded-{t|r|b|l}-{size}
	match = attr.match(/^rounded-([trbl])-(none|sm|md|lg|xl|2xl|3xl|full|\[([^\]]+)\])$/)
	if (match) {
		const corners: Record<string, string[]> = {
			t: ['borderTopLeftRadius', 'borderTopRightRadius'],
			r: ['borderTopRightRadius', 'borderBottomRightRadius'],
			b: ['borderBottomLeftRadius', 'borderBottomRightRadius'],
			l: ['borderTopLeftRadius', 'borderBottomLeftRadius']
		}
		const value = match[3]
			? remToPx(match[3], rootSize)
			: remToPx(BORDER_RADII[match[2]] || match[2], rootSize)
		for (const corner of corners[match[1]]) {
			result.css[corner] = value
		}
		return true
	}

	// Rounded per-corner: rounded-{tl|tr|br|bl}-{size}
	match = attr.match(/^rounded-(tl|tr|br|bl)-(none|sm|md|lg|xl|2xl|3xl|full|\[([^\]]+)\])$/)
	if (match) {
		const cornerMap: Record<string, string> = {
			tl: 'borderTopLeftRadius',
			tr: 'borderTopRightRadius',
			br: 'borderBottomRightRadius',
			bl: 'borderBottomLeftRadius'
		}
		const value = match[3]
			? remToPx(match[3], rootSize)
			: remToPx(BORDER_RADII[match[2]] || match[2], rootSize)
		result.css[cornerMap[match[1]]] = value
		return true
	}

	return false
}

// ============================================================================
// Display Parser
// ============================================================================

/**
 * Parse display attributes: block, inline-block, inline, hidden
 */
export function parseDisplay(attr: string, result: ParsedAttrs): boolean {
	const displays: Record<string, string> = {
		'block': 'block',
		'inline-block': 'inline-block',
		'inline': 'inline',
		'hidden': 'none'
	}

	if (attr in displays) {
		result.css.display = displays[attr]
		return true
	}

	// Visibility
	if (attr === 'visible') {
		result.css.visibility = 'visible'
		return true
	}
	if (attr === 'invisible') {
		result.css.visibility = 'hidden'
		return true
	}
	if (attr === 'collapse') {
		result.css.visibility = 'collapse'
		return true
	}

	return false
}

// ============================================================================
// Color Opacity Modifier Parser
// ============================================================================

/**
 * Parse color opacity modifiers: text-opacity-*, bg-opacity-*, border-opacity-*
 * 
 * These are pre-parsed before color attributes so the opacity value is available
 * when applying colors. This replaces the `/opacity` suffix syntax (e.g., `bg-[#000]/50`)
 * which doesn't work as HTML attributes due to the `/` character.
 * 
 * Usage:
 * - `bg-opacity-50 bg-[#000000]` → 50% opacity black background
 * - `text-opacity-75 text-[#ff0000]` → 75% opacity red text
 * - `border-opacity-25 border-[#0000ff]` → 25% opacity blue border
 */
export function parseColorOpacity(attr: string, result: ParsedAttrs): boolean {
	// text-opacity-{0-100} or text-opacity-[value]
	let match = attr.match(/^text-opacity-(\d+|\[[\d.]+\])$/)
	if (match) {
		result.textOpacity = parseOpacityValue(match[1])
		return true
	}

	// bg-opacity-{0-100} or bg-opacity-[value]
	match = attr.match(/^bg-opacity-(\d+|\[[\d.]+\])$/)
	if (match) {
		result.bgOpacity = parseOpacityValue(match[1])
		return true
	}

	// border-opacity-{0-100} or border-opacity-[value]
	match = attr.match(/^border-opacity-(\d+|\[[\d.]+\])$/)
	if (match) {
		result.borderOpacity = parseOpacityValue(match[1])
		return true
	}

	return false
}

/**
 * Parse opacity value from string: "50" → 0.5, "[0.33]" → 0.33
 */
function parseOpacityValue(value: string): number {
	if (value.startsWith('[')) {
		return parseFloat(value.slice(1, -1))
	}
	return parseInt(value) / 100
}

// ============================================================================
// Opacity Parser
// ============================================================================

/**
 * Parse opacity attributes: opacity-*
 * Extracted for use as color opacity multiplier.
 * 
 * Note: CSS opacity is not well supported in email clients.
 * We compound this with color opacities and blend colors instead.
 */
export function parseOpacity(attr: string, result: ParsedAttrs): boolean {
	// opacity-{0-100} or opacity-[value]
	const match = attr.match(/^opacity-(\d+|\[[\d.]+\])$/)
	if (match) {
		if (match[1].startsWith('[')) {
			result.opacity = parseFloat(match[1].slice(1, -1))
		} else {
			result.opacity = parseInt(match[1]) / 100
		}
		return true
	}

	return false
}

// ============================================================================
// Responsive Parser
// ============================================================================

/**
 * Parse responsive attributes: mobile-only, desktop-only
 * These control visibility via media queries.
 */
export function parseResponsive(attr: string, result: ParsedAttrs): boolean {
	if (attr === 'mobile-only') {
		result.responsive = 'mobile-only'
		result.css.display = 'none'  // Hidden by default, revealed via media query
		return true
	}

	if (attr === 'desktop-only') {
		result.responsive = 'desktop-only'
		return true
	}

	return false
}

// ============================================================================
// Quick Width Extraction (for Grid cells)
// ============================================================================

/**
 * Extract width value from an attrs array without full parsing.
 * Used by Grid to apply child width to the <td> cell.
 * 
 * @param attrs - Array of Tailwind-like attributes
 * @param rootSize - Base font size for rem calculation
 * @returns Width value (e.g., '40%', '100px') or undefined
 * 
 * @example
 * ```ts
 * extractWidthFromAttrs(['w-[40%]', 'p-4', 'bg-[#fff]'], 16)  // → '40%'
 * extractWidthFromAttrs(['w-full', 'text-sm'], 16)            // → '100%'
 * extractWidthFromAttrs(['p-4', 'bg-[#fff]'], 16)             // → undefined
 * ```
 */
export function extractWidthFromAttrs(attrs: string[], rootSize: number = DEFAULT_ROOT_SIZE): string | undefined {
	for (const attr of attrs) {
		if (attr === 'w-full' || attr === 'w-screen') {
			return '100%'
		}
		if (attr === 'w-auto') {
			return 'auto'
		}
		// w-[value]
		let match = attr.match(/^w-\[([^\]]+)\]$/)
		if (match) {
			return remToPx(match[1], rootSize)
		}
		// w-{scale}
		match = attr.match(/^w-(\d+(?:\.\d+)?)$/)
		if (match) {
			const value = SPACING_SCALE[match[1]]
			if (value) return remToPx(value, rootSize)
		}
	}
	return undefined
}

/**
 * Extract vertical-align value from an attrs array without full parsing.
 * Used by Grid and Table to apply child alignment to the <td> cell.
 * 
 * @param attrs - Array of Tailwind-like attributes
 * @returns Vertical align value ('top', 'middle', 'bottom') or undefined
 */
export function extractValignFromAttrs(attrs: string[]): 'top' | 'middle' | 'bottom' | undefined {
	for (const attr of attrs) {
		// Top row
		if (attr === 'align-top' || attr === 'align-top-left' || attr === 'align-top-right') return 'top'
		// Middle row (including aliases)
		if (attr === 'align-middle' || attr === 'align-middle-left' || attr === 'align-middle-right' ||
		    attr === 'align-left' || attr === 'align-center' || attr === 'align-right') return 'middle'
		// Bottom row
		if (attr === 'align-bottom' || attr === 'align-bottom-left' || attr === 'align-bottom-right') return 'bottom'
	}
	return undefined
}

/**
 * Extract text-align value from an attrs array without full parsing.
 * Used by Table to apply child alignment to the <td> cell.
 * 
 * Checks both align-* and justify-* attributes.
 * 
 * @param attrs - Array of Tailwind-like attributes
 * @returns Text align value ('left', 'center', 'right') or undefined
 */
export function extractTextAlignFromAttrs(attrs: string[]): 'left' | 'center' | 'right' | undefined {
	for (const attr of attrs) {
		// align-* attributes
		if (attr === 'align-top-left' || attr === 'align-left' || attr === 'align-middle-left' || attr === 'align-bottom-left') return 'left'
		if (attr === 'align-top' || attr === 'align-middle' || attr === 'align-center' || attr === 'align-bottom') return 'center'
		if (attr === 'align-top-right' || attr === 'align-right' || attr === 'align-middle-right' || attr === 'align-bottom-right') return 'right'
		// justify-* attributes
		if (attr === 'justify-left') return 'left'
		if (attr === 'justify-center') return 'center'
		if (attr === 'justify-right') return 'right'
	}
	return undefined
}

/**
 * Extract responsive visibility from an attrs array without full parsing.
 * Used by Grid to apply visibility class to the <td> cell.
 * 
 * @param attrs - Array of Tailwind-like attributes
 * @returns Responsive mode ('mobile-only', 'desktop-only') or undefined
 */
export function extractResponsiveFromAttrs(attrs: string[]): 'mobile-only' | 'desktop-only' | undefined {
	for (const attr of attrs) {
		if (attr === 'mobile-only') return 'mobile-only'
		if (attr === 'desktop-only') return 'desktop-only'
	}
	return undefined
}

// ============================================================================
// Column Span Extraction (for Table and Grid cells)
// ============================================================================

/**
 * Extract colspan value from attrs array without full parsing.
 * Used by Table and Grid to set colspan attribute on <td> cells.
 * 
 * Patterns:
 * - span-{2-12} → colspan="N"
 * - span-[value] → colspan="value" (arbitrary)
 * 
 * @param attrs - Array of Tailwind-like attributes
 * @returns Colspan value as number, or undefined if not specified
 * 
 * @example
 * ```ts
 * extractColspanFromAttrs(['span-2', 'p-4'])        // → 2
 * extractColspanFromAttrs(['span-[3]', 'w-full'])   // → 3
 * extractColspanFromAttrs(['p-4', 'bg-[#fff]'])    // → undefined
 * ```
 */
export function extractColspanFromAttrs(attrs: string[]): number | undefined {
	for (const attr of attrs) {
		// span-{2-12}
		let match = attr.match(/^span-(\d+)$/)
		if (match) {
			const value = parseInt(match[1])
			if (value >= 2 && value <= 12) return value
		}
		// span-[value]
		match = attr.match(/^span-\[(\d+)\]$/)
		if (match) {
			return parseInt(match[1])
		}
	}
	return undefined
}

/**
 * Extract rowspan value from attrs array without full parsing.
 * Used by Table and Grid to set rowspan attribute on <td> cells.
 * 
 * Patterns:
 * - row-span-{2-12} → rowspan="N"
 * - row-span-[value] → rowspan="value" (arbitrary)
 * 
 * @param attrs - Array of Tailwind-like attributes
 * @returns Rowspan value as number, or undefined if not specified
 * 
 * @example
 * ```ts
 * extractRowspanFromAttrs(['row-span-2', 'p-4'])        // → 2
 * extractRowspanFromAttrs(['row-span-[4]', 'w-full'])   // → 4
 * extractRowspanFromAttrs(['p-4', 'bg-[#fff]'])        // → undefined
 * ```
 */
export function extractRowspanFromAttrs(attrs: string[]): number | undefined {
	for (const attr of attrs) {
		// row-span-{2-12}
		let match = attr.match(/^row-span-(\d+)$/)
		if (match) {
			const value = parseInt(match[1])
			if (value >= 2 && value <= 12) return value
		}
		// row-span-[value]
		match = attr.match(/^row-span-\[(\d+)\]$/)
		if (match) {
			return parseInt(match[1])
		}
	}
	return undefined
}

// ============================================================================
// Column/Row Template Parsing
// ============================================================================

/**
 * Parse column template attribute into array of widths.
 * Used by Table and Div (grid mode) to define column widths.
 * 
 * Pattern: cols-[40%_20%_20%_20%] → ['40%', '20%', '20%', '20%']
 * 
 * @param attrs - Array of Tailwind-like attributes
 * @returns Array of width values, or undefined if not specified
 * 
 * @example
 * ```ts
 * parseColumnTemplate(['cols-[40%_20%_20%_20%]', 'p-4'])  // → ['40%', '20%', '20%', '20%']
 * parseColumnTemplate(['cols-[1fr_2fr]', 'border'])      // → ['1fr', '2fr']
 * parseColumnTemplate(['p-4', 'bg-[#fff]'])              // → undefined
 * ```
 */
export function parseColumnTemplate(attrs: string[]): string[] | undefined {
	for (const attr of attrs) {
		const match = attr.match(/^cols-\[([^\]]+)\]$/)
		if (match) {
			// Split by underscore and return array of widths
			return match[1].split('_')
		}
	}
	return undefined
}

/**
 * Parse row template attribute into array of heights.
 * Used by Div (grid mode with direction='rows') to define row heights.
 * 
 * Pattern: rows-[100px_auto_50px] → ['100px', 'auto', '50px']
 * 
 * @param attrs - Array of Tailwind-like attributes
 * @returns Array of height values, or undefined if not specified
 * 
 * @example
 * ```ts
 * parseRowTemplate(['rows-[100px_auto_50px]', 'p-4'])  // → ['100px', 'auto', '50px']
 * parseRowTemplate(['rows-[1fr_2fr]', 'border'])      // → ['1fr', '2fr']
 * parseRowTemplate(['p-4', 'bg-[#fff]'])              // → undefined
 * ```
 */
export function parseRowTemplate(attrs: string[]): string[] | undefined {
	for (const attr of attrs) {
		const match = attr.match(/^rows-\[([^\]]+)\]$/)
		if (match) {
			// Split by underscore and return array of heights
			return match[1].split('_')
		}
	}
	return undefined
}

/**
 * Parse cell-padding attribute from Table.
 * 
 * Supported formats:
 * - cell-padding-0 through cell-padding-12 (scale values)
 * - cell-padding-[8px] (arbitrary value)
 * 
 * Scale mapping (same as Tailwind spacing):
 * - 0 → 0px, 1 → 4px, 2 → 8px, 3 → 12px, 4 → 16px
 * - 5 → 20px, 6 → 24px, 8 → 32px, 10 → 40px, 12 → 48px
 * 
 * @param attrs - Array of attribute strings
 * @returns Cell padding value or undefined
 */
export function parseCellPadding(attrs: string[]): string | undefined {
	const scaleMap: Record<string, string> = {
		'0': '0',
		'1': '4px',
		'2': '8px',
		'3': '12px',
		'4': '16px',
		'5': '20px',
		'6': '24px',
		'8': '32px',
		'10': '40px',
		'12': '48px'
	}
	
	for (const attr of attrs) {
		// Check for arbitrary value: cell-padding-[8px]
		const arbitraryMatch = attr.match(/^cell-padding-\[([^\]]+)\]$/)
		if (arbitraryMatch) {
			return arbitraryMatch[1]
		}
		
		// Check for scale value: cell-padding-0 through cell-padding-12
		const scaleMatch = attr.match(/^cell-padding-(\d+)$/)
		if (scaleMatch && scaleMap[scaleMatch[1]]) {
			return scaleMap[scaleMatch[1]]
		}
	}
	return undefined
}

/**
 * Parse gap attribute for grid layouts.
 * 
 * Supported formats:
 * - gap-0 through gap-12 (scale values)
 * - gap-[20px] (arbitrary value)
 * 
 * Scale mapping (same as Tailwind spacing):
 * - 0 → 0px, 1 → 4px, 2 → 8px, 3 → 12px, 4 → 16px
 * - 5 → 20px, 6 → 24px, 8 → 32px, 10 → 40px, 12 → 48px
 * 
 * @param attrs - Array of attribute strings
 * @returns Gap value or undefined
 */
export function parseGap(attrs: string[]): string | undefined {
	const scaleMap: Record<string, string> = {
		'0': '0',
		'1': '4px',
		'2': '8px',
		'3': '12px',
		'4': '16px',
		'5': '20px',
		'6': '24px',
		'8': '32px',
		'10': '40px',
		'12': '48px'
	}
	
	for (const attr of attrs) {
		// Check for arbitrary value: gap-[20px]
		const arbitraryMatch = attr.match(/^gap-\[([^\]]+)\]$/)
		if (arbitraryMatch) {
			return arbitraryMatch[1]
		}
		
		// Check for scale value: gap-0 through gap-12
		const scaleMatch = attr.match(/^gap-(\d+)$/)
		if (scaleMatch && scaleMap[scaleMatch[1]]) {
			return scaleMap[scaleMatch[1]]
		}
	}
	return undefined
}
