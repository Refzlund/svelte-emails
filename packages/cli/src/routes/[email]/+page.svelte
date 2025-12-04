<script lang="ts">
	import { page } from '$app/state'
	import { onMount, untrack } from 'svelte'
	import { browser } from '$app/environment'
	import { emailStore } from '$lib/email-store'
	import { createHighlightManager } from '$lib/highlight.svelte'
	import { EmailPreview, CodeView, LoadingBar } from '$lib/components'
	import { getCached, setCache, setCacheFormattedHtml, invalidateCache, prefetchAdjacentEmails, type EmailRenderData } from '$lib/page-cache'
	import { createViewMode } from '$lib/utils/view-mode.svelte'
	import { formatHtml } from 'svelte-emails'
	import type { PageData } from './$types'
	import * as icons from '$lib/Icons.svelte'
	import floatingUI from 'floating-runes'

	interface Props {
		data: PageData
	}

	const { data }: Props = $props()

	// Get email ID from shallow routing state or fall back to data/params
	const currentEmailId = $derived(
		(page.state as any)?.emailId ?? data.emailId ?? data.email?.id ?? page.params.email
	)

	// Local state for email content (fetched client-side for instant navigation)
	// These are intentionally initialized once from server data, then managed client-side.
	// The $effect below handles updates based on currentEmailId changes.
	// svelte-ignore state_referenced_locally
	let email = $state(data.email)
	// svelte-ignore state_referenced_locally
	let source = $state(data.source)
	// svelte-ignore state_referenced_locally
	let rendered = $state(data.rendered)
	let formattedHtml = $state<string | null>(null)
	// svelte-ignore state_referenced_locally
	let renderError = $state<string | null>(data.renderError)
	// svelte-ignore state_referenced_locally
	let isLoading = $state(!data.email)
	let isRerendering = $state(false)  // True when re-rendering after file change

	/**
	 * Process email render result - format HTML if needed and update state
	 */
	function processRenderResult(result: EmailRenderData, emailId: string) {
		email = result.email
		source = result.source
		rendered = result.rendered
		renderError = result.renderError
		
		// Use cached formatted HTML or format now
		if (result.formattedHtml) {
			formattedHtml = result.formattedHtml
		} else if (result.rendered?.html) {
			// Format HTML client-side and cache it
			const formatted = formatHtml(result.rendered.html)
			formattedHtml = formatted
			result.formattedHtml = formatted
			setCacheFormattedHtml(emailId, formatted)
		} else {
			formattedHtml = null
		}
	}

	// Fetch email content when email ID changes (from shallow routing or regular navigation)
	$effect(() => {
		const emailId = currentEmailId
		if (!emailId) return

		// Check if we already have this email loaded
		if (email?.id === emailId) return

		// Check cache first for instant display
		const cached = getCached(emailId)
		if (cached) {
			processRenderResult(cached.data, emailId)
			isLoading = false
			return
		}

		// Fetch from server
		isLoading = true
		renderError = null
		fetch(`/__svelte-emails/render?id=${encodeURIComponent(emailId)}`)
			.then(async (res) => {
				// Check if this is still the current email
				if (currentEmailId !== emailId) return
				
				if (!res.ok) {
					const err = await res.json().catch(() => ({ error: 'Unknown error' }))
					renderError = err.error || 'Failed to load email'
					isLoading = false
					return
				}
				const result = await res.json()
				// Add formattedHtml field (will be populated by processRenderResult)
				result.formattedHtml = null
				processRenderResult(result, emailId)
				setCache(emailId, result)
				isLoading = false
			})
			.catch((err) => {
				if (currentEmailId !== emailId) return
				renderError = err.message || 'Failed to load email'
				isLoading = false
			})
	})

	const viewMode = createViewMode()
	
	// Floating indicator for active tab - only initialize on client
	// floatingUI() uses onDestroy internally so must be called during component init
	const float = browser ? floatingUI() : null
	
	// Disable initial transition animation
	let enableTransition = $state(false)
	onMount(() => {
		// Enable transition after first paint
		requestAnimationFrame(() => {
			enableTransition = true
		})
	})

	// Highlight manager for off-thread syntax highlighting
	const highlighter = createHighlightManager()

	// Trigger highlighting when data changes
	// Highlights source and formatted HTML (raw mode displays plain code without highlighting)
	$effect(() => {
		if (!email || !source) return
		highlighter.highlight(
			email.id,
			source,
			formattedHtml,
			rendered?.text ?? null
		)
	})

	// Prefetch adjacent emails for instant navigation
	$effect(() => {
		if (!email) return
		const emailIds = emailStore.emails.map((e) => e.id)
		if (emailIds.length > 0) {
			untrack(() => prefetchAdjacentEmails(email!.id, emailIds, 2))
		}
	})

	// Listen for content changes via shared store
	onMount(() => {
		let lastSeenTime = emailStore.lastContentChangeTime

		const unsubscribe = emailStore.subscribe(() => {
			// Check if content changed for this email
			if (
				emailStore.lastContentChangeId === currentEmailId &&
				emailStore.lastContentChangeTime > lastSeenTime
			) {
				console.log('[svelte-emails] Reloading due to content change')
				lastSeenTime = emailStore.lastContentChangeTime
				
				// Invalidate cache and trigger re-render (keep current content visible)
				invalidateCache(currentEmailId)
				isRerendering = true
				
				// Fetch updated content
				fetch(`/__svelte-emails/render?id=${encodeURIComponent(currentEmailId)}`)
					.then(async (res) => {
						if (!res.ok) {
							const err = await res.json().catch(() => ({ error: 'Unknown error' }))
							renderError = err.error || 'Failed to load email'
							isRerendering = false
							return
						}
						const result = await res.json()
						result.formattedHtml = null
						processRenderResult(result, currentEmailId)
						setCache(currentEmailId, result)
						isRerendering = false
					})
					.catch((err) => {
						renderError = err.message || 'Failed to load email'
						isRerendering = false
					})
			}
		})

		return unsubscribe
	})

	// Derive the relative path for display
	const relativePath = $derived(email?.relativePath ?? currentEmailId ?? 'Loading...')
