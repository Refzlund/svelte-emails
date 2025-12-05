/**
 * Style configuration and presets for email rendering.
 * 
 * StyleConfig defines the complete theming structure for all components.
 * Presets provide ready-to-use configurations.
 * 
 * @see ARCHITECTURE.md for how styles are applied during rendering
 */

// ============================================================================
// Style Configuration Types
// ============================================================================

/**
 * Root-level style configuration.
 * Sets base values inherited by all components.
 */
export interface RootStyle {
	/** Base font size for rem calculations (default: 16) */
	size?: number | string
	/** Default text color */
	color?: string
	/** Default background color */
	background?: string
	/** Default line height */
	lineHeight?: string | number
	/** Default font family (used by font-base to reset from font-mono) */
	fontFamily?: string
	/** Monospace font family (used by font-mono attribute) */
	monoFontFamily?: string
}

/**
 * Heading style configuration.
 */
export interface HeadingStyle {
	/** Font size */
	size?: string
	/** Font weight */
	weight?: string | number
	/** Line height */
	lineHeight?: string | number
	/** Text color */
	color?: string
	/** Padding (e.g., '0', '8px 0', '16px') */
	padding?: string
	/** Optional rule/divider below heading */
	rule?: {
		/** Rule color */
		color?: string
		/** Rule thickness */
		thickness?: string
		/** Spacing between text and rule */
		spacing?: string
	}
}

/**
 * Span (inline text) style configuration.
 */
export interface SpanStyle {
	/** Font size */
	size?: string
	/** Line height */
	lineHeight?: string | number
	/** Text color */
	color?: string
}

/**
 * Text component style configuration.
 */
export interface TextStyle {
	/** Default text color (can be 'inherit') */
	color?: string
	/** H1 heading styles */
	H1?: HeadingStyle
	/** H2 heading styles */
	H2?: HeadingStyle
	/** H3 heading styles */
	H3?: HeadingStyle
	/** H4 heading styles */
	H4?: HeadingStyle
	/** H5 heading styles */
	H5?: HeadingStyle
	/** H6 heading styles */
	H6?: HeadingStyle
	/** Paragraph styles */
	Paragraph?: {
		size?: string
		lineHeight?: string | number
		color?: string
		padding?: string
	}
	/** Small text styles */
	Small?: {
		size?: string
		lineHeight?: string | number
		color?: string
		padding?: string
	}
	/** Span (inline text) styles */
	Span?: SpanStyle
}

/**
 * Link component style configuration.
 */
export interface LinkStyle {
	/** Link text color */
	color?: string
	/** Text decoration (underline, none, etc.) */
	textDecoration?: string
	/** Hover color (limited email support) */
	hoverColor?: string
}

/**
 * Button component style configuration.
 */
export interface ButtonStyle {
	/** Button text color */
	color?: string
	/** Button background color */
	background?: string
	/** Padding (e.g., '12px 24px') */
	padding?: string
	/** Border radius */
	borderRadius?: string
	/** Font weight */
	fontWeight?: string | number
	/** Border (e.g., '1px solid #ccc') */
	border?: string
}

/**
 * Spacer component style configuration.
 */
export interface SpacerStyle {
	/** Default spacer height */
	size?: string
}

/**
 * Divider component style configuration.
 */
export interface DividerStyle {
	/** Divider color */
	color?: string
	/** Divider thickness */
	thickness?: string
	/** Border style (solid, dashed, dotted) */
	style?: 'solid' | 'dashed' | 'dotted'
}

/**
 * Code (inline) style configuration.
 */
export interface CodeStyle {
	/** Text color */
	color?: string
	/** Background color */
	background?: string
	/** Padding */
	padding?: string
	/** Border radius */
	borderRadius?: string
	/** Font family */
	fontFamily?: string
	/** Font size */
	size?: string
}

/**
 * Code block style configuration.
 */
export interface CodeblockStyle {
	/** Text color */
	color?: string
	/** Background color */
	background?: string
	/** Padding */
	padding?: string
	/** Border radius */
	borderRadius?: string
	/** Font family */
	fontFamily?: string
	/** Font size */
	size?: string
	/** Line height */
	lineHeight?: string | number
	/** White space handling (default: pre-wrap) */
	whiteSpace?: string
	/** Word wrap (default: break-word) */
	wordWrap?: string
	/** Overflow wrap (default: break-word) */
	overflowWrap?: string
}

/**
 * Highlight (text background) style configuration.
 */
export interface HighlightStyle {
	/** Text color */
	color?: string
	/** Background color */
	background?: string
}

/**
 * Unsubscribe link style configuration.
 */
