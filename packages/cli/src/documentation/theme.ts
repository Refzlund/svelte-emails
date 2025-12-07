/**
 * Documentation theme configuration.
 * 
 * Provides consistent colors and style rules for all documentation templates.
 * Import `colors` for inline color references and `style` for the Email component.
 */

import type { StyleConfig } from 'svelte-emails'

/**
 * Documentation color palette.
 * Green-themed colors for consistent styling across all docs.
 */
export const colors = {
	// Primary brand colors
	primary: '#10b981',
	primaryDark: '#059669',
	
	// Text colors
	text: '#111827',
	textMuted: '#4b5563',
	
	// Background colors
	background: '#f3f4f6',
	white: '#ffffff',
	
	// UI colors
	border: '#d1d5db',
	code: '#1f2937',
	codeBg: '#f9fafb',
	
	// Semantic colors
	blue: '#3b82f6',
	purple: '#8b5cf6',
	info: '#3b82f6',
	infoBg: '#dbeafe',
	success: '#10b981',
	danger: '#ef4444',
	warning: '#f59e0b',
	
	// Demo colors (soft pastels for examples)
	demoA: '#fef2f2',      // soft rose
	demoABorder: '#fecaca',
	demoB: '#eff6ff',      // soft blue
	demoBBorder: '#bfdbfe',
	demoC: '#f0fdf4',      // soft green
	demoCBorder: '#bbf7d0'
} as const

export type DocColors = typeof colors

/**
 * Documentation style configuration.
 * Pass to `<Email style={style}>` for consistent component styling.
 */
export const style: StyleConfig = {
	root: {
		color: colors.text,
		background: colors.white,
		size: 16,
		lineHeight: 1.5
	},
	Text: {
		color: 'inherit',
		H1: { color: colors.text },
		H2: { color: colors.text },
		H3: { color: colors.text },
		Paragraph: { color: colors.textMuted },
		Small: { color: colors.textMuted }
	},
	Link: {
		color: colors.primary,
		textDecoration: 'underline'
	},
	Button: {
		color: colors.white,
		background: colors.primary,
		padding: '14px 28px',
		borderRadius: '8px',
		fontWeight: 600
	},
	Divider: {
		color: colors.border,
		thickness: '1px',
		style: 'solid'
	},
	Code: {
		color: colors.code,
		background: colors.codeBg,
		border: { radius: '4px' }
	},
	Codeblock: {
		color: colors.code,
		background: colors.codeBg,
		border: { 
			radius: '8px',
			color: colors.border,
			width: '1px'
		}
	},
	Table: {
		borderColor: colors.border,
		headerBackground: colors.background,
		headerColor: colors.text
	}
}
