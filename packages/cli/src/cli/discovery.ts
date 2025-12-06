import fg from 'fast-glob'
import { readFileSync, existsSync } from 'node:fs'
import { basename, relative, join, dirname } from 'node:path'
import type { EmailFile, ViewMode } from './types.js'
import { sortByOrder } from './utils.js'

export type { EmailFile, ViewMode }

/**
 * Create a URL-safe ID from a relative path
 * Since each mode has its own route prefix, we don't need to include mode in the ID
 */
function createId(relativePath: string): string {
	return relativePath
		.replace(/\.email\.svelte$/, '')
		.replace(/\.svelte$/, '')
		.replace(/[/\\]/g, '-')
		.replace(/[^a-zA-Z0-9-]/g, '_')
		.toLowerCase()
}

/**
 * Extract the display name from a filename
 */
function extractName(filename: string): string {
	return basename(filename)
		.replace(/\.email\.svelte$/, '')
		.replace(/\.svelte$/, '')
		.replace(/([a-z])([A-Z])/g, '$1 $2') // CamelCase to spaces
		.replace(/[-_]/g, ' ') // kebab/snake to spaces
		.replace(/\b\w/g, (c) => c.toUpperCase()) // Capitalize words
}

/**
 * Extract an attribute value from <Email> tag, handling various formats
 * Supports:
 * - Double quotes: attr="value with 'apostrophes'"
 * - Single quotes: attr='value'
 * - Template literals: attr={`value`}
 * - Expressions: attr={someVar.method()} -> returns raw expression
 * - Bare values: attr=0, attr=123 (unquoted numeric or string values)
 */
function extractEmailAttribute(content: string, attrName: string): string {
	// Skip the script section to avoid matching <Email> in string literals
	// Look for closing </script> tag and search from there
	const scriptEndMatch = content.match(/<\/script>/i)
	const searchContent = scriptEndMatch 
		? content.slice(scriptEndMatch.index! + scriptEndMatch[0].length)
		: content
	
	// Find <Email tag start in the markup section
	const emailTagMatch = searchContent.match(/<Email\b/)
	if (!emailTagMatch) return ''
	
	const startIdx = emailTagMatch.index!
	// Find the matching > considering multiline tags
	let depth = 0
	let endIdx = startIdx
	for (let i = startIdx; i < searchContent.length; i++) {
		if (searchContent[i] === '<') depth++
		else if (searchContent[i] === '>') {
			if (depth === 1) {
				endIdx = i
				break
			}
			depth--
		}
	}
	
	const emailTag = searchContent.slice(startIdx, endIdx + 1)
	
	// Pattern for attr="value" (double quotes can contain single quotes)
	const doubleQuotePattern = new RegExp(`${attrName}="([^"]*)"`)
	const doubleMatch = emailTag.match(doubleQuotePattern)
	if (doubleMatch?.[1]) {
		return doubleMatch[1].slice(0, 100)
	}
	
	// Pattern for attr='value' (single quotes can contain double quotes)
	const singleQuotePattern = new RegExp(`${attrName}='([^']*)'`)
	const singleMatch = emailTag.match(singleQuotePattern)
	if (singleMatch?.[1]) {
		return singleMatch[1].slice(0, 100)
	}
	
	// Pattern for attr={`template literal`}
	const templatePattern = new RegExp(`${attrName}=\\{\`([^\`]*)\`\\}`)
	const templateMatch = emailTag.match(templatePattern)
	if (templateMatch?.[1]) {
		return templateMatch[1].slice(0, 100)
	}
	
	// Pattern for attr={expression} - return the raw expression
	const exprPattern = new RegExp(`${attrName}=\\{([^}]+)\\}`)
	const exprMatch = emailTag.match(exprPattern)
	if (exprMatch?.[1]) {
		// Return the expression value (without wrapping in {})
		return exprMatch[1].trim().slice(0, 100)
	}
	
	// Pattern for attr=bareValue (unquoted, e.g., order=1 or order=0)
	// Must not be followed by quotes or braces, captures until whitespace or >
	const barePattern = new RegExp(`${attrName}=([^"'{\\s>][^\\s>]*)`)
	const bareMatch = emailTag.match(barePattern)
	if (bareMatch?.[1]) {
		return bareMatch[1].slice(0, 100)
	}
	
	return ''
}

