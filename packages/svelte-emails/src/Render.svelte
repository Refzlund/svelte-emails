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


	/**
	 * Render queue system for handling concurrent async renders.
	 * 
	 * Rules:
	 * 1. Most recent render request ALWAYS wins — older renders cannot overwrite newer ones
	 * 2. When a new render starts, older pending renders are "cancelled" (their results ignored)
	 * 3. Multiple renders can be in-flight simultaneously, but only the latest matters
	 * 
	 * Implementation:
	 * - `latestRequestId` tracks the most recent render request
	 * - `latestCompletedId` tracks the most recent render that has completed
	 * - A render result is only applied if its ID > latestCompletedId AND === latestRequestId
	 *   OR if its ID > latestCompletedId AND no newer render has completed yet
	 */
	let latestRequestId = 0
	let latestCompletedId = 0

	// Re-render when dependencies change
	$effect(() => {
		// Capture dependencies for reactive tracking
		const currentRoot = $state.snapshot(root)
		const currentPlaceholders = placeholders
		const currentStyle = style

		if (!currentRoot) {
			rendered = null
			output = null
			// Reset tracking when there's no root
			latestRequestId = 0
			latestCompletedId = 0
			return
		}

		// Assign ID to this render request
		const thisRequestId = ++latestRequestId
		
		// Perform async render
		renderTree(currentRoot, { placeholders: currentPlaceholders, style: currentStyle })
			.then((result) => {
				// Only apply result if:
				// 1. This is the most recent request (thisRequestId === latestRequestId), OR
				// 2. This request is newer than any completed request AND the latest request hasn't finished yet
				//    (allows older-but-valid results while waiting for the newest)
				// 
				// Key rule: NEVER let an older render overwrite a newer completed render
				if (thisRequestId > latestCompletedId) {
					// This render is newer than any completed render
					if (thisRequestId === latestRequestId) {
						// This IS the latest request — always apply
						latestCompletedId = thisRequestId
						rendered = result
						output = result
					} else {
						// This is NOT the latest request, but it finished before the latest
						// Only apply if no newer render has completed yet
						// (provides intermediate results while waiting for the newest)
						// Note: We still update latestCompletedId to prevent even older renders from applying
						latestCompletedId = thisRequestId
						rendered = result
						output = result
					}
				}
				// else: This render is older than an already-completed render — discard it
			})
			.catch(() => {
				// Render failures are typically user errors in the email template
				// The error will surface through the UI or SSR error handling
				// 
				// Only clear output if this is still the most recent request
				// (don't let an old failed render clear newer successful results)
				if (thisRequestId === latestRequestId && thisRequestId > latestCompletedId) {
					latestCompletedId = thisRequestId
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
		<!-- 
			Note: allow-scripts + allow-same-origin together triggers a browser warning about
			sandbox escaping. This is acceptable here because:
			1. Content comes from our own renderTree(), not user input
			2. Scripts are stripped via stripScriptTags()
			3. allow-same-origin is required for morphdom to access contentDocument
			4. allow-scripts is needed for any inline handlers in the preview
		-->
		<IframePreview 
			html={rendered.html}
		/>
	{:else if mode === 'text'}
		<pre style="white-space: pre-wrap; font-family: monospace; margin: 0; padding: 16px; background: #f5f5f5; overflow: auto; height: 100%;">{rendered.text}</pre>
	{:else if mode === 'html'}
		<pre style="white-space: pre-wrap; font-family: monospace; margin: 0; padding: 16px; background: #1e1e1e; color: #d4d4d4; overflow: auto; height: 100%;">{prettify === 'none' ? rendered.html : formatHtml(rendered.html, { formatStyle: prettify === 'html+style' })}</pre>
	{/if}
{/if}
