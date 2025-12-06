<!-- @component
	Mobile-optimized email preview.
	
	Full-width iframe preview without resize handles.
	Simplified version of EmailPreview for mobile devices.

@example
```svelte
<MobileEmailPreview html={renderedHtml} emailId="my-email" mode="emails" />
```
-->
<script lang="ts">
	import { createPreviewState, createScrollPersistence } from '../email-preview.svelte.js'
	import { Email } from 'svelte-emails'

	interface Props {
		html: string
		/** Email ID for scroll position persistence */
		emailId?: string
		/** Mode for namespacing scroll positions (emails, examples, documentation) */
		mode?: string
	}

	const { html, emailId, mode }: Props = $props()

	/** Combined key for scroll position storage */
	const scrollKey = $derived(emailId && mode ? `${mode}:${emailId}` : emailId)

	// Use shared preview state (image caching + cursor glow)
	const preview = createPreviewState(
		() => html,
		() => scrollKey
	)

	// Use shared scroll persistence
	const scroll = createScrollPersistence(() => scrollKey)

	let iframeHeight = $state(0)
	let containerElement: HTMLDivElement | undefined = $state()
	let wrapperElement: HTMLDivElement | undefined = $state()

	// Restore scroll position when iframe height is ready
	$effect(() => {
		scroll.restorePosition(containerElement, iframeHeight > 0)
	})
</script>

<svelte:window onmousemove={preview.handleMouseMove} />

<div
	class="preview-container"
	bind:this={containerElement}
	onscroll={() => scroll.savePosition(containerElement)}
>
	<!-- Glow overlay - fixed position, clipped by container's clip-path -->
	<div 
		class="glow-overlay"
		style:--mouse-x="{preview.mouseX}px"
		style:--mouse-y="{preview.mouseY}px"
	></div>
	<div class="iframe-wrapper" bind:this={wrapperElement}>
		<Email.IframePreview
			html={preview.contentHtml}
			bind:height={iframeHeight}
			scrollContainer={containerElement}
			heightTarget={wrapperElement}
			title="Email Preview"
			scrolling="no"
			oniframemousemove={preview.handleMouseMove}
		/>
	</div>
</div>

<style>
	.preview-container {
		position: relative;
		display: grid;
		/* Center the wrapper horizontally */
		justify-items: center;
		align-content: start;
		/* Ensure grid track is at least full height for small content */
		grid-template-rows: minmax(100%, auto);
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
		width: 100%;
		/* Fill the grid cell height (at least 100% of container) */
		min-height: 100%;
		z-index: 4;
		overflow: visible;
	}

	.preview-container :global(iframe) {
		display: block;
		width: 100%;
		border: none;
		z-index: 1;
	}
</style>
