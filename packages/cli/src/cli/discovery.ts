import fg from 'fast-glob'
import { readFileSync, existsSync } from 'node:fs'
import { basename, relative, join } from 'node:path'
import type { EmailFile } from './types.js'

export type { EmailFile }

/**
 * Create a URL-safe ID from a relative path
 */
function createId(relativePath: string): string {
	return relativePath
		.replace(/\.email\.svelte$/, '')
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
		.replace(/([a-z])([A-Z])/g, '$1 $2') // CamelCase to spaces
		.replace(/[-_]/g, ' ') // kebab/snake to spaces
		.replace(/\b\w/g, (c) => c.toUpperCase()) // Capitalize words
}

/**
 * Extract preview text from <Email preview="..."> in a Svelte file
 */
function extractPreviewText(content: string): string {
	// Match <Email ... preview="..." ...> or preview='...' or preview={`...`}
	const patterns = [
		/<Email[^>]*\spreview=["']([^"']+)["'][^>]*>/,
		/<Email[^>]*\spreview=\{[`"']([^`"']+)[`"']\}[^>]*>/
	]

	for (const pattern of patterns) {
		const match = content.match(pattern)
		if (match?.[1]) {
			return match[1].slice(0, 100) // Limit to 100 chars
		}
	}

	return ''
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
 */
export async function discoverEmails(cwd: string, skipPreview = false): Promise<EmailFile[]> {
	const ignorePatterns = getIgnorePatterns(cwd)

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

		if (!skipPreview) {
			try {
				const content = readFileSync(absolutePath, 'utf-8')
				previewText = extractPreviewText(content)
			} catch {
				// Ignore read errors
			}
		}

		emails.push({
			id: createId(relativePath),
			name: extractName(relativePath),
			path: absolutePath,
			relativePath,
			previewText
		})
	}

	// Sort alphabetically by name
	emails.sort((a, b) => a.name.localeCompare(b.name))

	return emails
}
