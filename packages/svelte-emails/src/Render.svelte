<!-- @component
Email render component.

Renders email content in an isolated iframe (HTML mode) or as plain text.
Sets up the IR tree collector context and provides bindable output.

@example
```svelte
<script>
	let output = $state()
</script>

<Email.Render bind:output>
	<Email preview='Welcome!'>
		<Text content='Hello [[name]]!' />
	</Email>
</Email.Render>

<Email.Render mode="text" bind:output>
	<Email preview='Welcome!'>
		<Text content='Hello [[name]]!' />
	</Email>
</Email.Render>
```

@see ARCHITECTURE.md for the rendering pipeline
-->
<script lang='ts'>
	import type { Snippet } from 'svelte'
	import { setEmailRoot, type Mail, type Collector } from './context'
	import { renderTree, type RenderOptions, type RenderOutput } from './renderer'
	import { formatHtml } from './rendering'
	import type { StyleConfig } from './styles'

	interface Props {
		/** Render mode: 'preview' shows in iframe, 'text' shows plain text, 'html' shows HTML source */
		mode?: 'preview' | 'text' | 'html'
		/** 
		 * Prettify options for 'html' mode:
		 * - 'none': No formatting (raw minified output)
		 * - 'html': Format HTML structure only
		 * - 'html+style': Format HTML structure and CSS (style attributes + style tags)
		 */
		prettify?: 'none' | 'html' | 'html+style'
		/** Variables for interpolation */
		vars?: RenderOptions['vars']
		/** Style configuration (component theming, rem base size, etc.) */
		style?: StyleConfig
		/** Bindable output containing html, text, and headers */
		output?: RenderOutput | null
		/** Email content (should contain an <Email> component) */
		children?: Snippet
	}

	let { 
		mode = 'preview',
		prettify = 'html+style',
		vars = {}, 
		style, 
		output = $bindable(null),
		children 
	}: Props = $props()

	// IR tree root - populated by Email component via collector
	let root: Mail.EmailNode | null = $state(null)

	// Create collector that Email component will use to register itself
	const collector: Collector = {
		registerRoot(node: Mail.EmailNode) {
			root = node
		}
	}

	// Provide collector to children via context
	setEmailRoot(collector)

	// Render from IR tree when root is available and update bindable output
	const rendered = $derived.by(() => {
		if (!root) return null
		const result = renderTree(root, { vars, style })
		return result
	})

	// Update the bindable output when rendered changes
	$effect(() => {
		output = rendered
	})
</script>

<virtualtree hidden>
	<!-- Render children to build IR tree (produces no visible output) -->
	{@render children?.()}
</virtualtree>

<!-- Display based on mode -->
{#if rendered}
	{#if mode === 'preview'}
		<iframe
			title="Email Preview"
			srcdoc={rendered.html}
			sandbox="allow-popups allow-popups-to-escape-sandbox"
			style="width: 100%; height: 100%; border: none;"
		></iframe>
	{:else if mode === 'text'}
		<pre style="white-space: pre-wrap; font-family: monospace; margin: 0; padding: 16px; background: #f5f5f5; overflow: auto; height: 100%;">{rendered.text}</pre>
	{:else if mode === 'html'}
		<pre style="white-space: pre-wrap; font-family: monospace; margin: 0; padding: 16px; background: #1e1e1e; color: #d4d4d4; overflow: auto; height: 100%;">{prettify === 'none' ? rendered.html : formatHtml(rendered.html, { formatStyle: prettify === 'html+style' })}</pre>
	{/if}
{/if}
