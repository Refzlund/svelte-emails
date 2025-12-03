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

	// Process HTML whenever it changes
	$effect(() => {
		imageCache.processHtml(html)
	})

	let iframeWidth = $state(80) // percentage
	let iframeWrapper: HTMLDivElement | undefined = $state()
	let containerElement: HTMLDivElement | undefined = $state()
	let resizeEdge: 'left' | 'right' | null = $state(null)
	let isDragging = $state(false)

	function handleMouseDown(e: MouseEvent) {
		if (!resizeEdge || !containerElement) return

		isDragging = true
		const startX = e.clientX
		const startWidth = iframeWidth
		const containerWidth = containerElement.getBoundingClientRect().width
		const edge = resizeEdge

		function onMouseMove(e: MouseEvent) {
			const deltaX = e.clientX - startX
			// Since iframe is centered, dragging either edge should change width symmetrically
			// Dragging right edge outward (positive deltaX) increases width
			// Dragging left edge outward (negative deltaX) increases width
			const deltaPercent = (deltaX / containerWidth) * 100
			const widthChange = edge === 'right' ? deltaPercent * 2 : -deltaPercent * 2

			const newWidth = Math.max(10, Math.min(100, startWidth + widthChange))
			iframeWidth = newWidth
		}

		function onMouseUp() {
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
	class:resizing={isDragging}
>
	<div class="iframe-wrapper" bind:this={iframeWrapper}>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="resize-handle left"
			class:active={resizeEdge === 'left'}
			onmouseenter={() => resizeEdge = 'left'}
			onmouseleave={() => { if (!isDragging) resizeEdge = null }}
			onmousedown={handleMouseDown}
		></div>
		{#if imageCache.isLoading}
			<div class="loading-indicator" title="Caching images...">
				<div class="spinner-small"></div>
			</div>
		{/if}
		<iframe
			class:resize-left={resizeEdge === 'left'}
			class:resize-right={resizeEdge === 'right'}
			srcdoc={imageCache.processedHtml || html}
			title="Email Preview"
		></iframe>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="resize-handle right"
			class:active={resizeEdge === 'right'}
			onmouseenter={() => resizeEdge = 'right'}
			onmouseleave={() => { if (!isDragging) resizeEdge = null }}
			onmousedown={handleMouseDown}
		></div>
	</div>
</div>

<style>
	.preview-container {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		background: #e5e5e5;
		overflow: hidden;
	}

	.iframe-wrapper {
		position: relative;
		width: var(--iframe-width, 100%);
		height: 100%;
	}

	.resize-handle {
		position: absolute;
		top: 0;
		width: 8px;
		height: 100%;
		cursor: ew-resize;
		z-index: 10;
	}

	.resize-handle.left {
		left: -4px;
	}

	.resize-handle.right {
		right: -4px;
	}

	.resize-handle.active {
		background: #667eea;
		opacity: 0.5;
	}

	.preview-container iframe {
		width: 100%;
		height: 100%;
		border: none;
		transition: box-shadow 0.15s ease;
	}

	.preview-container iframe.resize-left {
		box-shadow: -2px 0 0 0 #667eea;
	}

	.preview-container iframe.resize-right {
		box-shadow: 2px 0 0 0 #667eea;
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
		border-top-color: #667eea;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
