/**
 * View mode for the CLI - emails, examples, or documentation
 */
export type ViewMode = 'emails' | 'examples' | 'documentation'

/**
 * Full email file metadata (includes absolute path for internal use)
 */
export interface EmailFile {
	/** URL-safe identifier (slugified relative path) */
	id: string
	/** Display name (filename without .email.svelte or .svelte) */
	name: string
	/** Absolute path to the file */
	path: string
	/** Path relative to CWD */
	relativePath: string
	/** Preview text extracted from <Email preview="..."> */
	previewText: string
	/** Category for grouping in navigation (from <Email category="...">) */
	category: string
	/** Order for sorting in navigation (from <Email order=...>) */
	order: number | undefined
	/** Which view mode this file belongs to */
	mode: ViewMode
}

/**
 * Safe email metadata for client consumption (no absolute paths)
 */
export interface SafeEmail {
	id: string
	name: string
	relativePath: string
	previewText: string
	category: string
	order: number | undefined
	mode: ViewMode
}
