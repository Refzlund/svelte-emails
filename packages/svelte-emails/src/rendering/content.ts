/**
 * Content processing utilities.
 * 
 * Handles markdown parsing, variable interpolation, and text escaping
 * for email content rendering.
 * 
 * @see ARCHITECTURE.md for markdown syntax reference
 */

import type { RenderContext } from './types'

// ============================================================================
// Escape Placeholder System
// ============================================================================

// Placeholder for escaped characters (using Unicode private use area)
const ESCAPE_PLACEHOLDER = '\uE000'
const ESCAPE_MAP: Map<string, string> = new Map()
let escapeCounter = 0

/**
 * Replace escaped characters with placeholders to protect them from parsing.
 */
function protectEscapes(content: string): string {
	escapeCounter = 0
	ESCAPE_MAP.clear()
	
	return content.replace(/\\(.)/g, (_, char: string) => {
		const placeholder = `${ESCAPE_PLACEHOLDER}${escapeCounter++}${ESCAPE_PLACEHOLDER}`
		ESCAPE_MAP.set(placeholder, char)
		return placeholder
	})
}

/**
 * Restore escaped characters from placeholders.
 */
function restoreEscapes(content: string): string {
	let result = content
	ESCAPE_MAP.forEach((char, placeholder) => {
		result = result.replace(placeholder, escapeHtml(char))
	})
	return result
}

// ============================================================================
// Markdown Parsing
// ============================================================================

/**
 * Parse extended markdown syntax in text content.
 * 
 * Supports:
 * - **bold**              → <strong>bold</strong>
 * - *italic*              → <em>italic</em>
 * - ~~strikethrough~~     → <s>strikethrough</s>
 * - __underline__         → <u>underline</u>
 * - [link text](url)      → <a href="url">link text</a>
 * - ^superscript^         → <sup>superscript</sup>
 * - _subscript_           → <sub>subscript</sub> (word-boundary)
 * - `code`                → <code>code</code>
 * - ```codeblock```       → <pre><code>codeblock</code></pre>
 * - (#hex)colored text(/) → <span style="color: #hex">text</span>
 * - [#hex]highlighted[/]  → <span style="background-color: #hex">text</span>
 * - --small text--        → <small>small text</small>
 * - \n                    → <br> (line breaks)
 * - \* \[ etc.            → literal character (escape)
 * - - item                → <ul><li>item</li></ul> (unordered list)
 * - 1. item               → <ol><li>item</li></ol> (ordered list)
 * - | col | col |         → <table> (markdown table)
 * 
 * @param content - Raw text content with markdown
 * @param context - Render context for StyleConfig access
 * @returns HTML string with markdown converted to tags
 * 
 * @example
 * ```ts
 * parseMarkdown('Hello **world**!')
 * // → 'Hello <strong>world</strong>!'
 * 
 * parseMarkdown('Visit [our site](https://example.com)')
 * // → 'Visit <a href="https://example.com">our site</a>'
 * ```
 */
export function parseMarkdown(content: string, context: RenderContext): string {
	// Step 1: Convert literal \n to actual newlines BEFORE escape processing
	// This must happen first because protectEscapes would capture \n as an escaped 'n'
	let result = content.replace(/\\n/g, '\n')

	// Step 2: Protect escaped characters (but not \n which we already handled)
	result = protectEscapes(result)

	// Step 3: Handle block-level elements first (before line breaks are converted)
	result = parseCodeblocks(result, context)
	result = parseTables(result, context)
	result = parseLists(result)

	// Step 4: Convert line breaks (but not inside pre/code blocks)
	result = parseLineBreaks(result)

	// Step 5: Handle inline formatting
	result = parseInlineFormatting(result, context)

	// Step 6: Restore escaped characters
	result = restoreEscapes(result)

	return result
}

/**
 * Parse inline formatting (bold, italic, links, etc.)
 */
