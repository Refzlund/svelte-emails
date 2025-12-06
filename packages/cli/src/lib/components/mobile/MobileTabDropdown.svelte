<!-- @component
	Mobile tab dropdown menu.
	
	Displays a vertical list of tab options that floats above the bottom nav.
	Uses the same background as the tabs, with custom border and shadow.

@example
```svelte
<MobileTabDropdown
	currentTab="preview"
	onselect={(tab) => viewMode.set(tab)}
	onclose={() => isOpen = false}
	isLoading={{ preview: false, source: true, html: false, text: false }}
/>
```
-->
<script lang="ts">
	import { TABS, type ViewMode } from '$lib/utils/view-mode.svelte'
	import TabButton from '../shared/TabButton.svelte'
	import { portal } from 'floating-runes'

	interface Props {
		/** Currently active tab */
		currentTab: ViewMode
		/** Callback when a tab is selected */
		onselect: (tab: ViewMode) => void
		/** Callback when the dropdown should close */
		onclose: () => void
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
		currentTab,
		onselect,
		onclose,
		isLoading = { preview: false, source: false, html: false, raw: false, text: false }
	}: Props = $props()

	// Close on outside click
	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onclose()
		}
	}

	function handleSelect(tab: ViewMode) {
		onselect(tab)
		onclose()
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="backdrop" onclick={handleBackdropClick} use:portal>
	<div class="dropdown">
		{#each TABS as tab}
			{@const isActive = currentTab === tab.mode}
			<TabButton
				tabMode={tab.mode}
				label={tab.label}
				icon={tab.icon}
				{isActive}
				isLoading={isLoading[tab.mode as keyof typeof isLoading]}
				onclick={() => handleSelect(tab.mode)}
				class="dropdown-item"
			/>
		{/each}
	</div>
</div>

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 999;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		align-items: flex-end;
		padding: 0 16px 72px 16px;
	}

	.dropdown {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 6px;
		background: var(--tabs-bg);
		border: 1px solid rgba(84, 85, 117, 0.50);
		border-radius: 12px;
		box-shadow: 4px 4px 12px 0 rgba(21, 21, 30, 0.25);
		animation: dropdown-in 0.15s ease;
	}

	@keyframes dropdown-in {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.dropdown :global(.dropdown-item) {
		width: 100%;
		justify-content: flex-start;
		padding: 12px 16px;
		font-size: 15px;
	}

	.dropdown :global(.dropdown-item.active) {
		background: var(--tab-active-gradient);
		border-radius: 8px;
	}
</style>