</script>

<div class="email-viewer">
	<!-- Header with tabs and file path -->
	<header class="viewer-header">
		{#if float}
			<nav class="tabs" use:float.untether={'pointerleave'}>
				<div
					class="tab-indicator"
					class:active={float.referenced}
					class:transition={enableTransition}
					style:width={float.referenced ? `${float.referenced.clientWidth}px` : '0'}
					style:height={float.referenced ? `${float.referenced.offsetHeight}px` : '0'}
					style:opacity={float.referenced ? 1 : 0}
					use:float={{ tether: false }}
				></div>
				<button
					class="tab"
					class:active={viewMode.value === 'preview'}
					use:float.tether={'mouseenter'}
					use:float.ref={() => viewMode.value === 'preview'}
					onclick={() => viewMode.set('preview')}
				>
					{#if (isLoading || isRerendering) && viewMode.value === 'preview'}
						<span class="spinner"></span>
					{:else}
						{@render icons.contentView({ size: 20, opacity: viewMode.value === 'preview' ? 1 : .75 })}
					{/if}
					Preview
				</button>
				<button
					class="tab"
					class:active={viewMode.value === 'source'}
					use:float.tether={'mouseenter'}
					use:float.ref={() => viewMode.value === 'source'}
					onclick={() => viewMode.set('source')}
				>
					{#if highlighter.loading.source}
						<span class="spinner"></span>
					{:else}
						{@render icons.code({ size: 20, opacity: viewMode.value === 'source' ? 1 : .75 })}
					{/if}
					Source
				</button>
				<button
					class="tab"
					class:active={viewMode.value === 'html' || viewMode.value === 'raw'}
					use:float.tether={'mouseenter'}
					use:float.ref={() => viewMode.value === 'html' || viewMode.value === 'raw'}
					onclick={() => viewMode.set('html')}
				>
					{#if highlighter.loading.html}
						<span class="spinner"></span>
					{:else}
						{@render icons.document({ size: 20, opacity: viewMode.value === 'html' || viewMode.value === 'raw' ? 1 : .75 })}
					{/if}
					HTML
				</button>
				<button
					class="tab"
					class:active={viewMode.value === 'text'}
					use:float.tether={'mouseenter'}
					use:float.ref={() => viewMode.value === 'text'}
					onclick={() => viewMode.set('text')}
				>
					{#if highlighter.loading.text}
						<span class="spinner"></span>
					{:else}
						{@render icons.codeText({ size: 20, opacity: viewMode.value === 'text' ? 1 : .75 })}
					{/if}
					Text
				</button>
			</nav>
		{:else}
			<!-- SSR fallback without floating actions -->
			<nav class="tabs">
				<button
					class="tab"
					class:active={viewMode.value === 'preview'}
					onclick={() => viewMode.set('preview')}
				>
					{#if (isLoading || isRerendering) && viewMode.value === 'preview'}
						<span class="spinner"></span>
					{:else}
						{@render icons.contentView({ size: 20, opacity: viewMode.value === 'preview' ? 1 : .75 })}
					{/if}
					Preview
				</button>
				<button
					class="tab"
					class:active={viewMode.value === 'source'}
					onclick={() => viewMode.set('source')}
				>
					{#if highlighter.loading.source}
						<span class="spinner"></span>
					{:else}
						{@render icons.code({ size: 20, opacity: viewMode.value === 'source' ? 1 : .75 })}
					{/if}
					Source
				</button>
				<button
					class="tab"
					class:active={viewMode.value === 'html' || viewMode.value === 'raw'}
					onclick={() => viewMode.set('html')}
				>
					{#if highlighter.loading.html}
						<span class="spinner"></span>
					{:else}
						{@render icons.document({ size: 20, opacity: viewMode.value === 'html' || viewMode.value === 'raw' ? 1 : .75 })}
					{/if}
					HTML
				</button>
				<button
					class="tab"
					class:active={viewMode.value === 'text'}
					onclick={() => viewMode.set('text')}
				>
					{#if highlighter.loading.text}
						<span class="spinner"></span>
					{:else}
						{@render icons.codeText({ size: 20, opacity: viewMode.value === 'text' ? 1 : .75 })}
					{/if}
					Text
				</button>
			</nav>
		{/if}

		<div class="file-path">
			{relativePath}
		</div>
		<LoadingBar visible={isLoading || isRerendering} />
	</header>

	<!-- Content area -->
	<div class="viewer-content">
		{#if isLoading}
			<div class="loading-panel">
				<p>Rendering email...</p>
			</div>
		{:else if renderError}
			<div class="error-panel">
				<h3>⚠️ Render Error</h3>
				<pre>{renderError}</pre>
			</div>
		{:else if viewMode.value === 'preview'}
			{#if rendered}
				<EmailPreview html={rendered.html} />
			{/if}
		{:else if viewMode.value === 'source'}
			<CodeView
				code={source ?? ''}
				highlightedHtml={highlighter.state.source}
			/>
		{:else if viewMode.value === 'html' || viewMode.value === 'raw'}
			{#if rendered}
				<CodeView
					code={formattedHtml ?? rendered.html}
					rawCode={rendered.html}
					highlightedHtml={highlighter.state.html}
					showToggle
					showRaw={viewMode.isRaw}
					onToggle={(raw) => viewMode.set(raw ? 'raw' : 'html')}
				/>
			{/if}
		{:else if viewMode.value === 'text'}
			{#if rendered}
				<CodeView
					code={rendered.text}
					highlightedHtml={highlighter.state.text}
				/>
			{/if}
		{/if}
	</div>
</div>

<style>
	.email-viewer {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.viewer-header {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 16px;
		height: 70px;
		background: var(--viewer-header-bg);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.tabs {
		position: relative;
		display: flex;
		gap: 4px;
		padding: 4px;
		border-radius: 6px;
		background-color: var(--tabs-bg);
	}

	.tab-indicator {
		left: 0px;
		position: absolute;
		border-radius: 4px;
		pointer-events: none;
		user-select: none;
		transform: translateY(-100%);
	}

	.tab-indicator.transition {
		transition:
			left 0.1s ease-out,
			width 0.1s ease-out;
	}

	.tab-indicator.active {
		background: var(--tab-active-gradient);
	}

	.tab {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 10px 16px;
		border: none;
		border-radius: 8px;
		background: transparent;
		color: rgba(255, 255, 255, 0.6);
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.tab:hover {
		color: rgba(255, 255, 255, 0.9);
	}

	.tab.active {
		color: #fff;
	}

	.spinner {
		width: 20px;
		height: 20px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: rgba(255, 255, 255, 0.8);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		flex-shrink: 0;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.file-path {
		font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
		font-size: 12px;
		color: rgba(255, 255, 255, 0.5);
	}

	.viewer-content {
		flex: 1;
		overflow: hidden;
	}

	.error-panel {
		padding: 24px;
		background: #fef2f2;
		color: #991b1b;
	}

	.error-panel h3 {
		margin-bottom: 12px;
	}

	.error-panel pre {
		background: #fee2e2;
		padding: 16px;
		border-radius: 8px;
		overflow: auto;
		font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
		font-size: 13px;
	}

	.loading-panel {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		gap: 16px;
		color: rgba(255, 255, 255, 0.6);
	}
</style>
