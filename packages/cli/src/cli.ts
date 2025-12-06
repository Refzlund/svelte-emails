#!/usr/bin/env node

import { spawn, type SpawnOptions } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { discoverEmails } from './cli/discovery.js'
import { runBuild } from './cli/build.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Spawn a child process with signal forwarding and exit handling
 */
function spawnWithSignals(
	command: string,
	args: string[],
	options: SpawnOptions
): void {
	const child = spawn(command, args, {
		...options,
		shell: process.platform === 'win32'
	})

	process.on('SIGINT', () => child.kill('SIGINT'))
	process.on('SIGTERM', () => child.kill('SIGTERM'))

	child.on('exit', (code) => {
		process.exit(code ?? 0)
	})
}

interface CLIOptions {
	port: number
	open: boolean
	cwd: string
	/** Library development mode - watches bundled examples/documentation */
	dev: boolean
}

interface BuildCLIOptions {
	cwd: string
	outDir: string
	base: string
	includeExamples: boolean
	includeDocumentation: boolean
	continueOnError: boolean
}

interface PreviewCLIOptions {
	dir: string
	port: number
	open: boolean
}

function parseArgs(args: string[]): CLIOptions {
	const options: CLIOptions = {
		port: 33411,
		open: false,
		cwd: process.cwd(),
		dev: false
	}

	for (let i = 0; i < args.length; i++) {
		const arg = args[i]
		const nextArg = args[i + 1]

		if (arg === '--port' || arg === '-p') {
			options.port = parseInt(nextArg, 10)
			i++
		} else if (arg === '--open' || arg === '-o') {
			options.open = true
		} else if (arg === '--cwd') {
			options.cwd = resolve(nextArg)
			i++
		} else if (arg === '--dev') {
			// Internal flag for library development
			options.dev = true
		} else if (arg === '--help' || arg === '-h') {
			printHelp()
			process.exit(0)
		}
	}

	return options
}

function parseBuildArgs(args: string[]): BuildCLIOptions {
	const options: BuildCLIOptions = {
		cwd: process.cwd(),
		outDir: resolve(process.cwd(), 'build'),
		base: '/',
		includeExamples: true,
		includeDocumentation: true,
		continueOnError: true
	}

	for (let i = 0; i < args.length; i++) {
		const arg = args[i]
		const nextArg = args[i + 1]

		if (arg === '--cwd') {
			options.cwd = resolve(nextArg)
			i++
		} else if (arg === '--out' || arg === '-o') {
			options.outDir = resolve(nextArg)
			i++
		} else if (arg === '--base' || arg === '-b') {
			options.base = nextArg
			i++
		} else if (arg === '--no-examples') {
			options.includeExamples = false
		} else if (arg === '--no-documentation' || arg === '--no-docs') {
			options.includeDocumentation = false
		} else if (arg === '--strict') {
			options.continueOnError = false
		} else if (arg === '--help' || arg === '-h') {
			printBuildHelp()
			process.exit(0)
		}
	}

	return options
}

function parsePreviewArgs(args: string[]): PreviewCLIOptions {
	const options: PreviewCLIOptions = {
		dir: resolve(process.cwd(), 'build'),
		port: 4173,
		open: false
	}

	for (let i = 0; i < args.length; i++) {
		const arg = args[i]
		const nextArg = args[i + 1]

		if (arg === '--port' || arg === '-p') {
			options.port = parseInt(nextArg, 10)
			i++
		} else if (arg === '--open' || arg === '-o') {
			options.open = true
		} else if (arg === '--dir' || arg === '-d') {
			options.dir = resolve(nextArg)
			i++
		} else if (!arg.startsWith('-') && !args[i - 1]?.match(/^(-d|--dir|-p|--port)$/)) {
			// Positional argument - treat as directory
			options.dir = resolve(arg)
		} else if (arg === '--help' || arg === '-h') {
			printPreviewHelp()
			process.exit(0)
		}
	}

	return options
}

function printHelp() {
	console.log(`
svelte-emails - Email template development server

Usage:
  bunx svelte-emails [command] [options]

Commands:
  (default)     Start the development server
  build         Build a static preview site
  preview       Preview a built site locally

Dev Server Options:
  --port, -p <number>  Port number (default: 33411)
  --open, -o           Open browser automatically
  --cwd <path>         Working directory (default: current directory)
  --help, -h           Show this help message

Examples:
  bunx svelte-emails
  bunx svelte-emails --port 3000 --open
  bunx svelte-emails --cwd ./packages/emails
  bunx svelte-emails build --out ./dist
  bunx svelte-emails preview ./dist
`)
}

