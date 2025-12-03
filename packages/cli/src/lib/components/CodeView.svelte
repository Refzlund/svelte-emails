<!-- @component
	Code viewer panel with Shiki syntax highlighting.

@example
```svelte
<CodeView code={sourceCode} highlightedHtml={highlighted} />
```
-->
<script lang="ts">
	interface Props {
		code: string
		highlightedHtml: string | null
	}

	const { code, highlightedHtml }: Props = $props()
</script>

<div class="code-panel">
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
	}

	.code-panel :global(pre) {
		margin: 0;
		padding: 20px;
		font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
		font-size: 13px;
		line-height: 1.5;
		white-space: pre-wrap;
		word-wrap: break-word;
		background: #0d1117 !important;
	}

	.code-panel :global(code) {
		font-family: inherit;
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

	.code-panel :global(*) {
		tab-size: 4;
	}
</style>
