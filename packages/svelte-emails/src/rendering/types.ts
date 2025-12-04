/**
 * Shared types for the rendering system.
 * 
 * @see ARCHITECTURE.md for detailed documentation of these types
 */

import type { StyleConfig } from '../styles'

// Re-export StyleConfig for convenience
export type { StyleConfig } from '../styles'

// ============================================================================
// Render Output & Options
// ============================================================================

/**
 * Render output containing HTML, plain text, and email headers.
 */
export interface RenderOutput {
	html: string
	text: string
	/** Email headers (e.g., List-Unsubscribe, List-Unsubscribe-Post) */
	headers: Record<string, string>
}

/**
 * Options passed to the render function.
 */
export interface RenderOptions {
	/** Placeholder values for [[variable]] interpolation (e.g., { first_name: 'Alice' }) */
	placeholders?: Record<string, string>
	/** Style configuration (component theming, rem base size, etc.) */
	style?: StyleConfig
}

// ============================================================================
// Inherited Styles
// ============================================================================

/**
 * Inherited styles passed down during tree traversal.
 * These accumulate as we descend and affect child rendering.
 * 
 * All CSS properties that naturally inherit in browsers are tracked here
 * to ensure consistent rendering across email clients.
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/Inheritance
 */
export interface InheritedStyles {
	// --- Background (for opacity blending, not CSS inheritance) ---
	/** Current background color for opacity blending (default: #ffffff) */
	backgroundColor: string

	// --- Color ---
	/** Inherited text color */
	color?: string

	// --- Font Properties ---
	/** Inherited font family */
	fontFamily?: string
	/** Base font family (for font-base to reset to) */
	baseFontFamily?: string
	/** Monospace font family (for font-mono) */
	monoFontFamily?: string
	/** Inherited font size */
	fontSize?: string
	/** Inherited font weight */
	fontWeight?: string
	/** Inherited font style (normal, italic, oblique) */
	fontStyle?: string
	/** Inherited font variant (normal, small-caps) */
	fontVariant?: string

	// --- Text Properties ---
	/** Inherited text decoration (underline, overline, line-through, none) */
	textDecoration?: string
	/** Inherited text transform (uppercase, lowercase, capitalize, none) */
	textTransform?: string
	/** Inherited text align (left, center, right, justify) */
	textAlign?: string
	/** Inherited text indent */
	textIndent?: string

	// --- Spacing & Layout ---
	/** Inherited line height */
	lineHeight?: string
	/** Inherited letter spacing */
	letterSpacing?: string
	/** Inherited word spacing */
	wordSpacing?: string

	// --- Whitespace & Overflow ---
	/** Inherited white-space handling (normal, nowrap, pre, pre-line, pre-wrap) */
	whiteSpace?: string
	/** Inherited word break behavior */
	wordBreak?: string
	/** Inherited overflow wrap */
	overflowWrap?: string

	// --- Vertical Alignment (for table cells) ---
	/** Inherited vertical alignment */
	verticalAlign?: string

	// --- Visibility ---
	/** Inherited visibility (visible, hidden, collapse) */
	visibility?: string

	// --- List Properties ---
	/** Inherited list style type */
	listStyleType?: string
	/** Inherited list style position */
	listStylePosition?: string

	// --- Other ---
	/** Inherited cursor style */
	cursor?: string
	/** Inherited text direction */
	direction?: string

	// --- Border (for opacity blending) ---
	/** Inherited border color (defaults to text color if not set) */
	borderColor?: string

	// --- Opacity (compounds with color opacities) ---
	/** Element opacity multiplier (compounds with color opacities) */
	opacity: number
}

// ============================================================================
// Parsed Attributes
// ============================================================================

/**
 * CSS properties parsed from utility attributes.
 * This is the result of converting Tailwind-like attrs (e.g., 'p-4', 'bg-[#fff]')
 * into actual CSS property-value pairs.
 */
export interface ParsedAttrs {
	/** CSS properties to apply (e.g., { padding: '16px', backgroundColor: '#fff' }) */
	css: Record<string, string>
	/** Margin values (emulated via wrapper table, not applied directly) */
	margin?: {
		top?: string
		right?: string
		bottom?: string
		left?: string
	}
	/** Background color (extracted for inheritance tracking) */
	backgroundColor?: string
	/** Element opacity (extracted for compounding with color opacities) */
	opacity?: number
	/** Text color opacity modifier (from text-opacity-*) */
	textOpacity?: number
	/** Background color opacity modifier (from bg-opacity-*) */
	bgOpacity?: number
	/** Border color opacity modifier (from border-opacity-*) */
	borderOpacity?: number
	/** Responsive visibility mode */
	responsive?: 'mobile-only' | 'desktop-only'
}

// ============================================================================
// Render Context
// ============================================================================

/**
 * Context maintained during rendering traversal.
 */
export interface RenderContext {
	/** Placeholder values for [[variable]] interpolation */
	placeholders: Record<string, string>
	/** Footnotes collected for plain text output (links become [1], [2], etc.) */
	footnotes: Array<{ label: string; url: string }>
	/** Email headers collected during rendering (e.g., List-Unsubscribe) */
	headers: Record<string, string>
	/** Style configuration */
	style: StyleConfig
}

// ============================================================================
// Helper Types
// ============================================================================

/**
 * RGB color components.
 */
export interface RGB {
	r: number
	g: number
	b: number
}

/**
 * Color with opacity value.
 */
export interface ColorWithOpacity {
	color: string
	opacity: number
}
