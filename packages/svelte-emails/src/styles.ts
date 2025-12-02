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
	/** Default font family */
	fontFamily?: string
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
	}
	/** Small text styles */
	Small?: {
		size?: string
		lineHeight?: string | number
		color?: string
	}
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

/**
 * Minimal preset — clean, modern defaults.
 * Uses system fonts and subtle styling.
 */
export const minimal: StyleConfig = {
	root: {
		color: '#1b1b1d',
		background: '#ffffff',
		size: 16,
		lineHeight: 1.5,
		fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
	},
	Text: {
		color: 'inherit',
		H1: {
			size: '2.5rem',
			weight: 700,
			lineHeight: 1.2
		},
		H2: {
			size: '2rem',
			weight: 700,
			lineHeight: 1.25
		},
		H3: {
			size: '1.5rem',
			weight: 600,
			lineHeight: 1.3
		},
		H4: {
			size: '1.25rem',
			weight: 600,
			lineHeight: 1.35
		},
		H5: {
			size: '1rem',
			weight: 600,
			lineHeight: 1.4
		},
		H6: {
			size: '0.875rem',
			weight: 600,
			lineHeight: 1.4
		},
		Paragraph: {
			size: '1rem',
			lineHeight: 1.6
		},
		Small: {
			size: '0.875rem',
			lineHeight: 1.5
		}
	},
	Link: {
		color: '#2563eb',
		textDecoration: 'underline'
	},
	Button: {
		color: '#ffffff',
		background: '#2563eb',
		padding: '12px 24px',
		borderRadius: '6px',
		fontWeight: 600
	},
	Spacer: {
		size: '2rem'
	},
	Divider: {
		color: '#e5e7eb',
		thickness: '1px',
		style: 'solid'
	},
	Code: {
		color: '#1f2937',
		background: '#f3f4f6',
		padding: '2px 6px',
		borderRadius: '4px',
		fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
		size: '0.875em'
	},
	Codeblock: {
		color: '#1f2937',
		background: '#f3f4f6',
		padding: '16px',
		borderRadius: '8px',
		fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
		size: '0.875rem',
		lineHeight: 1.5
	},
	Highlight: {
		color: 'inherit',
		background: '#fef08a'
	},
	Unsubscribe: {
		color: '#6b7280',
		size: '0.75rem'
	},
	Table: {
		borderColor: '#e5e7eb',
		borderWidth: '1px',
		headerBackground: '#f9fafb',
		headerColor: '#111827',
		headerWeight: 600,
		stripedBackground: '#f9fafb',
		cellPadding: '12px 16px',
		compactCellPadding: '8px 12px'
	}
}

/**
 * Dark preset — dark mode compatible.
 * Uses dark backgrounds with light text.
 */
export const dark: StyleConfig = {
	root: {
		color: '#e5e7eb',
		background: '#111827',
		size: 16,
		lineHeight: 1.5,
		fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
	},
	Text: {
		color: 'inherit',
		H1: {
			size: '2.5rem',
			weight: 700,
			lineHeight: 1.2,
			color: '#f9fafb'
		},
		H2: {
			size: '2rem',
			weight: 700,
			lineHeight: 1.25,
			color: '#f9fafb'
		},
		H3: {
			size: '1.5rem',
			weight: 600,
			lineHeight: 1.3,
			color: '#f9fafb'
		},
		H4: {
			size: '1.25rem',
			weight: 600,
			lineHeight: 1.35,
			color: '#f9fafb'
		},
		H5: {
			size: '1rem',
			weight: 600,
			lineHeight: 1.4,
			color: '#f9fafb'
		},
		H6: {
			size: '0.875rem',
			weight: 600,
			lineHeight: 1.4,
			color: '#f9fafb'
		},
		Paragraph: {
			size: '1rem',
			lineHeight: 1.6
		},
		Small: {
			size: '0.875rem',
			lineHeight: 1.5,
			color: '#9ca3af'
		}
	},
	Link: {
		color: '#60a5fa',
		textDecoration: 'underline'
	},
	Button: {
		color: '#111827',
		background: '#60a5fa',
		padding: '12px 24px',
		borderRadius: '6px',
		fontWeight: 600
	},
	Spacer: {
		size: '2rem'
	},
	Divider: {
		color: '#374151',
		thickness: '1px',
		style: 'solid'
	},
	Code: {
		color: '#e5e7eb',
		background: '#1f2937',
		padding: '2px 6px',
		borderRadius: '4px',
		fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
		size: '0.875em'
	},
	Codeblock: {
		color: '#e5e7eb',
		background: '#1f2937',
		padding: '16px',
		borderRadius: '8px',
		fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
		size: '0.875rem',
		lineHeight: 1.5
	},
	Highlight: {
		color: '#1f2937',
		background: '#fde68a'
	},
	Unsubscribe: {
		color: '#9ca3af',
		size: '0.75rem'
	},
	Table: {
		borderColor: '#374151',
		borderWidth: '1px',
		headerBackground: '#1f2937',
		headerColor: '#f9fafb',
		headerWeight: 600,
		stripedBackground: '#1f2937',
		cellPadding: '12px 16px',
		compactCellPadding: '8px 12px'
	}
}

/**
 * Collection of all available presets.
 */
export const presets = {
	minimal,
	dark
} as const

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Deep merge two style configurations.
 * The second argument overrides values from the first.
 * 
 * @param base - Base style configuration
 * @param overrides - Overrides to apply
 * @returns Merged style configuration
 * 
 * @example
 * ```ts
 * const custom = merge(presets.minimal, {
 *   root: { size: 18 },
 *   Button: { background: '#ff0000' }
 * })
 * ```
 */
export function merge<T extends Record<string, unknown>>(
	base: T,
	overrides?: Partial<T>
): T {
	if (!overrides) return base

	const result = { ...base }

	for (const key in overrides) {
		const baseValue = base[key]
		const overrideValue = overrides[key]

		if (
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
