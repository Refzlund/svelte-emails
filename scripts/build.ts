import { build } from 'rolldown'
import { cp, rm, mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')
const distDir = resolve(rootDir, '_dist')

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
	console.log('🧹 Cleaning _dist...')
	if (existsSync(distDir)) {
		try {
			await rm(distDir, { recursive: true, force: true })
		} catch {
			// If rm fails, try to clean contents instead
			console.log('   Could not remove _dist, cleaning contents instead...')
		}
	}
	await mkdir(distDir, { recursive: true })

	// =========================================================================
	// 1. Build core library with svelte-package
	// =========================================================================
	console.log('\n📦 Building core library with svelte-package...')
	const coreLibDir = resolve(rootDir, 'packages/svelte-emails')
	await run(['bun', 'run', 'build'], coreLibDir)
	
	// Copy the built dist folder to _dist/dist (library output)
	await cp(
		resolve(coreLibDir, 'dist'),
		resolve(distDir, 'dist'),
		{ recursive: true }
	)

	// =========================================================================
	// 2. Copy CLI source for dev mode (Vite dev server with HMR)
	// =========================================================================
	console.log('\n📦 Copying CLI source for dev mode...')
	const cliAppDir = resolve(distDir, 'cli-app')
	await mkdir(cliAppDir, { recursive: true })
	
	// Copy CLI src folder
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
	
	// Copy and update svelte.config.js for dev mode (no adapter needed)
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
	await writeFile(resolve(cliAppDir, 'svelte.config.js'), svelteConfig)
	
	// Create vite.config.ts for the CLI app with performance optimizations
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
	await writeFile(resolve(cliAppDir, 'vite.config.ts'), viteConfig)
	
	// Copy tsconfig.json
	await cp(
		resolve(rootDir, 'packages/cli/tsconfig.json'),
		resolve(cliAppDir, 'tsconfig.json')
	)

	// Create symlink for node_modules so cli-app can resolve dependencies
	const cliAppNodeModules = resolve(cliAppDir, 'node_modules')
	const parentNodeModules = resolve(distDir, 'node_modules')
	try {
		// Remove existing node_modules if it exists (might be a directory from previous builds)
		if (existsSync(cliAppNodeModules)) {
			await rm(cliAppNodeModules, { recursive: true })
		}
		// Create a junction (Windows) or symlink (Unix) to parent node_modules
		const { symlink } = await import('node:fs/promises')
		await symlink(parentNodeModules, cliAppNodeModules, 'junction')
		console.log('   Created node_modules symlink for cli-app')
	} catch (err) {
		console.warn('   Warning: Could not create node_modules symlink:', err)
	}

	// =========================================================================
	// 3. Bundle CLI entry point
	// =========================================================================
	console.log('\n🔨 Building CLI entry point...')
	await build({
		input: resolve(rootDir, 'packages/cli/src/cli.ts'),
		output: {
			format: 'esm',
			dir: resolve(distDir, 'bin'),
			entryFileNames: 'svelte-emails.js'
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
	
	// Fix: CLI should run from cli-app directory for dev mode
	cliContent = cliContent.replace(
		/const cliRoot = resolve\(__dirname, "\.\."\)/g,
		'const cliRoot = resolve(__dirname, "..", "cli-app")'
	)
	
	await writeFile(cliBinPath, cliContent)

	// =========================================================================
	// 4. Create package.json
	// =========================================================================
	console.log('\n📝 Creating package.json...')
	
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
				types: './dist/index.d.ts',
				svelte: './dist/index.js',
				default: './dist/index.js'
			}
		},
		svelte: './dist/index.js',
		types: './dist/index.d.ts',
		files: [
			'dist',
			'cli-app',
			'bin',
			'LLM.md'
		],
		peerDependencies: {
			svelte: '^5.0.0'
		},
		peerDependenciesMeta: {
			shiki: { optional: true }
		},
		dependencies: {
			'fast-glob': cliPackage.dependencies['fast-glob'],
			'chokidar': cliPackage.dependencies['chokidar'],
			// CLI dev mode needs these
			'@sveltejs/kit': '^2.48.5',
			'@sveltejs/vite-plugin-svelte': '^6.2.1',
			'vite': '^7.2.2'
		},
		optionalDependencies: {
			// Syntax highlighting for code view (optional)
			'shiki': cliPackage.optionalDependencies?.['shiki'] ?? '^3.19.0',
			'@shikijs/langs': cliPackage.optionalDependencies?.['@shikijs/langs'] ?? '^3.19.0',
			'@shikijs/themes': cliPackage.optionalDependencies?.['@shikijs/themes'] ?? '^3.19.0'
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
	// 5. Copy README and LICENSE
	// =========================================================================
	console.log('\n📝 Copying README, LLM.md...')
	if (existsSync(resolve(rootDir, 'README.md'))) {
		await cp(resolve(rootDir, 'README.md'), resolve(distDir, 'README.md'))
	}
	if (existsSync(resolve(rootDir, 'LLM.md'))) {
		await cp(resolve(rootDir, 'LLM.md'), resolve(distDir, 'LLM.md'))
	}
	if (existsSync(resolve(rootDir, 'LICENSE'))) {
		await cp(resolve(rootDir, 'LICENSE'), resolve(distDir, 'LICENSE'))
	}

	// =========================================================================
	// 6. Install dependencies
	// =========================================================================
	console.log('\n📦 Installing dependencies...')
	await run(['bun', 'install'], distDir)

	console.log('\n✅ Build complete!')
	console.log(`   Output: ${distDir}`)
	console.log('')
	console.log('   Structure:')
	console.log('   - dist/      → Core library (built with svelte-package)')
	console.log('   - cli-app/   → CLI dev server source (Vite + SvelteKit)')
	console.log('   - bin/       → CLI entry point')
	console.log('')
	console.log('   To link locally:')
	console.log('   cd _dist && bun link')
}

buildPackage().catch((err) => {
	console.error('❌ Build failed:', err)
	process.exit(1)
})
