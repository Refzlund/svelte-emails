/**
 * Dark preset — dark mode compatible.
 * 
 * Uses dark backgrounds with light text.
 * Inherits from base preset.
 */

import type { StyleConfig } from '../styles'

export const dark: StyleConfig = {
	root: {
		color: '#e5e7eb',
		background: '#111827'
	},
	Text: {
		color: 'inherit',
		H1: {
			color: '#f9fafb'
		},
		H2: {
			color: '#f9fafb'
		},
		H3: {
			color: '#f9fafb'
		},
		H4: {
			color: '#f9fafb'
		},
		H5: {
			color: '#f9fafb'
		},
		H6: {
			color: '#f9fafb'
		},
		Small: {
			color: '#9ca3af'
		}
	},
	Link: {
		color: '#60a5fa'
	},
	Button: {
		color: '#111827',
		background: '#60a5fa'
	},
	Divider: {
		color: '#374151'
	},
	Code: {
		color: '#e5e7eb',
		background: '#1f2937'
	},
	Codeblock: {
		color: '#e5e7eb',
		background: '#1f2937'
	},
	Highlight: {
		color: '#1f2937',
		background: '#fde68a'
	},
	Unsubscribe: {
		color: '#9ca3af'
	},
	Table: {
		borderColor: '#374151',
		headerBackground: '#1f2937',
		headerColor: '#f9fafb',
		stripedBackground: '#1f2937'
	}
}
