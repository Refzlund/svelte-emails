/**
 * Full email file metadata (includes absolute path for internal use)
 */
export interface EmailFile {
	/** URL-safe identifier (slugified relative path) */
	id: string
	/** Display name (filename without .email.svelte) */
	name: string
	/** Absolute path to the file */
	path: string
	/** Path relative to CWD */
	relativePath: string
	/** Preview text extracted from <Email preview="..."> */
	previewText: string
}

/**
 * Safe email metadata for client consumption (no absolute paths)
 */
export interface SafeEmail {
	id: string
	name: string
	relativePath: string
	previewText: string
}