function parseInlineFormatting(content: string, context: RenderContext): string {
	let result = content

	// Bold: **text**
	result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

	// Italic: *text* (but not **)
	result = result.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')

	// Strikethrough: ~~text~~
	result = result.replace(/~~([^~]+)~~/g, '<s>$1</s>')

	// Underline: __text__
	result = result.replace(/__([^_]+)__/g, '<u>$1</u>')

	// Links: [text](url) — apply Link styles from config
	const linkStyle = buildLinkStyle(context)
	result = result.replace(
		/\[([^\]]+)\]\(([^)]+)\)/g,
		linkStyle ? `<a href="$2" style="${linkStyle}">$1</a>` : '<a href="$2">$1</a>'
	)

	// Superscript: ^text^
	result = result.replace(/\^([^^]+)\^/g, '<sup>$1</sup>')

	// Subscript: _text_ (single underscore, word boundaries)
	result = result.replace(/(?<=\s|^)_([^_]+)_(?=\s|$)/g, '<sub>$1</sub>')

	// Inline code: `text` — apply Code styles from config
	const codeStyle = buildCodeStyle(context)
	result = result.replace(
		/`([^`]+)`/g,
		codeStyle ? `<code style="${codeStyle}">$1</code>` : '<code>$1</code>'
	)

	// Colored text: (#hex)text(/)
	result = result.replace(
		/\(#([0-9a-fA-F]{3,6})\)([^(]+)\(\/\)/g,
		'<span style="color: #$1">$2</span>'
	)

	// Highlighted text: [#hex]text[/] — merge with Highlight config
	result = result.replace(
		/\[#([0-9a-fA-F]{3,6})\]([^[]+)\[\/\]/g,
		(_, hex, text) => {
			const highlightConfig = context.style.Highlight
			const color = highlightConfig?.color ? `color: ${highlightConfig.color}; ` : ''
			return `<span style="${color}background-color: #${hex}">${text}</span>`
		}
	)

	// Small text: --text--
	result = result.replace(/--([^-]+)--/g, '<small>$1</small>')

	return result
}

/**
 * Build inline style string for links from StyleConfig.
 */
function buildLinkStyle(context: RenderContext): string {
	const linkConfig = context.style.Link
	if (!linkConfig) return ''

	const styles: string[] = []
	if (linkConfig.color) styles.push(`color: ${linkConfig.color}`)
	if (linkConfig.textDecoration) styles.push(`text-decoration: ${linkConfig.textDecoration}`)
	return styles.join('; ')
}

/**
 * Build inline style string for inline code from StyleConfig.
 */
function buildCodeStyle(context: RenderContext): string {
	const codeConfig = context.style.Code
	if (!codeConfig) return ''

	const styles: string[] = []
	if (codeConfig.color) styles.push(`color: ${codeConfig.color}`)
	if (codeConfig.background) styles.push(`background-color: ${codeConfig.background}`)
	if (codeConfig.padding) styles.push(`padding: ${codeConfig.padding}`)
	if (codeConfig.borderRadius) styles.push(`border-radius: ${codeConfig.borderRadius}`)
	if (codeConfig.fontFamily) styles.push(`font-family: ${codeConfig.fontFamily}`)
	if (codeConfig.size) styles.push(`font-size: ${codeConfig.size}`)
	return styles.join('; ')
}

/**
 * Build inline style string for codeblocks from StyleConfig.
 */
function buildCodeblockStyle(context: RenderContext): string {
	const config = context.style.Codeblock
	if (!config) return ''

	const styles: string[] = []
	if (config.color) styles.push(`color: ${config.color}`)
	if (config.background) styles.push(`background-color: ${config.background}`)
	if (config.padding) styles.push(`padding: ${config.padding}`)
	if (config.borderRadius) styles.push(`border-radius: ${config.borderRadius}`)
	if (config.fontFamily) styles.push(`font-family: ${config.fontFamily}`)
	if (config.size) styles.push(`font-size: ${config.size}`)
	if (config.lineHeight) styles.push(`line-height: ${config.lineHeight}`)
	return styles.join('; ')
}

// ============================================================================
// Codeblock Parsing
// ============================================================================

/**
 * Parse triple-backtick codeblocks.
 * Handles both ```code``` and ```lang\ncode\n```
 */
function parseCodeblocks(content: string, context: RenderContext): string {
	const style = buildCodeblockStyle(context)
	const styleAttr = style ? ` style="${style}"` : ''

	// Multi-line codeblocks: ```lang?\n...code...\n```
	let result = content.replace(
		/```(?:\w+)?\n([\s\S]*?)```/g,
		(_, code: string) => {
			const escaped = escapeHtml(code.trim())
			return `<pre${styleAttr}><code>${escaped}</code></pre>`
		}
	)

	// Inline codeblocks: ```code``` (no newlines)
	result = result.replace(
		/```([^`\n]+)```/g,
		(_, code: string) => {
			const escaped = escapeHtml(code)
			return `<pre${styleAttr}><code>${escaped}</code></pre>`
		}
	)

	return result
}

// ============================================================================
// Line Break Parsing
// ============================================================================

/**
 * Convert newlines to <br> tags, but not inside <pre> blocks.
 */
function parseLineBreaks(content: string): string {
	// Split on <pre> blocks to avoid converting newlines inside them
	const parts = content.split(/(<pre[\s\S]*?<\/pre>)/g)
	
	return parts.map((part, i) => {
		// Odd indices are <pre> blocks, leave them alone
		if (i % 2 === 1) return part
		// Even indices are regular content, convert newlines
		return part.replace(/\n/g, '<br>')
	}).join('')
}

