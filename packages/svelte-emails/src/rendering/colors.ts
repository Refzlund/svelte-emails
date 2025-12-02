/**
 * Color utilities for opacity blending and hex manipulation.
 * 
 * Email clients don't reliably support rgba() or CSS opacity, so we
 * pre-blend colors against the background to emulate transparency.
 * 
 * @see ARCHITECTURE.md for color blending algorithm details
 */

import type { RGB, ColorWithOpacity } from './types'

// ============================================================================
// Color Blending
// ============================================================================

/**
 * Blend a foreground color with opacity against a background color.
 * Used to emulate transparency in email clients that don't support rgba/opacity.
 * 
 * Algorithm: result = fg * opacity + bg * (1 - opacity)
 * 
 * @param foreground - The color to blend (hex)
 * @param background - The background color (hex)
 * @param opacity - Opacity value 0-1
 * @returns Blended solid hex color
 * 
 * @example
 * ```ts
 * blendColor('#000000', '#ffffff', 0.5) // → '#808080' (gray)
 * blendColor('#ff0000', '#ffffff', 0.5) // → '#ff8080' (light red)
 * ```
 */
export function blendColor(foreground: string, background: string, opacity: number): string {
	const fg = parseHex(foreground)
	const bg = parseHex(background)

	const r = Math.round(fg.r * opacity + bg.r * (1 - opacity))
	const g = Math.round(fg.g * opacity + bg.g * (1 - opacity))
	const b = Math.round(fg.b * opacity + bg.b * (1 - opacity))

	return rgbToHex(r, g, b)
}

// ============================================================================
// Hex Parsing & Conversion
// ============================================================================

/**
 * Parse a hex color to RGB components.
 * Supports #RGB, #RRGGBB, #RRGGBBAA formats.
 * 
 * @param hex - Hex color string (with or without #)
 * @returns RGB components (0-255 each)
 * 
 * @example
 * ```ts
 * parseHex('#fff')    // → { r: 255, g: 255, b: 255 }
 * parseHex('#ff0000') // → { r: 255, g: 0, b: 0 }
 * ```
 */
export function parseHex(hex: string): RGB {
	hex = hex.replace('#', '')

	// Expand shorthand (#RGB → #RRGGBB)
	if (hex.length === 3) {
		hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
	}

	return {
		r: parseInt(hex.slice(0, 2), 16),
		g: parseInt(hex.slice(2, 4), 16),
		b: parseInt(hex.slice(4, 6), 16)
	}
}

/**
 * Convert RGB components to hex string.
 * 
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @returns Hex color string with # prefix
 * 
 * @example
 * ```ts
 * rgbToHex(255, 128, 0) // → '#ff8000'
 * ```
 */
export function rgbToHex(r: number, g: number, b: number): string {
	return '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')
}

// ============================================================================
// Opacity Parsing
// ============================================================================

/**
 * Parse a color value with optional opacity modifier.
 * Handles both Tailwind notation (/50 = 50%) and arbitrary ([0.33]).
 * 
 * @param color - The base hex color
 * @param opacityPart - Optional opacity modifier (e.g., "50", "[0.33]")
 * @returns Object with color and opacity (0-1)
 * 
 * @example
 * ```ts
 * parseColorWithOpacity('#ff0000')           // → { color: '#ff0000', opacity: 1 }
 * parseColorWithOpacity('#ff0000', '50')     // → { color: '#ff0000', opacity: 0.5 }
 * parseColorWithOpacity('#ff0000', '[0.33]') // → { color: '#ff0000', opacity: 0.33 }
 * ```
 */
export function parseColorWithOpacity(color: string, opacityPart?: string): ColorWithOpacity {
	if (!opacityPart) return { color, opacity: 1 }

	// /[0.33] → 0.33, /50 → 0.5
	const opacity = opacityPart.startsWith('[')
		? parseFloat(opacityPart.slice(1, -1))
		: parseInt(opacityPart) / 100

	return { color, opacity }
}

// ============================================================================
// Color Validation
// ============================================================================

/**
 * Check if a string is a valid hex color.
 * 
 * @param str - String to validate
 * @returns True if valid hex color
 * 
 * @example
 * ```ts
 * isValidHex('#fff')      // → true
 * isValidHex('#ff0000')   // → true
 * isValidHex('#ff0000aa') // → true (with alpha)
 * isValidHex('red')       // → false
 * ```
 */
export function isValidHex(str: string): boolean {
	return /^#[0-9a-fA-F]{3,8}$/.test(str)
}

/**
 * Normalize a hex color to 6-digit lowercase format.
 * 
 * @param hex - Hex color string
 * @returns Normalized 6-digit hex (e.g., '#ff0000')
 * 
 * @example
 * ```ts
 * normalizeHex('#FFF')    // → '#ffffff'
 * normalizeHex('#FF0000') // → '#ff0000'
 * ```
 */
export function normalizeHex(hex: string): string {
	hex = hex.replace('#', '').toLowerCase()

	// Expand shorthand
	if (hex.length === 3) {
		hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
	}

	// Strip alpha if present
	if (hex.length === 8) {
		hex = hex.slice(0, 6)
	}

	return '#' + hex
}
