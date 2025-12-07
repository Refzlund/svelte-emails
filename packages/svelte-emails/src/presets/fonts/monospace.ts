/**
 * Monospace font preset.
 * 
 * Technical, code-focused monospace fonts throughout.
 * Good for developer-focused emails, changelogs, and technical documentation.
 * 
 * Font stack:
 * - Consolas: Windows (Vista+)
 * - Monaco: macOS
 * - "Lucida Console": Windows
 * - "Courier New": Windows, macOS, Linux
 * - Courier: Universal fallback
 * - monospace: Generic fallback
 */

import type { StyleConfig } from '../../styles'
import { MONOSPACE_FONT_STACK } from '../base'

export const monospace: StyleConfig = {
	root: {
		fontFamily: MONOSPACE_FONT_STACK
	},
	Code: {
		fontFamily: MONOSPACE_FONT_STACK
	},
	Codeblock: {
		fontFamily: MONOSPACE_FONT_STACK
	}
}
