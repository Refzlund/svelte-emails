/**
 * Constants for style attribute parsing.
 * Defines scales and presets based on Tailwind CSS conventions.
 * 
 * All values stored in rem for relative spacing. The parser converts
 * rem to px at render time using the configured root size (default: 16px).
 * 
 * @see ARCHITECTURE.md for the rem-to-px conversion strategy
 */

// ============================================================================
// Spacing Scale (in rem)
// ============================================================================

/**
 * Tailwind spacing scale values in rem units.
 * Converted to px at parse time using root.size (default: 16px).
 * 
 * Usage: p-4 → 1rem → 16px, m-2 → 0.5rem → 8px
 */
export const SPACING_SCALE: Record<string, string> = {
	'0': '0',
	'0.25': '0.0625rem',
	'0.5': '0.125rem',
	'0.75': '0.1875rem',
	'1': '0.25rem',
	'1.5': '0.375rem',
	'2': '0.5rem',
	'2.5': '0.625rem',
	'3': '0.75rem',
	'3.5': '0.875rem',
	'4': '1rem',
	'5': '1.25rem',
	'6': '1.5rem',
	'7': '1.75rem',
	'8': '2rem',
	'9': '2.25rem',
	'10': '2.5rem',
	'11': '2.75rem',
	'12': '3rem',
	'14': '3.5rem',
	'16': '4rem',
	'20': '5rem',
	'24': '6rem',
	'28': '7rem',
	'32': '8rem',
	'36': '9rem',
	'40': '10rem',
	'44': '11rem',
	'48': '12rem',
	'52': '13rem',
	'56': '14rem',
	'60': '15rem',
	'64': '16rem',
	'72': '18rem',
	'80': '20rem',
	'96': '24rem'
}

// ============================================================================
// Typography Presets
// ============================================================================

/**
 * Font size presets with associated line heights in rem.
 * Converted to px at parse time. Base (1rem) = 16px by default.
 * 
 * Usage: text-sm → 0.875rem/1.25rem → 14px/20px
 */
export const FONT_SIZES: Record<string, { fontSize: string; lineHeight: string }> = {
	'xs': { fontSize: '0.75rem', lineHeight: '1rem' },
	'sm': { fontSize: '0.875rem', lineHeight: '1.25rem' },
	'base': { fontSize: '1rem', lineHeight: '1.5rem' },
	'lg': { fontSize: '1.125rem', lineHeight: '1.75rem' },
	'xl': { fontSize: '1.25rem', lineHeight: '1.75rem' },
	'2xl': { fontSize: '1.5rem', lineHeight: '2rem' },
	'3xl': { fontSize: '1.875rem', lineHeight: '2.25rem' },
	'4xl': { fontSize: '2.25rem', lineHeight: '2.5rem' },
	'5xl': { fontSize: '3rem', lineHeight: '1' },
	'6xl': { fontSize: '3.75rem', lineHeight: '1' },
	'7xl': { fontSize: '4.5rem', lineHeight: '1' },
	'8xl': { fontSize: '6rem', lineHeight: '1' },
	'9xl': { fontSize: '8rem', lineHeight: '1' }
}

/**
 * Font weight presets.
 * 
 * Usage: font-bold → 700, font-medium → 500
 */
export const FONT_WEIGHTS: Record<string, string> = {
	'thin': '100',
	'extralight': '200',
	'light': '300',
	'normal': '400',
	'medium': '500',
	'semibold': '600',
	'bold': '700',
	'extrabold': '800',
	'black': '900'
}

/**
 * Line height presets (named values).
 * 
 * Usage: leading-tight → 1.25, leading-relaxed → 1.625
 */
export const LINE_HEIGHTS: Record<string, string> = {
	'none': '1',
	'tight': '1.25',
	'snug': '1.375',
	'normal': '1.5',
	'relaxed': '1.625',
	'loose': '2'
}

/**
 * Letter spacing presets.
 * 
 * Usage: tracking-tight → -0.025em, tracking-wide → 0.025em
 */
export const LETTER_SPACINGS: Record<string, string> = {
	'tighter': '-0.05em',
	'tight': '-0.025em',
	'normal': '0',
	'wide': '0.025em',
	'wider': '0.05em',
	'widest': '0.1em'
}

// ============================================================================
// Border & Radius Presets
// ============================================================================

/**
 * Border radius presets in rem.
 * Converted to px at parse time.
 * Note: Border-radius is not supported in Outlook Windows.
 * 
 * Usage: rounded-lg → 0.5rem → 8px
 */
export const BORDER_RADII: Record<string, string> = {
	'none': '0',
	'sm': '0.125rem',
	'': '0.25rem',      // Default 'rounded'
	'md': '0.375rem',
	'lg': '0.5rem',
	'xl': '0.75rem',
	'2xl': '1rem',
	'3xl': '1.5rem',
	'full': '9999px'
}

/**
 * Border width scale in px (borders typically don't use rem).
 * 
 * Usage: border-2 → 2px, border-4 → 4px
 */
export const BORDER_WIDTHS: Record<string, string> = {
	'0': '0',
	'1': '1px',
	'2': '2px',
	'4': '4px',
	'8': '8px'
}

// ============================================================================
// Sizing Presets
// ============================================================================

/**
 * Max-width presets for container widths in rem.
 * Converted to px at parse time.
 * 
 * Usage: max-w-md → 28rem → 448px
 */
export const MAX_WIDTHS: Record<string, string> = {
	'xs': '20rem',
	'sm': '24rem',
	'md': '28rem',
	'lg': '32rem',
	'xl': '36rem',
	'2xl': '42rem',
	'3xl': '48rem',
	'4xl': '56rem',
	'5xl': '64rem',
	'6xl': '72rem',
	'7xl': '80rem'
}

// ============================================================================
// Default Values
// ============================================================================

/**
 * Default root font size for rem calculations.
 * Can be overridden via style preset's root.size.
 */
export const DEFAULT_ROOT_SIZE = 16

/**
 * Default mobile breakpoint for responsive styles.
 * Used for `responsive` columns, `mobile-only`, and `desktop-only`.
 * Can be customized per-email with `mobile-threshold` attribute.
 */
export const DEFAULT_MOBILE_BREAKPOINT = 480

// ============================================================================
// Derived Scales (px-based)
// ============================================================================

/**
 * Spacing scale in px units (derived from SPACING_SCALE at default 16px root).
 * Used for gap, cell-padding, and other properties that need px values directly.
 */
export const SPACING_SCALE_PX: Record<string, string> = {
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