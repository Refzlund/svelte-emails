<script lang="ts">
	/**
	 * EmailViewer Component
	 * 
	 * Shared viewer for emails, examples, and documentation.
	 * Handles fetching, caching, highlighting, and rendering.
	 */
	import { page } from '$app/state'
	import { onMount, untrack } from 'svelte'
	import { browser } from '$app/environment'
	import { emailStore, type ViewMode } from '$lib/email-store'
	import { createHighlightManager } from '$lib/highlight.svelte'
	import { EmailPreview } from '$lib/components'
	import CodeView from './CodeView.svelte'
	import LoadingBar from './LoadingBar.svelte'
	import {
		getCached,
		setCache,
		setCacheFormattedHtml,
		invalidateCache,
		prefetchAdjacentEmails,
		type EmailRenderData
	} from '$lib/page-cache'
	import { createViewMode } from '$lib/utils/view-mode.svelte'
	import { formatHtml } from 'svelte-emails'
	import * as icons from '$lib/Icons.svelte'
	import floatingUI from 'floating-runes'

	interface Props {
		/** The mode determines which list to use for prefetching */
		mode: ViewMode
		/** Current item ID to display */
		itemId: string | undefined
	}

	const { mode, itemId }: Props = $props()

	// Loading messages per mode
	const loadingMessage = $derived(
		mode === 'emails' ? 'Rendering email...'
			: mode === 'examples' ? 'Rendering example...'
			: 'Rendering documentation...'
	)

	// Local state for content (fetched client-side for instant navigation)
	let email = $state<EmailRenderData['email'] | null>(null)
	let source = $state<string | null>(null)
	let rendered = $state<EmailRenderData['rendered'] | null>(null)
	let formattedHtml = $state<string | null>(null)
	let renderError = $state<string | null>(null)
	let isLoading = $state(false)
	let isRerendering = $state(false)

	/**
	 * Process email render result - format HTML if needed and update state
	 */
	function processRenderResult(result: EmailRenderData, id: string) {
		email = result.email
		source = result.source
		rendered = result.rendered
		renderError = result.renderError

		// Use cached formatted HTML or format now
		if (result.formattedHtml) {
			formattedHtml = result.formattedHtml
		} else if (result.rendered?.html) {
			const formatted = formatHtml(result.rendered.html)
			formattedHtml = formatted
			result.formattedHtml = formatted
			setCacheFormattedHtml(id, formatted, mode)
		} else {
			formattedHtml = null
		}
	}

	// Fetch content when itemId changes
	$effect(() => {
		const id = itemId
		
		if (!id) {
			isLoading = false
			return
		}

		// Check if we already have this item loaded
		if (email?.id === id) {
			return
		}

		// Check cache first for instant display
		const cached = getCached(id, mode)
		if (cached) {
			processRenderResult(cached.data, id)
			isLoading = false
			return
		}

		// Fetch from server
		isLoading = true
		renderError = null
		fetch(`/__svelte-emails/render?id=${encodeURIComponent(id)}&mode=${mode}`)
			.then(async (res) => {
				// Check if this is still the current item
				if (itemId !== id) return

				if (!res.ok) {
					const err = await res.json().catch(() => ({ error: 'Unknown error' }))
					renderError = err.error || 'Failed to load'
					isLoading = false
					return
				}
				const result = await res.json()
				result.formattedHtml = null
				processRenderResult(result, id)
				setCache(id, result, mode)
				isLoading = false
			})
			.catch((err) => {
				if (itemId !== id) return
				renderError = err.message || 'Failed to load'
				isLoading = false
			})
	})

	const viewMode = createViewMode()

	// Floating indicator for active tab - only initialize on client
	const float = browser ? floatingUI() : null

	// Disable initial transition animation
	let enableTransition = $state(false)
	onMount(() => {
		requestAnimationFrame(() => {
			enableTransition = true
		})
	})

	// Highlight manager for off-thread syntax highlighting
	const highlighter = createHighlightManager()

	// Trigger highlighting when data changes
	$effect(() => {
		if (!email || !source) return
		highlighter.highlight(email.id, source, formattedHtml, rendered?.text ?? null)
	})

	// Prefetch adjacent items for instant navigation
	$effect(() => {
		if (!email) return
		const list = emailStore.getByMode(mode)
		const ids = list.map((e) => e.id)
		if (ids.length > 0) {
			untrack(() => prefetchAdjacentEmails(email!.id, ids, 2, mode))
		}
	})

	// Listen for content changes via shared store
	onMount(() => {
		let lastSeenTime = emailStore.lastContentChangeTime

		const unsubscribe = emailStore.subscribe(() => {
			if (
				emailStore.lastContentChangeId === itemId &&
				emailStore.lastContentChangeTime > lastSeenTime
			) {
				lastSeenTime = emailStore.lastContentChangeTime

				invalidateCache(itemId!, mode)
				isRerendering = true

				fetch(`/__svelte-emails/render?id=${encodeURIComponent(itemId!)}&mode=${mode}`)
					.then(async (res) => {
						if (!res.ok) {
							const err = await res.json().catch(() => ({ error: 'Unknown error' }))
							renderError = err.error || 'Failed to load'
							isRerendering = false
							return
						}
						const result = await res.json()
						result.formattedHtml = null
						processRenderResult(result, itemId!)
						setCache(itemId!, result, mode)
						isRerendering = false
					})
					.catch((err) => {
						renderError = err.message || 'Failed to load'
						isRerendering = false
					})
			}
		})

		return unsubscribe
	})

	// Derive the relative path for display
	const relativePath = $derived(email?.relativePath ?? itemId ?? 'Loading...')
