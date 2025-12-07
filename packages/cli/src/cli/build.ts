/**
 * Static Build Script for svelte-emails
 * 
 * Pre-renders all emails and generates a static SPA that can be deployed
 * to any static hosting provider.
 * 
 * Build Process:
 * 1. Discover all email files (user's emails, bundled examples, documentation)
 * 2. Start a temporary Vite server for SSR rendering
 * 3. Render each email using the SSR environment
 * 4. Generate static JSON data files
 * 5. Run SvelteKit build with adapter-static
 * 6. Output deployable static site
 */

import { spawn } from 'node:child_process'
import { writeFile, mkdir, rm } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync, readFileSync } from 'node:fs'
import { createServer, isRunnableDevEnvironment } from 'vite'
import { discoverAll, type EmailFile } from './discovery.js'
import { toSafeEmail } from './utils.js'
import type { SafeEmail } from './types.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

export interface BuildOptions {
	/** Working directory containing email templates */
	cwd: string
	/** Output directory for the build */
	outDir: string
	/** Base path for deployment (e.g., '/emails/' for github pages) */
	base?: string
	/** Whether to include bundled examples */
	includeExamples?: boolean
	/** Whether to include bundled documentation */
	includeDocumentation?: boolean
	/** Continue build even if some emails fail to render */
	continueOnError?: boolean
	/** Glob patterns to ignore when discovering emails */
	ignorePatterns?: string[]
}

interface RenderedEmail {
	email: SafeEmail
	source: string
	rendered: {
		html: string
		text: string
		headers: Record<string, string>
	} | null
	formattedHtml: string | null
	renderError: string | null
}

interface BuildManifest {
	buildTime: string
	version: string
	emailCount: number
	exampleCount: number
	documentationCount: number
	base: string
}

/**
 * Run the static build process
 */
export async function runBuild(options: BuildOptions): Promise<void> {
	const {
		cwd,
		outDir,
		base = '/',
		includeExamples = true,
		includeDocumentation = true,
		continueOnError = true,
		ignorePatterns = []
	} = options

	const cliRoot = resolve(__dirname, '../..')
	const dataDir = resolve(cliRoot, 'static/_data')

	console.log('\n📧 svelte-emails build\n')
	console.log(`   Source: ${cwd}`)
	console.log(`   Output: ${outDir}`)
	if (base !== '/') console.log(`   Base: ${base}`)
	if (ignorePatterns.length > 0) console.log(`   Ignoring: ${ignorePatterns.join(', ')}`)
	console.log('')

	// Step 1: Clean previous build data
	console.log('🧹 Cleaning previous build data...')
	if (existsSync(dataDir)) {
		await rm(dataDir, { recursive: true })
	}
	await mkdir(dataDir, { recursive: true })

	// Step 2: Discover all files
	console.log('🔍 Discovering email templates...')
	const allFiles = await discoverAll(cwd, false, ignorePatterns)
	
	const emails = allFiles.emails
	const examples = includeExamples ? allFiles.examples : []
	const documentation = includeDocumentation ? allFiles.documentation : []

	console.log(`   Found ${emails.length} email(s)`)
	if (includeExamples) console.log(`   Found ${examples.length} example(s)`)
	if (includeDocumentation) console.log(`   Found ${documentation.length} documentation page(s)`)
	console.log('')

	// Step 3: Start Vite server for SSR rendering
	console.log('⚡ Starting render server...')
	const server = await createServer({
		root: cliRoot,
		server: { middlewareMode: true },
		appType: 'custom',
		logLevel: 'warn'
	})

	try {
		// Step 4: Pre-render all emails using SSR
		console.log('⚡ Pre-rendering emails...')
		
		const renderedEmails = await renderAllEmails(server, emails, 'emails', continueOnError)
		const renderedExamples = includeExamples 
			? await renderAllEmails(server, examples, 'examples', continueOnError)
			: []
		const renderedDocs = includeDocumentation
			? await renderAllEmails(server, documentation, 'documentation', continueOnError)
			: []

		// Count errors
		const errorCount = [...renderedEmails, ...renderedExamples, ...renderedDocs]
			.filter(r => r.renderError).length

		if (errorCount > 0) {
			console.log(`   ⚠️  ${errorCount} email(s) had render errors`)
		}
		console.log('')

		// Step 5: Generate static data files
		console.log('📝 Generating static data...')

		// Write individual email data files for lazy loading
		for (const rendered of [...renderedEmails, ...renderedExamples, ...renderedDocs]) {
			const emailDataPath = resolve(dataDir, `${rendered.email.mode}/${rendered.email.id}.json`)
			await mkdir(dirname(emailDataPath), { recursive: true })
			await writeFile(emailDataPath, JSON.stringify(rendered, null, 2))
		}

		// Write email list manifest
		const manifest: BuildManifest = {
			buildTime: new Date().toISOString(),
			version: '1.0.0',
			emailCount: renderedEmails.length,
			exampleCount: renderedExamples.length,
			documentationCount: renderedDocs.length,
			base
		}

		// Write the email list (metadata only, not full rendered content)
		const emailList = {
			emails: renderedEmails.map(r => r.email),
			examples: renderedExamples.map(r => r.email),
			documentation: renderedDocs.map(r => r.email),
			manifest
		}

		await writeFile(
			resolve(dataDir, 'email-list.json'),
			JSON.stringify(emailList, null, 2)
		)

		console.log(`   Generated ${renderedEmails.length + renderedExamples.length + renderedDocs.length} data files`)
		console.log('')

	} finally {
		// Close the Vite server
		await server.close()
	}

	// Step 6: Run SvelteKit build
	console.log('🔨 Building static site...')

	await runViteBuild(cliRoot, outDir, base)

	// Step 7: Clean up temporary data from static folder
	// The data is now in the build output, we can remove from static
	if (existsSync(dataDir)) {
		await rm(dataDir, { recursive: true })
	}

	console.log('')
	console.log('✅ Build complete!')
	console.log(`   Output: ${outDir}`)
	console.log('')
	console.log('   To preview locally:')
	console.log(`   bunx svelte-emails preview ${outDir}`)
	console.log('')
}

