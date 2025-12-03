#!/usr/bin/env bun

/**
 * CLI runner wrapper that preserves the original working directory
 * This allows running the CLI from the monorepo root while the actual
 * dev server runs from packages/cli (for proper module resolution)
 */

import { spawnSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const originalCwd = process.cwd()
const cliDir = resolve(__dirname, 'packages/cli')

// Parse args to check if --cwd was already provided
const args = process.argv.slice(2)
const hasCwd = args.some((arg, i) => arg === '--cwd' || args[i - 1] === '--cwd')

// Build the command arguments
const cliArgs = [...args]
if (!hasCwd) {
	// Default to original CWD if no --cwd provided
	cliArgs.push('--cwd', originalCwd)
}

// Run the CLI from its package directory for proper module resolution
const result = spawnSync('bun', ['run', 'src/cli.ts', ...cliArgs], {
	cwd: cliDir,
	stdio: 'inherit',
	shell: process.platform === 'win32'
})

process.exit(result.status ?? 0)
