<script lang="ts">
	import { invalidateAll } from '$app/navigation'
	import { onMount } from 'svelte'
	import { emailStore } from '$lib/email-store'
	import type { PageData } from './$types'

	interface Props {
		data: PageData
	}

	const { data }: Props = $props()

	let mode: 'preview' | 'source' | 'html' | 'text' = $state('preview')

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
				<span class="icon">&lt;/&gt;</span> Source
			</button>
			<button
				class="tab"
				class:active={mode === 'html'}
				onclick={() => mode = 'html'}
			>
				<span class="icon">📄</span> HTML
			</button>
			<button
				class="tab"
				class:active={mode === 'text'}
				onclick={() => mode = 'text'}
			>
				<span class="icon">≡</span> Text
			</button>
		</nav>

		<div class="file-path">
			{data.email.relativePath}
		</div>
	</header>

	<!-- Content area -->
	<div class="viewer-content">
		{#if data.renderError}
			<div class="error-panel">
				<h3>⚠️ Render Error</h3>
				<pre>{data.renderError}</pre>
			</div>
		{:else if mode === 'preview'}
			{#if data.rendered}
				<div class="preview-container">
					<iframe
						srcdoc={data.rendered.html}
						title="Email Preview"
						sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox"
					></iframe>
				</div>
			{/if}
		{:else if mode === 'source'}
			<div class="code-panel">
				<pre><code>{data.source}</code></pre>
			</div>
		{:else if mode === 'html'}
			{#if data.rendered}
				<div class="code-panel">
					<pre><code>{data.rendered.html}</code></pre>
				</div>
			{/if}
		{:else if mode === 'text'}
			{#if data.rendered}
				<div class="code-panel">
					<pre><code>{data.rendered.text}</code></pre>
				</div>
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

	.file-path {
		font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
		font-size: 12px;
		color: rgba(255, 255, 255, 0.5);
	}

	.viewer-content {
		flex: 1;
		overflow: hidden;
	}

	.preview-container {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		background: #e5e5e5;
		overflow: auto;
		overflow: hidden;
	}

	.preview-container iframe {
		width: 80%;
		height: 100%;
		border: none;
	}

	.code-panel {
		height: 100%;
		overflow: auto;
		background: #0d1117;
	}

	.code-panel pre {
		margin: 0;
		padding: 20px;
		font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
		font-size: 13px;
		line-height: 1.5;
		color: #e6edf3;
		white-space: pre-wrap;
		word-wrap: break-word;
	}

	.code-panel code {
		font-family: inherit;
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
