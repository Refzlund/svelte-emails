<!-- @component
Seamless iframe preview component.

Renders HTML content in an isolated iframe with morphdom-based DOM diffing
for smooth updates without flash, scroll reset, or image reloading.

**Features:**
- First render uses `srcdoc` attribute for reliable cross-browser initial load
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
	
	// Rendering state
	let srcdocContent: string | undefined = $state(undefined)
	let loadedHtml = $state('')   // HTML confirmed loaded via onload
	let pendingHtml = $state('')  // HTML queued while iframe is loading

	/** Strip script tags to prevent warnings in sandboxed iframes */
	function stripScriptTags(content: string): string {
		const endTag = String.fromCharCode(60) + '/script>'
		return content.replace(new RegExp('<script\\b[^>]*>[\\s\\S]*?' + endTag, 'gi'), '')
	}

	/** Update iframe height based on content */
	function updateHeight(doc: Document) {
		const newHeight = doc.documentElement?.scrollHeight
		if (newHeight && newHeight > 0) height = newHeight
	}

	/** Setup ResizeObserver to track iframe content height */
	function setupHeightObserver(doc: Document) {
		heightObserver?.disconnect()
		requestAnimationFrame(() => updateHeight(doc))
		
		heightObserver = new ResizeObserver(() => updateHeight(doc))
		if (doc.body) heightObserver.observe(doc.body)
		if (doc.documentElement) heightObserver.observe(doc.documentElement)
	}
	
	/** Morphdom options for head - preserve charset and viewport meta tags */
	const headMorphOptions = {
		onBeforeNodeDiscarded(node: Node) {
			if (node instanceof HTMLMetaElement) {
				if (node.hasAttribute('charset') || node.getAttribute('name') === 'viewport') {
					return false
				}
			}
			return true
		}
	}
	
	/** Morphdom options for body - preserve images with same src to avoid reload flicker */
	const bodyMorphOptions = {
		onBeforeElUpdated(fromEl: Element, toEl: Element) {
			if (fromEl instanceof HTMLImageElement && toEl instanceof HTMLImageElement && fromEl.src === toEl.src) {
				// Sync attributes without triggering image reload
				if (fromEl.alt !== toEl.alt) fromEl.alt = toEl.alt
				if (fromEl.width !== toEl.width) fromEl.width = toEl.width
				if (fromEl.height !== toEl.height) fromEl.height = toEl.height
				const newStyle = toEl.getAttribute('style')
				if (fromEl.getAttribute('style') !== newStyle) {
					fromEl.setAttribute('style', newStyle || '')
				}
				return false
			}
			return true
		}
	}
	
	/** Apply HTML to iframe document via morphdom */
	function morphToDocument(doc: Document, newHtml: string) {
		const newDoc = new DOMParser().parseFromString(newHtml, 'text/html')
		if (doc.head && newDoc.head) morphdom(doc.head, newDoc.head, headMorphOptions)
		if (doc.body && newDoc.body) morphdom(doc.body, newDoc.body, bodyMorphOptions)
		updateHeight(doc)
	}

	/** Handle iframe load event */
	function handleIframeLoad() {
		const doc = iframeElement?.contentDocument
		if (!doc) return
		
		// Mark srcdoc as loaded
		if (srcdocContent) loadedHtml = srcdocContent
		
		setupHeightObserver(doc)
		
		// Apply any pending HTML that arrived while loading
		if (pendingHtml && pendingHtml !== srcdocContent) {
			morphToDocument(doc, pendingHtml)
			loadedHtml = pendingHtml
			pendingHtml = ''
		}
	}

	// Sync html prop to iframe
	$effect(() => {
		if (!html) {
			srcdocContent = undefined
			loadedHtml = ''
			pendingHtml = ''
			return
		}
		
		const safeContent = stripScriptTags(html)
		
		// Skip if already showing this content
		if (safeContent === loadedHtml && iframeElement?.contentDocument?.body) return
		
		// Use morphdom if iframe has loaded content
		const doc = iframeElement?.contentDocument
		if (loadedHtml && doc?.body && doc?.head) {
			morphToDocument(doc, safeContent)
			loadedHtml = safeContent
			return
		}
		
		// Queue for morphdom if iframe is currently loading
		if (srcdocContent && !loadedHtml) {
			pendingHtml = safeContent
			return
		}
		
		// Initial load via srcdoc
		srcdocContent = safeContent
		loadedHtml = ''
	})

	// Cleanup
	$effect(() => () => {
		heightObserver?.disconnect()
		heightObserver = null
	})

	// Combined styles
	const computedStyle = $derived.by(() => {
		const heightStyle = height > 0 ? `height: ${height}px;` : 'height: 100%;'
		const base = `width: 100%; border: none; ${heightStyle}`
		return style ? `${base} ${style}` : base
	})
</script>

{#if !srcdocContent && pending}
	{@render pending()}
{/if}

{#if srcdocContent}
	<iframe
		bind:this={iframeElement}
		title="Email Preview"
		class={className}
		style={computedStyle}
		srcdoc={srcdocContent}
		onload={handleIframeLoad}
		{...restProps}
	></iframe>
{/if}