export interface UnsubscribeStyle {
	/** Text color */
	color?: string
	/** Font size */
	size?: string
}

/**
 * Table component style configuration.
 */
export interface TableStyle {
	/** Border color */
	borderColor?: string
	/** Border width */
	borderWidth?: string
	/** Header row background color */
	headerBackground?: string
	/** Header row text color */
	headerColor?: string
	/** Header row font weight */
	headerWeight?: string | number
	/** Striped row background color */
	stripedBackground?: string
	/** Cell padding (normal) */
	cellPadding?: string
	/** Cell padding (compact) */
	compactCellPadding?: string
}

/**
 * Complete style configuration for email rendering.
 * All properties are optional — defaults are applied for missing values.
 */
export interface StyleConfig {
	/** Root-level styles (base font size, colors, etc.) */
	root?: RootStyle
	/** Text component styles */
	Text?: TextStyle
	/** Link component styles */
	Link?: LinkStyle
	/** Button component styles */
	Button?: ButtonStyle
	/** Spacer component styles */
	Spacer?: SpacerStyle
	/** Divider component styles */
	Divider?: DividerStyle
	/** Inline code styles */
	Code?: CodeStyle
	/** Code block styles */
	Codeblock?: CodeblockStyle
	/** Text highlight styles */
	Highlight?: HighlightStyle
	/** Unsubscribe link styles */
	Unsubscribe?: UnsubscribeStyle
	/** Table component styles */
	Table?: TableStyle
}

// ============================================================================
// Presets
// ============================================================================

// Re-export presets from dedicated folder
export * as presets from './presets'

// Import base preset for use in renderer
import { base } from './presets/base'
export { base as basePreset }

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Prepend font families to an existing font stack.
 * Used when merging font presets to maintain fallbacks.
 * 
 * @param newFonts - Font families to prepend
 * @param existingFonts - Existing font stack
 * @returns Combined font stack with newFonts first
 * 
 * @example
 * ```ts
 * prependFontFamily('Arial', 'Helvetica, sans-serif')
 * // Returns: 'Arial, Helvetica, sans-serif'
 * 
 * prependFontFamily('"Open Sans"', 'Arial, sans-serif')
 * // Returns: '"Open Sans", Arial, sans-serif'
 * ```
 */
export function prependFontFamily(newFonts: string, existingFonts?: string): string {
	if (!existingFonts) return newFonts
	return `${newFonts}, ${existingFonts}`
}

/**
 * Deep merge two style configurations.
 * The second argument overrides values from the first.
 * 
 * Special handling for fontFamily: prepends instead of replacing,
 * so fallback fonts are preserved.
 * 
 * @param base - Base style configuration
 * @param overrides - Overrides to apply
 * @returns Merged style configuration
 * 
 * @example
 * ```ts
 * const custom = merge(presets.base, {
 *   root: { size: 18 },
 *   Button: { background: '#ff0000' }
 * })
 * ```
 */
export function merge<T extends Record<any, any>>(
	base: T,
	overrides?: Partial<T>
): T {
	if (!overrides) return base

	const result = { ...base }

	for (const key in overrides) {
		const baseValue = base[key]
		const overrideValue = overrides[key]

		// Special handling for fontFamily: prepend instead of replace
		if (key === 'fontFamily' && typeof overrideValue === 'string') {
			if (typeof baseValue === 'string') {
				result[key] = prependFontFamily(overrideValue, baseValue) as T[Extract<keyof T, string>]
			} else {
				result[key] = overrideValue as T[Extract<keyof T, string>]
			}
		} else if (
			typeof baseValue === 'object' &&
			baseValue !== null &&
			!Array.isArray(baseValue) &&
			typeof overrideValue === 'object' &&
			overrideValue !== null &&
			!Array.isArray(overrideValue)
		) {
			// Recursively merge objects
			result[key] = merge(
				baseValue as Record<string, unknown>,
				overrideValue as Record<string, unknown>
			) as T[Extract<keyof T, string>]
		} else if (overrideValue !== undefined) {
			result[key] = overrideValue as T[Extract<keyof T, string>]
		}
	}

	return result
}

/**
 * Get the root font size as a number (for rem calculations).
 * Handles both number and string inputs.
 * 
 * @param style - Style configuration
 * @returns Root font size as number (default: 16)
 */
export function getRootSize(style?: StyleConfig): number {
	const size = style?.root?.size
	if (typeof size === 'number') return size
	if (typeof size === 'string') {
		const parsed = parseFloat(size)
		return isNaN(parsed) ? 16 : parsed
	}
	return 16
}
