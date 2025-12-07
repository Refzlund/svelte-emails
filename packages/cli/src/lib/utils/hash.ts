/**
 * Generate a simple version hash for content-based cache invalidation.
 * Uses djb2-like hashing algorithm for fast string hashing.
 */
export function generateVersion(content: string): string {
	let hash = 0
	for (let i = 0; i < content.length; i++) {
		const char = content.charCodeAt(i)
		hash = ((hash << 5) - hash) + char
		hash = hash & hash // Convert to 32-bit integer
	}
	return hash.toString(36)
}
