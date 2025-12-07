<!-- @component
	Code viewer panel with Shiki syntax highlighting.

@example
```svelte
<CodeView code={sourceCode} highlightedHtml={highlighted} />
```
-->
<script lang="ts">
	import * as icons from '$lib/Icons.svelte'

	interface Props {
		code: string
		highlightedHtml: string | null
		/** Raw (non-prettified) code to copy when showing formatted view */
		rawCode?: string
	}

	const { code, highlightedHtml, rawCode }: Props = $props()

	// Copy the raw code if provided, otherwise the displayed code
	const codeToCopy = $derived(rawCode ?? code)

	let copied = $state(false)
	let copyTimeout: ReturnType<typeof setTimeout> | undefined

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(codeToCopy)
			copied = true
			clearTimeout(copyTimeout)
			copyTimeout = setTimeout(() => {
				copied = false
			}, 2000)
		} catch (err) {
			console.error('Failed to copy:', err)
		}
	}
</script>

<div class="code-panel">
	<div class="toolbar">
		<button
			class="copy-btn"
			class:copied
			onclick={copyToClipboard}
			title="Copy to clipboard"
		>
			{#if copied}
				{@render icons.checkmark({ size: 16 })}
				<span>Copied!</span>
			{:else}
				{@render icons.copy({ size: 16 })}
				<span>Copy</span>
			{/if}
		</button>
	</div>

	{#if highlightedHtml}
		{@html highlightedHtml}
	{:else}
		<pre><code>{code}</code></pre>
	{/if}
</div>

<style>
	.code-panel {
		height: 100%;
		overflow: auto;
		background: #0d1117;
		position: relative;
	}

	.toolbar {
		display: flex;
		gap: 4px;
		padding: 12px;
		position: absolute;
		top: 0;
		right: 0;
		z-index: 1;
	}

	.copy-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		font-size: 12px;
		font-family: inherit;
		border: 1px solid #30363d;
		border-radius: 6px;
		background: transparent;
		color: #8b949e;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.copy-btn:hover {
		background: #21262d;
		color: #e6edf3;
	}

	.copy-btn.copied {
		background: #238636;
		border-color: #238636;
		color: #fff;
	}

	/* Shared pre/code styles for both plain and highlighted code */
	.code-panel :global(pre),
	.code-panel pre {
		margin: 0;
		padding: 20px;
		font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
		font-size: 13px;
		line-height: 1.5;
		white-space: pre-wrap;
		word-wrap: break-word;
		background: #0d1117 !important;
		color: #e6edf3;
	}

	.code-panel :global(code),
	.code-panel code {
		font-family: inherit;
	}

	.code-panel :global(*) {
		tab-size: 4;
	}
</style>
