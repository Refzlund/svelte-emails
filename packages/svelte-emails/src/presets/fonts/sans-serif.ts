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
import { MONOSPACE_FONT_STACK } from '../base'

export const sansSerif: StyleConfig = {
	root: {
		fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif'
	},
	Code: {
		fontFamily: MONOSPACE_FONT_STACK
	},
	Codeblock: {
		fontFamily: MONOSPACE_FONT_STACK
	}
}