/**
 * Render all emails in a list using Vite SSR
 */
async function renderAllEmails(
	server: Awaited<ReturnType<typeof createServer>>,
	files: EmailFile[],
	mode: string,
	continueOnError: boolean
): Promise<RenderedEmail[]> {
	const results: RenderedEmail[] = []

	const ssrEnv = server.environments.ssr
	if (!isRunnableDevEnvironment(ssrEnv)) {
		throw new Error('SSR environment is not available')
	}

	// Import svelte-emails once
	const svelteEmailsModule = await ssrEnv.runner.import('svelte-emails') as {
		render: Function
		formatHtml: Function
	}

	for (const file of files) {
		try {
			process.stdout.write(`   Rendering ${file.name}...`)
			const rendered = await renderEmail(ssrEnv, svelteEmailsModule, file)
			results.push(rendered)
			
			if (rendered.renderError) {
				console.log(` ⚠️  Error: ${rendered.renderError.slice(0, 50)}...`)
			} else {
				console.log(' ✓')
			}
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : String(err)
			console.log(` ❌ ${errorMsg.slice(0, 50)}`)
			
			if (!continueOnError) {
				throw new Error(`Failed to render ${file.name}: ${errorMsg}`)
			}

			// Add error entry
			results.push({
				email: toSafeEmail(file),
				source: tryReadFile(file.path),
				rendered: null,
				formattedHtml: null,
				renderError: errorMsg
			})
		}
	}

	return results
}

/**
 * Render a single email file using Vite SSR
 */
async function renderEmail(
	ssrEnv: { runner: { import: (path: string) => Promise<unknown> } },
	svelteEmails: { render: Function; formatHtml: Function },
	file: EmailFile
): Promise<RenderedEmail> {
	const source = readFileSync(file.path, 'utf-8')
	
	try {
		// Import the email component via Vite SSR
		const mod = await ssrEnv.runner.import(file.path) as { default: unknown }
		
		// Render the email - returns RenderOutput directly or throws
		const result = await svelteEmails.render(mod.default, { placeholders: {} }) as {
			html: string
			text: string
			headers: Record<string, string>
		}

		// Format HTML for display
		const formattedHtml = svelteEmails.formatHtml(result.html)

		return {
			email: toSafeEmail(file),
			source,
			rendered: {
				html: result.html,
				text: result.text,
				headers: result.headers
			},
			formattedHtml,
			renderError: null
		}
	} catch (err) {
		return {
			email: toSafeEmail(file),
			source,
			rendered: null,
			formattedHtml: null,
			renderError: err instanceof Error ? err.message : String(err)
		}
	}
}

/**
 * Try to read a file, return empty string on error
 */
function tryReadFile(path: string): string {
	try {
		return readFileSync(path, 'utf-8')
	} catch {
		return ''
	}
}

/**
 * Run the Vite/SvelteKit build
 */
function runViteBuild(cliRoot: string, outDir: string, base: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const child = spawn('bunx', ['vite', 'build'], {
			cwd: cliRoot,
			stdio: 'inherit',
			shell: process.platform === 'win32',
			env: {
				...process.env,
				SVELTE_EMAILS_BUILD: '1',
				SVELTE_EMAILS_OUT_DIR: outDir,
				SVELTE_EMAILS_BASE: base
			}
		})

		child.on('exit', (code) => {
			if (code === 0) {
				resolve()
			} else {
				reject(new Error(`Vite build failed with code ${code}`))
			}
		})

		child.on('error', reject)
	})
}
