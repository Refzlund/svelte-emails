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
 * - - item                → table-based list (unordered)
 * - 1. item               → table-based list (ordered)
 * - - [ ] item            → checkbox (unchecked)
 * - - [x] item            → checkbox (checked)
 * - | col | col |         → <table> (markdown table)
 * 
 * Lists are rendered as tables for maximum email client compatibility.
 * Checkboxes are rendered as styled inline boxes.
 * 
 * NOTE: Raw HTML tags in content are escaped (displayed as literal text).
 * Only the markdown syntax above is parsed into HTML.
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
 * 
 * parseMarkdown('- [ ] Todo item\n- [x] Done item')
 * // → Table with styled checkboxes
 * 
 * parseMarkdown('Use <div> tags')
 * // → 'Use &lt;div&gt; tags' (HTML is escaped, not parsed)
 * ```
 */
export function parseMarkdown(content: string, context: RenderContext): string {
	// Step 1: Convert literal \n to actual newlines BEFORE escape processing
	// This must happen first because protectEscapes would capture \n as an escaped 'n'
	let result = content.replace(/\\n/g, '\n')

	// Step 2: Protect escaped characters (but not \n which we already handled)
	result = protectEscapes(result)

	// Step 3: Escape HTML tags to prevent raw HTML from being rendered
	// This ensures only our markdown syntax produces HTML, not user-provided tags
	result = escapeHtml(result)

	// Step 4: Handle block-level elements first (before line breaks are converted)
	result = parseCodeblocks(result, context)
	result = parseTables(result, context)
	result = parseLists(result)

	// Step 5: Convert line breaks (but not inside pre/code blocks)
	result = parseLineBreaks(result)

	// Step 6: Handle inline formatting
	result = parseInlineFormatting(result, context)

	// Step 7: Restore escaped characters
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

	// Links: [text](url) — apply Link styles from config, open in new tab
	// rel="noopener noreferrer" prevents tabnabbing attacks with target="_blank"
	const linkStyle = buildLinkStyle(context)
	result = result.replace(
		/\[([^\]]+)\]\(([^)]+)\)/g,
		linkStyle 
			? `<a href="$2" target="_blank" rel="noopener noreferrer" style="${linkStyle}">$1</a>` 
			: '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
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
	// Content is already HTML-escaped from the global escapeHtml() call in parseMarkdown
	const codeStyle = buildCodeStyle(context)
	result = result.replace(
		/`([^`]+)`/g,
		(_, code: string) => {
			return codeStyle ? `<code style="${codeStyle}">${code}</code>` : `<code>${code}</code>`
		}
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
 * 
 * Note: Content is already HTML-escaped from the global escapeHtml() call
 * in parseMarkdown, so we don't escape again here.
 */
function parseCodeblocks(content: string, context: RenderContext): string {
	const configStyle = buildCodeblockStyle(context)
	const styleAttr = configStyle ? ` style="${configStyle}"` : ''

	// Multi-line codeblocks: ```lang?\n...code...\n```
	let result = content.replace(
		/```(?:\w+)?\n([\s\S]*?)```/g,
		(_, code: string) => {
			return `<pre${styleAttr}><code>${code.trim()}</code></pre>`
		}
	)

	// Inline codeblocks: ```code``` (no newlines)
	result = result.replace(
		/```([^`\n]+)```/g,
		(_, code: string) => {
			return `<pre${styleAttr}><code>${code}</code></pre>`
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
 * Block elements (<pre>, <table>) are handled specially:
 * - <pre> blocks preserve newlines as-is
 * - <table> blocks remove newlines entirely (structural, not content)
 * 
 * Newlines immediately before or after block elements are also removed
 * to prevent extra <br> tags around blocks.
 */
function parseLineBreaks(content: string): string {
	// Split on block elements that shouldn't have <br> tags inside
	const blockPattern = /(<(?:pre|table)[\s\S]*?<\/(?:pre|table)>)/g
	const parts = content.split(blockPattern)
	
	return parts.map((part, i) => {
		// Odd indices are block elements
		if (i % 2 === 1) {
			// For tables, remove newlines entirely (structural, not content)
			if (part.startsWith('<table')) {
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
 * Parse unordered and ordered lists with nesting support.
 * 
 * Unordered: Lines starting with - or * (with optional indentation)
 * Ordered: Lines starting with 1., a., A., i., I. (with optional indentation)
 * Checkboxes: - [ ] unchecked, - [x] or - [X] checked
 * 
 * Nesting is detected by indentation (2+ spaces per level).
 * A list requires at least 2 consecutive list items to be recognized.
 * This prevents single lines like "1. Introduction" from being treated as lists.
 * 
 * Lists are rendered as tables for maximum email client compatibility.
 */
function parseLists(content: string): string {
	const lines = content.split('\n')
	
	// Helper to detect list item and its indentation level
	const detectListItem = (line: string): { 
		type: 'ul' | 'ol' | null
		indent: number
		content: string
		listType?: string
		checkbox?: 'checked' | 'unchecked' | null
	} => {
		// Count leading whitespace (tabs count as 2 spaces for indentation purposes)
		const indentMatch = line.match(/^([\t ]*)/)
		const indentStr = indentMatch ? indentMatch[1] : ''
		// Convert tabs to 2-space equivalent for consistent nesting calculation
		const indent = indentStr.split('').reduce((sum, char) => sum + (char === '\t' ? 2 : 1), 0)
		const trimmed = line.trim()
		
		// Check for checkbox items: - [ ] or - [x] or - [X]
		const checkboxMatch = trimmed.match(/^[-*]\s+\[([ xX])\]\s+(.+)$/)
		if (checkboxMatch) {
			const isChecked = checkboxMatch[1].toLowerCase() === 'x'
			return { 
				type: 'ul', 
				indent, 
				content: checkboxMatch[2],
				checkbox: isChecked ? 'checked' : 'unchecked'
			}
		}
		
		// Check for unordered list item
		const ulMatch = trimmed.match(/^[-*]\s+(.+)$/)
		if (ulMatch) {
			return { type: 'ul', indent, content: ulMatch[1], checkbox: null }
		}
		
		// Check for ordered list item
		const olMatch = trimmed.match(/^(\d+|[a-z]|[A-Z]|[ivxIVX]+)\.\s+(.+)$/)
		if (olMatch) {
			const marker = olMatch[1]
			let listType = '1'
			if (/^[a-z]$/.test(marker)) listType = 'a'
			else if (/^[A-Z]$/.test(marker)) listType = 'A'
			else if (/^[ivxIVX]+$/.test(marker) && marker.toLowerCase() === marker) listType = 'i'
			else if (/^[ivxIVX]+$/.test(marker)) listType = 'I'
			
			return { type: 'ol', indent, content: olMatch[2], listType, checkbox: null }
		}
		
		return { type: null, indent: 0, content: '', checkbox: null }
	}
	
	// First pass: identify list items with indentation
	interface ListItem {
		item: {
			type: 'ul' | 'ol'
			indent: number
			content: string
			listType?: string
			checkbox?: 'checked' | 'unchecked' | null
		}
		lineIndex: number
	}
	
	const listItems: ListItem[] = []
	for (let i = 0; i < lines.length; i++) {
		const detected = detectListItem(lines[i])
		if (detected.type) {
			listItems.push({
				lineIndex: i,
				item: {
					type: detected.type,
					indent: detected.indent,
					content: detected.content,
					listType: detected.listType,
					checkbox: detected.checkbox
				}
			})
		}
	}
	
	// If fewer than 2 items total, no lists
	if (listItems.length < 2) {
		return content
	}
	
	// Check if we have at least 2 items at the root level (indent 0)
	// to qualify as a list (prevents single "1. Introduction" from becoming a list)
	const minIndent = Math.min(...listItems.map(item => item.item.indent))
	const rootLevelItems = listItems.filter(item => item.item.indent === minIndent)
	
	if (rootLevelItems.length < 2) {
		// Not enough items at root level to form a list
		return content
	}
	
	// Build output with nested lists
	const result: string[] = []
	const listItemIndices = new Set(listItems.map(item => item.lineIndex))
	
	// Group consecutive list items (line indices that are adjacent)
	// First, find the actual consecutive groups based on line index
	const groups: number[][] = []
	let currentGroup: number[] = []
	
	const sortedIndices = [...listItemIndices].sort((a, b) => a - b)
	for (const idx of sortedIndices) {
		if (currentGroup.length === 0 || idx === currentGroup[currentGroup.length - 1] + 1) {
			currentGroup.push(idx)
		} else {
			if (currentGroup.length > 0) groups.push(currentGroup)
			currentGroup = [idx]
		}
	}
	if (currentGroup.length > 0) groups.push(currentGroup)
	
	// Create a map of line index to group index
	const lineToGroup = new Map<number, number>()
	for (let g = 0; g < groups.length; g++) {
		for (const idx of groups[g]) {
			lineToGroup.set(idx, g)
		}
	}
	
	let i = 0
	let lastRenderedGroup = -1
	while (i < lines.length) {
		if (!listItemIndices.has(i)) {
			result.push(lines[i])
			i++
			continue
		}
		
		// This line is a list item - check which group it belongs to
		const groupIdx = lineToGroup.get(i)!
		
		// If we haven't rendered this group yet, render all items in the group
		if (groupIdx !== lastRenderedGroup) {
			const groupLineIndices = groups[groupIdx]
			const groupItems = listItems.filter(li => groupLineIndices.includes(li.lineIndex))
			
			// Only render as list if group has 2+ items
			if (groupItems.length >= 2) {
				result.push(renderNestedList(groupItems))
			} else {
				// Single item - output as regular line
				for (const idx of groupLineIndices) {
					result.push(lines[idx])
				}
			}
			lastRenderedGroup = groupIdx
		}
		i++
	}
	
	return result.join('\n')
}

/**
 * Render a group of list items as nested tables.
 * Each root item is its own table, with children nested inside the content cell.
 * Uses tables for maximum email client compatibility.
 */
function renderNestedList(items: Array<{ lineIndex: number; item: { type: 'ul' | 'ol'; indent: number; content: string; listType?: string; checkbox?: 'checked' | 'unchecked' | null } }>): string {
	// Find min indent to normalize
	const minIndent = Math.min(...items.map(i => i.item.indent))
	
	// Calculate nesting levels (normalize indent to 0-based levels, 2 spaces = 1 level)
	const itemsWithLevel = items.map(({ item }, index) => ({
		...item,
		level: Math.floor((item.indent - minIndent) / 2),
		originalIndex: index
	}))
	
	// Track ordered list counters per level and type
	const olCounters: Map<string, number> = new Map()
	
	const getCounter = (level: number, listType: string): number => {
		const key = `${level}-${listType}`
		const count = (olCounters.get(key) ?? 0) + 1
		olCounters.set(key, count)
		return count
	}
	
	const formatCounter = (count: number, listType: string): string => {
		switch (listType) {
			case 'a': return String.fromCharCode(96 + count) // a, b, c...
			case 'A': return String.fromCharCode(64 + count) // A, B, C...
			case 'i': return toRoman(count).toLowerCase()    // i, ii, iii...
			case 'I': return toRoman(count)                  // I, II, III...
			default: return String(count)                    // 1, 2, 3...
		}
	}
	
	// Get the list type based on nesting level (for auto-progression)
	// Ordered: 1 → a → i → 1 → a → i (cycles)
	// If user explicitly specified a type, use that instead
	const getListTypeForLevel = (level: number, explicitType?: string): string => {
		if (explicitType) return explicitType
		const types = ['1', 'a', 'i']
		return types[level % types.length]
	}
	
	// Get bullet symbol based on nesting level
	// Standard progression: disc (●) → circle (○) → square (■)
	const getBulletForLevel = (level: number): string => {
		const bullets = ['●', '○', '■'] // disc, circle, square
		return bullets[Math.min(level, bullets.length - 1)]
	}
	
	const renderMarker = (item: typeof itemsWithLevel[0]): string => {
		if (item.checkbox) {
			const checkboxStyles = item.checkbox === 'checked'
				? 'width:14px;height:14px;border:1px solid #10b981;background:#10b981;border-radius:2px;display:table-cell;text-align:center;vertical-align:middle;font-size:10px;color:#fff;'
				: 'width:14px;height:14px;border:1px solid #d1d5db;background:#f9fafb;border-radius:2px;'
			const checkmark = item.checkbox === 'checked' ? '✓' : ''
			return `<div style="${checkboxStyles}">${checkmark}</div>`
		} else if (item.type === 'ol') {
			const listType = getListTypeForLevel(item.level, item.listType)
			const count = getCounter(item.level, listType)
			return `${formatCounter(count, listType)}.`
		} else {
			return getBulletForLevel(item.level)
		}
	}
	
	// Build tree structure
	interface TreeNode {
		item: typeof itemsWithLevel[0]
		children: TreeNode[]
	}
	
	// Iteratively build tree by finding children for each item
	const findChildren = (parentIdx: number, parentLevel: number): TreeNode[] => {
		const children: TreeNode[] = []
		let i = parentIdx + 1
		
		while (i < itemsWithLevel.length) {
			const item = itemsWithLevel[i]
			
			// If we hit an item at same level or less than parent, stop
			if (item.level <= parentLevel) {
				break
			}
			
			// If this item is exactly one level deeper, it's a direct child
			if (item.level === parentLevel + 1) {
				const nodeChildren = findChildren(i, item.level)
				children.push({ item, children: nodeChildren })
			}
			// Items more than one level deeper belong to a previous sibling, skip them
			
			i++
		}
		
		return children
	}
	
	// Find all root-level items (level 0) and their children
	const rootNodes: TreeNode[] = []
	for (let i = 0; i < itemsWithLevel.length; i++) {
		if (itemsWithLevel[i].level === 0) {
			const children = findChildren(i, 0)
			rootNodes.push({ item: itemsWithLevel[i], children })
		}
	}
	
	// Render a tree node as table rows
	// Each item is a row with: [marker (20px, centered)] [content]
	// Children are rendered as additional rows with empty marker cell
	const renderNodeRows = (node: TreeNode): string => {
		const marker = renderMarker(node.item)
		
		// Build rows for this node and its children
		const rows: string[] = []
		
		// Main row with marker and content
		const markerCell = `<td style="width:20px;padding:2px 8px 2px 0;vertical-align:middle;text-align:center;">${marker}</td>`
		const contentCell = `<td style="padding:2px 0;vertical-align:top;">${node.item.content}</td>`
		rows.push(`<tr>${markerCell}${contentCell}</tr>`)
		
		// Children go in subsequent rows, with empty marker cell and nested table in content cell
		if (node.children.length > 0) {
			const childrenHtml = node.children.map(child => renderNode(child)).join('')
			rows.push(`<tr><td></td><td style="padding:0;">${childrenHtml}</td></tr>`)
		}
		
		return rows.join('')
	}
	
	// Render a tree node as a complete table
	const renderNode = (node: TreeNode): string => {
		const rows = renderNodeRows(node)
		return `<table style="border-collapse:collapse;">${rows}</table>`
	}
	
	// Render all root nodes
	return rootNodes.map(node => renderNode(node)).join('')
}

/**
 * Convert number to Roman numerals.
 */
function toRoman(num: number): string {
	const romanNumerals: [number, string][] = [
		[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
		[100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
		[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
	]
	let result = ''
	for (const [value, numeral] of romanNumerals) {
		while (num >= value) {
			result += numeral
			num -= value
		}
	}
	return result
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

// Unicode placeholder for escaped brackets
const ESCAPED_OPEN_BRACKET = '\uE100'
const ESCAPED_CLOSE_BRACKET = '\uE101'

/**
 * Interpolate placeholders in content.
 * Replaces [[placeholder_name]] with values from context.placeholders.
 * Unknown placeholders are left as-is for debugging.
 * 
 * Escape with backslash to output literal brackets:
 * - \[[ → [[  (escaped opening)
 * - \]] → ]]  (escaped closing)
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
 * 
 * interpolatePlaceholders('Use \\[[variable]] syntax', context)
 * // → 'Use [[variable]] syntax' (escaped, literal output)
 * ```
 */
export function interpolatePlaceholders(content: string, context: RenderContext): string {
	// Handle undefined/null content gracefully
	if (content == null) {
		return ''
	}
	
	// Ensure content is a string (handle numbers, booleans, etc.)
	const str = String(content)
	
	// Protect escaped brackets before processing
	let result = str
		.replace(/\\\[\[/g, ESCAPED_OPEN_BRACKET)
		.replace(/\\\]\]/g, ESCAPED_CLOSE_BRACKET)
	
	// Replace placeholders
	result = result.replace(/\[\[([^\]]+)\]\]/g, (_, varName: string) => {
		const value = context.placeholders[varName.trim()]
		return value !== undefined ? escapeHtml(value) : `[[${varName}]]`
	})
	
	// Restore escaped brackets as literal text
	return result
		.replace(new RegExp(ESCAPED_OPEN_BRACKET, 'g'), '[[')
		.replace(new RegExp(ESCAPED_CLOSE_BRACKET, 'g'), ']]')
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
