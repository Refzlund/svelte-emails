/**
 * Serif font preset.
 * 
 * Classic, elegant serif fonts for a traditional or editorial feel.
 * Good for newsletters, editorial content, and formal communications.
 * 
 * Font stack:
 * - Georgia: Windows, macOS (widely available)
 * - "Times New Roman": Windows, macOS, Linux
 * - Times: macOS, Linux
 * - serif: Generic fallback
 */

import type { StyleConfig } from '../../styles'

export const serif: StyleConfig = {
	root: {
		fontFamily: 'Georgia, "Times New Roman", Times, serif'
	},
	Code: {
		fontFamily: 'Consolas, Monaco, "Lucida Console", "Courier New", Courier, monospace'
	},
	Codeblock: {
		fontFamily: 'Consolas, Monaco, "Lucida Console", "Courier New", Courier, monospace'
	}
}
