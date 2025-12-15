import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

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
		// No adapter needed - CLI dev mode only
	}
}

export default config
