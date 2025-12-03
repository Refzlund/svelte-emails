<script lang="ts">
	import { invalidateAll } from '$app/navigation'
	import { page } from '$app/state'
	import { onMount } from 'svelte'
	import { emailStore } from '$lib/email-store'
	import { createHighlightManager } from '$lib/highlight.svelte'
	import { EmailPreview, CodeView } from '$lib/components'
	import {
		cacheEmailData,
		prefetchAdjacentEmails,
		invalidateEmailCache,
		getCachedEmailData,
		type EmailData
	} from '$lib/email-prefetch'
	import type { PageData } from './$types'

	interface Props {
		data: PageData
	}

	const { data }: Props = $props()

	let mode: 'preview' | 'source' | 'html' | 'text' = $state('preview')

	// Use cached data if available for instant display, fall back to server data
	const effectiveData = $derived.by(() => {
		const emailId = page.params.email
		if (!emailId) return data
		
		const cached = getCachedEmailData(emailId)
		// Use server data if it's for the current email, otherwise use cache
		if (data.email.id === emailId) {
			return data
		}
		return cached || data
	})

	// Highlight manager for off-thread syntax highlighting
	const highlighter = createHighlightManager()

	// Cache the loaded data and prefetch adjacent emails
	$effect(() => {
		// Cache current email data
		cacheEmailData({
			email: data.email,
			source: data.source,
			rendered: data.rendered,
			renderError: data.renderError,
			timestamp: Date.now()
		})

		// Prefetch adjacent emails for instant navigation
		const emailIds = emailStore.emails.map((e) => e.id)
		if (emailIds.length > 0) {
			prefetchAdjacentEmails(data.email.id, emailIds, 2)
		}
	})

	// Trigger highlighting when data changes
	$effect(() => {
		highlighter.highlight(
			effectiveData.email.id,
			effectiveData.source,
			effectiveData.rendered?.html ?? null,
			effectiveData.rendered?.text ?? null
		)
	})

	// Listen for content changes via shared store
	onMount(() => {
		let lastSeenTime = emailStore.lastContentChangeTime

		const unsubscribe = emailStore.subscribe(() => {
			// Check if content changed for this email
			if (
				emailStore.lastContentChangeId === data.email.id &&
				emailStore.lastContentChangeTime > lastSeenTime
			) {
				console.log('[svelte-emails] Reloading due to content change')
				lastSeenTime = emailStore.lastContentChangeTime
				// Invalidate cache before reloading
				invalidateEmailCache(data.email.id)
				invalidateAll()
			}
		})

		return unsubscribe
	})
</script>

<div class="email-viewer">
	<!-- Header with tabs and file path -->
	<header class="viewer-header">
		<nav class="tabs">
			<button
				class="tab"
				class:active={mode === 'preview'}
				onclick={() => mode = 'preview'}
			>
				<span class="icon">🖼️</span> Preview
			</button>
			<button
				class="tab"
				class:active={mode === 'source'}
				onclick={() => mode = 'source'}
			>
				{#if highlighter.loading.source}
					<span class="spinner"></span>
				{:else}
					<span class="icon">&lt;/&gt;</span>
				{/if}
				Source
			</button>
			<button
				class="tab"
				class:active={mode === 'html'}
				onclick={() => mode = 'html'}
			>
				{#if highlighter.loading.html}
					<span class="spinner"></span>
				{:else}
					<span class="icon">📄</span>
				{/if}
				HTML
			</button>
			<button
				class="tab"
				class:active={mode === 'text'}
				onclick={() => mode = 'text'}
			>
				{#if highlighter.loading.text}
					<span class="spinner"></span>
				{:else}
					<span class="icon">≡</span>
				{/if}
				Text
			</button>
		</nav>

		<div class="file-path">
			{effectiveData.email.relativePath}
		</div>
	</header>

	<!-- Content area -->
	<div class="viewer-content">
		{#if effectiveData.renderError}
			<div class="error-panel">
				<h3>⚠️ Render Error</h3>
				<pre>{effectiveData.renderError}</pre>
			</div>
		{:else if mode === 'preview'}
			{#if effectiveData.rendered}
				<EmailPreview html={effectiveData.rendered.html} />
			{/if}
		{:else if mode === 'source'}
			<CodeView
				code={effectiveData.source}
				highlightedHtml={highlighter.state.source}
			/>
		{:else if mode === 'html'}
			{#if effectiveData.rendered}
				<CodeView
					code={effectiveData.rendered.html}
					rawCode={effectiveData.rendered.htmlRaw}
					highlightedHtml={highlighter.state.html}
					showToggle
				/>
			{/if}
		{:else if mode === 'text'}
			{#if effectiveData.rendered}
				<CodeView
					code={effectiveData.rendered.text}
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
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 16px;
		background: #1a1a2e;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.tabs {
		display: flex;
		gap: 4px;
		padding: 8px 0;
	}

	.tab {
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
		background: rgba(255, 255, 255, 0.05);
		color: rgba(255, 255, 255, 0.9);
	}

	.tab.active {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #fff;
	}

	.icon {
		font-size: 12px;
	}

	.spinner {
		width: 12px;
		height: 12px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: rgba(255, 255, 255, 0.8);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
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
</style>
