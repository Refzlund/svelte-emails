<!-- @component
Email render component.

Renders email content in an isolated iframe (preview mode) or as plain text/HTML source.
Sets up the IR tree collector context and provides bindable output.

**Preview Mode Features:**
- Seamless updates using DOM diffing (morphdom) — no flash or scroll reset
- Images don't reload on content changes
- Form state is preserved
- Complete CSS isolation via iframe

@example
```svelte
<script>
	let output = $state()
	let name = $state('World')
</script>

<input bind:value={name} />

<Email.Render bind:output>
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
	import IframePreview from './IframePreview.svelte'

	export interface Props {
		/** Render mode: 'preview' shows in iframe, 'text' shows plain text, 'html' shows HTML source */
		mode?: 'preview' | 'text' | 'html'
		/** 
		 * Prettify options for 'html' mode:
		 * - 'none': No formatting (raw minified output)
		 * - 'html': Format HTML structure only
		 * - 'html+style': Format HTML structure and CSS (style attributes + style tags)
		 */
		prettify?: 'none' | 'html' | 'html+style'
		/** Placeholder values for [[variable]] interpolation */
		placeholders?: RenderOptions['placeholders']
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
		placeholders = {}, 
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

	// Rendered output state - updated asynchronously when root changes
	// Note: renderTree is async to support Shiki syntax highlighting
	let rendered: RenderOutput | null = $state(null)

	// Track the latest render request to handle race conditions
	let renderVersion = 0

	// Re-render when dependencies change
	$effect(() => {
		// Capture dependencies for reactive tracking
		const currentRoot = root
		const currentPlaceholders = placeholders
		const currentStyle = style
		
		if (!currentRoot) {
			rendered = null
			output = null
			return
		}

		// Track this render request
		const thisVersion = ++renderVersion
		
		// Perform async render
		renderTree(currentRoot, { placeholders: currentPlaceholders, style: currentStyle })
			.then((result) => {
				// Only update if this is still the latest request
				if (thisVersion === renderVersion) {
					rendered = result
					output = result
				}
			})
			.catch(() => {
				// Render failures are typically user errors in the email template
				// The error will surface through the UI or SSR error handling
				if (thisVersion === renderVersion) {
					rendered = null
					output = null
				}
			})
	})
</script>

<virtualtree hidden>
	<!-- Render children to build IR tree (produces no visible output) -->
	{@render children?.()}
</virtualtree>

<!-- Display based on mode -->
{#if rendered}
	{#if mode === 'preview'}
		<IframePreview 
			html={rendered.html}
			sandbox="allow-popups allow-popups-to-escape-sandbox allow-scripts"
		/>
	{:else if mode === 'text'}
		<pre style="white-space: pre-wrap; font-family: monospace; margin: 0; padding: 16px; background: #f5f5f5; overflow: auto; height: 100%;">{rendered.text}</pre>
	{:else if mode === 'html'}
		<pre style="white-space: pre-wrap; font-family: monospace; margin: 0; padding: 16px; background: #1e1e1e; color: #d4d4d4; overflow: auto; height: 100%;">{prettify === 'none' ? rendered.html : formatHtml(rendered.html, { formatStyle: prettify === 'html+style' })}</pre>
	{/if}
{/if}
