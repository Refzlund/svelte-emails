/**
 * Shiki syntax highlighting integration for svelte-emails.
 * 
 * This module provides lazy-loaded Shiki syntax highlighting for code blocks
 * and inline code in emails. Shiki is loaded on-demand, making it an optional
 * dependency.
 * 
 * IMPORTANT: Shiki must be installed separately:
 * ```bash
 * npm install shiki
 * # or
 * bun add shiki
 * ```
 * 
 * @example
 * ```svelte
 * <Text.Codeblock
 *   highlight="typescript"
 *   content={`const greeting = "Hello!"`}
 * />
 * ```
 * 
 * @see ARCHITECTURE.md for syntax highlighting details
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Options for highlighting code with Shiki.
 */
export interface HighlightOptions {
	/** Programming language for syntax highlighting */
	lang: string
	/** 
	 * Theme name or custom theme object.
	 * Defaults to 'github-light' for email readability.
	 * @see https://shiki.style/themes for available themes
	 */
	theme?: string
}

/**
 * Result from highlighting code.
 */
export interface HighlightResult {
	/** The highlighted HTML content */
	html: string
	/** The theme used */
	theme: string
	/** The language used */
	lang: string
}

// ============================================================================
// Lazy Loader
// ============================================================================

// Cached Shiki import promise
let shikiPromise: Promise<typeof import('shiki')> | null = null

/**
 * Lazy-load the Shiki module.
 * Returns the same promise on subsequent calls to avoid multiple imports.
 * 
 * @throws Error if shiki is not installed
 */
async function loadShiki(): Promise<typeof import('shiki')> {
	if (!shikiPromise) {
		shikiPromise = import('shiki').catch((err) => {
			shikiPromise = null // Reset on failure so user can retry
			throw new Error(
				'Shiki is required for syntax highlighting but is not installed. ' +
				'Install it with: npm install shiki (or bun add shiki)\n' +
				`Original error: ${err.message}`
			)
		})
	}
	return shikiPromise
}

// ============================================================================
// Main Highlight Function
// ============================================================================

/** Default theme optimized for email readability */
const DEFAULT_THEME = 'github-light'

/**
 * Highlight code using Shiki with lazy loading.
 * 
 * The first call loads Shiki asynchronously. Subsequent calls reuse the
 * loaded module. Languages and themes are loaded on-demand by Shiki.
 * 
 * @param code - The source code to highlight
 * @param options - Highlighting options (lang, theme, inline)
 * @returns Promise resolving to highlighted HTML
 * 
 * @example
 * ```ts
 * // Basic usage
 * const html = await highlightCode('const x = 1', { lang: 'typescript' })
 * 
 * // With custom theme
 * const html = await highlightCode(code, { 
 *   lang: 'python',
 *   theme: 'nord'
 * })
 * 
 * // For inline code (strips outer wrappers)
 * const html = await highlightCode('console.log()', { 
 *   lang: 'js',
 *   inline: true
 * })
 * ```
 */
export async function highlightCode(
	code: string,
	options: HighlightOptions
): Promise<HighlightResult> {
	const { lang, theme = DEFAULT_THEME } = options

	const shiki = await loadShiki()

	// Use Shiki's shorthand function which loads languages/themes on demand
	let html = await shiki.codeToHtml(code, {
		lang,
		theme
	})

	// Always strip outer wrappers - the renderer adds its own <pre><code> or <code>
	// This gives us consistent styling control while keeping Shiki's syntax spans
	html = stripOuterWrappers(html)

	return { html, theme, lang }
}

/**
 * Strip the outer <pre><code> wrappers from Shiki output.
 * Used for inline code where we don't want block-level elements.
 * 
 * Shiki outputs: <pre ...><code ...>CONTENT</code></pre>
 * We extract: CONTENT
 */
function stripOuterWrappers(html: string): string {
	// Match the content between <code ...> and </code>
	const codeMatch = html.match(/<code[^>]*>([\s\S]*)<\/code>/)
	if (codeMatch) {
		return codeMatch[1]
	}
	// Fallback: return original if pattern doesn't match
	return html
}

/**
 * Check if Shiki is available (installed).
 * Does not load Shiki, just checks if the import would succeed.
 * 
 * @returns Promise resolving to true if Shiki is available
 */
export async function isShikiAvailable(): Promise<boolean> {
	try {
		await import('shiki')
		return true
	} catch {
		return false
	}
}
