<script lang="ts">
	/**
	 * EmailViewer Component
	 * 
	 * Shared viewer for emails, examples, and documentation.
	 * Handles fetching, caching, highlighting, and rendering.
	 */
	import { onMount } from 'svelte'
	import { browser } from '$app/environment'
	import { type ViewMode } from '$lib/email-store'
	import { createHighlightManager } from '$lib/highlight.svelte'
	import { EmailPreview } from '$lib/components'
	import CodeView from './CodeView.svelte'
	import LoadingBar from './LoadingBar.svelte'
	import { createViewMode } from '$lib/utils/view-mode.svelte'
	import * as icons from '$lib/Icons.svelte'
	import floatingUI from 'floating-runes'
	import { createEmailViewerState } from './email-viewer.svelte.js'

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

	// Email viewer state with data fetching
	const viewer = createEmailViewerState(
		() => mode,
		() => itemId
	)

	const viewMode = createViewMode()

	// Floating indicator for active tab - only initialize on client
	const float = browser ? floatingUI() : null

	// Disable initial transition animation
	let enableTransition = $state(false)
	onMount(() => {
		requestAnimationFrame(() => {
			enableTransition = true
		})
		// Setup content change listener for live reload
		return viewer.setupContentChangeListener()
	})

	// Highlight manager for off-thread syntax highlighting
	const highlighter = createHighlightManager()

	// Trigger highlighting when data changes
	$effect(() => {
		if (!viewer.email || !viewer.source) return
		highlighter.highlight(viewer.email.id, viewer.source, viewer.formattedHtml, viewer.rendered?.text ?? null)
	})

	// Derive the relative path for display
	const relativePath = $derived(viewer.email?.relativePath ?? itemId ?? 'Loading...')
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
		<div class="left">
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
				{@render tabButton(float, 'preview', 'Preview', icons.contentView, (viewer.isLoading || viewer.isRerendering) && viewMode.value === 'preview')}
				{@render tabButton(float, 'source', 'Source', icons.code, highlighter.loading.source)}
				{@render tabButton(float, 'html', 'HTML', icons.document, highlighter.loading.html)}
				{@render tabButton(float, 'text', 'Text', icons.codeText, highlighter.loading.text)}
			</nav>
			
			{#if viewMode.value === 'html' || viewMode.value === 'raw'}
				<label class="raw-toggle">
					<input
						type="checkbox"
						checked={viewMode.isRaw}
						onchange={(e) => viewMode.set(e.currentTarget.checked ? 'raw' : 'html')}
					/>
					<span class="toggle-track">
						<span class="toggle-thumb"></span>
					</span>
					<span class="toggle-label">View Raw</span>
				</label>
			{/if}
		</div>
		

		<div class="file-path">
			{relativePath}
		</div>
		<LoadingBar visible={viewer.isLoading || viewer.isRerendering} />
	</header>

	<!-- Content area -->
	<div class="viewer-content">
		{#if viewer.isLoading}
			<div class="loading-panel">
				<p>{loadingMessage}</p>
			</div>
		{:else if viewer.renderError}
			<div class="error-panel">
				<h3>⚠️ Render Error</h3>
				<pre>{viewer.renderError}</pre>
			</div>
		{:else if viewMode.value === 'preview'}
			{#if viewer.rendered}
				<EmailPreview html={viewer.rendered.html} emailId={itemId} {mode} />
			{/if}
		{:else if viewMode.value === 'source'}
			<CodeView code={viewer.source ?? ''} highlightedHtml={highlighter.state.source} />
		{:else if viewMode.value === 'html' || viewMode.value === 'raw'}
			{#if viewer.rendered}
				<CodeView
					code={viewMode.isRaw ? viewer.rendered.html : (viewer.formattedHtml ?? viewer.rendered.html)}
					rawCode={viewer.rendered.html}
					highlightedHtml={viewMode.isRaw ? null : highlighter.state.html}
				/>
			{/if}
		{:else if viewMode.value === 'text'}
			{#if viewer.rendered}
				<CodeView code={viewer.rendered.text} highlightedHtml={highlighter.state.text} />
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

		.left {
			display: flex;
			align-items: center;
			gap: 16px;
		}
	}

	.tabs {
		position: relative;
		display: flex;
		gap: 4px;
		padding: 4px;
		border-radius: 6px;
		background-color: var(--tabs-bg);
	}

	.raw-toggle {
		display: flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
		user-select: none;
	}

	.raw-toggle input {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
	}

	.toggle-track {
		position: relative;
		width: 36px;
		height: 20px;
		background: var(--toggle-off-bg);
		border-radius: 10px;
		transition: background 0.15s ease;
	}

	.raw-toggle input:checked + .toggle-track {
		background: var(--toggle-on-bg);
	}

	.toggle-thumb {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 16px;
		height: 16px;
		background: var(--toggle-off-thumb);
		border-radius: 50%;
		transition: transform 0.15s ease, background 0.15s ease;
	}

	.raw-toggle input:checked + .toggle-track .toggle-thumb {
		transform: translateX(16px);
		background: var(--toggle-on-thumb);
	}

	.toggle-label {
		font-size: 13px;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.7);
	}

	.raw-toggle:hover .toggle-label {
		color: rgba(255, 255, 255, 0.9);
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
