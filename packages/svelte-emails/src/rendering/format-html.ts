/**
 * HTML Formatter for pretty-printing minified HTML.
 * 
 * Used in Render.svelte to display readable HTML source code
 * while keeping the actual output minified for email size.
 */

/**
 * Format CSS inside a <style> tag with proper indentation.
 * 
 * @param css - Minified CSS string
 * @param baseIndent - Base indentation for the style tag
 * @param indentSize - Spaces per indent level
 * @returns Formatted CSS string
 */
function formatStyleContent(css: string, baseIndent: string, indentSize: number): string {
	const innerIndent = baseIndent + ' '.repeat(indentSize)
	const ruleIndent = innerIndent + ' '.repeat(indentSize)
	
	let result = ''
	let i = 0
	
	while (i < css.length) {
		// Skip whitespace
		while (i < css.length && /\s/.test(css[i])) i++
		if (i >= css.length) break
		
		// Check for @media or other at-rules
		if (css[i] === '@') {
			const braceStart = css.indexOf('{', i)
			if (braceStart === -1) break
			
			// Find matching closing brace
			let braceCount = 1
			let braceEnd = braceStart + 1
			while (braceEnd < css.length && braceCount > 0) {
				if (css[braceEnd] === '{') braceCount++
				else if (css[braceEnd] === '}') braceCount--
				braceEnd++
			}
			
			const atRule = css.slice(i, braceStart).trim()
			const innerCss = css.slice(braceStart + 1, braceEnd - 1)
			
			result += `\n${innerIndent}${atRule} {`
			// Recursively format inner content with extra indent
			const formattedInner = formatStyleContent(innerCss, innerIndent, indentSize)
			result += formattedInner
			result += `\n${innerIndent}}`
			
			i = braceEnd
			continue
		}
		
		// Regular rule: selector { properties }
		const braceStart = css.indexOf('{', i)
		if (braceStart === -1) break
		
		const braceEnd = css.indexOf('}', braceStart)
		if (braceEnd === -1) break
		
		const selector = css.slice(i, braceStart).trim()
		const properties = css.slice(braceStart + 1, braceEnd).trim()
		
		result += `\n${innerIndent}${selector} {`
		
		// Format properties
		const props = properties.split(';').filter(p => p.trim())
		for (const prop of props) {
			result += `\n${ruleIndent}${prop.trim()};`
		}
		
		result += `\n${innerIndent}}`
		
		i = braceEnd + 1
	}
	
	return result
}

/**
 * Format a tag's attributes, prettifying style attributes.
 * 
 * @param tagContent - The content between < and > (e.g., 'div class="foo" style="..."')
 * @param baseIndent - Current indentation level
 * @returns Formatted tag content
 */
