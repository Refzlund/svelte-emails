import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

// Conditionally load adapter-static for build mode
const isBuildMode = process.env.SVELTE_EMAILS_BUILD === '1'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	// Inject CSS into JS instead of emitting separate CSS files
	// This bypasses the virtual CSS module system that can cause race conditions
	// in rolldown-vite on first page load. Since this is a dev tool, the slight
	// performance tradeoff is acceptable.
	// See: https://github.com/sveltejs/vite-plugin-svelte/issues/1192
	compilerOptions: {
		css: 'injected'
	},
	kit: {
		// Use adapter-static for build mode (static SPA), no adapter for dev
		adapter: isBuildMode
			? (await import('@sveltejs/adapter-static')).default({
				pages: process.env.SVELTE_EMAILS_OUT_DIR || 'build',
				assets: process.env.SVELTE_EMAILS_OUT_DIR || 'build',
				fallback: 'index.html', // SPA fallback - all routes serve index.html
				precompress: false,
				strict: false // Don't require all routes to be prerendered
			})
			: undefined,
		// Set base path for deployment (e.g., GitHub Pages subdirectory)
		paths: {
			base: isBuildMode ? (process.env.SVELTE_EMAILS_BASE || '').replace(/\/$/, '') : ''
		},
		// Prerender configuration for static build
		prerender: {
			// Only prerender the root for the fallback
			entries: isBuildMode ? ['/'] : ['*'],
			// Don't fail on unrendered routes in build mode (we use fallback)
			handleMissingId: 'warn'
		}
	}
}

export default config
