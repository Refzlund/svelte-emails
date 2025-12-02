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
import { MONOSPACE_FONT_STACK } from '../base'

export const serif: StyleConfig = {
	root: {
		fontFamily: 'Georgia, "Times New Roman", Times, serif'
	},
	Code: {
		fontFamily: MONOSPACE_FONT_STACK
	},
	Codeblock: {
		fontFamily: MONOSPACE_FONT_STACK
	}
}
