<!-- @component
	A tooltip component using floating-runes.
	
	Shows a tooltip after a delay when hovering over the reference element.

@example
```svelte
<Tooltip text="Hello world" delay={500}>
	<button>Hover me</button>
</Tooltip>
```
-->
<script lang="ts">
	import type { Snippet } from 'svelte'
	import floatingUI, { flip, shift, offset, portal, arrow } from 'floating-runes'

	interface Props {
		/** Tooltip text to display */
		text: string
		/** Optional keyboard shortcut to show */
		shortcut?: string
		/** Delay in ms before showing tooltip */
		delay?: number
		/** Placement of the tooltip */
		placement?: 'top' | 'bottom' | 'left' | 'right'
		/** Content to wrap */
		children: Snippet
	}

	const {
		text,
		shortcut,
		delay = 400,
		placement = 'top',
		children
	}: Props = $props()

	// Track actual placement after flip
	// svelte-ignore state_referenced_locally
	let actualPlacement = $state<'top' | 'bottom' | 'left' | 'right'>(placement)

	// placement is a constant from props, so this warning is a false positive
	// svelte-ignore state_referenced_locally
	const float = floatingUI({
		placement,
		middleware: [
			offset(8),
			flip(),
			shift({ padding: 8 }),
			arrow()
		]
	}).then((data) => {
		actualPlacement = data.placement as typeof placement
	})

	let showTooltip = $state(false)
	let hoverTimeout: ReturnType<typeof setTimeout> | undefined

	function handleMouseEnter() {
		clearTimeout(hoverTimeout)
		hoverTimeout = setTimeout(() => {
			showTooltip = true
		}, delay)
	}

	function handleMouseLeave() {
		clearTimeout(hoverTimeout)
		showTooltip = false
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<span
	use:float.ref
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
>
	{@render children()}
</span>

{#if float && showTooltip}
	<tooltip-el
		class:from-top={actualPlacement === 'top'}
		class:from-bottom={actualPlacement === 'bottom'}
		class:from-left={actualPlacement === 'left'}
		class:from-right={actualPlacement === 'right'}
		use:float
		use:portal
	>
		<span class="tooltip-text">{text}</span>
		{#if shortcut}
			<kbd class="tooltip-shortcut">{shortcut}</kbd>
		{/if}
		<tooltip-arrow use:float.arrow></tooltip-arrow>
	</tooltip-el>
{/if}

<style>
	tooltip-el {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 10px;
		background: #1f2028;
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 6px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		pointer-events: none;
		width: max-content;
	}

	tooltip-el.from-top {
		animation: tooltip-from-top 0.15s ease;
	}

	tooltip-el.from-bottom {
		animation: tooltip-from-bottom 0.15s ease;
	}

	tooltip-el.from-left {
		animation: tooltip-from-left 0.15s ease;
	}

	tooltip-el.from-right {
		animation: tooltip-from-right 0.15s ease;
	}

	@keyframes tooltip-from-top {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes tooltip-from-bottom {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes tooltip-from-left {
		from {
			opacity: 0;
			transform: translateX(4px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	@keyframes tooltip-from-right {
		from {
			opacity: 0;
			transform: translateX(-4px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	tooltip-arrow {
		width: 8px;
		height: 8px;
		background: #1f2028;
		transform: rotate(45deg);
		border-radius: 1px;
	}

	.tooltip-text {
		font-size: 12px;
		color: rgba(255, 255, 255, 0.9);
		white-space: nowrap;
	}

	.tooltip-shortcut {
		font-size: 11px;
		font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
		padding: 2px 6px;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 4px;
		color: rgba(255, 255, 255, 0.7);
	}
</style>
