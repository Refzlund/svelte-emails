<!-- @component
Seamless iframe preview component.

Renders HTML content in an isolated iframe with morphdom-based DOM diffing
for smooth updates without flash, scroll reset, or image reloading.

**Features:**
- First render uses `document.write()` for fast initial load
- Subsequent renders use morphdom to diff and patch
- Images with unchanged `src` are preserved (no reload/flicker)
- Scroll position is preserved across updates
- Form state is preserved
- Auto-sizing height based on content

@example
```svelte
<IframePreview html={emailHtml} />
```

@example With custom class
```svelte
<IframePreview 
	html={emailHtml} 
	class="my-preview"
	sandbox="allow-scripts"
/>
```
-->
<script lang='ts' module>
	import type { Snippet } from 'svelte'
	import type { HTMLIframeAttributes } from 'svelte/elements'

	export interface IframePreviewProps extends Omit<HTMLIframeAttributes, 'srcdoc' | 'src'> {
		/** HTML content to render in the iframe */
		html: string
		/** Bindable iframe height (auto-calculated from content) */
		height?: number
		/** Optional snippet to render while loading (before first content) */
		pending?: Snippet
	}
</script>

<script lang='ts'>
	import morphdom from 'morphdom'

	let { 
		html,
		height = $bindable(0),
		pending,
		class: className,
		style,
		...restProps
	}: IframePreviewProps = $props()

	let iframeElement: HTMLIFrameElement | undefined = $state()
	let heightObserver: ResizeObserver | null = null
	
	// Track whether we've done the initial render
	// svelte-ignore non_reactive_update
	let isInitialized = false
	// Track the last rendered HTML to detect changes
	let lastRenderedHtml = ''

	/**
	 * Update iframe height based on content
	 */
	function updateHeight(doc: Document) {
		if (doc.documentElement) {
			const newHeight = doc.documentElement.scrollHeight
			if (newHeight > 0) {
				height = newHeight
			}
		}
	}

	/**
	 * Setup ResizeObserver to track iframe content height
	 */
	function setupHeightObserver(doc: Document) {
		heightObserver?.disconnect()
		
		const updateHeightCallback = () => updateHeight(doc)
		
		requestAnimationFrame(updateHeightCallback)
		
		heightObserver = new ResizeObserver(updateHeightCallback)
		if (doc.body) heightObserver.observe(doc.body)
		if (doc.documentElement) heightObserver.observe(doc.documentElement)
	}

	/**
	 * Update iframe content using morphdom for seamless diffing.
	 * - First render: uses document.write() for fast initial load
	 * - Subsequent renders: uses morphdom to diff and patch
	 */
	function updateIframeContent(content: string) {
		const iframe = iframeElement
		if (!iframe) return
		
		const doc = iframe.contentDocument
		if (!doc) return
		
		// Skip if content hasn't changed
		if (content === lastRenderedHtml) return
		lastRenderedHtml = content

		if (!isInitialized) {
			// First render: write the full document
			doc.open()
			doc.write(content)
			doc.close()
			isInitialized = true
			
			// Setup height observer after initial render
			setupHeightObserver(doc)
		} else {
			// Subsequent renders: diff with morphdom
			const parser = new DOMParser()
			const newDoc = parser.parseFromString(content, 'text/html')
			
			// Morph the <head> element (for style changes)
			if (doc.head && newDoc.head) {
				morphdom(doc.head, newDoc.head, {
					onBeforeNodeDiscarded(node) {
						// Preserve essential meta tags
						if (node instanceof HTMLMetaElement) {
							const name = node.getAttribute('name')
							const charset = node.getAttribute('charset')
							if (charset || name === 'viewport') return false
						}
						return true
					}
				})
			}
			
			// Morph the <body> element (main content)
			if (doc.body && newDoc.body) {
				morphdom(doc.body, newDoc.body, {
					onBeforeElUpdated(fromEl, toEl) {
						// Skip updating images with same src (prevents reload/flicker)
						if (
							fromEl instanceof HTMLImageElement &&
							toEl instanceof HTMLImageElement &&
							fromEl.src === toEl.src
						) {
							// Still update other attributes
							if (fromEl.alt !== toEl.alt) fromEl.alt = toEl.alt
							if (fromEl.width !== toEl.width) fromEl.width = toEl.width
							if (fromEl.height !== toEl.height) fromEl.height = toEl.height
							if (fromEl.getAttribute('style') !== toEl.getAttribute('style')) {
								fromEl.setAttribute('style', toEl.getAttribute('style') || '')
							}
							return false
						}
						return true
					}
				})
			}
			
			// Update height after morph
			updateHeight(doc)
		}
	}

	// Update iframe content when HTML changes
	$effect(() => {
		if (!html || !iframeElement) return
		updateIframeContent(html)
	})

	// Reset state when iframe element changes
	$effect(() => {
		if (iframeElement) {
			isInitialized = false
			lastRenderedHtml = ''
		}
		
		return () => {
			heightObserver?.disconnect()
			heightObserver = null
		}
	})

	// Compute combined styles
	const computedStyle = $derived.by(() => {
		const heightStyle = height > 0 ? `height: ${height}px;` : 'height: 100%;'
		const baseStyle = `width: 100%; border: none; ${heightStyle}`
		return style ? `${baseStyle} ${style}` : baseStyle
	})
</script>

{#if !isInitialized && pending}
	{@render pending()}
{/if}

<iframe
	bind:this={iframeElement}
	title="Email Preview"
	class={className}
	style={computedStyle}
	{...restProps}
></iframe>