// ============================================================================
// List Parsing
// ============================================================================

/**
 * Parse unordered and ordered lists.
 * 
 * Unordered: Lines starting with - or *
 * Ordered: Lines starting with 1., a., A., i., I.
 */
function parseLists(content: string): string {
	const lines = content.split('\n')
	const result: string[] = []
	let inList: 'ul' | 'ol' | null = null
	let listType: string | null = null

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]
		const trimmed = line.trim()

		// Unordered list item: - or *
		const ulMatch = trimmed.match(/^[-*]\s+(.+)$/)
		if (ulMatch) {
			if (inList !== 'ul') {
				if (inList) result.push(`</${inList}>`)
				result.push('<ul>')
				inList = 'ul'
			}
			result.push(`<li>${ulMatch[1]}</li>`)
			continue
		}

		// Ordered list item: 1. a. A. i. I.
		const olMatch = trimmed.match(/^(\d+|[a-z]|[A-Z]|[ivxIVX]+)\.\s+(.+)$/)
		if (olMatch) {
			const marker = olMatch[1]
			let type = '1' // default decimal
			if (/^[a-z]$/.test(marker)) type = 'a'
			else if (/^[A-Z]$/.test(marker)) type = 'A'
			else if (/^[ivxIVX]+$/.test(marker) && marker.toLowerCase() === marker) type = 'i'
			else if (/^[ivxIVX]+$/.test(marker)) type = 'I'

			if (inList !== 'ol' || listType !== type) {
				if (inList) result.push(`</${inList}>`)
				result.push(`<ol type="${type}">`)
				inList = 'ol'
				listType = type
			}
			result.push(`<li>${olMatch[2]}</li>`)
			continue
		}

		// Not a list item — close any open list
		if (inList) {
			result.push(`</${inList}>`)
			inList = null
			listType = null
		}
		result.push(line)
	}

	// Close any remaining list
	if (inList) {
		result.push(`</${inList}>`)
	}

	return result.join('\n')
}

// ============================================================================
// Table Parsing
// ============================================================================

/**
 * Parse markdown tables.
 * 
 * Format:
 * | Header 1 | Header 2 |
 * |----------|----------|
 * | Cell 1   | Cell 2   |
 */
function parseTables(content: string, context: RenderContext): string {
	const lines = content.split('\n')
	const result: string[] = []
	let tableLines: string[] = []
	let inTable = false

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim()

		// Check if line is a table row (starts and ends with |)
		if (line.startsWith('|') && line.endsWith('|')) {
			// Check if it's a separator row (|---|---|)
			if (/^\|[\s-:|]+\|$/.test(line)) {
				// This is a separator, continue collecting
				tableLines.push(line)
				inTable = true
				continue
			}

			// Regular table row
			tableLines.push(line)
			inTable = true
			continue
		}

		// Not a table row — if we were in a table, render it
		if (inTable && tableLines.length > 0) {
			result.push(renderMarkdownTable(tableLines, context))
			tableLines = []
			inTable = false
		}

		result.push(lines[i]) // Keep original line (with whitespace)
	}

	// Render any remaining table
	if (tableLines.length > 0) {
		result.push(renderMarkdownTable(tableLines, context))
	}

	return result.join('\n')
}

/**
 * Render collected table lines to HTML table.
 */
function renderMarkdownTable(lines: string[], context: RenderContext): string {
	const tableConfig = context.style.Table
	const borderColor = tableConfig?.borderColor ?? '#e5e7eb'
	const cellPadding = tableConfig?.cellPadding ?? '8px 12px'
	const headerBg = tableConfig?.headerBackground ?? '#f9fafb'
	const headerColor = tableConfig?.headerColor
	const headerWeight = tableConfig?.headerWeight ?? '600'

	// Find separator row index
	const separatorIndex = lines.findIndex((line) => /^\|[\s-:|]+\|$/.test(line))
	
	// Parse rows
	const parseRow = (line: string): string[] => {
		return line
			.slice(1, -1) // Remove leading/trailing |
			.split('|')
			.map((cell) => cell.trim())
	}

	const headerRows = separatorIndex > 0 ? lines.slice(0, separatorIndex) : []
	const bodyRows = separatorIndex >= 0 ? lines.slice(separatorIndex + 1) : lines

	// Build table HTML
	const tableStyle = `border-collapse: collapse; width: 100%;`
	const cellStyle = `border: 1px solid ${borderColor}; padding: ${cellPadding};`
	const headerStyle = `${cellStyle} background-color: ${headerBg};${headerColor ? ` color: ${headerColor};` : ''} font-weight: ${headerWeight};`

	let html = `<table style="${tableStyle}">`

	// Render header rows
	if (headerRows.length > 0) {
		html += '<thead>'
		for (const row of headerRows) {
			const cells = parseRow(row)
			html += '<tr>'
			for (const cell of cells) {
				html += `<th style="${headerStyle}">${cell}</th>`
			}
			html += '</tr>'
		}
		html += '</thead>'
	}

	// Render body rows
	if (bodyRows.length > 0) {
		html += '<tbody>'
		for (const row of bodyRows) {
			if (!row.trim()) continue
			const cells = parseRow(row)
			html += '<tr>'
			for (const cell of cells) {
				html += `<td style="${cellStyle}">${cell}</td>`
			}
			html += '</tr>'
		}
		html += '</tbody>'
	}

	html += '</table>'
	return html
}

