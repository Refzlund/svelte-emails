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
	SPACING_SCALE_PX,
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
// Regex Patterns
// ============================================================================
// Pre-compiled regex patterns for performance and maintainability.
// Grouped by parser function.

// Unit conversion
const REM_VALUE_RE = /^([\d.]+)rem$/

// Padding patterns
const PADDING_ARBITRARY_RE = /^p-\[([^\]]+)\]$/
const PADDING_SCALE_RE = /^p-(\d+(?:\.\d+)?)$/
const PADDING_X_RE = /^px-(?:\[([^\]]+)\]|(\d+(?:\.\d+)?))$/
const PADDING_Y_RE = /^py-(?:\[([^\]]+)\]|(\d+(?:\.\d+)?))$/
const PADDING_SIDE_RE = /^p([trbl])-(?:\[([^\]]+)\]|(\d+(?:\.\d+)?))$/

// Margin patterns
const MARGIN_ARBITRARY_RE = /^m-\[([^\]]+)\]$/
const MARGIN_SCALE_RE = /^m-(\d+(?:\.\d+)?)$/
const MARGIN_X_RE = /^mx-(?:\[([^\]]+)\]|(\d+(?:\.\d+)?))$/
const MARGIN_Y_RE = /^my-(?:\[([^\]]+)\]|(\d+(?:\.\d+)?))$/
const MARGIN_SIDE_RE = /^m([trbl])-(auto|\[([^\]]+)\]|(\d+(?:\.\d+)?))$/

// Width patterns
const WIDTH_ARBITRARY_RE = /^w-\[([^\]]+)\]$/
const WIDTH_SCALE_RE = /^w-(\d+(?:\.\d+)?)$/

// Height patterns
const HEIGHT_ARBITRARY_RE = /^h-\[([^\]]+)\]$/
const HEIGHT_SCALE_RE = /^h-(\d+(?:\.\d+)?)$/

// Min/max width patterns
const MIN_WIDTH_ARBITRARY_RE = /^min-w-\[([^\]]+)\]$/
const MIN_WIDTH_SCALE_RE = /^min-w-(\d+(?:\.\d+)?)$/
const MAX_WIDTH_ARBITRARY_RE = /^max-w-\[([^\]]+)\]$/
const MAX_WIDTH_PRESET_RE = /^max-w-(\d?xl|xs|sm|md|lg)$/
const MAX_WIDTH_SCALE_RE = /^max-w-(\d+(?:\.\d+)?)$/

// Min height patterns
const MIN_HEIGHT_ARBITRARY_RE = /^min-h-\[([^\]]+)\]$/
const MIN_HEIGHT_SCALE_RE = /^min-h-(\d+(?:\.\d+)?)$/

