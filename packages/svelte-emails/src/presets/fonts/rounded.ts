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

export const rounded: StyleConfig = {
	root: {
		fontFamily: 'Verdana, "Trebuchet MS", Geneva, Arial, sans-serif'
	},
	Code: {
		fontFamily: 'Consolas, Monaco, "Lucida Console", "Courier New", Courier, monospace'
	},
	Codeblock: {
		fontFamily: 'Consolas, Monaco, "Lucida Console", "Courier New", Courier, monospace'
	}
}
