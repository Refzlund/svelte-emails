import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
import { emailListPlugin } from './src/cli/vite-plugin.js'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function getEmailsCwd() {
	if (process.env.SVELTE_EMAILS_CWD) {
		return resolve(process.env.SVELTE_EMAILS_CWD)
	}
	return process.cwd()
}

export default defineConfig({
	plugins: [
		emailListPlugin({
			cwd: getEmailsCwd()
		}),
		sveltekit()
	],
	// Performance optimizations for running in user's project
	cacheDir: resolve(__dirname, 'node_modules/.vite'),
	optimizeDeps: {
		// Don't scan the user's project for dependencies
		entries: [],
		// Exclude user's potential dependencies
		exclude: ['svelte-emails'],
		// Don't force re-optimization
		force: false
	},
	// SSR config - svelte-emails must be processed by Vite, not loaded by Node directly
	ssr: {
		noExternal: ['svelte-emails']
	},
	server: {
		fs: {
			allow: [
				__dirname,
				getEmailsCwd(),
				resolve(__dirname, 'node_modules'),
				resolve(__dirname, '..', 'node_modules')
			]
		},
		watch: {
			ignored: [
				'**/node_modules/**',
				'**/.git/**',
				'**/.svelte-kit/**',
				'**/dist/**',
				'**/build/**'
			]
		}
	}
})
