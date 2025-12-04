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

	interface Props {
		html: string
	}

	const { html }: Props = $props()

	const imageCache = createImageCache()

	$effect(() => {
		imageCache.processHtml(html)
	})

	let iframeWidth = $state(80) // percentage
	let iframeHeight = $state(0)
	let containerElement: HTMLDivElement | undefined = $state()
	let iframeWrapperElement: HTMLDivElement | undefined = $state()
	let iframeElement: HTMLIFrameElement | undefined = $state()
	let resizeEdge: 'left' | 'right' | null = $state(null)
	let isDragging = $state(false)

	// Sync iframe height to its content and setup mouse event forwarding
	$effect(() => {
		// Track html changes to re-setup observer when content changes
		const _ = imageCache.processedHtml || html

		const iframe = iframeElement
		if (!iframe) return

		let observer: ResizeObserver | null = null

		const updateHeight = () => {
			const doc = iframe.contentDocument
			if (doc?.documentElement) {
				const height = doc.documentElement.scrollHeight
				if (height > 0) {
					iframeHeight = height
				}
			}
		}

		const setupObserver = () => {
			const doc = iframe.contentDocument
			if (!doc?.body) return

			updateHeight()

			observer = new ResizeObserver(updateHeight)
			observer.observe(doc.body)
			if (doc.documentElement) {
				observer.observe(doc.documentElement)
			}

			// Forward mouse events from iframe to detect edge proximity
			doc.addEventListener('mousemove', handleIframeMouseMove)
		}

		const onLoad = () => {
			setupObserver()
		}

		iframe.addEventListener('load', onLoad)

		if (iframe.contentDocument?.readyState === 'complete') {
			setupObserver()
		}

		return () => {
			iframe.removeEventListener('load', onLoad)
			iframe.contentDocument?.removeEventListener('mousemove', handleIframeMouseMove)
			observer?.disconnect()
		}
	})

	// Handle mouse move from inside iframe
	function handleIframeMouseMove(e: MouseEvent) {
		if (!iframeWrapperElement || !iframeElement || isDragging) return

		// Get iframe's position in viewport
		const iframeRect = iframeElement.getBoundingClientRect()
		// Convert iframe-relative coords to viewport coords
		const viewportX = iframeRect.left + e.clientX

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

	// Cursor glow effect
	let mouseX = $state(0)
	let mouseY = $state(0)

	function handleMouseMove(e: MouseEvent) {
		if (!containerElement || !iframeWrapperElement) return
		const rect = containerElement.getBoundingClientRect()
		mouseX = e.clientX - rect.left
		mouseY = e.clientY - rect.top

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
			iframeWidth = newWidth
		}

		function onMouseUp(e: MouseEvent) {
			e.preventDefault()
			isDragging = false
			resizeEdge = null
			window.removeEventListener('mousemove', onMouseMove)
			window.removeEventListener('mouseup', onMouseUp)
		}

		window.addEventListener('mousemove', onMouseMove)
		window.addEventListener('mouseup', onMouseUp)
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="preview-container"
	bind:this={containerElement}
	style:--iframe-width="{iframeWidth}%"
	style:--mouse-x="{mouseX}px"
	style:--mouse-y="{mouseY}px"
	class:resizing={isDragging}
	class:resize-active={resizeEdge !== null}
	onmousemove={handleMouseMove}
	onmousedown={handleMouseDown}
	onmouseleave={() => { if (!isDragging) resizeEdge = null }}
>
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
			srcdoc={imageCache.processedHtml || html}
			title="Email Preview"
			style:height={iframeHeight > 0 ? `${iframeHeight}px` : '100%'}
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
		
		/* Wireframe grid background */
		--grid-color: rgba(119, 123, 219, 0.12);
		--grid-size: 24px;
		background-color: #35354B;
		background-image:
			linear-gradient(var(--grid-color) 1px, transparent 1px),
			linear-gradient(90deg, var(--grid-color) 1px, transparent 1px);
		background-size: var(--grid-size) var(--grid-size);
	}

	/* Cursor glow effect on grid lines */
	.preview-container::before {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		background:
			radial-gradient(
				circle 150px at var(--mouse-x, 50%) var(--mouse-y, 50%),
				transparent 0%,
				transparent 100%
			);
		/* Glow mask that only affects the grid lines */
		mask-image:
			linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px),
			linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px);
		mask-size: var(--grid-size) var(--grid-size);
		-webkit-mask-image:
			linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px),
			linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px);
		-webkit-mask-size: var(--grid-size) var(--grid-size);
		background: radial-gradient(
			circle 180px at var(--mouse-x, 50%) var(--mouse-y, 50%),
			rgba(119, 123, 219, 0.5) 0%,
			rgba(89, 73, 162, 0.25) 40%,
			transparent 70%
		);
		z-index: 1;
	}

	.iframe-wrapper {
		position: relative;
		width: var(--iframe-width, 100%);
		z-index: 2;
		overflow: visible;
	}

	.iframe-wrapper > iframe {
		box-shadow: 0px 0 0 0 #777BDB;
		transition: .2s;
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
		position: relative;
		width: 100%;
		min-height: 100%;
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
