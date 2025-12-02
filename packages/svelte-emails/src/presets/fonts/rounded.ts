/**
 * Rounded font preset.
 * 
 * Friendly, approachable fonts with rounded characteristics.
 * Good for casual, friendly, and consumer-focused emails.
 * 
 * Font stack:
 * - Verdana: Windows, macOS (excellent screen readability)
 * - "Trebuchet MS": Windows, macOS
 * - Geneva: macOS
 * - Arial: Universal fallback
 * - sans-serif: Generic fallback
 */

import type { StyleConfig } from '../../styles'
import { MONOSPACE_FONT_STACK } from '../base'

export const rounded: StyleConfig = {
	root: {
		fontFamily: 'Verdana, "Trebuchet MS", Geneva, Arial, sans-serif'
	},
	Code: {
		fontFamily: MONOSPACE_FONT_STACK
	},
	Codeblock: {
		fontFamily: MONOSPACE_FONT_STACK
	}
}
