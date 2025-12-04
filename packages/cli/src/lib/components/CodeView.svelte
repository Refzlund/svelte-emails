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
		/** Show toggle between formatted and raw view */
		showToggle?: boolean
		/** Raw (non-prettified) code to show when toggle is off */
		rawCode?: string
		/** Highlighted HTML for the raw code (separate from formatted) */
		highlightedRawHtml?: string | null
		/** Controlled: whether to show raw view */
		showRaw?: boolean
		/** Callback when toggle changes */
		onToggle?: (showRaw: boolean) => void
	}

	const {
		code,
		highlightedHtml,
		showToggle = false,
		rawCode,
		highlightedRawHtml,
		showRaw,
		onToggle
	}: Props = $props()

	// Internal state for uncontrolled mode
	let internalShowFormatted = $state(true)
	
	// Use controlled value if provided, otherwise use internal state
	const showFormatted = $derived(showRaw !== undefined ? !showRaw : internalShowFormatted)

	const displayCode = $derived(showFormatted ? code : (rawCode ?? code))
	const displayHighlighted = $derived(showFormatted ? highlightedHtml : (highlightedRawHtml ?? null))
	
	const handleToggle = (formatted: boolean) => {
		if (onToggle) {
			onToggle(!formatted)
		} else {
			internalShowFormatted = formatted
		}
	}
</script>

<div class="code-panel">
	{#if showToggle}
		<div class="toggle-bar">
			<button
				class="toggle-btn"
				class:active={showFormatted}
				onclick={() => handleToggle(true)}
			>
				Formatted
			</button>
			<button
				class="toggle-btn"
				class:active={!showFormatted}
				onclick={() => handleToggle(false)}
			>
				Raw
			</button>
		</div>
	{/if}

	{#if displayHighlighted}
		{@html displayHighlighted}
	{:else}
		<pre><code>{displayCode}</code></pre>
	{/if}
</div>

<style>
	.code-panel {
		height: 100%;
		overflow: auto;
		background: #0d1117;
		position: relative;
	}

	.toggle-bar {
		display: flex;
		gap: 4px;
		padding: 12px;
		position: absolute;
		top: 0;
		right: 0;
		z-index: 1;
	}

	.toggle-btn {
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

	.toggle-btn:hover {
		background: #21262d;
		color: #e6edf3;
	}

	.toggle-btn.active {
		background: #21262d;
		color: #e6edf3;
		border-color: #8b949e;
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
