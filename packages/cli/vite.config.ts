import devtoolsJson from 'vite-plugin-devtools-json';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { emailListPlugin } from './src/cli/vite-plugin.js';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Determine the CWD for email discovery
// - When run via CLI: SVELTE_EMAILS_CWD is set by cli.ts
// - When run via npm/bun dev: fall back to apps/dev for development
function getEmailsCwd(): string {
	if (process.env.SVELTE_EMAILS_CWD) {
		return resolve(process.env.SVELTE_EMAILS_CWD);
	}

	// Default to apps/dev for local development
	return resolve(__dirname, '../../apps/dev');
}

// Check if we're running in library development mode
// Set SVELTE_EMAILS_DEV=1 to enable watching bundled examples/documentation
function isLibraryDevelopment(): boolean {
	return process.env.SVELTE_EMAILS_DEV === '1';
}

// Find the root of the installed package (handles bunx temp directories)
function getPackageRoot(): string {
	// Go up from cli-app to the package root
	return resolve(__dirname, '..');
}

// Resolve svelte-emails to its source for development
// This allows email templates to import 'svelte-emails' without building the package
function getSvelteEmailsPath(): string {
	// In monorepo development, point to the source
	return resolve(__dirname, '../svelte-emails/src/index.ts');
}

export default defineConfig({
	plugins: [
		// emailListPlugin MUST come before sveltekit so its middleware runs first
		emailListPlugin({
			cwd: getEmailsCwd(),
			// Watch bundled examples/documentation only during library development
			// (when running `bun dev` in CLI package, not via `bunx svelte-emails`)
			watchBundled: isLibraryDevelopment()
		}),
		sveltekit(),
		devtoolsJson()
	],
	// Optimize startup time when running in user's project
	cacheDir: resolve(__dirname, 'node_modules/.vite'),
	// Worker configuration for static builds
	worker: {
		format: 'es'
	},
	resolve: {
		alias: {
			// Resolve 'svelte-emails' to the source for development
			// This ensures the module runner can find it regardless of where emails are located
			'svelte-emails': getSvelteEmailsPath(),
			// Alias for CLI/plugin code (server-side)
			'$cli': resolve(__dirname, 'src/cli')
		},
		// Ensure single instance of svelte across all module boundaries
		// This is critical for SSR context to work properly - the ssr_context
		// module-level variable must be shared between svelte-emails and email components
		dedupe: ['svelte']
	},
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
		// Bundle these packages into SSR build to ensure single instances
		// This is critical for Svelte's SSR context to work properly - the ssr_context
		// module-level variable in svelte/internal/server/context.js must be shared
		// between svelte-emails and the email component modules
		noExternal: ['svelte-emails', 'svelte']
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
});