function formatTagWithStyle(tagContent: string, baseIndent: string): string {
	// Check if there's a style attribute
	const styleMatch = tagContent.match(/(\s+style=")([^"]*)(")/)
	if (!styleMatch) return tagContent
	
	const styleValue = styleMatch[2]
	const properties = styleValue.split(';').filter(p => p.trim())
	
	// Only format if multiple properties
	if (properties.length <= 2) return tagContent
	
	// Format style on multiple lines
	const formattedStyle = properties
		.map(p => `${baseIndent}    ${p.trim()};`)
		.join('\n')
	
	const beforeStyle = tagContent.slice(0, styleMatch.index)
	const afterStyle = tagContent.slice(styleMatch.index! + styleMatch[0].length)
	
	return `${beforeStyle}\n${baseIndent}  style="\n${formattedStyle}\n${baseIndent}  "${afterStyle}`
}

/**
 * Options for HTML formatting.
 */
interface FormatHtmlOptions {
	/** Number of spaces per indent level (default: 2) */
	indentSize?: number
	/** Whether to format style attributes and <style> tag contents (default: true) */
	formatStyle?: boolean
}

/**
 * Format minified HTML into a readable, indented structure.
 * 
 * Features:
 * - Indents nested elements
 * - Preserves inline elements on same line
 * - Handles self-closing tags
 * - Formats <style> tag contents with proper CSS indentation (when formatStyle is true)
 * - Formats inline style attributes with multiple properties (when formatStyle is true)
 * - Handles HTML comments and MSO conditionals
 * 
 * @param html - Minified HTML string
 * @param options - Formatting options
 * @returns Formatted HTML string
 */
export function formatHtml(html: string, options: FormatHtmlOptions = {}): string {
	const { indentSize = 2, formatStyle = true } = options
	// Inline elements that shouldn't cause line breaks
	const inlineTags = new Set([
		'a', 'abbr', 'b', 'bdo', 'br', 'cite', 'code', 'dfn', 'em', 'i', 'img',
		'kbd', 'label', 'map', 'object', 'q', 's', 'samp', 'small', 'span',
		'strong', 'sub', 'sup', 'time', 'tt', 'u', 'var'
	])
	
	// Self-closing tags
	const voidTags = new Set([
		'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link',
		'meta', 'param', 'source', 'track', 'wbr'
	])
	
	let result = ''
	let indent = 0
	let i = 0
	
	const getIndent = () => ' '.repeat(indent * indentSize)
	const addNewline = () => result.length > 0 && !result.endsWith('\n') ? '\n' : ''
	
	while (i < html.length) {
		// Check for comments (including MSO conditionals)
		if (html.slice(i, i + 4) === '<!--') {
			const endComment = html.indexOf('-->', i)
			if (endComment === -1) break
			
			const comment = html.slice(i, endComment + 3)
			result += addNewline() + getIndent() + comment
			i = endComment + 3
			continue
		}
		
		// Check for closing tag
		if (html.slice(i, i + 2) === '</') {
			const endTag = html.indexOf('>', i)
			if (endTag === -1) break
			
			const tagContent = html.slice(i + 2, endTag)
			const tagName = tagContent.trim().toLowerCase()
			
			// Decrease indent for block-level closing tags
			if (!inlineTags.has(tagName)) {
				indent = Math.max(0, indent - 1)
				result += addNewline() + getIndent()
			}
			
			result += `</${tagContent}>`
			i = endTag + 1
			continue
		}
		
		// Check for opening tag
		if (html[i] === '<') {
			const endTag = html.indexOf('>', i)
			if (endTag === -1) break
			
			const tagContent = html.slice(i + 1, endTag)
			const tagMatch = tagContent.match(/^(\/?)([\w-]+)/)
			
			if (tagMatch) {
				const tagName = tagMatch[2].toLowerCase()
				const isSelfClosing = html[endTag - 1] === '/' || voidTags.has(tagName)
				
				// Handle <style> tag specially - format CSS content if enabled
				if (tagName === 'style') {
					const closeTag = '</style>'
					const closeIndex = html.indexOf(closeTag, endTag)
					
					if (closeIndex !== -1) {
						const cssContent = html.slice(endTag + 1, closeIndex)
						const currentIndent = getIndent()
						
						result += addNewline() + currentIndent + `<${tagContent}>`
						if (formatStyle) {
							result += formatStyleContent(cssContent, currentIndent, indentSize)
							result += `\n${currentIndent}</style>`
						} else {
							result += cssContent + '</style>'
						}
						
						i = closeIndex + closeTag.length
						continue
					}
				}
				
				// Handle script/pre/textarea - preserve content as-is
				if (tagName === 'script' || tagName === 'pre' || tagName === 'textarea') {
					const closeTag = `</${tagName}>`
					const closeIndex = html.indexOf(closeTag, endTag)
					
					if (closeIndex !== -1) {
						const fullTag = html.slice(i, closeIndex + closeTag.length)
						result += addNewline() + getIndent() + fullTag
						i = closeIndex + closeTag.length
						continue
					}
				}
				
				// Add newline and indent for block elements
				if (!inlineTags.has(tagName)) {
					result += addNewline() + getIndent()
				}
				
				// Format the tag (potentially with multi-line style attribute if enabled)
				const formattedTag = formatStyle ? formatTagWithStyle(tagContent, getIndent()) : tagContent
				result += `<${formattedTag}>`
				
				// Increase indent after opening block tags (unless self-closing)
				if (!inlineTags.has(tagName) && !isSelfClosing) {
					indent++
				}
				
				i = endTag + 1
				continue
			} else {
				// Unrecognized tag-like content, output as-is and advance
				result += html.slice(i, endTag + 1)
				i = endTag + 1
				continue
			}
		}
		
		// Regular text content
		let textEnd = html.indexOf('<', i)
		if (textEnd === -1) textEnd = html.length
		
		// Ensure we always advance at least one character to prevent infinite loops
		if (textEnd === i) {
			result += html[i]
			i++
			continue
		}
		
		const text = html.slice(i, textEnd)
		if (text.trim()) {
			result += text
		}
		i = textEnd
	}
	
	return result.trim()
}
