#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { discoverEmails } from './cli/discovery.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

interface CLIOptions {
	port: number
	open: boolean
	cwd: string
}

function parseArgs(args: string[]): CLIOptions {
	const options: CLIOptions = {
		port: 33411,
		open: false,
		cwd: process.cwd()
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
		} else if (arg === '--help' || arg === '-h') {
			printHelp()
			process.exit(0)
		}
	}

	return options
}

function printHelp() {
	console.log(`
svelte-emails - Email template development server

Usage:
  bunx svelte-emails [options]

Options:
  --port, -p <number>  Port number (default: 33411)
  --open, -o           Open browser automatically
  --cwd <path>         Working directory (default: current directory)
  --help, -h           Show this help message

Examples:
  bunx svelte-emails
  bunx svelte-emails --port 3000 --open
  bunx svelte-emails --cwd ./packages/emails
`)
}

async function main() {
	const args = process.argv.slice(2)
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
	const child = spawn('bunx', ['vite', ...viteArgs], {
		cwd: cliRoot,
		stdio: 'inherit',
		shell: process.platform === 'win32',
		env: {
			...process.env,
			SVELTE_EMAILS_CWD: options.cwd
		}
	})

	// Forward signals to child process
	process.on('SIGINT', () => child.kill('SIGINT'))
	process.on('SIGTERM', () => child.kill('SIGTERM'))

	child.on('exit', (code) => {
		process.exit(code ?? 0)
	})
}

main().catch((err) => {
	console.error('Failed to start dev server:', err)
	process.exit(1)
})