// ============================================================================
// Variable Interpolation
// ============================================================================

/**
 * Interpolate variables in content.
 * Replaces [[variable_name]] with values from context.vars.
 * Unknown variables are left as-is for debugging.
 * 
 * @param content - Content with variable placeholders
 * @param context - Render context containing variable values
 * @returns Content with variables replaced
 * 
 * @example
 * ```ts
 * const context = { vars: { first_name: 'Alice' }, footnotes: [], headers: {} }
 * interpolateVariables('Hello [[first_name]]!', context)
 * // → 'Hello Alice!'
 * 
 * interpolateVariables('Hello [[unknown]]!', context)
 * // → 'Hello [[unknown]]!' (preserved for debugging)
 * ```
 */
export function interpolateVariables(content: string, context: RenderContext): string {
	return content.replace(/\[\[([^\]]+)\]\]/g, (_, varName: string) => {
		const value = context.vars[varName.trim()]
		return value !== undefined ? escapeHtml(value) : `[[${varName}]]`
	})
}

// ============================================================================
// HTML Escaping
// ============================================================================

/**
 * HTML-escape a string to prevent XSS.
 * Escapes &, <, >, ", and ' characters.
 * 
 * @param str - Raw string to escape
 * @returns HTML-safe string
 * 
 * @example
 * ```ts
 * escapeHtml('<script>alert("xss")</script>')
 * // → '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 * ```
 */
export function escapeHtml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
}

/**
 * Unescape HTML entities back to characters.
 * Useful for plain text output.
 * 
 * @param str - HTML-escaped string
 * @returns Unescaped string
 */
export function unescapeHtml(str: string): string {
	return str
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
}

// ============================================================================
// Plain Text Conversion
// ============================================================================

/**
 * Strip HTML tags from content for plain text output.
 * Preserves link URLs as footnote references.
 * 
 * @param html - HTML content
 * @param context - Render context to track footnotes
 * @returns Plain text content
 * 
 * @example
 * ```ts
 * const context = { vars: {}, footnotes: [], headers: {} }
 * stripHtmlToText('Click <a href="https://example.com">here</a>!', context)
 * // → 'Click here[1]!'
 * // context.footnotes = [{ label: '[1]', url: 'https://example.com' }]
 * ```
 */
export function stripHtmlToText(html: string, context: RenderContext): string {
	let result = html

	// Convert links to footnote references
	result = result.replace(/<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/g, (_, url, text) => {
		const index = context.footnotes.length + 1
		context.footnotes.push({ label: `[^${index}]`, url })
		return `${text}[^${index}]`
	})

	// Convert common elements to plain text equivalents
	result = result.replace(/<br\s*\/?>/gi, '\n')
	result = result.replace(/<\/p>/gi, '\n\n')
	result = result.replace(/<\/h[1-6]>/gi, '\n\n')
	result = result.replace(/<\/div>/gi, '\n')
	result = result.replace(/<\/tr>/gi, '\n')
	result = result.replace(/<\/li>/gi, '\n')
	result = result.replace(/<hr\s*\/?>/gi, '\n---\n')

	// Strip remaining tags
	result = result.replace(/<[^>]+>/g, '')

	// Unescape entities
	result = unescapeHtml(result)

	// Normalize whitespace
	result = result.replace(/\n{3,}/g, '\n\n')
	result = result.trim()

	return result
}

/**
 * Format footnotes for plain text email footer.
 * 
 * @param footnotes - Array of footnote entries
 * @returns Formatted footnote section
 * 
 * @example
 * ```ts
 * formatFootnotes([
 *   { label: '[1]', url: 'https://example.com' },
 *   { label: '[2]', url: 'https://other.com' }
 * ])
 * // → '\n\nLinks:\n[1] https://example.com\n[2] https://other.com'
 * ```
 */
export function formatFootnotes(
	footnotes: Array<{ label: string; url: string }>
): string {
	if (footnotes.length === 0) return ''

	const lines = footnotes.map((f) => `${f.label} ${f.url}`)
	return '\n\nLinks:\n' + lines.join('\n')
}
