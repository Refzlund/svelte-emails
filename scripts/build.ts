import { build } from 'rolldown'
import { cp, rm, mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')
const packageDir = resolve(rootDir, 'packages/svelte-emails')
const cliDir = resolve(packageDir, 'cli')

async function run(command: string[], cwd: string, env?: Record<string, string>) {
	console.log(`   Running: ${command.join(' ')}`)
	const proc = Bun.spawn(command, {
		cwd,
		env: { ...process.env, ...env },
		stdout: 'inherit',
		stderr: 'inherit'
	})
	const exitCode = await proc.exited
	if (exitCode !== 0) {
		throw new Error(`Command failed with exit code ${exitCode}`)
	}
}

async function buildPackage() {
	console.log('🧹 Cleaning cli directory...')
	if (existsSync(cliDir)) {
		await rm(cliDir, { recursive: true, force: true })
	}
	await mkdir(cliDir, { recursive: true })

	// =========================================================================
	// 1. Build core library with svelte-package
	// =========================================================================
	console.log('\n📦 Building core library with svelte-package...')
	await run(['bun', 'run', 'build'], packageDir)

	// =========================================================================
	// 2. Copy CLI source for dev mode (Vite dev server with HMR)
	// =========================================================================
	console.log('\n📦 Copying CLI source for dev mode...')
	
	// Copy CLI src folder, excluding internal test routes (folders starting with __)
	await cp(
		resolve(rootDir, 'packages/cli/src'),
		resolve(cliDir, 'src'),
		{ 
			recursive: true,
			filter: (source) => {
				// Exclude directories/files starting with __ (internal test routes)
				const name = source.split(/[/\\]/).pop() || ''
				return !name.startsWith('__')
			}
		}
	)
	
	// Copy CLI static files
	await cp(
		resolve(rootDir, 'packages/cli/static'),
		resolve(cliDir, 'static'),
		{ recursive: true }
	)
	
	// Create svelte.config.js for CLI dev mode
	const svelteConfig = `import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

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
`
	await writeFile(resolve(cliDir, 'svelte.config.js'), svelteConfig)
	
	// Create vite.config.ts for the CLI app
	const viteConfig = `import { sveltekit } from '@sveltejs/kit/vite'
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
`
	await writeFile(resolve(cliDir, 'vite.config.ts'), viteConfig)
	
	// Copy tsconfig.json
	await cp(
		resolve(rootDir, 'packages/cli/tsconfig.json'),
		resolve(cliDir, 'tsconfig.json')
	)

	// =========================================================================
	// 3. Bundle CLI entry point
	// =========================================================================
	console.log('\n🔨 Building CLI entry point...')
	await mkdir(resolve(cliDir, 'bin'), { recursive: true })
	
	await build({
		input: resolve(rootDir, 'packages/cli/src/cli.ts'),
		output: {
			format: 'esm',
			dir: resolve(cliDir, 'bin'),
			entryFileNames: 'svelte-emails.js'
		},
		platform: 'node',
		external: [
			/^node:/,
			'fast-glob',
			'vite',
			'chokidar'
		],
		resolve: {
			alias: {
				'./lib/discovery.js': resolve(rootDir, 'packages/cli/src/lib/discovery.ts')
			}
		}
	})

	// Add shebang and fix paths in bundled CLI
	const cliBinPath = resolve(cliDir, 'bin/svelte-emails.js')
	let cliContent = await readFile(cliBinPath, 'utf-8')
	
	// Remove any existing shebang and add our own at the top
	cliContent = cliContent.replace(/^#!.*\n/gm, '')
	cliContent = '#!/usr/bin/env node\n' + cliContent
	
	// Fix paths for the bundled CLI:
	// - cli.ts uses resolve(__dirname, '..') to go from src/ to cli root
	//   After bundling to bin/, this should become resolve(__dirname, '..')
	//   to go from bin/ to cli/
	// - build.ts uses resolve(__dirname, '../..') to go from src/cli/ to cli root
	//   After bundling to bin/, this should become resolve(__dirname, '..')
	//   to go from bin/ to cli/
	cliContent = cliContent.replace(
		/const cliRoot = resolve\(__dirname\$?\d*, ["']\.\.\/\.\.["']\)/g,
		'const cliRoot = resolve(__dirname, "..")'
	)
	cliContent = cliContent.replace(
		/const cliRoot = resolve\(__dirname, ["']\.\.["']\)/g,
		'const cliRoot = resolve(__dirname, "..")'
	)
	
	await writeFile(cliBinPath, cliContent)

	// =========================================================================
	// 4. Copy README and LLM.md to package directory
	// =========================================================================
	console.log('\n📝 Copying README, LLM.md...')
	if (existsSync(resolve(rootDir, 'README.md'))) {
		await cp(resolve(rootDir, 'README.md'), resolve(packageDir, 'README.md'))
	}
	if (existsSync(resolve(rootDir, 'LLM.md'))) {
		await cp(resolve(rootDir, 'LLM.md'), resolve(packageDir, 'LLM.md'))
	}
	if (existsSync(resolve(rootDir, 'LICENSE'))) {
		await cp(resolve(rootDir, 'LICENSE'), resolve(packageDir, 'LICENSE'))
	}

	console.log('\n✅ Build complete!')
	console.log(`   Output: ${packageDir}`)
	console.log('')
	console.log('   Structure:')
	console.log('   - dist/      → Core library (built with svelte-package)')
	console.log('   - cli/       → CLI dev server source (Vite + SvelteKit)')
	console.log('   - cli/bin/   → CLI entry point')
	console.log('')
	console.log('   To publish:')
	console.log('   cd packages/svelte-emails && npm publish')
}

buildPackage().catch((err) => {
	console.error('❌ Build failed:', err)
	process.exit(1)
})
