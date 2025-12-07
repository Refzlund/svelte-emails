/**
 * Post-build script to add .js extensions to relative imports.
 * 
 * Node.js ESM requires explicit file extensions for relative imports.
 * This script processes all .js files in dist/ and adds .js extensions
 * to imports that reference other .js/.ts files (not .svelte files).
 * 
 * Run after svelte-package: bun run build
 */

import { readdir, readFile, writeFile } from 'fs/promises'
import { join, dirname } from 'path'
import { existsSync } from 'fs'

const DIST_DIR = join(import.meta.dirname, '..', 'dist')

async function getAllJsFiles(dir: string): Promise<string[]> {
	const files: string[] = []
	const entries = await readdir(dir, { withFileTypes: true })
	
	for (const entry of entries) {
		const fullPath = join(dir, entry.name)
		if (entry.isDirectory()) {
			files.push(...await getAllJsFiles(fullPath))
		} else if (entry.name.endsWith('.js')) {
			files.push(fullPath)
		}
	}
	
	return files
}

function needsJsExtension(importPath: string, fromFile: string): boolean {
	// Already has .js or .svelte extension
	if (importPath.endsWith('.js') || importPath.endsWith('.svelte')) {
		return false
	}
	
	// Check if it's a directory with index.js
	const fromDir = dirname(fromFile)
	const targetPath = join(fromDir, importPath)
	
	// If path points to a directory, it should become /index.js
	if (existsSync(targetPath)) {
		try {
			const stats = require('fs').statSync(targetPath)
			if (stats.isDirectory()) {
				return true // Will add /index.js
			}
		} catch {}
	}
	
	// Otherwise add .js
	return true
}

function addJsExtension(importPath: string, fromFile: string): string {
	if (!needsJsExtension(importPath, fromFile)) {
		return importPath
	}
	
	// Check if it's a directory
	const fromDir = dirname(fromFile)
	const targetPath = join(fromDir, importPath)
	
	if (existsSync(targetPath)) {
		try {
			const stats = require('fs').statSync(targetPath)
			if (stats.isDirectory()) {
				return `${importPath}/index.js`
			}
		} catch {}
	}
	
	return `${importPath}.js`
}

async function processFile(filePath: string): Promise<boolean> {
	const content = await readFile(filePath, 'utf-8')
	let modified = false
	
	const newContent = content.replace(
		/(?:(?:import|export)\s+(?:type\s+)?(?:\{[^}]*\}|\*(?:\s+as\s+\w+)?|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+|(?:export\s+\*\s+from\s+))(['"])(\.[^'"]+)\1/g,
		(match, quote, importPath) => {
			const newPath = addJsExtension(importPath, filePath)
			if (newPath !== importPath) {
				modified = true
				return match.replace(`${quote}${importPath}${quote}`, `${quote}${newPath}${quote}`)
			}
			return match
		}
	)
	
	if (modified) {
		await writeFile(filePath, newContent, 'utf-8')
	}
	
	return modified
}

async function main() {
	console.log('🔧 Fixing ESM imports in dist/...')
	
	const files = await getAllJsFiles(DIST_DIR)
	let fixedCount = 0
	
	for (const file of files) {
		const wasModified = await processFile(file)
		if (wasModified) {
			fixedCount++
			console.log(`   Fixed: ${file.replace(DIST_DIR, 'dist')}`)
		}
	}
	
	console.log(`✅ Fixed ${fixedCount} files`)
}

main().catch(console.error)