/**
 * Extract preview text from <Email preview="..."> in a Svelte file
 */
export function extractPreviewText(content: string): string {
	return extractEmailAttribute(content, 'preview')
}

/**
 * Extract category from <Email category="..."> in a Svelte file
 */
export function extractCategory(content: string): string {
	return extractEmailAttribute(content, 'category')
}

/**
 * Extract order from <Email order=...> in a Svelte file
 * Returns undefined if not specified or invalid
 */
export function extractOrder(content: string): number | undefined {
	const value = extractEmailAttribute(content, 'order')
	if (!value) return undefined
	
	// Handle numeric values (order={1}, order="1", order='1')
	const num = parseFloat(value)
	if (!isNaN(num) && isFinite(num)) return num
	
	return undefined
}

/**
 * Parse .gitignore file and return patterns suitable for fast-glob ignore
 */
function parseGitignore(gitignorePath: string): string[] {
	if (!existsSync(gitignorePath)) return []

	const content = readFileSync(gitignorePath, 'utf-8')
	return content
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line && !line.startsWith('#'))
		.map((pattern) => {
			// Convert gitignore patterns to glob patterns
			// Remove leading slash (gitignore uses / for root-relative, but we want relative patterns)
			if (pattern.startsWith('/')) {
				pattern = pattern.slice(1)
			}
			// Ensure directory patterns match all contents
			if (pattern.endsWith('/')) {
				return `**/${pattern}**`
			}
			// If pattern doesn't have a slash, it should match anywhere
			if (!pattern.includes('/')) {
				return `**/${pattern}`
			}
			return pattern
		})
}

/**
 * Collect all .gitignore patterns from root and nested directories
 */
function collectGitignorePatterns(cwd: string): string[] {
	const patterns: string[] = []
	
	// Read root .gitignore
	const rootGitignore = join(cwd, '.gitignore')
	patterns.push(...parseGitignore(rootGitignore))
	
	return patterns
}

/**
 * Get comprehensive ignore patterns for file discovery
 */
export function getIgnorePatterns(cwd: string): string[] {
	const gitignorePatterns = collectGitignorePatterns(cwd)

	return [
		// Always ignore these directories regardless of .gitignore
		'**/node_modules/**',
		'**/node_modules',
		'**/.git/**',
		'**/.git',
		'**/.svelte-kit/**',
		'**/.svelte-kit',
		'**/dist/**',
		'**/dist',
		'**/build/**',
		'**/build',
		'**/.next/**',
		'**/.nuxt/**',
		'**/.output/**',
		'**/.vercel/**',
		'**/.netlify/**',
		'**/coverage/**',
		'**/.cache/**',
		'**/tmp/**',
		'**/temp/**',
		'**/.turbo/**',
		'**/.nx/**',
		// Gitignore patterns from the project
		...gitignorePatterns
	]
}

/**
 * Discover all *.email.svelte files in a directory
 * @param cwd - Working directory to scan
 * @param skipPreview - Skip reading file contents for preview text (faster)
 * @param additionalIgnore - Additional glob patterns to ignore
 */
