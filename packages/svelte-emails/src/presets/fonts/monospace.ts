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

export const monospace: StyleConfig = {
	root: {
		fontFamily: 'Consolas, Monaco, "Lucida Console", "Courier New", Courier, monospace'
	},
	Code: {
		fontFamily: 'Consolas, Monaco, "Lucida Console", "Courier New", Courier, monospace'
	},
	Codeblock: {
		fontFamily: 'Consolas, Monaco, "Lucida Console", "Courier New", Courier, monospace'
	}
}
