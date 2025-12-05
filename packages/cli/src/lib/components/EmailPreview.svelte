<!-- @component
	Resizable iframe preview for rendered email HTML.
	
	The iframe width can be adjusted by dragging the edges.
	Images are automatically cached as data URLs for instant loading.
	Uses the shared IframePreview component with morphdom for seamless updates.

@example
```svelte
<EmailPreview html={renderedHtml} />
```
-->
<script lang="ts">
	import { createImageCache } from '$lib/image-cache.svelte'
	import { createPreviewWidth } from '$lib/utils/preview-width.svelte'
	import { Email } from 'svelte-emails'

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
	let resizeEdge: 'left' | 'right' | null = $state(null)
	let isDragging = $state(false)
	
	// Resize state for drag operations
	let resizeState: {
		edge: 'left' | 'right'
		startX: number
		startWidth: number
		containerWidth: number
	} | null = null

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

	// Derive the content to display (with cached images)
	const contentHtml = $derived(imageCache.processedHtml || html)

	// Cursor glow effect - use viewport coordinates for fixed overlay
	let mouseX = $state(0)
	let mouseY = $state(0)

	/** Unified mouse move handler for both window and iframe events */
	function handleMouseMove(e: { clientX: number; clientY: number }) {
		mouseX = e.clientX
		mouseY = e.clientY
		if (resizeState) handleResizeMove(e.clientX)
	}
	
	function handleResizeMove(clientX: number) {
		if (!resizeState) return
		const { edge, startX, startWidth, containerWidth } = resizeState
		const deltaX = clientX - startX
		// Since iframe is centered, dragging either edge should change width symmetrically
		const deltaPercent = (deltaX / containerWidth) * 100
		const widthChange = edge === 'right' ? deltaPercent * 2 : -deltaPercent * 2
		const newWidth = Math.max(10, Math.min(100, startWidth + widthChange))
		previewWidth.value = newWidth
	}
	
	function handleResizeEnd() {
		if (!resizeState) return
		resizeState = null
		isDragging = false
		resizeEdge = null
		previewWidth.persist()
	}

	function handleIframeMouseUp() {
		handleResizeEnd()
	}

	function handleResizeHandleEnter(edge: 'left' | 'right') {
		if (!isDragging) resizeEdge = edge
	}

	function handleResizeHandleLeave() {
		if (!isDragging) resizeEdge = null
	}

	function handleResizeStart(e: MouseEvent, edge: 'left' | 'right') {
		if (!containerElement) return

		e.preventDefault()
		isDragging = true
		resizeEdge = edge
		
		// Store resize state for use by both window and iframe events
		resizeState = {
			edge,
			startX: e.clientX,
			startWidth: iframeWidth,
			containerWidth: containerElement.getBoundingClientRect().width
		}

		// Window listeners as fallback (for when mouse stays outside iframe)
		function onWindowMouseUp() {
			handleResizeEnd()
			window.removeEventListener('mouseup', onWindowMouseUp)
		}
		window.addEventListener('mouseup', onWindowMouseUp)
	}
</script>

<svelte:window onmousemove={handleMouseMove} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="preview-container"
	bind:this={containerElement}
	style:--iframe-width="{iframeWidth}%"
	class:resizing={isDragging}
>
	<!-- Glow overlay - fixed position, clipped by container's clip-path -->
	<div 
		class="glow-overlay"
		style:--mouse-x="{mouseX}px"
		style:--mouse-y="{mouseY}px"
	></div>
	<div
		class="iframe-wrapper"
		class:resize-left={resizeEdge === 'left'}
		class:resize-right={resizeEdge === 'right'}
	>
		<!-- Left resize handle -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div 
			class="resize-handle resize-handle-left"
			onmouseenter={() => handleResizeHandleEnter('left')}
			onmouseleave={handleResizeHandleLeave}
			onmousedown={(e) => handleResizeStart(e, 'left')}
		></div>
		
		<Email.IframePreview
			html={contentHtml}
			bind:height={iframeHeight}
			title="Email Preview"
			style="min-height: {containerHeight}px;"
			scrolling="no"
			oniframemousemove={handleMouseMove}
			oniframemouseup={handleIframeMouseUp}
		/>
		
		<!-- Right resize handle -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div 
			class="resize-handle resize-handle-right"
			onmouseenter={() => handleResizeHandleEnter('right')}
			onmouseleave={handleResizeHandleLeave}
			onmousedown={(e) => handleResizeStart(e, 'right')}
		></div>
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

	.iframe-wrapper :global(iframe) {
		box-shadow: 0px 0 0 0 #777BDB;
		transition: box-shadow .2s;
		z-index: 2;
	}

	/* Visual resize indicators via box-shadow on wrapper */
	.iframe-wrapper.resize-left :global(iframe) {
		box-shadow: -6px 0 0 0 #777BDB;
	}

	.iframe-wrapper.resize-right :global(iframe) {
		box-shadow: 6px 0 0 0 #777BDB;
	}

	/* Resize handles - invisible but capture mouse events */
	.resize-handle {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 12px;
		cursor: ew-resize;
		z-index: 10;
	}

	.resize-handle-left {
		left: -6px;
	}

	.resize-handle-right {
		right: -6px;
	}

	.preview-container :global(iframe) {
		display: block;
		width: 100%;
		border: none;
		z-index: 1;
	}

	.preview-container.resizing {
		cursor: ew-resize;
		user-select: none;
	}
</style>
