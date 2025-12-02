/**
 * Sans-serif font preset.
 * 
 * Clean, modern sans-serif fonts with excellent email client support.
 * Good for professional and corporate emails.
 * 
 * Font stack:
 * - Arial: Windows, macOS, Linux
 * - Helvetica Neue: macOS
 * - Helvetica: macOS, Linux
 * - sans-serif: Generic fallback
 */

import type { StyleConfig } from '../../styles'

export const sansSerif: StyleConfig = {
	root: {
		fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif'
	},
	Code: {
		fontFamily: 'Consolas, Monaco, "Lucida Console", "Courier New", Courier, monospace'
	},
	Codeblock: {
		fontFamily: 'Consolas, Monaco, "Lucida Console", "Courier New", Courier, monospace'
	}
}
