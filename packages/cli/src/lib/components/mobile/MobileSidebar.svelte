<!-- @component
	Mobile slide-in sidebar.
	
	Slides in from the left with a backdrop overlay.
	Uses the shared SidebarContent with shortcuts disabled.
	Has rounded corners on the right side and a shadow.

@example
```svelte
<MobileSidebar bind:open={showSidebar} />
```
-->
<script lang="ts">
	import SidebarContent from '../shared/SidebarContent.svelte'
	import { portal } from 'floating-runes'

	interface Props {
		/** Controls sidebar visibility - bind to toggle open/close with animation */
		open: boolean
	}

	let { open = $bindable() }: Props = $props()

	let isClosing = $state(false)

	// Animate out then close
	function close() {
		if (isClosing) return
		isClosing = true
		setTimeout(() => {
			isClosing = false
			open = false
		}, 150) // Match animation duration
	}

	// Close on backdrop click
	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			close()
		}
	}

	// Close on escape key
	function handleKeydown(e: KeyboardEvent) {
		if (open && e.key === 'Escape') {
			close()
		}
	}
</script>

{#if open || isClosing}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="sidebar-overlay" class:closing={isClosing} onclick={handleBackdropClick} use:portal>
		<aside class="mobile-sidebar" class:closing={isClosing}>
			<SidebarContent showShortcuts={false} onitemclick={close} />
		</aside>
	</div>
{/if}

<svelte:window onkeydown={handleKeydown} />

<style>
	.sidebar-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		/* Stop above bottom nav (64px) */
		bottom: 64px;
		background: rgba(0, 0, 0, 0.5);
		z-index: 1000;
		animation: overlay-in 0.2s ease;
	}

	@keyframes overlay-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.mobile-sidebar {
		position: absolute;
		top: 0;
		left: 0;
		bottom: 0;
		width: 85%;
		max-width: 320px;
		background: var(--nav-bg);
		border-radius: 0 16px 0 0;
		box-shadow: 4px 4px 24px 0 rgba(21, 21, 30, 0.10);
		display: flex;
		flex-direction: column;
		animation: sidebar-in 0.25s ease;
		overflow: hidden;
	}

	@keyframes sidebar-in {
		from {
			transform: translateX(-100%);
		}
		to {
			transform: translateX(0);
		}
	}

	.sidebar-overlay.closing {
		animation: overlay-out 0.15s ease forwards;
	}

	@keyframes overlay-out {
		from {
			opacity: 1;
		}
		to {
			opacity: 0;
		}
	}

	.mobile-sidebar.closing {
		animation: sidebar-out 0.15s ease forwards;
	}

	@keyframes sidebar-out {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(-100%);
		}
	}

	/* Ensure the sidebar content fills the container */
	.mobile-sidebar :global(.email-list) {
		flex: 1;
		overflow-y: auto;
	}
</style>