// Color patterns
const TEXT_COLOR_RE = /^text-\[(#[0-9a-fA-F]{3,8})\](?:\/(\d+|\[[\d.]+\]))?$/
const BG_COLOR_RE = /^bg-\[(#[0-9a-fA-F]{3,8})\](?:\/(\d+|\[[\d.]+\]))?$/

// Typography patterns
const TEXT_SIZE_PRESET_RE = /^text-(xs|sm|base|lg|xl|\d+xl)$/
const TEXT_SIZE_ARBITRARY_RE = /^text-\[([^#][^\]]*)\]$/
const FONT_WEIGHT_RE = /^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/
const LINE_HEIGHT_PRESET_RE = /^leading-(none|tight|snug|normal|relaxed|loose)$/
const LINE_HEIGHT_SCALE_RE = /^leading-(\d+(?:\.\d+)?)$/
const LINE_HEIGHT_ARBITRARY_RE = /^leading-\[([^\]]+)\]$/
const LETTER_SPACING_PRESET_RE = /^tracking-(tighter|tight|normal|wide|wider|widest)$/
const LETTER_SPACING_ARBITRARY_RE = /^tracking-\[([^\]]+)\]$/
const WHITESPACE_RE = /^whitespace-(normal|nowrap|pre|pre-line|pre-wrap)$/

// Border patterns
const BORDER_WIDTH_SCALE_RE = /^border-([0-8])$/
const BORDER_WIDTH_ARBITRARY_RE = /^border-\[(\d+(?:px)?)\]$/
const BORDER_SIDE_RE = /^border-([trbl])(?:-([0-8]|\[([^\]]+)\]))?$/
const BORDER_AXIS_RE = /^border-([xy])(?:-([0-8]|\[([^\]]+)\]))?$/
const BORDER_COLOR_RE = /^border-\[(#[0-9a-fA-F]{3,8})\](?:\/(\d+|\[[\d.]+\]))?$/
const BORDER_STYLE_RE = /^border-(solid|dashed|dotted|double|hidden|none)$/
const ROUNDED_PRESET_RE = /^rounded-(none|sm|md|lg|xl|2xl|3xl|full)$/
const ROUNDED_ARBITRARY_RE = /^rounded-\[([^\]]+)\]$/
const ROUNDED_SIDE_RE = /^rounded-([trbl])-(none|sm|md|lg|xl|2xl|3xl|full|\[([^\]]+)\])$/
const ROUNDED_CORNER_RE = /^rounded-(tl|tr|br|bl)-(none|sm|md|lg|xl|2xl|3xl|full|\[([^\]]+)\])$/

// Opacity patterns
const TEXT_OPACITY_RE = /^text-opacity-(\d+|\[[\d.]+\])$/
const BG_OPACITY_RE = /^bg-opacity-(\d+|\[[\d.]+\])$/
const BORDER_OPACITY_RE = /^border-opacity-(\d+|\[[\d.]+\])$/
const OPACITY_RE = /^opacity-(\d+|\[[\d.]+\])$/

// Grid/cell patterns
const COLS_TEMPLATE_RE = /^cols-\[([^\]]+)\]$/
const ROWS_TEMPLATE_RE = /^rows-\[([^\]]+)\]$/
const CELL_PADDING_ARBITRARY_RE = /^cell-padding-\[([^\]]+)\]$/
const CELL_PADDING_SCALE_RE = /^cell-padding-(\d+)$/
const GAP_ARBITRARY_RE = /^gap-\[([^\]]+)\]$/
const GAP_SCALE_RE = /^gap-(\d+)$/
const SPAN_RE = /^span-(\d+)$/
const SPAN_ARBITRARY_RE = /^span-\[(\d+)\]$/
const ROW_SPAN_RE = /^row-span-(\d+)$/
const ROW_SPAN_ARBITRARY_RE = /^row-span-\[(\d+)\]$/