function printBuildHelp() {
	console.log(`
svelte-emails build - Build a static preview site

Usage:
  bunx svelte-emails build [options]

Options:
  --out, -o <path>      Output directory (default: ./build)
  --base, -b <path>     Base path for deployment (default: /)
  --cwd <path>          Working directory (default: current directory)
  --no-examples         Exclude bundled examples
  --no-documentation    Exclude bundled documentation
  --no-docs             Alias for --no-documentation
  --strict              Fail build if any email has render errors
  --help, -h            Show this help message

Examples:
  bunx svelte-emails build
  bunx svelte-emails build --out ./dist
  bunx svelte-emails build --base /emails/
  bunx svelte-emails build --no-examples --no-docs
`)
}

function printPreviewHelp() {
	console.log(`
svelte-emails preview - Preview a built site locally

Usage:
  bunx svelte-emails preview [dir] [options]

Arguments:
  dir                   Directory to serve (default: ./build)

Options:
  --dir, -d <path>      Directory to serve (alternative to positional arg)
  --port, -p <number>   Port number (default: 4173)
  --open, -o            Open browser automatically
  --help, -h            Show this help message

Examples:
  bunx svelte-emails preview
  bunx svelte-emails preview ./dist
  bunx svelte-emails preview --port 3000 --open
  bunx svelte-emails preview -d ./build -p 8080
`)
}

async function runDevServer(args: string[]) {
	const options = parseArgs(args)

	// Set environment variable for Vite config
	process.env.SVELTE_EMAILS_CWD = options.cwd

	console.log(`\n📧 svelte-emails dev server`)
	console.log(`   Scanning: ${options.cwd}\n`)

	// Initial discovery for display
	const emailFiles = await discoverEmails(options.cwd)
	console.log(`   Found ${emailFiles.length} email template(s)`)

	if (emailFiles.length > 0) {
		emailFiles.forEach((email) => {
			console.log(`   - ${email.relativePath}`)
		})
	}

	console.log('')

	// Build vite command arguments
	const viteArgs = ['dev', '--port', String(options.port)]
	if (options.open) {
		viteArgs.push('--open')
	}

	// Spawn vite dev server from the CLI package directory
	const cliRoot = resolve(__dirname, '..')
	spawnWithSignals('bunx', ['vite', ...viteArgs], {
		cwd: cliRoot,
		stdio: 'inherit',
		env: {
			...process.env,
			SVELTE_EMAILS_CWD: options.cwd,
			// Enable watching bundled examples/documentation in library dev mode
			SVELTE_EMAILS_DEV: options.dev ? '1' : undefined
		}
	})
}

async function runBuildCommand(args: string[]) {
	const options = parseBuildArgs(args)

	await runBuild({
		cwd: options.cwd,
		outDir: options.outDir,
		base: options.base,
		includeExamples: options.includeExamples,
		includeDocumentation: options.includeDocumentation,
		continueOnError: options.continueOnError
	})
}

async function runPreviewCommand(args: string[]) {
	const options = parsePreviewArgs(args)

	// Check if directory exists
	if (!existsSync(options.dir)) {
		console.error(`\n❌ Directory not found: ${options.dir}`)
		console.error('\n   Run "bunx svelte-emails build" first to create a build.\n')
		process.exit(1)
	}

	// Check if it looks like a valid build
	const indexPath = resolve(options.dir, 'index.html')
	if (!existsSync(indexPath)) {
		console.error(`\n❌ No index.html found in: ${options.dir}`)
		console.error('\n   This doesn\'t appear to be a valid build output.\n')
		process.exit(1)
	}

	console.log(`\n📧 svelte-emails preview`)
	console.log(`   Serving: ${options.dir}`)
	console.log(`   URL: http://localhost:${options.port}\n`)

	// Use vite preview to serve the static files
	const viteArgs = [
		'vite',
		'preview',
		'--outDir', options.dir,
		'--port', String(options.port)
	]

	if (options.open) {
		viteArgs.push('--open')
	}

	spawnWithSignals('bunx', viteArgs, {
		cwd: process.cwd(),
		stdio: 'inherit'
	})
}

async function main() {
	const args = process.argv.slice(2)
	const command = args[0]

	// Check for build command
	if (command === 'build') {
		await runBuildCommand(args.slice(1))
	} else if (command === 'preview') {
		await runPreviewCommand(args.slice(1))
	} else {
		// Default: dev server
		await runDevServer(args)
	}
}

main().catch((err) => {
	console.error('Error:', err.message || err)
	process.exit(1)
})
