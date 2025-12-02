/**
 * Geometric font preset.
 * 
 * Clean, modern geometric sans-serif fonts with uniform strokes.
 * Good for tech, modern, and minimalist design aesthetics.
 * 
 * Font stack:
 * - "Century Gothic": Windows
 * - "Apple Gothic": macOS (older)
 * - AppleGothic: macOS (older)
 * - Futura: macOS
 * - Arial: Universal fallback
 * - sans-serif: Generic fallback
 */

import type { StyleConfig } from '../../styles'
import { MONOSPACE_FONT_STACK } from '../base'

export const geometric: StyleConfig = {
	root: {
		fontFamily: '"Century Gothic", Futura, "Apple Gothic", AppleGothic, Arial, sans-serif'
	},
	Code: {
		fontFamily: MONOSPACE_FONT_STACK
	},
	Codeblock: {
		fontFamily: MONOSPACE_FONT_STACK
	}
}