// List style patterns
const WIDTH_FRACTION_RE = /^w-(\d+(?:\/\d+)?)$/

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
	const match = value.match(REM_VALUE_RE)
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

	// Pre-parse opacity modifiers first so they're available when parsing colors
	// This includes both color-specific opacities (text-opacity, bg-opacity, border-opacity)
	// and element-wide opacity (opacity-50), which compounds with all color opacities
	for (const attr of attrs) {
		parseColorOpacity(attr, result)
		parseOpacity(attr, result)
	}

	// Calculate effective inherited opacity: parent opacity × this element's opacity
	// This allows opacity-50 to affect all colors on this element, not just children
	const effectiveInherited: InheritedStyles = {
		...inherited,
		opacity: inherited.opacity * (result.opacity ?? 1)
	}

	// Parse all other attributes using the effective inherited opacity
	for (const attr of attrs) {
		parseAttr(attr, result, effectiveInherited, rootSize)
	}

	// Apply inherited border color with opacity if border-opacity-* was used 
	// but no explicit border-[#color] was specified
	if (result.borderOpacity !== undefined && !result.css.borderColor) {
		// Use inherited border color (which defaults to text color)
		const inheritedBorderColor = inherited.borderColor ?? inherited.color ?? '#000000'
		const finalOpacity = result.borderOpacity * effectiveInherited.opacity
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
	if (parseTypography(attr, result, inherited, rootSize)) return
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
function parsePadding(attr: string, result: ParsedAttrs, rootSize: number): boolean {
	// p-[value]
	let match = attr.match(PADDING_ARBITRARY_RE)
	if (match) {
		result.css.padding = remToPx(match[1], rootSize)
		return true
	}

	// p-{scale}
	match = attr.match(PADDING_SCALE_RE)
	if (match) {
		const value = SPACING_SCALE[match[1]]
		if (value) result.css.padding = remToPx(value, rootSize)
		return true
	}

	// px-[value] / px-{scale}
	match = attr.match(PADDING_X_RE)
	if (match) {
		const value = match[1] ? remToPx(match[1], rootSize) : remToPx(SPACING_SCALE[match[2]], rootSize)
		if (value) {
			result.css.paddingLeft = value
			result.css.paddingRight = value
		}
		return true
	}

	// py-[value] / py-{scale}
	match = attr.match(PADDING_Y_RE)
	if (match) {
		const value = match[1] ? remToPx(match[1], rootSize) : remToPx(SPACING_SCALE[match[2]], rootSize)
		if (value) {
			result.css.paddingTop = value
			result.css.paddingBottom = value
		}
		return true
	}

	// pt-*, pr-*, pb-*, pl-*
	match = attr.match(PADDING_SIDE_RE)
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
function parseMargin(attr: string, result: ParsedAttrs, rootSize: number): boolean {
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
	let match = attr.match(MARGIN_ARBITRARY_RE)
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
	match = attr.match(MARGIN_SCALE_RE)
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
	match = attr.match(MARGIN_X_RE)
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
	match = attr.match(MARGIN_Y_RE)
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
	match = attr.match(MARGIN_SIDE_RE)
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
function parseWidth(attr: string, result: ParsedAttrs, rootSize: number): boolean {
	if (attr === 'w-full' || attr === 'w-screen') {
		result.css.width = '100%'
		return true
	}

	if (attr === 'w-auto') {
		result.css.width = 'auto'
		return true
	}

	// w-[value]
	let match = attr.match(WIDTH_ARBITRARY_RE)
	if (match) {
		result.css.width = remToPx(match[1], rootSize)
		return true
	}

	// w-{scale}
	match = attr.match(WIDTH_SCALE_RE)
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
function parseHeight(attr: string, result: ParsedAttrs, rootSize: number): boolean {
	if (attr === 'h-full' || attr === 'h-screen') {
		result.css.height = '100%'
		return true
	}

	if (attr === 'h-auto') {
		result.css.height = 'auto'
		return true
	}

	// h-[value]
	let match = attr.match(HEIGHT_ARBITRARY_RE)
	if (match) {
		result.css.height = remToPx(match[1], rootSize)
		return true
	}

	// h-{scale}
	match = attr.match(HEIGHT_SCALE_RE)
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
function parseMinMaxWidth(attr: string, result: ParsedAttrs, rootSize: number): boolean {
	// min-w-full
	if (attr === 'min-w-full') {
		result.css.minWidth = '100%'
		return true
	}

	// min-w-[value]
	let match = attr.match(MIN_WIDTH_ARBITRARY_RE)
	if (match) {
		result.css.minWidth = remToPx(match[1], rootSize)
		return true
	}

	// min-w-{scale}
	match = attr.match(MIN_WIDTH_SCALE_RE)
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
	match = attr.match(MAX_WIDTH_ARBITRARY_RE)
	if (match) {
		result.css.maxWidth = remToPx(match[1], rootSize)
		return true
	}

	// max-w-{preset} (xs, sm, md, lg, xl, 2xl, etc.)
	match = attr.match(MAX_WIDTH_PRESET_RE)
	if (match) {
		const value = MAX_WIDTHS[match[1]]
		if (value) result.css.maxWidth = remToPx(value, rootSize)
		return true
	}

	// max-w-{scale}
	match = attr.match(MAX_WIDTH_SCALE_RE)
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
function parseMinHeight(attr: string, result: ParsedAttrs, rootSize: number): boolean {
	if (attr === 'min-h-full' || attr === 'min-h-screen') {
		result.css.minHeight = '100%'
		return true
	}

	// min-h-[value]
	let match = attr.match(MIN_HEIGHT_ARBITRARY_RE)
	if (match) {
		result.css.minHeight = remToPx(match[1], rootSize)
		return true
	}

	// min-h-{scale}
	match = attr.match(MIN_HEIGHT_SCALE_RE)
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
function parseColor(
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
	let match = attr.match(TEXT_COLOR_RE)
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
	match = attr.match(BG_COLOR_RE)
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
function parseAlignment(attr: string, result: ParsedAttrs): boolean {
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
function parseJustify(attr: string, result: ParsedAttrs): boolean {
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
 * 
 * Includes font-mono and font-base for switching between font stacks:
 * - font-mono: Uses monoFontFamily from inherited styles (set via StyleConfig.root.monoFontFamily)
 * - font-base: Resets to baseFontFamily from inherited styles (set via StyleConfig.root.fontFamily)
 */
function parseTypography(
	attr: string,
	result: ParsedAttrs,
	inherited: InheritedStyles,
	rootSize: number
): boolean {
	// Font family: font-mono, font-base
	if (attr === 'font-mono') {
		if (inherited.monoFontFamily) {
			result.css.fontFamily = inherited.monoFontFamily
		}
		return true
	}
	if (attr === 'font-base') {
		if (inherited.baseFontFamily) {
			result.css.fontFamily = inherited.baseFontFamily
		}
		return true
	}

	// Font size presets: text-xs, text-sm, etc.
	let match = attr.match(TEXT_SIZE_PRESET_RE)
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
	match = attr.match(TEXT_SIZE_ARBITRARY_RE)
	if (match) {
		result.css.fontSize = remToPx(match[1], rootSize)
		return true
	}

	// Font weight: font-*
	match = attr.match(FONT_WEIGHT_RE)
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
	match = attr.match(LINE_HEIGHT_PRESET_RE)
	if (match) {
		result.css.lineHeight = LINE_HEIGHTS[match[1]]
		return true
	}

	// Line height scale: leading-{scale}
	match = attr.match(LINE_HEIGHT_SCALE_RE)
	if (match) {
		const value = SPACING_SCALE[match[1]]
		if (value) result.css.lineHeight = remToPx(value, rootSize)
		return true
	}

	// Line height arbitrary: leading-[value]
	match = attr.match(LINE_HEIGHT_ARBITRARY_RE)
	if (match) {
		result.css.lineHeight = remToPx(match[1], rootSize)
		return true
	}

	// Letter spacing presets: tracking-*
	match = attr.match(LETTER_SPACING_PRESET_RE)
	if (match) {
		result.css.letterSpacing = LETTER_SPACINGS[match[1]]
		return true
	}

	// Letter spacing arbitrary: tracking-[value]
	match = attr.match(LETTER_SPACING_ARBITRARY_RE)
	if (match) {
		result.css.letterSpacing = remToPx(match[1], rootSize)
		return true
	}

	// Whitespace
	match = attr.match(WHITESPACE_RE)
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
function parseBorder(
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
	let match = attr.match(BORDER_WIDTH_SCALE_RE)
	if (match) {
		result.css.borderWidth = BORDER_WIDTHS[match[1]] || `${match[1]}px`
		// Only set solid as default if no explicit border style was specified
		if (match[1] !== '0' && !result.css.borderStyle) result.css.borderStyle = 'solid'
		return true
	}

	// Border width arbitrary: border-[value]
	match = attr.match(BORDER_WIDTH_ARBITRARY_RE)
	if (match) {
		result.css.borderWidth = match[1].includes('px') ? match[1] : `${match[1]}px`
		// Only set solid as default if no explicit border style was specified
		if (!result.css.borderStyle) result.css.borderStyle = 'solid'
		return true
	}

	// Border per-side: border-{t|r|b|l}
	match = attr.match(BORDER_SIDE_RE)
	if (match) {
		const sideMap = { t: 'Top', r: 'Right', b: 'Bottom', l: 'Left' }
		const side = sideMap[match[1] as keyof typeof sideMap]
		const value = match[3] || (match[2] ? BORDER_WIDTHS[match[2]] : '1px')
		result.css[`border${side}Width`] = value
		// Only set solid as default if no explicit border style was specified
		if (value !== '0' && !result.css[`border${side}Style`]) result.css[`border${side}Style`] = 'solid'
		return true
	}

	// Border x/y: border-{x|y}
	match = attr.match(BORDER_AXIS_RE)
	if (match) {
		const value = match[3] || (match[2] ? BORDER_WIDTHS[match[2]] : '1px')
		if (match[1] === 'x') {
			result.css.borderLeftWidth = value
			result.css.borderRightWidth = value
			// Only set solid as default if no explicit border style was specified
			if (value !== '0') {
				if (!result.css.borderLeftStyle) result.css.borderLeftStyle = 'solid'
				if (!result.css.borderRightStyle) result.css.borderRightStyle = 'solid'
			}
		} else {
			result.css.borderTopWidth = value
			result.css.borderBottomWidth = value
			// Only set solid as default if no explicit border style was specified
			if (value !== '0') {
				if (!result.css.borderTopStyle) result.css.borderTopStyle = 'solid'
				if (!result.css.borderBottomStyle) result.css.borderBottomStyle = 'solid'
			}
		}
		return true
	}

	// Border color: border-[#hex] or border-[#hex]/opacity
	match = attr.match(BORDER_COLOR_RE)
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
		// Set default width and style ONLY if no border width is already specified
		// (including directional borders like border-t-2)
		// This allows `border={color}` alone to show a visible border,
		// but doesn't override directional borders
		const hasBorderWidth = result.css.borderWidth ||
			result.css.borderTopWidth || result.css.borderRightWidth ||
			result.css.borderBottomWidth || result.css.borderLeftWidth
		if (!hasBorderWidth) {
			result.css.borderWidth = '1px'
		}
		if (!result.css.borderStyle && !result.css.borderTopStyle &&
			!result.css.borderRightStyle && !result.css.borderBottomStyle &&
			!result.css.borderLeftStyle) {
			result.css.borderStyle = 'solid'
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
	match = attr.match(BORDER_STYLE_RE)
	if (match) {
		result.css.borderStyle = match[1]
		return true
	}

	// Border radius
	if (attr === 'rounded') {
		result.css.borderRadius = remToPx(BORDER_RADII[''], rootSize)
		return true
	}

	match = attr.match(ROUNDED_PRESET_RE)
	if (match) {
		result.css.borderRadius = remToPx(BORDER_RADII[match[1]], rootSize)
		return true
	}

	// Rounded arbitrary: rounded-[value]
	match = attr.match(ROUNDED_ARBITRARY_RE)
	if (match) {
		result.css.borderRadius = remToPx(match[1], rootSize)
		return true
	}

	// Rounded per-side: rounded-{t|r|b|l}-{size}
	match = attr.match(ROUNDED_SIDE_RE)
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
	match = attr.match(ROUNDED_CORNER_RE)
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
function parseDisplay(attr: string, result: ParsedAttrs): boolean {
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
function parseColorOpacity(attr: string, result: ParsedAttrs): boolean {
	// text-opacity-{0-100} or text-opacity-[value]
	let match = attr.match(TEXT_OPACITY_RE)
	if (match) {
		result.textOpacity = parseOpacityValue(match[1])
		return true
	}

	// bg-opacity-{0-100} or bg-opacity-[value]
	match = attr.match(BG_OPACITY_RE)
	if (match) {
		result.bgOpacity = parseOpacityValue(match[1])
		return true
	}

	// border-opacity-{0-100} or border-opacity-[value]
	match = attr.match(BORDER_OPACITY_RE)
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
function parseOpacity(attr: string, result: ParsedAttrs): boolean {
	// opacity-{0-100} or opacity-[value]
	const match = attr.match(OPACITY_RE)
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
 * 
 * Note: We do NOT set display: none here. The wrapWithResponsive() function
 * in html-helpers.ts handles hiding by wrapping the element in a div with
 * the appropriate inline styles and class. Setting display: none in parsed.css
 * would cause the inner element to stay hidden even when the outer wrapper
 * is revealed by the media query.
 */
function parseResponsive(attr: string, result: ParsedAttrs): boolean {
	if (attr === 'mobile-only') {
		result.responsive = 'mobile-only'
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
		let match = attr.match(WIDTH_ARBITRARY_RE)
		if (match) {
			return remToPx(match[1], rootSize)
		}
		// w-{scale}
		match = attr.match(WIDTH_SCALE_RE)
		if (match) {
			const value = SPACING_SCALE[match[1]]
			if (value) return remToPx(value, rootSize)
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
		const match = attr.match(COLS_TEMPLATE_RE)
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
		const match = attr.match(ROWS_TEMPLATE_RE)
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
 * @param attrs - Array of attribute strings
 * @returns Cell padding value or undefined
 */
export function parseCellPadding(attrs: string[]): string | undefined {
	for (const attr of attrs) {
		// Check for arbitrary value: cell-padding-[8px]
		const arbitraryMatch = attr.match(CELL_PADDING_ARBITRARY_RE)
		if (arbitraryMatch) {
			return arbitraryMatch[1]
		}
		
		// Check for scale value: cell-padding-0 through cell-padding-12
		const scaleMatch = attr.match(CELL_PADDING_SCALE_RE)
		if (scaleMatch && SPACING_SCALE_PX[scaleMatch[1]]) {
			return SPACING_SCALE_PX[scaleMatch[1]]
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
 * @param attrs - Array of attribute strings
 * @returns Gap value or undefined
 */
export function parseGap(attrs: string[]): string | undefined {
	for (const attr of attrs) {
		// Check for arbitrary value: gap-[20px]
		const arbitraryMatch = attr.match(GAP_ARBITRARY_RE)
		if (arbitraryMatch) {
			return arbitraryMatch[1]
		}
		
		// Check for scale value: gap-0 through gap-12
		const scaleMatch = attr.match(GAP_SCALE_RE)
		if (scaleMatch && SPACING_SCALE_PX[scaleMatch[1]]) {
			return SPACING_SCALE_PX[scaleMatch[1]]
		}
	}
	return undefined
}

// ============================================================================
// Cell Attributes Extraction (Consolidated)
// ============================================================================

/**
 * Result of extractCellAttrs - all cell-related attributes in one pass.
 */
export interface CellAttrs {
	colspan?: number
	rowspan?: number
	valign?: 'top' | 'middle' | 'bottom'
	textAlign?: 'left' | 'center' | 'right'
	width?: string
	height?: string
	responsive?: 'mobile-only' | 'desktop-only'
}

/**
 * Extract all cell-related attributes from an attrs array in a single pass.
 * Used by Grid and Table renderers to get <td> attributes efficiently.
 * 
 * Extracts:
 * - colspan: span-{2-12} or span-[N]
 * - rowspan: row-span-{2-12} or row-span-[N]
 * - valign: align-top, align-middle, align-bottom (and compound forms)
 * - textAlign: align-* or justify-* for horizontal alignment
 * - width: w-{value}, w-[value], or w-full
 * - height: h-full, h-screen (signals cell should expand to fill row height)
 * - responsive: mobile-only or desktop-only
 * 
 * @param attrs - Array of Tailwind-like attributes
 * @param rootSize - Root font size for rem conversion
 * @returns Object with all extracted cell attributes
 * 
 * @example
 * ```ts
 * extractCellAttrs(['span-2', 'align-top-left', 'w-[200px]', 'h-full'], 16)
 * // → { colspan: 2, valign: 'top', textAlign: 'left', width: '200px', height: '100%' }
 * ```
 */
export function extractCellAttrs(attrs: string[], rootSize: number): CellAttrs {
	const result: CellAttrs = {}
	
	for (const attr of attrs) {
		// colspan: span-{2-12} or span-[N]
		if (!result.colspan) {
			let match = attr.match(SPAN_RE)
			if (match) {
				const value = parseInt(match[1])
				if (value >= 2 && value <= 12) result.colspan = value
			} else {
				match = attr.match(SPAN_ARBITRARY_RE)
				if (match) result.colspan = parseInt(match[1])
			}
		}
		
		// rowspan: row-span-{2-12} or row-span-[N]
		if (!result.rowspan) {
			let match = attr.match(ROW_SPAN_RE)
			if (match) {
				const value = parseInt(match[1])
				if (value >= 2 && value <= 12) result.rowspan = value
			} else {
				match = attr.match(ROW_SPAN_ARBITRARY_RE)
				if (match) result.rowspan = parseInt(match[1])
			}
		}
		
		// valign: vertical alignment from align-* compound attributes
		if (!result.valign) {
			if (attr === 'align-top' || attr === 'align-top-left' || attr === 'align-top-right') {
				result.valign = 'top'
			} else if (
				attr === 'align-middle' || attr === 'align-middle-left' || attr === 'align-middle-right' ||
				attr === 'align-left' || attr === 'align-center' || attr === 'align-right'
			) {
				result.valign = 'middle'
			} else if (attr === 'align-bottom' || attr === 'align-bottom-left' || attr === 'align-bottom-right') {
				result.valign = 'bottom'
			}
		}
		
		// textAlign: horizontal alignment from align-* and justify-*
		if (!result.textAlign) {
			if (attr === 'align-top-left' || attr === 'align-left' || attr === 'align-middle-left' || attr === 'align-bottom-left' || attr === 'justify-left') {
				result.textAlign = 'left'
			} else if (attr === 'align-top' || attr === 'align-middle' || attr === 'align-center' || attr === 'align-bottom' || attr === 'justify-center') {
				result.textAlign = 'center'
			} else if (attr === 'align-top-right' || attr === 'align-right' || attr === 'align-middle-right' || attr === 'align-bottom-right' || attr === 'justify-right') {
				result.textAlign = 'right'
			}
		}
		
		// width: w-{value}, w-[value], w-full, w-screen
		if (!result.width) {
			result.width = extractWidthValue(attr, rootSize)
		}
		
		// height: h-full or h-screen signals the cell should expand to fill row height
		if (!result.height) {
			if (attr === 'h-full' || attr === 'h-screen') {
				result.height = '100%'
			}
		}
		
		// responsive: mobile-only or desktop-only
		if (!result.responsive) {
			if (attr === 'mobile-only') result.responsive = 'mobile-only'
			else if (attr === 'desktop-only') result.responsive = 'desktop-only'
		}
	}
	
	return result
}

/**
 * Extract width value from a single attribute.
 * Internal helper for extractCellAttrs.
 */
function extractWidthValue(attr: string, rootSize: number): string | undefined {
	// w-full → 100%
	if (attr === 'w-full') return '100%'
	// w-screen → 100% (aliased, not actual viewport width)
	if (attr === 'w-screen') return '100%'
	
	// w-{n} → scale lookup (including fractions)
	let match = attr.match(WIDTH_FRACTION_RE)
	if (match) {
		// Handle fraction: w-1/2, w-1/3, etc.
		if (match[1].includes('/')) {
			const [num, denom] = match[1].split('/').map(Number)
			return `${(num / denom) * 100}%`
		}
		// Scale lookup: w-0, w-1, w-2, etc.
		const scale: Record<string, string> = {
			'0': '0px', '1': '4px', '2': '8px', '3': '12px', '4': '16px',
			'5': '20px', '6': '24px', '7': '28px', '8': '32px', '9': '36px',
			'10': '40px', '11': '44px', '12': '48px', '14': '56px', '16': '64px',
			'20': '80px', '24': '96px', '28': '112px', '32': '128px', '36': '144px',
			'40': '160px', '44': '176px', '48': '192px', '52': '208px', '56': '224px',
			'60': '240px', '64': '256px', '72': '288px', '80': '320px', '96': '384px'
		}
		if (scale[match[1]]) return scale[match[1]]
	}
	
	// w-[value] → arbitrary
	match = attr.match(WIDTH_ARBITRARY_RE)
	if (match) {
		const value = match[1]
		// Handle rem values
		if (value.endsWith('rem')) {
			const rem = parseFloat(value)
			return `${rem * rootSize}px`
		}
		return value
	}
	
	return undefined
}