</script>

{#snippet tabButton(
	fl: ReturnType<typeof floatingUI> | null,
	tabMode: 'preview' | 'source' | 'html' | 'text',
	label: string,
	icon: typeof icons.contentView,
	tabLoading: boolean
)}
	{@const isHtmlTab = tabMode === 'html'}
	{@const isActive = isHtmlTab 
		? (viewMode.value === 'html' || viewMode.value === 'raw')
		: viewMode.value === tabMode}
	<button
		class="tab"
		class:active={isActive}
		{@attach node => {
			if(!fl) return
			const [c1,c2] = [
				fl.tether(node, 'mouseenter'),
				fl.ref(node, () => isActive)
			]
			return () => { c1.destroy(); c2.destroy(); }
		}}
		onclick={() => viewMode.set(tabMode)}
	>
		{#if tabLoading}
			<span class="spinner"></span>
		{:else}
			{@render icon({ size: 20, opacity: isActive ? 1 : .75 })}
		{/if}
		{label}
	</button>
{/snippet}

<div class="email-viewer">
	<!-- Header with tabs and file path -->
	<header class="viewer-header">
		<nav class="tabs" use:float?.untether={'pointerleave'}>
			{#if float}
				<div
					class="tab-indicator"
					class:active={float.referenced}
					class:transition={enableTransition}
					style:width={float.referenced ? `${float.referenced.clientWidth}px` : '0'}
					style:height={float.referenced ? `${float.referenced.offsetHeight}px` : '0'}
					style:opacity={float.referenced ? 1 : 0}
					use:float={{ tether: false }}
				></div>
			{/if}
			{@render tabButton(float, 'preview', 'Preview', icons.contentView, (isLoading || isRerendering) && viewMode.value === 'preview')}
			{@render tabButton(float, 'source', 'Source', icons.code, highlighter.loading.source)}
			{@render tabButton(float, 'html', 'HTML', icons.document, highlighter.loading.html)}
			{@render tabButton(float, 'text', 'Text', icons.codeText, highlighter.loading.text)}
		</nav>
		

		<div class="file-path">
			{relativePath}
		</div>
		<LoadingBar visible={isLoading || isRerendering} />
	</header>

	<!-- Content area -->
	<div class="viewer-content">
		{#if isLoading}
			<div class="loading-panel">
				<p>{loadingMessage}</p>
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
			<CodeView code={source ?? ''} highlightedHtml={highlighter.state.source} />
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
				<CodeView code={rendered.text} highlightedHtml={highlighter.state.text} />
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
