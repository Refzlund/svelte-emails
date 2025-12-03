import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
import { emailListPlugin } from './src/lib/vite-plugin.js'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Determine the CWD for email discovery
// - When run via CLI: SVELTE_EMAILS_CWD is set by cli.ts
// - When run via npm/bun dev: fall back to apps/dev for development
function getEmailsCwd(): string {
	if (process.env.SVELTE_EMAILS_CWD) {
		return resolve(process.env.SVELTE_EMAILS_CWD)
	}
	// Default to apps/dev for local development
	return resolve(__dirname, '../../apps/dev')
}

export default defineConfig({
	plugins: [
		// emailListPlugin MUST come before sveltekit so its middleware runs first
		emailListPlugin({
			cwd: getEmailsCwd()
		}),
		sveltekit()
	]
})
