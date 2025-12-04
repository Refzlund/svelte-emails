<!-- @component
	Resizable iframe preview for rendered email HTML.
	
	The iframe width can be adjusted by dragging the edges.
	Images are automatically cached as data URLs for instant loading.

@example
```svelte
<EmailPreview html={renderedHtml} />
```
-->
<script lang="ts">
	import { createImageCache } from '$lib/image-cache.svelte'
	import { createPreviewWidth } from '$lib/utils/preview-width.svelte'

	interface Props {
		html: string
	}

	const { html }: Props = $props()

	const imageCache = createImageCache()

	$effect(() => {
		imageCache.processHtml(html)
	})

	const previewWidth = createPreviewWidth()
	let iframeWidth = $derived(previewWidth.value)
	let iframeHeight = $state(0)
	let containerHeight = $state(0)
	let containerElement: HTMLDivElement | undefined = $state()
	let iframeWrapperElement: HTMLDivElement | undefined = $state()
	let iframeElement: HTMLIFrameElement | undefined = $state()
	let resizeEdge: 'left' | 'right' | null = $state(null)
	let isDragging = $state(false)
	
	// Track current HTML to avoid unnecessary updates
	let currentHtml = ''
	let heightObserver: ResizeObserver | null = null

	// Track container height for min-height calculation
	$effect(() => {
		if (!containerElement) return
		
		const updateContainerHeight = () => {
			containerHeight = containerElement!.clientHeight
		}
		
		updateContainerHeight()
		const resizeObserver = new ResizeObserver(updateContainerHeight)
		resizeObserver.observe(containerElement)
		
		return () => resizeObserver.disconnect()
	})

	// Derive the content to display
	const contentHtml = $derived(imageCache.processedHtml || html)

	// Write HTML directly to iframe document (faster than srcdoc - no reload)
	$effect(() => {
		const iframe = iframeElement
		const content = contentHtml
		if (!iframe || !content) return
		
		// Skip if content hasn't changed
		if (content === currentHtml) return
		currentHtml = content
		
		// Reset height to allow shrinking
		iframeHeight = 0
		
		const doc = iframe.contentDocument
		if (!doc) return
		
		// Cleanup previous observer
		heightObserver?.disconnect()
		doc.removeEventListener('mousemove', handleIframeMouseMove)
		
		// Write content directly (faster than srcdoc)
		doc.open()
		doc.write(content)
		doc.close()
		
		// Setup height observer
		const updateHeight = () => {
			if (doc.documentElement) {
				const height = doc.documentElement.scrollHeight
				if (height > 0) {
					iframeHeight = height
				}
			}
		}
		
		// Initial height update
		requestAnimationFrame(updateHeight)
		
		// Observe for changes
		heightObserver = new ResizeObserver(updateHeight)
		if (doc.body) heightObserver.observe(doc.body)
		if (doc.documentElement) heightObserver.observe(doc.documentElement)
		
		// Forward mouse events
		doc.addEventListener('mousemove', handleIframeMouseMove)
		
		return () => {
			heightObserver?.disconnect()
			doc.removeEventListener('mousemove', handleIframeMouseMove)
		}
	})

	// Handle mouse move from inside iframe
	function handleIframeMouseMove(e: MouseEvent) {
		if (!iframeWrapperElement || !iframeElement) return

		// Get iframe's position in viewport
		const iframeRect = iframeElement.getBoundingClientRect()
		// Convert iframe-relative coords to viewport coords
		const viewportX = iframeRect.left + e.clientX
		const viewportY = iframeRect.top + e.clientY

		// Update glow position
		mouseX = viewportX
		mouseY = viewportY

		if (isDragging) return

		const wrapperRect = iframeWrapperElement.getBoundingClientRect()
		const edgeThreshold = 8

		if (Math.abs(viewportX - wrapperRect.left) < edgeThreshold) {
			resizeEdge = 'left'
		} else if (Math.abs(viewportX - wrapperRect.right) < edgeThreshold) {
			resizeEdge = 'right'
		} else {
			resizeEdge = null
		}
	}

	// Cursor glow effect - use viewport coordinates for fixed overlay
	let mouseX = $state(0)
	let mouseY = $state(0)

	function handleMouseMove(e: MouseEvent) {
		if (!containerElement || !iframeWrapperElement) return
		// Use viewport coordinates for the fixed glow overlay
		mouseX = e.clientX
		mouseY = e.clientY

		// Detect edge proximity using iframe wrapper bounds (always current)
		if (!isDragging) {
			const wrapperRect = iframeWrapperElement.getBoundingClientRect()
			const edgeThreshold = 8

			if (Math.abs(e.clientX - wrapperRect.left) < edgeThreshold) {
				resizeEdge = 'left'
			} else if (Math.abs(e.clientX - wrapperRect.right) < edgeThreshold) {
				resizeEdge = 'right'
			} else {
				resizeEdge = null
			}
		}
	}

	function handleMouseDown(e: MouseEvent) {
		if (!resizeEdge || !containerElement) return

		e.preventDefault()
		isDragging = true
		const startX = e.clientX
		const startWidth = iframeWidth
		const containerWidth = containerElement.getBoundingClientRect().width
		const edge = resizeEdge

		function onMouseMove(e: MouseEvent) {
			e.preventDefault()
			const deltaX = e.clientX - startX
			// Since iframe is centered, dragging either edge should change width symmetrically
			const deltaPercent = (deltaX / containerWidth) * 100
			const widthChange = edge === 'right' ? deltaPercent * 2 : -deltaPercent * 2

			const newWidth = Math.max(10, Math.min(100, startWidth + widthChange))
			previewWidth.value = newWidth
		}

		function onMouseUp(e: MouseEvent) {
			e.preventDefault()
			isDragging = false
			resizeEdge = null
			previewWidth.persist()
			window.removeEventListener('mousemove', onMouseMove)
			window.removeEventListener('mouseup', onMouseUp)
		}

		window.addEventListener('mousemove', onMouseMove)
		window.addEventListener('mouseup', onMouseUp)
	}
