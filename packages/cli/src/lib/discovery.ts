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
 * Parse .gitignore file and return patterns
 */
function parseGitignore(cwd: string): string[] {
	const gitignorePath = join(cwd, '.gitignore')
	if (!existsSync(gitignorePath)) return []

	const content = readFileSync(gitignorePath, 'utf-8')
	return content
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line && !line.startsWith('#'))
}

/**
 * Discover all *.email.svelte files in a directory
 */
export async function discoverEmails(cwd: string): Promise<EmailFile[]> {
	const gitignorePatterns = parseGitignore(cwd)

	const ignorePatterns = [
		'**/node_modules/**',
		'**/.svelte-kit/**',
		'**/dist/**',
		'**/build/**',
		...gitignorePatterns
	]

	const files = await fg('**/*.email.svelte', {
		cwd,
		absolute: true,
		ignore: ignorePatterns
	})

	const emails: EmailFile[] = []

	for (const absolutePath of files) {
		const relativePath = relative(cwd, absolutePath)
		let previewText = ''

		try {
			const content = readFileSync(absolutePath, 'utf-8')
			previewText = extractPreviewText(content)
		} catch {
			// Ignore read errors
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
