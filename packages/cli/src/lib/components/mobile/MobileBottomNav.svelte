<!-- @component
	Mobile bottom navigation bar.
	
	Fixed at the bottom of the screen, contains:
	- Left: Menu button (hamburger icon) to open sidebar
	- Center: Current email title and preview text (shrunken)
	- Right: Current tab button that opens tab dropdown

@example
```svelte
<MobileBottomNav
	emailName="My Email"
	previewText="This is a preview..."
	currentTab="preview"
	onmenuclick={() => showSidebar = true}
	ontabselect={(tab) => viewMode.set(tab)}
	isLoading={{ preview: false, source: true, html: false, text: false }}
/>
```
-->
<script lang="ts">
	import * as icons from '$lib/Icons.svelte'
	import { getTabConfig, type ViewMode } from '$lib/utils/view-mode.svelte'
	import MobileTabDropdown from './MobileTabDropdown.svelte'
	import LoadingBar from '../LoadingBar.svelte'

	interface Props {
		/** Email/item name to display */
		emailName?: string
		/** Preview text to display */
		previewText?: string
		/** Currently active tab */
		currentTab: ViewMode
		/** Callback when menu button is clicked */
		onmenuclick: () => void
		/** Callback when a tab is selected */
		ontabselect: (tab: ViewMode) => void
		/** Loading states for each tab */
		isLoading?: {
			preview: boolean
			source: boolean
			html: boolean
			raw: boolean
			text: boolean
		}
	}

	const {
		emailName = 'Loading...',
		previewText = '',
		currentTab,
		onmenuclick,
		ontabselect,
		isLoading = { preview: false, source: false, html: false, raw: false, text: false }
	}: Props = $props()

	let showTabDropdown = $state(false)

	// Get the current tab config from centralized source
	const tabInfo = $derived(getTabConfig(currentTab))

	// Check if current tab is loading
	const isCurrentTabLoading = $derived(isLoading[currentTab as keyof typeof isLoading] ?? false)
</script>

<nav class="bottom-nav">
	<LoadingBar visible={isCurrentTabLoading} />

	<!-- Menu button -->
	<button class="menu-button" onclick={onmenuclick} aria-label="Open menu">
		{@render icons.list({ size: 24 })}
	</button>

	<!-- Center: Title and preview -->
	<div class="center-content">
		<span class="email-name">{emailName}</span>
		{#if previewText}
			<span class="preview-text">{previewText}</span>
		{/if}
	</div>

	<!-- Tab button -->
	<button
		class="tab-button"
		onclick={() => showTabDropdown = !showTabDropdown}
		aria-label="Select view mode"
		aria-expanded={showTabDropdown}
	>
		{#if isCurrentTabLoading}
			<span class="spinner"></span>
		{:else}
			{@render tabInfo.icon({ size: 18 })}
		{/if}
		<span class="tab-label">{tabInfo.label}</span>
	</button>
</nav>

{#if showTabDropdown}
	<MobileTabDropdown
		{currentTab}
		onselect={ontabselect}
		onclose={() => showTabDropdown = false}
		{isLoading}
	/>
{/if}

<style>
	.bottom-nav {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		height: 64px;
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 0 12px;
		background: var(--viewer-header-bg);
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		z-index: 100;
	}

	/* Position loading bar at top of nav */
	.bottom-nav :global(.loading-bar) {
		bottom: auto;
		top: 0;
	}

	.menu-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		border: none;
		border-radius: 8px;
		background: transparent;
		color: rgba(255, 255, 255, 0.8);
		cursor: pointer;
		transition: background 0.15s ease;
		flex-shrink: 0;
	}

	.menu-button:hover,
	.menu-button:active {
		background: rgba(255, 255, 255, 0.1);
	}

	.center-content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.email-name {
		font-size: 13px;
		font-weight: 600;
		color: #fff;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.preview-text {
		font-size: 11px;
		color: rgba(255, 255, 255, 0.5);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.tab-button {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 14px;
		border: none;
		border-radius: 8px;
		background: var(--tab-active-gradient);
		color: #fff;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: opacity 0.15s ease;
		flex-shrink: 0;
	}

	.tab-button:hover,
	.tab-button:active {
		opacity: 0.9;
	}

	.tab-label {
		white-space: nowrap;
	}

	.spinner {
		width: 18px;
		height: 18px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: rgba(255, 255, 255, 0.8);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		flex-shrink: 0;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