</script>

<svelte:window onmousemove={handleMouseMove} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="preview-container"
	bind:this={containerElement}
	style:--iframe-width="{iframeWidth}%"
	class:resizing={isDragging}
	class:resize-active={resizeEdge !== null}
	onmousedown={handleMouseDown}
	onmouseleave={() => { if (!isDragging) resizeEdge = null }}
>
	<!-- Glow overlay - fixed position, clipped by container's clip-path -->
	<div 
		class="glow-overlay"
		style:--mouse-x="{mouseX}px"
		style:--mouse-y="{mouseY}px"
	></div>
	<div
		class="iframe-wrapper"
		bind:this={iframeWrapperElement}
		class:resize-left={resizeEdge === 'left'}
		class:resize-right={resizeEdge === 'right'}
	>
		{#if imageCache.isLoading}
			<div class="loading-indicator" title="Caching images...">
				<div class="spinner-small"></div>
			</div>
		{/if}
		<iframe
			bind:this={iframeElement}
			title="Email Preview"
			style:height={iframeHeight > 0 ? `${iframeHeight}px` : `${containerHeight}px`}
			style:min-height="{containerHeight}px"
			scrolling="no"
		></iframe>
	</div>
</div>

<style>
	.preview-container {
		position: relative;
		display: flex;
		justify-content: center;
		height: 100%;
		overflow-y: auto;
		overflow-x: hidden;
		/* Clip the glow overlay */
		clip-path: inset(0);
		
		/* Wireframe grid background - fixed to viewport */
		--grid-color: rgba(119, 123, 219, 0.12);
		--grid-size: 24px;
		background-color: #35354B;
		background-image:
			linear-gradient(var(--grid-color) 1px, transparent 1px),
			linear-gradient(90deg, var(--grid-color) 1px, transparent 1px);
		background-size: var(--grid-size) var(--grid-size);
		background-attachment: fixed;
	}

	/* Cursor glow effect on grid lines - fixed but clipped by container */
	.glow-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		pointer-events: none;
		/* Glow mask that only affects the grid lines */
		mask-image:
			linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px),
			linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px);
		mask-size: var(--grid-size) var(--grid-size);
		-webkit-mask-image:
			linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px),
			linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px);
		-webkit-mask-size: var(--grid-size) var(--grid-size);
		background: radial-gradient(
			circle 180px at var(--mouse-x, 50%) var(--mouse-y, 50%),
			rgba(119, 123, 219, 0.5) 0%,
			rgba(89, 73, 162, 0.25) 40%,
			transparent 70%
		);
		z-index: 3;
	}

	.iframe-wrapper {
		position: relative;
		width: var(--iframe-width, 100%);
		z-index: 4;
		overflow: visible;
		min-height: 100%;
	}

	.iframe-wrapper > iframe {
		box-shadow: 0px 0 0 0 #777BDB;
		transition: box-shadow .2s;
		z-index: 2;
	}

	/* Visual resize indicators via box-shadow on wrapper */
	.iframe-wrapper.resize-left > iframe {
		box-shadow: -6px 0 0 0 #777BDB;
	}

	.iframe-wrapper.resize-right > iframe {
		box-shadow: 6px 0 0 0 #777BDB;
	}

	.preview-container.resize-active {
		cursor: ew-resize;
	}

	.preview-container iframe {
		display: block;
		width: 100%;
		border: none;
		pointer-events: auto;
		z-index: 1;
	}

	.preview-container.resizing {
		cursor: ew-resize;
		user-select: none;
	}

	.preview-container.resizing iframe {
		pointer-events: none;
	}

	.loading-indicator {
		position: absolute;
		top: 8px;
		right: 8px;
		padding: 6px;
		background: rgba(255, 255, 255, 0.9);
		border-radius: 50%;
		z-index: 5;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.spinner-small {
		width: 16px;
		height: 16px;
		border: 2px solid #e5e5e5;
		border-top-color: #777BDB;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
