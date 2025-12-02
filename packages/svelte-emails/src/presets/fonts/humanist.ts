/**
 * Humanist font preset.
 * 
 * Warm, readable humanist sans-serif fonts with calligraphic influence.
 * Good for approachable, human-centered communications.
 * 
 * Font stack:
 * - "Segoe UI": Windows (Vista+)
 * - "Lucida Grande": macOS
 * - "Lucida Sans Unicode": Windows
 * - Tahoma: Windows, macOS
 * - Arial: Universal fallback
 * - sans-serif: Generic fallback
 */

import type { StyleConfig } from '../../styles'
import { MONOSPACE_FONT_STACK } from '../base'

export const humanist: StyleConfig = {
	root: {
		fontFamily: '"Segoe UI", "Lucida Grande", "Lucida Sans Unicode", Tahoma, Arial, sans-serif'
	},
	Code: {
		fontFamily: MONOSPACE_FONT_STACK
	},
	Codeblock: {
		fontFamily: MONOSPACE_FONT_STACK
	}
}
