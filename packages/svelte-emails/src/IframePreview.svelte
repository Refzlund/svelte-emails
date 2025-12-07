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
	import {
		stripScriptTags,
		snapshotWidthAnchor,
		restoreWidthScroll,
		snapshotContentAnchor,
		restoreContentScroll,
		calculateContentHeight,
		morphHtmlToDocument,
		setupImageLoadListeners,
		toViewportCoords,
		type WidthAnchorData,
		type ContentAnchorData
	} from './iframe-preview.svelte.ts'

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
	
	// Separate anchor data for width vs content changes
	let widthAnchorData: WidthAnchorData | null = null
	let contentAnchorData: ContentAnchorData | null = null
	
	// Rendering state
	let srcdocContent: string | undefined = $state(undefined)
	let loadedHtml = $state('')   // HTML confirmed loaded via onload
	let pendingHtml = $state('')  // HTML queued while iframe is loading

	/** Update iframe height based on content, with scroll anchoring if configured */
	function updateHeight(doc: Document, forceAnchorRestore = false) {
		const newHeight = calculateContentHeight(doc)
		const heightChanged = newHeight !== height && newHeight > 0
		
		// Width-based anchoring (direct element reference) - only for width changes
		if (scrollContainer && heightTarget && widthAnchorData && heightChanged) {
			restoreWidthScroll(scrollContainer, heightTarget, widthAnchorData, newHeight)
			// Clear after successful restore - width change is done
			widthAnchorData = null
			height = newHeight
			return
		}
		
		// Content-based anchoring (signature lookup) - for content changes
		if (scrollContainer && heightTarget && contentAnchorData && (heightChanged || forceAnchorRestore)) {
			const anchor = contentAnchorData
			contentAnchorData = null  // Clear after use
			restoreContentScroll(doc, scrollContainer, heightTarget, anchor, newHeight)
			if (heightChanged) height = newHeight
			return
		}
		
		// No anchoring - just update height
		if (heightChanged) {
			if (heightTarget) {
				heightTarget.style.height = `${newHeight}px`
			}
			height = newHeight
		}
	}

	/** Setup ResizeObserver to track iframe content height */
	function setupHeightObserver(doc: Document) {
		heightObserver?.disconnect()
		requestAnimationFrame(() => updateHeight(doc))
		
		heightObserver = new ResizeObserver(() => updateHeight(doc))
		if (doc.body) heightObserver.observe(doc.body)
		if (doc.documentElement) heightObserver.observe(doc.documentElement)
		
		// Listen to image load events to recalculate height
		setupImageLoadListeners(doc, () => updateHeight(doc))
	}

	/** Setup ResizeObserver on heightTarget to snapshot anchor before width changes */
	function setupWidthObserver(doc: Document) {
		widthObserver?.disconnect()
		if (!heightTarget || !scrollContainer) return
		
		let lastWidth = heightTarget.getBoundingClientRect().width
		
		widthObserver = new ResizeObserver((entries) => {
			const newWidth = entries[0]?.contentRect.width
			if (newWidth && newWidth !== lastWidth) {
				// Snapshot using direct element reference for width changes
				widthAnchorData = snapshotWidthAnchor(doc, scrollContainer.scrollTop)
				lastWidth = newWidth
			}
		})
		
		widthObserver.observe(heightTarget)
	}

	/** Setup mouse event forwarding from iframe to parent */
	function setupMouseForwarding(doc: Document) {
		doc.addEventListener('mousemove', (e: MouseEvent) => {
			if (!iframeElement) return
			oniframemousemove?.(toViewportCoords(e, iframeElement))
		})
		
		doc.addEventListener('mouseup', (e: MouseEvent) => {
			if (!iframeElement) return
			oniframemouseup?.(toViewportCoords(e, iframeElement))
		})
	}

	/** Apply HTML to iframe document via morphdom */
	function morphToDocument(doc: Document, newHtml: string) {
		const scrollBefore = scrollContainer?.scrollTop ?? 0
		const heightBefore = height
		
		// Snapshot anchor before DOM changes
		if (scrollContainer) {
			contentAnchorData = snapshotContentAnchor(doc, scrollContainer.scrollTop)
		}
		const hadAnchor = contentAnchorData !== null
		
		morphHtmlToDocument(doc, newHtml)
		setupImageLoadListeners(doc, () => updateHeight(doc))
		updateHeight(doc, true)
		
		// Fallback: preserve scroll if no anchor was found
		if (scrollContainer && (!hadAnchor || heightBefore === 0)) {
			scrollContainer.scrollTop = scrollBefore
		}
	}

	/** Handle iframe load event */
	function handleIframeLoad() {
		const doc = iframeElement?.contentDocument
		if (!doc) return
		
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
