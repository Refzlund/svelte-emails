/**
 * Rendering system exports.
 * 
 * This module provides all utilities needed for converting the IR tree
 * to email-safe HTML and plain text output.
 * 
 * @example
 * ```ts
 * import { parseAttrs, toInlineCSS, blendColor } from './rendering'
 * 
 * const parsed = parseAttrs(['p-4', 'bg-[#fff]/50'], inherited)
 * const style = toInlineCSS(parsed.css, inherited)
 * ```
 */

// Types
export type {
	RenderOutput,
	RenderOptions,
	StyleConfig,
	InheritedStyles,
	ParsedAttrs,
	RenderContext,
	RGB,
	ColorWithOpacity
} from './types'

// Constants
export {
	SPACING_SCALE,
	FONT_SIZES,
	FONT_WEIGHTS,
	LINE_HEIGHTS,
	LETTER_SPACINGS,
	BORDER_RADII,
	BORDER_WIDTHS,
	MAX_WIDTHS,
	DEFAULT_ROOT_SIZE,
	DEFAULT_BACKGROUND_COLOR,
	DEFAULT_OPACITY,
	MOBILE_BREAKPOINT
} from './CONSTANTS'

// Attribute Parsing
export {
	parseAttrs,
	parsePadding,
	parseMargin,
	parseWidth,
	parseHeight,
	parseMinMaxWidth,
	parseMinHeight,
	parseColor,
	parseAlignment,
	parseJustify,
	parseTypography,
	parseBorder,
	parseDisplay,
	parseOpacity,
	parseResponsive,
	remToPx,
	extractWidthFromAttrs,
	extractValignFromAttrs,
	extractTextAlignFromAttrs,
	extractResponsiveFromAttrs,
	extractColspanFromAttrs,
	extractRowspanFromAttrs,
	parseColumnTemplate,
	parseRowTemplate,
	parseCellPadding,
	parseGap
} from './parse-attrs'

// Color Utilities
export {
	blendColor,
	parseHex,
	rgbToHex,
	parseColorWithOpacity,
	isValidHex,
	normalizeHex
} from './colors'

// HTML Helpers
export {
	toKebabCase,
	toInlineCSS,
	htmlAttrs,
	presentationTable,
	wrapWithMargin,
	wrapWithResponsive,
	mergeWithInherited,
	extractInheritable,
	createDefaultInherited
} from './html-helpers'

// Content Processing
export {
	parseMarkdown,
	interpolatePlaceholders,
	escapeHtml,
	unescapeHtml,
	stripHtmlToText,
	formatFootnotes
} from './content'

// HTML Formatting
export { formatHtml } from './format-html'
