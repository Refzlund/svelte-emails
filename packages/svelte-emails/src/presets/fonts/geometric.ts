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

export const geometric: StyleConfig = {
	root: {
		fontFamily: '"Century Gothic", Futura, "Apple Gothic", AppleGothic, Arial, sans-serif'
	},
	Code: {
		fontFamily: 'Consolas, Monaco, "Lucida Console", "Courier New", Courier, monospace'
	},
	Codeblock: {
		fontFamily: 'Consolas, Monaco, "Lucida Console", "Courier New", Courier, monospace'
	}
}
