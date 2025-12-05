/**
 * Content processing utilities.
 * 
 * Handles markdown parsing, variable interpolation, and text escaping
 * for email content rendering.
 * 
 * @see ARCHITECTURE.md for markdown syntax reference
 */

import type { RenderContext } from './types'
import { buildStyleFromConfig, buildHighlightStyle, CONFIG_MAPPINGS } from './style-helpers'

// ============================================================================
// Escape Placeholder System
// ============================================================================

/**
 * TODO(CONSIDERATION): The escape system uses module-level state (ESCAPE_MAP,
 * escapeCounter) which makes it non-reentrant. If parseMarkdown() is called
 * concurrently (e.g., parallel SSR), escapes could be corrupted.
 * 
 * Currently safe because rendering is synchronous, but worth noting.
 * 
 * Alternative approaches:
 * 1. Pass escape state through function parameters
 * 2. Use a unique token per call (e.g., UUID)
 * 3. Create a class instance per parse operation
 */

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

	// Bold: **text** - allows single * inside content (e.g., **align-*:**)
	result = result.replace(/\*\*((?:[^*]|\*(?!\*))+)\*\*/g, '<strong>$1</strong>')

	// Italic: *text* (but not **) - allows single * inside if not followed by another *
	result = result.replace(/(?<!\*)\*((?:[^*]|\*(?!\*))+?)\*(?!\*)/g, '<em>$1</em>')

	// Strikethrough: ~~text~~ - allows single ~ inside
	result = result.replace(/~~((?:[^~]|~(?!~))+)~~/g, '<s>$1</s>')

	// Underline: __text__ - allows single _ inside
	result = result.replace(/__((?:[^_]|_(?!_))+)__/g, '<u>$1</u>')

	// Links: [text](url) — apply Link styles from config
	const linkStyle = buildLinkStyle(context)
	result = result.replace(
		/\[([^\]]+)\]\(([^)]+)\)/g,
		linkStyle ? `<a href="$2" style="${linkStyle}">$1</a>` : '<a href="$2">$1</a>'
	)

	// Superscript: ^text^
	result = result.replace(/\^([^^]+)\^/g, '<sup>$1</sup>')

	// Subscript: _text_ 
	// Two patterns:
	// 1. Inline subscript like H_2_O - requires letter/digit before and after underscores
	// 2. Word-level subscript with spaces: _text_ at word boundaries
	// Pattern 1: letter/digit_content_letter/digit (for chemical formulas)
	result = result.replace(/(?<=[A-Za-z0-9])_([^_]+)_(?=[A-Za-z0-9])/g, '<sub>$1</sub>')
	// Pattern 2: space/start_content_space/end (for word-level subscript)
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
		(_, hex, text) => `<span style="${buildHighlightStyle(context.style.Highlight, hex)}">${text}</span>`
	)

	// Small text: --text--
	result = result.replace(/--([^-]+)--/g, '<small>$1</small>')

	return result
}

/** Build inline style for links using shared utility */
function buildLinkStyle(context: RenderContext): string {
	return buildStyleFromConfig(context.style.Link, CONFIG_MAPPINGS.Link)
}

/** Build inline style for inline code using shared utility */
function buildCodeStyle(context: RenderContext): string {
	return buildStyleFromConfig(context.style.Code, CONFIG_MAPPINGS.Code)
}

/** Build inline style for codeblocks using shared utility */
function buildCodeblockStyle(context: RenderContext): string {
	return buildStyleFromConfig(context.style.Codeblock, CONFIG_MAPPINGS.Codeblock)
}

// ============================================================================
// Codeblock Parsing
// ============================================================================

/**
 * Parse triple-backtick codeblocks.
 * Handles both ```code``` and ```lang\ncode\n```
 * 
 * Whitespace handling (pre-wrap, word-wrap, overflow-wrap) is included
 * in StyleConfig.Codeblock and applied via buildCodeblockStyle.
 */
