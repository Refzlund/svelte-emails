import { build } from 'rolldown'
import { cp, rm, mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')
const distDir = resolve(rootDir, '_dist')

async function buildPackage() {
	console.log('🧹 Cleaning _dist...')
	if (existsSync(distDir)) {
		await rm(distDir, { recursive: true })
	}
	await mkdir(distDir, { recursive: true })

	// =========================================================================
	// 1. Copy core library source (Svelte components need to stay as source)
	// =========================================================================
	console.log('📦 Copying core library...')
	await cp(
		resolve(rootDir, 'packages/svelte-emails/src'),
		resolve(distDir, 'src'),
		{ recursive: true }
	)

	// =========================================================================
	// 2. Copy CLI's SvelteKit app structure
	// =========================================================================
	console.log('📦 Copying CLI SvelteKit app...')
	
	// The CLI app needs a specific structure for SvelteKit to work
	const cliAppDir = resolve(distDir, 'cli-app')
	await mkdir(cliAppDir, { recursive: true })
	
	// Copy CLI src folder (contains routes, app.html, lib, etc.)
	await cp(
		resolve(rootDir, 'packages/cli/src'),
		resolve(cliAppDir, 'src'),
		{ recursive: true }
	)
	
	// Copy CLI static files
	await cp(
		resolve(rootDir, 'packages/cli/static'),
		resolve(cliAppDir, 'static'),
		{ recursive: true }
	)
	
	// Copy and update svelte.config.js (remove adapter, we only need dev mode)
	const svelteConfig = `import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		// No adapter needed - CLI only runs in dev mode
	}
}

export default config
`
	await writeFile(resolve(cliAppDir, 'svelte.config.js'), svelteConfig)
	
	// Create vite.config.ts for the CLI app
	const viteConfig = `import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
import { emailListPlugin } from './src/lib/vite-plugin.js'
import { resolve } from 'node:path'

function getEmailsCwd(): string {
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
	]
})
`
	await writeFile(resolve(cliAppDir, 'vite.config.ts'), viteConfig)
	
	// Copy tsconfig.json
	await cp(
		resolve(rootDir, 'packages/cli/tsconfig.json'),
		resolve(cliAppDir, 'tsconfig.json')
	)

	// =========================================================================
	// 3. Bundle CLI entry point
	// =========================================================================
	console.log('🔨 Building CLI entry point...')
	await build({
		input: resolve(rootDir, 'packages/cli/src/cli.ts'),
		output: {
			format: 'esm',
			file: resolve(distDir, 'bin/svelte-emails.js')
		},
		platform: 'node',
		external: [
			/^node:/,
			'fast-glob'
		],
		resolve: {
			alias: {
				'./lib/discovery.js': resolve(rootDir, 'packages/cli/src/lib/discovery.ts')
			}
		}
	})

	// Add shebang and fix paths in bundled CLI
	const cliBinPath = resolve(distDir, 'bin/svelte-emails.js')
	let cliContent = await readFile(cliBinPath, 'utf-8')
	
	// Remove any existing shebang and add our own at the top
	cliContent = cliContent.replace(/^#!.*\n/gm, '')
	cliContent = '#!/usr/bin/env node\n' + cliContent
	
	// Fix: CLI should run vite from cli-app directory
	// The bundled code has: resolve(__dirname, '..')
	// We need it to point to cli-app: resolve(__dirname, '..', 'cli-app')
	cliContent = cliContent.replace(
		/const cliRoot = resolve\(__dirname, "\.\."\)/g,
		'const cliRoot = resolve(__dirname, "..", "cli-app")'
	)
	
	await writeFile(cliBinPath, cliContent)

	// =========================================================================
	// 4. Update CLI app's vite-plugin to import from main package
	// =========================================================================
	console.log('🔧 Updating imports...')
	
	// Update vite-plugin.ts to import render from the main package
	const vitePluginPath = resolve(cliAppDir, 'src/lib/vite-plugin.ts')
	let vitePluginContent = await readFile(vitePluginPath, 'utf-8')
	
	// The plugin imports 'svelte-emails' for rendering - this is fine
	// since the package exports it
	
	await writeFile(vitePluginPath, vitePluginContent)

	// =========================================================================
	// 5. Create package.json
	// =========================================================================
	console.log('📝 Creating package.json...')
	
	const corePackage = JSON.parse(
		await readFile(resolve(rootDir, 'packages/svelte-emails/package.json'), 'utf-8')
	)
	const cliPackage = JSON.parse(
		await readFile(resolve(rootDir, 'packages/cli/package.json'), 'utf-8')
	)

	const packageJson = {
		name: 'svelte-emails',
		version: corePackage.version,
		description: 'Email template library for Svelte with a development server',
		type: 'module',
		bin: {
			'svelte-emails': './bin/svelte-emails.js'
		},
		exports: {
			'.': {
				types: './src/index.d.ts',
				svelte: './src/index.ts',
				default: './src/index.ts'
			}
		},
		svelte: './src/index.ts',
		types: './src/index.d.ts',
		files: [
			'src',
			'cli-app',
			'bin'
		],
		peerDependencies: {
			svelte: '^5.0.0'
		},
		dependencies: {
			'fast-glob': cliPackage.dependencies['fast-glob'],
			'chokidar': cliPackage.dependencies['chokidar'],
			'@sveltejs/kit': '^2.48.5',
			'@sveltejs/vite-plugin-svelte': '^6.2.1',
			'vite': '^7.2.2'
		},
		keywords: [
			'svelte',
			'email',
			'templates',
			'mjml',
			'newsletter'
		],
		repository: {
			type: 'git',
			url: 'https://github.com/Refzlund/svelte-emails'
		},
		license: 'MIT',
		author: 'Refzlund'
	}

	await writeFile(
		resolve(distDir, 'package.json'),
		JSON.stringify(packageJson, null, '\t')
	)

	// =========================================================================
	// 6. Copy README and LICENSE
	// =========================================================================
	console.log('📝 Copying README...')
	if (existsSync(resolve(rootDir, 'README.md'))) {
		await cp(resolve(rootDir, 'README.md'), resolve(distDir, 'README.md'))
	}
	if (existsSync(resolve(rootDir, 'LICENSE'))) {
		await cp(resolve(rootDir, 'LICENSE'), resolve(distDir, 'LICENSE'))
	}

	console.log('✅ Build complete!')
	console.log(`   Output: ${distDir}`)
	console.log('')
	console.log('   To test locally:')
	console.log('   cd _dist && bun install && bun run bin/svelte-emails.js --help')
}

buildPackage().catch((err) => {
	console.error('❌ Build failed:', err)
	process.exit(1)
})
