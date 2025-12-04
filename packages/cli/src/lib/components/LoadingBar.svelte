<!-- @component
	Animated loading bar that appears below navigation during re-renders.
	
	Shows a smooth indeterminate progress animation with multiple lines.

@example
```svelte
<LoadingBar visible={isLoading} />
```
-->
<script lang="ts">
	interface Props {
		visible?: boolean
	}

	const { visible = false }: Props = $props()

	let finishing = $state(false)
	let hidden = $state(true)

	$effect(() => {
		if (visible) {
			hidden = false
			finishing = false
		} else if (!hidden) {
			// Start finish animation instead of hiding immediately
			finishing = true
		}
	})

	function onAnimationIteration(e: AnimationEvent) {
		// When finishing and animation completes a cycle, hide the bar
		if (finishing && e.target === e.currentTarget) {
			hidden = true
			finishing = false
		}
	}
</script>

<div class="loading-bar" class:hidden>
	<div
		class="progress p1"
		onanimationiteration={onAnimationIteration}
	></div>
	<div class="progress p2"></div>
	<div class="progress p3"></div>
</div>

<style>
	.loading-bar {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: rgba(119, 123, 219, 0.1);
		overflow: hidden;
	}

	.loading-bar.hidden {
		visibility: hidden;
	}

	.progress {
		position: absolute;
		top: 0;
		left: -40%;
		height: 100%;
		width: 40%;
		background: linear-gradient(
			90deg,
			transparent,
			rgba(119, 123, 219, 0.6) 20%,
			#777BDB 50%,
			rgba(119, 123, 219, 0.6) 80%,
			transparent
		);
	}

	.p1 {
		animation: loading 1.4s ease-in-out infinite;
	}

	.p2 {
		animation: loading 1.4s ease-in-out infinite;
		animation-delay: 0.4s;
		opacity: 0.7;
	}

	.p3 {
		animation: loading 1.4s ease-in-out infinite;
		animation-delay: 0.8s;
		opacity: 0.4;
	}

	@keyframes loading {
		0% {
			left: -40%;
		}
		100% {
			left: 100%;
		}
	}
</style>
