/**
 * Rendering system exports.
 * 
 * This module provides utilities for converting the IR tree
 * to email-safe HTML and plain text output.
 */

// Types
export type {
	RenderOutput,
	RenderOptions,
	StyleConfig,
	InheritedStyles,
	ParsedAttrs,
	RenderContext
} from './types'

// Constants
export { MOBILE_BREAKPOINT } from './CONSTANTS'

// Attribute Parsing
export {
	parseAttrs,
	remToPx,
	extractWidthFromAttrs,
	extractCellAttrs
} from './parse-attrs'

// HTML Helpers
export {
	toInlineCSS,
	htmlAttrs,
	presentationTable,
	wrapWithMargin,
	applyWrappers,
	extractInheritable
} from './html-helpers'

// Content Processing
export {
	parseMarkdown,
	interpolatePlaceholders,
	escapeHtml,
	formatFootnotes
} from './content'

// Style Helpers
export {
	buildCssFromConfig,
	buildCell,
	buildCellStylesFromRow,
	extractRowStylesForCells,
	CONFIG_MAPPINGS
} from './style-helpers'

// HTML Formatting
export { formatHtml } from './format-html'
