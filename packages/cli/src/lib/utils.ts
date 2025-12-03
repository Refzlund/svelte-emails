import type { ViteDevServer } from 'vite'
import type { EmailFile, SafeEmail } from './types.js'

/**
 * Normalize path separators to forward slashes (cross-platform)
 */
export function normalizePath(path: string): string {
	return path.replace(/\\/g, '/')
}

/**
 * Convert an EmailFile to a SafeEmail (strips absolute path)
 */
export function toSafeEmail(email: EmailFile): SafeEmail {
	return {
		id: email.id,
		name: email.name,
		relativePath: email.relativePath,
		previewText: email.previewText
	}
}

/**
 * Convert an array of EmailFiles to SafeEmails
 */
export function toSafeEmails(emails: EmailFile[]): SafeEmail[] {
	return emails.map(toSafeEmail)
}

/**
 * Invalidate a module in Vite's module graph (if it exists)
 */
export function invalidateModule(server: ViteDevServer, path: string): void {
	const mod = server.moduleGraph.getModuleById(path)
	if (mod) {
		server.moduleGraph.invalidateModule(mod)
	}
}

/**
 * Create a debounced function that delays execution until after
 * the specified wait time has elapsed since the last call
 */
export function debounce<TArgs extends unknown[]>(
	fn: (...args: TArgs) => void,
	wait: number
): (...args: TArgs) => void {
	let timeoutId: ReturnType<typeof setTimeout> | null = null

	return (...args: TArgs) => {
		if (timeoutId) {
			clearTimeout(timeoutId)
		}
		timeoutId = setTimeout(() => {
			fn(...args)
			timeoutId = null
		}, wait)
	}
}