export async function discoverEmails(cwd: string, skipPreview = false, additionalIgnore: string[] = []): Promise<EmailFile[]> {
	const ignorePatterns = [...getIgnorePatterns(cwd), ...additionalIgnore]

	const files = await fg('**/*.email.svelte', {
		cwd,
		absolute: true,
		ignore: ignorePatterns,
		followSymbolicLinks: false,
		suppressErrors: true,
		concurrency: 4, // Limit concurrent fs operations
		deep: 15 // Reasonable depth limit
	})

	const emails: EmailFile[] = []

	for (const absolutePath of files) {
		const relativePath = relative(cwd, absolutePath)
		let previewText = ''
		let category = ''
		let order: number | undefined

		if (!skipPreview) {
			try {
				const content = readFileSync(absolutePath, 'utf-8')
				previewText = extractPreviewText(content)
				category = extractCategory(content)
				order = extractOrder(content)
			} catch {
				// Ignore read errors
			}
		}

		emails.push({
			id: createId(relativePath),
			name: extractName(relativePath),
			path: absolutePath,
			relativePath,
			previewText,
			category,
			order,
			mode: 'emails'
		})
	}

	return sortByOrder(emails)
}

/**
 * Get the CLI package's src directory path
 * This is where examples and documentation are bundled
 */
export function getCliSrcDir(): string {
	// import.meta.url gives us the current file's URL
	const currentFileUrl = import.meta.url
	const currentFilePath = new URL(currentFileUrl).pathname
	// On Windows, pathname starts with /C:/ - need to handle this
	const normalizedPath = currentFilePath.replace(/^\/([A-Za-z]:)/, '$1')
	return join(normalizedPath, '..', '..')
}

/**
 * Discover *.svelte files in a specific subfolder (e.g., src/examples, src/documentation)
 * These are bundled with the CLI package itself, not in the user's project.
 * @param subfolder - Subfolder name (e.g., 'examples', 'documentation')
 * @param mode - The view mode for these files
 * @param skipPreview - Skip reading file contents for preview text (faster)
 */
export async function discoverSvelteFiles(
	subfolder: string, 
	mode: ViewMode, 
	skipPreview = false
): Promise<EmailFile[]> {
	// Get the CLI package's src directory (where this file lives)
	const cliSrcDir = getCliSrcDir()
	const searchPath = join(cliSrcDir, subfolder)
	
	if (!existsSync(searchPath)) {
		return []
	}

	const files = await fg('**/*.svelte', {
		cwd: searchPath,
		absolute: true,
		ignore: [
			'**/node_modules/**',
			'**/.svelte-kit/**'
		],
		followSymbolicLinks: false,
		suppressErrors: true,
		concurrency: 4,
		deep: 5
	})

	const items: EmailFile[] = []

	for (const absolutePath of files) {
		const relativePath = relative(searchPath, absolutePath)
		let previewText = ''
		let category = ''
		let order: number | undefined

		if (!skipPreview) {
			try {
				const content = readFileSync(absolutePath, 'utf-8')
				previewText = extractPreviewText(content)
				category = extractCategory(content)
				order = extractOrder(content)
			} catch {
				// Ignore read errors
			}
		}

		// For bundled files, use folder name as category if not specified in <Email>
		// e.g., "1. Getting Started/Introduction.svelte" -> category: "1. Getting Started"
		// Handle both forward slashes (Unix) and backslashes (Windows)
		if (!category && (relativePath.includes('/') || relativePath.includes('\\'))) {
			category = dirname(relativePath).replace(/\\/g, '/')
		}

		items.push({
			id: createId(relativePath),
			name: extractName(relativePath),
			path: absolutePath,
			relativePath: `${subfolder}/${relativePath}`,
			previewText,
			category,
			order,
			mode
		})
	}

	return sortByOrder(items)
}

/**
 * Discover all files for all view modes
 * @param cwd - User's project directory for emails
 * @param skipPreview - Skip reading file contents for preview text (faster)
 * @param ignorePatterns - Additional glob patterns to ignore for user emails
 */
export async function discoverAll(cwd: string, skipPreview = false, ignorePatterns: string[] = []): Promise<{
	emails: EmailFile[]
	examples: EmailFile[]
	documentation: EmailFile[]
}> {
	const [emails, examples, documentation] = await Promise.all([
		discoverEmails(cwd, skipPreview, ignorePatterns),
		discoverSvelteFiles('examples', 'examples', skipPreview),
		discoverSvelteFiles('documentation', 'documentation', skipPreview)
	])

	return { emails, examples, documentation }
}