function parseCodeblocks(content: string, context: RenderContext): string {
	const configStyle = buildCodeblockStyle(context)
	const styleAttr = configStyle ? ` style="${configStyle}"` : ''

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
 * Convert newlines to <br> tags, but not inside block-level elements.
 * 
 * Block elements (<pre>, <ul>, <ol>, <table>) are handled specially:
 * - <pre> blocks preserve newlines as-is
 * - <ul>/<ol> lists remove newlines entirely (structural, not content)
 * - <table> blocks remove newlines entirely (structural, not content)
 * 
 * Newlines immediately before or after block elements are also removed
 * to prevent extra <br> tags around blocks.
 */
function parseLineBreaks(content: string): string {
	// Split on block elements that shouldn't have <br> tags inside
	const blockPattern = /(<(?:pre|ul|ol|table)[\s\S]*?<\/(?:pre|ul|ol|table)>)/g
	const parts = content.split(blockPattern)
	
	return parts.map((part, i) => {
		// Odd indices are block elements
		if (i % 2 === 1) {
			// For lists and tables, remove newlines entirely (structural, not content)
			if (part.startsWith('<ul') || part.startsWith('<ol') || part.startsWith('<table')) {
				return part.replace(/\n/g, '')
			}
			// For <pre> blocks, preserve newlines as-is
			return part
		}
		// Even indices are regular content
		// Trim leading/trailing newlines adjacent to block elements
		// (which are at odd indices)
		let processed = part
		if (i > 0) {
			// Previous part was a block element, remove leading newlines
			processed = processed.replace(/^\n+/, '')
		}
		if (i < parts.length - 1) {
			// Next part is a block element, remove trailing newlines
			processed = processed.replace(/\n+$/, '')
		}
		// Convert remaining newlines to <br>
		return processed.replace(/\n/g, '<br>')
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
 * 
 * A list requires at least 2 consecutive list items to be recognized.
 * This prevents single lines like "1. Introduction" from being treated as lists.
 */
function parseLists(content: string): string {
	const lines = content.split('\n')
	
	// First pass: identify which lines are potential list items and collect runs of consecutive items
	const listRuns: { start: number; end: number; type: 'ul' | 'ol'; listType?: string }[] = []
	let currentRun: { start: number; type: 'ul' | 'ol'; listType?: string } | null = null
	
	for (let i = 0; i < lines.length; i++) {
		const trimmed = lines[i].trim()
		
		// Check for unordered list item
		const ulMatch = trimmed.match(/^[-*]\s+(.+)$/)
		if (ulMatch) {
			if (currentRun?.type === 'ul') {
				// Continue the run
			} else {
				// Start new run
				if (currentRun) {
					listRuns.push({ ...currentRun, end: i - 1 })
				}
				currentRun = { start: i, type: 'ul' }
			}
			continue
		}
		
		// Check for ordered list item
		const olMatch = trimmed.match(/^(\d+|[a-z]|[A-Z]|[ivxIVX]+)\.\s+(.+)$/)
		if (olMatch) {
			const marker = olMatch[1]
			let type = '1'
			if (/^[a-z]$/.test(marker)) type = 'a'
			else if (/^[A-Z]$/.test(marker)) type = 'A'
			else if (/^[ivxIVX]+$/.test(marker) && marker.toLowerCase() === marker) type = 'i'
			else if (/^[ivxIVX]+$/.test(marker)) type = 'I'
			
			if (currentRun?.type === 'ol' && currentRun?.listType === type) {
				// Continue the run
			} else {
				// Start new run
				if (currentRun) {
					listRuns.push({ ...currentRun, end: i - 1 })
				}
				currentRun = { start: i, type: 'ol', listType: type }
			}
			continue
		}
		
		// Not a list item - end current run
		if (currentRun) {
			listRuns.push({ ...currentRun, end: i - 1 })
			currentRun = null
		}
	}
	
	// End any remaining run
	if (currentRun) {
		listRuns.push({ ...currentRun, end: lines.length - 1 })
	}
	
	// Filter out runs with only 1 item (not a real list)
	const validRuns = listRuns.filter((run) => run.end > run.start)
	
	// If no valid runs, return content unchanged
	if (validRuns.length === 0) {
		return content
	}
	
	// Create a set of line indices that are part of valid lists
	const listLineIndices = new Set<number>()
	for (const run of validRuns) {
		for (let i = run.start; i <= run.end; i++) {
			listLineIndices.add(i)
		}
	}
	
	// Second pass: build the output
	const result: string[] = []
	let currentValidRun: typeof validRuns[0] | null = null
	let inList = false
	
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]
		const trimmed = line.trim()
		
		// Check if this line is part of a valid list
		if (listLineIndices.has(i)) {
			// Find which run this belongs to
			const run = validRuns.find((r) => i >= r.start && i <= r.end)!
			
			// Open list if needed
			if (currentValidRun !== run) {
				if (inList) {
					result.push(currentValidRun!.type === 'ul' ? '</ul>' : '</ol>')
				}
				if (run.type === 'ul') {
					result.push('<ul>')
				} else {
					result.push(`<ol type="${run.listType}">`)
				}
				currentValidRun = run
				inList = true
			}
			
			// Extract content from the list item
			const ulMatch = trimmed.match(/^[-*]\s+(.+)$/)
			const olMatch = trimmed.match(/^(\d+|[a-z]|[A-Z]|[ivxIVX]+)\.\s+(.+)$/)
			const itemContent = ulMatch ? ulMatch[1] : olMatch![2]
			result.push(`<li>${itemContent}</li>`)
		} else {
			// Not a list line - close any open list
			if (inList) {
				result.push(currentValidRun!.type === 'ul' ? '</ul>' : '</ol>')
				inList = false
				currentValidRun = null
			}
			result.push(line)
		}
	}
	
	// Close any remaining list
	if (inList) {
		result.push(currentValidRun!.type === 'ul' ? '</ul>' : '</ol>')
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
 * Interpolate placeholders in content.
 * Replaces [[placeholder_name]] with values from context.placeholders.
 * Unknown placeholders are left as-is for debugging.
 * 
 * @param content - Content with [[placeholder]] syntax
 * @param context - Render context containing placeholder values
 * @returns Content with placeholders replaced
 * 
 * @example
 * ```ts
 * const context = { placeholders: { first_name: 'Alice' }, footnotes: [], headers: {} }
 * interpolatePlaceholders('Hello [[first_name]]!', context)
 * // → 'Hello Alice!'
 * 
 * interpolatePlaceholders('Hello [[unknown]]!', context)
 * // → 'Hello [[unknown]]!' (preserved for debugging)
 * ```
 */
export function interpolatePlaceholders(content: string, context: RenderContext): string {
	return content.replace(/\[\[([^\]]+)\]\]/g, (_, varName: string) => {
		const value = context.placeholders[varName.trim()]
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
