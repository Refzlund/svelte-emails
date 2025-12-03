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

// Find the root of the installed package (handles bunx temp directories)
function getPackageRoot(): string {
	// Go up from cli-app to the package root
	return resolve(__dirname, '..')
}

export default defineConfig({
	plugins: [
		// emailListPlugin MUST come before sveltekit so its middleware runs first
		emailListPlugin({
			cwd: getEmailsCwd()
		}),
		sveltekit()
	],
	// Optimize startup time when running in user's project
	cacheDir: resolve(__dirname, 'node_modules/.vite'),
	optimizeDeps: {
		// Don't scan the user's project for dependencies
		// The CLI only needs its own dependencies
		entries: [],
		// Exclude user's potential dependencies that might interfere
		exclude: ['svelte-emails'],
		// Force cache to be in CLI directory
		force: false
	},
	ssr: {
		noExternal: ['svelte-emails']
	},
	server: {
		// Allow serving files from the user's email directory
		fs: {
			// Allow serving files from anywhere - necessary for bunx temp directories
			// and various package manager layouts (npm, pnpm, bun, yarn)
			strict: false,
			allow: [
				// CLI package directory
				__dirname,
				// User's email directory (will be set via env)
				getEmailsCwd(),
				// Package root (includes node_modules)
				getPackageRoot()
			]
		},
		// Reduce file system watching overhead
		watch: {
			// Only watch what's necessary
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
