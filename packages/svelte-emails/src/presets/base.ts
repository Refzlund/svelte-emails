/**
 * Base preset — defines all default values.
 * 
 * This preset is automatically merged as a fallback for all other presets.
 * It provides sensible defaults for email rendering.
 */

import type { StyleConfig } from '../styles'

/**
 * Traditional monospace font stack used across font presets.
 * This prioritizes older, widely-available fonts for maximum compatibility.
 * - Consolas: Windows (Vista+)
 * - Monaco: macOS
 * - "Lucida Console": Windows
 * - "Courier New": Windows, macOS, Linux
 * - Courier: Universal fallback
 * - monospace: Generic fallback
 */
export const MONOSPACE_FONT_STACK = 'Consolas, Monaco, "Lucida Console", "Courier New", Courier, monospace'

export const base: StyleConfig = {
	root: {
		color: '#1b1b1d',
		background: '#ffffff',
		size: 16,
		lineHeight: 1.5,
		fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
		monoFontFamily: MONOSPACE_FONT_STACK
	},
	Text: {
		color: 'inherit',
		H1: {
			size: '2.5rem',
			weight: 700,
			lineHeight: 1.2,
			padding: '0'
		},
		H2: {
			size: '2rem',
			weight: 700,
			lineHeight: 1.25,
			padding: '0'
		},
		H3: {
			size: '1.5rem',
			weight: 600,
			lineHeight: 1.3,
			padding: '0'
		},
		H4: {
			size: '1.25rem',
			weight: 600,
			lineHeight: 1.35,
			padding: '0'
		},
		H5: {
			size: '1rem',
			weight: 600,
			lineHeight: 1.4,
			padding: '0'
		},
		H6: {
			size: '0.875rem',
			weight: 600,
			lineHeight: 1.4,
			padding: '0'
		},
		Paragraph: {
			size: '1rem',
			lineHeight: 1.6,
			padding: '0'
		},
		Small: {
			size: '0.875rem',
			lineHeight: 1.5,
			padding: '0'
		},
		Span: {
			size: '1rem',
			lineHeight: 1.5
		}
	},
	Link: {
		color: '#2563eb',
		textDecoration: 'underline'
	},
	Button: {
		color: '#ffffff',
		background: '#2563eb',
		padding: '12px 24px',
		borderRadius: '0px',
		fontWeight: 600
	},
	Spacer: {
		size: '2rem'
	},
	Divider: {
		color: '#e5e7eb',
		thickness: '1px',
		style: 'solid'
	},
	Code: {
		color: '#1f2937',
		background: '#f3f4f6',
		padding: '2px 6px',
		fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
		size: '0.875em',
		// Border configuration
		border: {
			radius: '4px'
		}
	},
	Codeblock: {
		color: '#1f2937',
		background: '#f3f4f6',
		padding: '16px',
		fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
		size: '0.875rem',
		lineHeight: 1.5,
		// Whitespace handling for proper code display
		whiteSpace: 'pre-wrap',
		wordWrap: 'break-word',
		overflowWrap: 'break-word',
		// Border configuration
		border: {
			radius: '8px'
		}
	},
	Highlight: {
		color: 'inherit',
		background: '#fef08a'
	},
	Unsubscribe: {
		color: '#6b7280',
		size: '0.75rem'
	},
	Table: {
		borderColor: '#e5e7eb',
		borderWidth: '1px',
		headerBackground: '#f9fafb',
		headerColor: '#111827',
		headerWeight: 600,
		stripedBackground: '#f9fafb',
		cellPadding: '12px 16px',
		compactCellPadding: '8px 12px'
	}
}
