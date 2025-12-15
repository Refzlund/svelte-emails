/**
 * Package script for svelte-emails using @refzlund/repo/pack
 * 
 * Run from repository root: bun run build
 * Run directly: cd packages/svelte-emails && bun scripts/pack.ts
 */

import { pack } from '@refzlund/repo/pack'

await pack({
	// Core library source
	input: './src',
	outDir: '_package',
	distDir: 'dist',

	// Additional documentation files
	extraFiles: ['LLM.md'],

	// Copy CLI application (SvelteKit dev server)
	copyDir: [
		{
			from: '../cli',
			to: 'cli',
			exclude: [
				'**/__*/**',      // Internal test routes
				'**/__*',
				'node_modules/**',
				'.svelte-kit/**',
				'build/**',
				'cli-output/**',  // Separate configs for published package
				'vite.config.ts', // Dev-only config (uses monorepo paths)
				'svelte.config.js' // Dev-only config (has build mode logic)
			]
		}
	],

	// Copy the published-mode config files (simplified, no monorepo paths)
	copy: [
		{ from: '../cli/cli-output/svelte.config.js', to: 'cli/svelte.config.js' },
		{ from: '../cli/cli-output/vite.config.ts', to: 'cli/vite.config.ts' }
	],

	// Bundle the CLI entry point
	bundle: {
		entry: '../cli/src/cli.ts',
		output: 'cli/bin/svelte-emails.js',
		format: 'esm',
		platform: 'node',
		shebang: true,
		external: [
			'node:*',
			'fast-glob',
			'vite',
			'chokidar'
		],
		// Fix __dirname paths after bundling:
		// - Original: src/cli/build.ts uses resolve(__dirname, '../..') to reach cli root
		// - After bundling to bin/: needs resolve(__dirname, '..') to reach cli root
		transforms: [
			{
				find: /const cliRoot = resolve\(__dirname\$?\d*, ["']\.\.\/\.\.["']\)/g,
				replace: 'const cliRoot = resolve(__dirname, "..")'
			}
		]
	},

	// Run ESM import fix after svelte-package
	hooks: {
		postPackage: 'bun scripts/fix-esm-imports.ts'
	}
})
