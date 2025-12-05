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
- Scroll anchoring during resize (when `scrollContainer` and `heightTarget` provided)
- Mouse events inside iframe can be forwarded to parent via `oniframemousemove` and `oniframemouseup`

@example Basic usage
```svelte
<IframePreview html={emailHtml} />
```

@example With mouse tracking for visual effects
```svelte
<IframePreview 
	html={emailHtml} 
	oniframemousemove={(e) => { mouseX = e.clientX; mouseY = e.clientY }}
/>
```

@example With scroll anchoring for resizable containers
```svelte
<div class="scroll-container" bind:this={scrollContainer}>
	<div class="wrapper" bind:this={wrapper}>
		<IframePreview 
			html={emailHtml}
			bind:height={iframeHeight}
			scrollContainer={scrollContainer}
			heightTarget={wrapper}
		/>
	</div>
</div>
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
		/** 
		 * Scroll container element for scroll anchoring during width changes.
		 * When provided with `heightTarget`, the component tracks an anchor element
		 * near the viewport top and preserves its visual position during resize.
		 */
		scrollContainer?: HTMLElement
		/**
		 * Target element for direct height updates during scroll anchoring.
		 * When provided with `scrollContainer`, enables jitter-free resize behavior
		 * by synchronously updating height and scroll position.
		 */
		heightTarget?: HTMLElement
		/** Callback for mouse move events inside the iframe (viewport coordinates) */
		oniframemousemove?: (event: { clientX: number; clientY: number }) => void
		/** Callback for mouse up events inside the iframe (viewport coordinates) */
		oniframemouseup?: (event: { clientX: number; clientY: number }) => void
	}
</script>

<script lang='ts'>
	import morphdom from 'morphdom'

	let { 
		html,
		height = $bindable(0),
		pending,
		scrollContainer,
		heightTarget,
		class: className,
		style,
		oniframemousemove,
		oniframemouseup,
		...restProps
	}: IframePreviewProps = $props()

	let iframeElement: HTMLIFrameElement | undefined = $state()
	let heightObserver: ResizeObserver | null = null
	let widthObserver: ResizeObserver | null = null
	
	// Track anchor element position before width changes trigger reflow
	let anchorData: { element: Element; offsetFromViewportTop: number } | null = null
	
	// Rendering state
	let srcdocContent: string | undefined = $state(undefined)
	let loadedHtml = $state('')   // HTML confirmed loaded via onload
	let pendingHtml = $state('')  // HTML queued while iframe is loading

	/** Strip script tags to prevent warnings in sandboxed iframes */
	function stripScriptTags(content: string): string {
		const endTag = String.fromCharCode(60) + '/script>'
		return content.replace(new RegExp('<script\\b[^>]*>[\\s\\S]*?' + endTag, 'gi'), '')
	}

	/** Selector for anchor candidate elements */
	const ANCHOR_SELECTOR = 'h1, h2, h3, h4, h5, h6, p, div, table, img, section, article, header, footer'

	/** 
	 * Find a stable anchor element near the top of the visible viewport.
	 * Used for scroll anchoring during width changes.
	 */
	function findAnchorElement(doc: Document, scrollTop: number): { element: Element; offsetFromViewportTop: number } | null {
		const body = doc.body
		if (!body) return null
		
		let bestMatch: { element: Element; offsetFromViewportTop: number } | null = null
		let bestDistance = Infinity
		
		for (const el of body.querySelectorAll(ANCHOR_SELECTOR)) {
			const rect = el.getBoundingClientRect()
			if (rect.height < 10) continue
			
			const distance = Math.abs(rect.top - scrollTop)
			if (rect.top >= scrollTop - 50 && distance < bestDistance) {
				bestDistance = distance
				bestMatch = { element: el, offsetFromViewportTop: rect.top - scrollTop }
			}
		}
		
		return bestMatch
	}

	/** Snapshot anchor element position before width changes cause reflow */
	function snapshotAnchorPosition(doc: Document) {
		if (!scrollContainer) return
		anchorData = findAnchorElement(doc, scrollContainer.scrollTop)
	}

	/** Update iframe height based on content, with scroll anchoring if configured */
	function updateHeight(doc: Document) {
		if (!iframeElement) return
		
		const body = doc.body
		if (!body) return
		
		const bodyStyle = doc.defaultView?.getComputedStyle(body)
		const marginTop = parseFloat(bodyStyle?.marginTop || '0')
		const marginBottom = parseFloat(bodyStyle?.marginBottom || '0')
		const newHeight = body.scrollHeight + marginTop + marginBottom
		
		if (newHeight === height || newHeight <= 0) return
		
		// Apply scroll anchoring when configured
		if (scrollContainer && heightTarget && anchorData) {
			const anchorTopNow = anchorData.element.getBoundingClientRect().top
			const newScrollTop = anchorTopNow - anchorData.offsetFromViewportTop
			
			heightTarget.style.height = `${newHeight}px`
			void scrollContainer.offsetHeight // Force synchronous layout
			scrollContainer.scrollTop = Math.max(0, newScrollTop)
		} else if (heightTarget) {
			heightTarget.style.height = `${newHeight}px`
		}
		
		height = newHeight
	}

	/** Setup ResizeObserver to track iframe content height */
	function setupHeightObserver(doc: Document) {
		heightObserver?.disconnect()
		requestAnimationFrame(() => updateHeight(doc))
		
		heightObserver = new ResizeObserver(() => updateHeight(doc))
		if (doc.body) heightObserver.observe(doc.body)
		if (doc.documentElement) heightObserver.observe(doc.documentElement)
	}

	/** Setup ResizeObserver on heightTarget to snapshot anchor before width changes */
	function setupWidthObserver(doc: Document) {
		widthObserver?.disconnect()
		if (!heightTarget) return
		
		let lastWidth = heightTarget.getBoundingClientRect().width
		
		widthObserver = new ResizeObserver((entries) => {
			const newWidth = entries[0]?.contentRect.width
			if (newWidth && newWidth !== lastWidth) {
				snapshotAnchorPosition(doc)
				lastWidth = newWidth
			}
		})
		
		widthObserver.observe(heightTarget)
	}

	/** Setup mouse event forwarding from iframe to parent */
	function setupMouseForwarding(doc: Document) {
		// Helper to convert iframe coords to viewport coords
		function toViewportCoords(e: MouseEvent) {
			if (!iframeElement) return null
			const rect = iframeElement.getBoundingClientRect()
			return {
				clientX: rect.left + e.clientX,
				clientY: rect.top + e.clientY
			}
		}
		
		doc.addEventListener('mousemove', (e: MouseEvent) => {
			const coords = toViewportCoords(e)
			if (coords) oniframemousemove?.(coords)
		})
		
		doc.addEventListener('mouseup', (e: MouseEvent) => {
			const coords = toViewportCoords(e)
			if (coords) oniframemouseup?.(coords)
		})
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
		setupWidthObserver(doc)
		setupMouseForwarding(doc)
		
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
		widthObserver?.disconnect()
		widthObserver = null
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
