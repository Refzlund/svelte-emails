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

export const humanist: StyleConfig = {
	root: {
		fontFamily: '"Segoe UI", "Lucida Grande", "Lucida Sans Unicode", Tahoma, Arial, sans-serif'
	},
	Code: {
		fontFamily: 'Consolas, Monaco, "Lucida Console", "Courier New", Courier, monospace'
	},
	Codeblock: {
		fontFamily: 'Consolas, Monaco, "Lucida Console", "Courier New", Courier, monospace'
	}
}
