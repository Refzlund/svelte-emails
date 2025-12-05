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
	let containerElement: HTMLDivElement | undefined = $state()
	let wrapperElement: HTMLDivElement | undefined = $state()
	let resizeEdge: 'left' | 'right' | null = $state(null)
	let isDragging = $state(false)
	
	// Resize drag state
	let dragStartX = 0
	let dragStartWidth = 0
	let dragContainerWidth = 0

	// Derive the content to display (with cached images)
	const contentHtml = $derived(imageCache.processedHtml || html)

	// Cursor glow effect - use viewport coordinates for fixed overlay
	let mouseX = $state(0)
	let mouseY = $state(0)

	function handleMouseMove(e: { clientX: number; clientY: number }) {
		mouseX = e.clientX
		mouseY = e.clientY
	}
	
	function handleResizeMove(clientX: number) {
		if (!isDragging || !containerElement) return
		
		const deltaX = clientX - dragStartX
		// Since iframe is centered, dragging either edge should change width symmetrically
		const deltaPercent = (deltaX / dragContainerWidth) * 100
		const widthChange = resizeEdge === 'right' ? deltaPercent * 2 : -deltaPercent * 2
		previewWidth.value = Math.max(10, Math.min(100, dragStartWidth + widthChange))
	}
	
	function handleResizeEnd() {
		if (!isDragging) return
		isDragging = false
		resizeEdge = null
		previewWidth.persist()
	}

	function handleResizeStart(e: MouseEvent, edge: 'left' | 'right') {
		if (!containerElement) return
		e.preventDefault()
		isDragging = true
		resizeEdge = edge
		dragStartX = e.clientX
		dragStartWidth = iframeWidth
		dragContainerWidth = containerElement.getBoundingClientRect().width
	}
</script>

<svelte:window onmousemove={handleMouseMove} />

{#snippet resizeHandle(edge: 'left' | 'right')}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div 
		class="resize-handle resize-handle-{edge}"
		onmouseenter={() => !isDragging && (resizeEdge = edge)}
		onmouseleave={() => !isDragging && (resizeEdge = null)}
		onmousedown={(e) => handleResizeStart(e, edge)}
	></div>
{/snippet}

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="preview-container"
	bind:this={containerElement}
	style:--iframe-width="{iframeWidth}%"
	class:resizing={isDragging}
>
	<!-- Transparent overlay to capture mouse events during drag -->
	{#if isDragging}
		<div 
			class="drag-overlay"
			onmousemove={(e) => handleResizeMove(e.clientX)}
			onmouseup={handleResizeEnd}
		></div>
	{/if}
	
	<!-- Glow overlay - fixed position, clipped by container's clip-path -->
	<div 
		class="glow-overlay"
		style:--mouse-x="{mouseX}px"
		style:--mouse-y="{mouseY}px"
	></div>
	<div
		class="iframe-wrapper"
		bind:this={wrapperElement}
		class:resize-left={resizeEdge === 'left'}
		class:resize-right={resizeEdge === 'right'}
		style:height={iframeHeight > 0 ? `${iframeHeight}px` : undefined}
	>
		{@render resizeHandle('left')}
		
		<Email.IframePreview
			html={contentHtml}
			bind:height={iframeHeight}
			scrollContainer={containerElement}
			heightTarget={wrapperElement}
			title="Email Preview"
			scrolling="no"
			oniframemousemove={handleMouseMove}
		/>
		
		{@render resizeHandle('right')}
	</div>
</div>

<style>
	.preview-container {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: flex-start;
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

	/* Resize handles - positioned at edges of iframe wrapper */
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

	/* Transparent overlay during drag to capture all mouse events */
	.drag-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 9999;
		cursor: ew-resize;
	}
</style>
