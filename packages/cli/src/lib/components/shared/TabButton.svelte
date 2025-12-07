<!-- @component
	Shared tab button used in both desktop horizontal tabs and mobile vertical dropdown.

@example
```svelte
<TabButton
	tabMode="preview"
	label="Preview"
	icon={icons.contentView}
	isActive={currentTab === 'preview'}
	isLoading={loading}
	onclick={() => setTab('preview')}
/>
```
-->
<script lang="ts">
	import type * as icons from '$lib/Icons.svelte'
	import type { ViewMode } from '$lib/utils/view-mode.svelte'

	interface Props {
		/** The tab mode identifier */
		tabMode: ViewMode
		/** Display label */
		label: string
		/** Icon snippet to render */
		icon: typeof icons.contentView
		/** Whether this tab is currently active */
		isActive: boolean
		/** Whether the tab is in loading state */
		isLoading?: boolean
		/** Click handler */
		onclick: () => void
		/** Optional class for styling variants */
		class?: string
	}

	const {
		tabMode,
		label,
		icon,
		isActive,
		isLoading = false,
		onclick,
		class: className = ''
	}: Props = $props()
</script>

<button
	class="tab-button {className}"
	class:active={isActive}
	{onclick}
	data-tab={tabMode}
>
	{#if isLoading}
		<span class="spinner"></span>
	{:else}
		{@render icon({ size: 20, opacity: isActive ? 1 : 0.75 })}
	{/if}
	<span class="label">{label}</span>
</button>

<style>
	.tab-button {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 10px 16px;
		border: none;
		border-radius: 8px;
		background: transparent;
		color: rgba(255, 255, 255, 0.6);
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
		white-space: nowrap;
	}

	.tab-button:hover {
		color: rgba(255, 255, 255, 0.9);
	}

	.tab-button.active {
		color: #fff;
	}

	.spinner {
		width: 20px;
		height: 20px;
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

	.label {
		flex: 1;
		text-align: left;
	}
</style>
