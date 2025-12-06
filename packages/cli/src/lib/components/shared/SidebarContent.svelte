<!-- @component
	Shared sidebar content for both desktop and mobile.
	
	Contains the email/example/documentation list, folder grouping,
	and mode switching buttons. The desktop Sidebar.svelte and 
	MobileSidebar.svelte both use this component.

@example
```svelte
<SidebarContent showShortcuts={false} onitemclick={closeSidebar} />
```
-->
<script lang="ts">
	import { onMount } from 'svelte'
	import { base } from '$app/paths'
	import { createSidebarState } from '../sidebar.svelte.js'
	import type { SafeEmail } from '../../../cli/types.js'
	import * as icons from '$lib/Icons.svelte'
	import Tooltip from '../Tooltip.svelte'
	import { registerShortcuts } from '$lib/utils/keyboard-shortcuts'

	interface Props {
		/** Whether to show keyboard shortcuts in mode toggles */
		showShortcuts?: boolean
		/** Callback when an item is clicked (for closing mobile sidebar) */
		onitemclick?: () => void
	}

	const { showShortcuts = true, onitemclick }: Props = $props()

	const sidebar = createSidebarState()

	onMount(() => {
		const unsubscribeStore = sidebar.subscribeToUpdates()
		const unsubscribeShortcuts = showShortcuts
			? registerShortcuts({
				toggleExamples: () => sidebar.navigateToMode('examples'),
				toggleDocumentation: () => sidebar.navigateToMode('documentation')
			})
			: () => {}
		return () => {
			unsubscribeStore()
			unsubscribeShortcuts()
		}
	})

	function handleItemClick(e: MouseEvent, itemId: string) {
		sidebar.handleItemClick(e, itemId)
		onitemclick?.()
	}
</script>

{#snippet emailItem(item: SafeEmail, index: number, inFolder: boolean = false)}
	<a
		href="{sidebar.urlPrefix}/{item.id}"
		class="email-item"
		class:in-folder={inFolder}
		class:selected={sidebar.selectedId === item.id}
		class:even={index % 2 === 0}
		class:odd={index % 2 === 1}
		onclick={(e) => handleItemClick(e, item.id)}
	>
		<span class="email-name">{item.name}</span>
		{#if item.previewText}
			<span class="email-preview">{item.previewText}</span>
		{/if}
	</a>
{/snippet}

{#snippet modeToggleButton(
	mode: 'examples' | 'documentation',
	label: string,
	shortcut: string,
	icon: typeof icons.sparkleAction
)}
	{@const isActive = sidebar.viewMode === mode}
	{@const handleClick = () => {
		sidebar.navigateToMode(mode)
		// Don't close sidebar when toggling modes - only close when selecting an item
	}}
	{#if showShortcuts}
		<Tooltip text={`Toggle ${label.toLowerCase()}`} {shortcut} placement="right">
			<button
				class="mode-toggle"
				class:active={isActive}
				onclick={handleClick}
			>
				{@render icon({ size: 24, opacity: isActive ? 1 : .5 })}
				<span class="mode-label">{label}</span>
				<kbd class="mode-shortcut">{shortcut}</kbd>
			</button>
		</Tooltip>
	{:else}
		<button
			class="mode-toggle"
			class:active={isActive}
			onclick={handleClick}
		>
			{@render icon({ size: 24, opacity: isActive ? 1 : .5 })}
			<span class="mode-label">{label}</span>
		</button>
	{/if}
{/snippet}

<header class="sidebar-header">
	<img src="{base}/svelte-emails.png" alt="svelte-emails logo" width="24" height="24" />
	<span class="title">{sidebar.navTitle}</span>
</header>

<nav class="email-list">
	<!-- Uncategorized items first -->
	{#each sidebar.navStructure.uncategorized as item, i}
		{@render emailItem(item, i)}
	{/each}

	<!-- Categorized folders -->
	{#each sidebar.navStructure.folders as folder, folderIndex}
		{@const isCollapsed = sidebar.isFolderCollapsed(folder.name)}
		<button
			class="folder-header"
			class:even={(sidebar.navStructure.uncategorized.length + folderIndex) % 2 === 0}
			class:odd={(sidebar.navStructure.uncategorized.length + folderIndex) % 2 === 1}
			onclick={() => sidebar.toggleFolder(folder.name)}
		>
			<span class="folder-chevron" class:collapsed={isCollapsed}>
				{@render icons.chevronRight({ size: 14, opacity: 0.6 })}
			</span>
			{@render icons.folder({ size: 18, opacity: 0.7 })}
			<span class="folder-name">{folder.name}</span>
			<span class="folder-count">{folder.items.length}</span>
		</button>
		{#if !isCollapsed}
			{#each folder.items as item, itemIndex}
				{@const globalIdx = sidebar.getGlobalIndex(folderIndex, itemIndex)}
				{@render emailItem(item, globalIdx, true)}
			{/each}
		{/if}
	{/each}

	{#if sidebar.currentList.length === 0}
		<div class="empty-state">
			<p>{sidebar.emptyStateMessage.title}</p>
			<p class="hint">{sidebar.emptyStateMessage.hint}</p>
		</div>
	{/if}
</nav>

<footer class="sidebar-footer">
	{@render modeToggleButton('examples', 'Examples', 'Alt+E', icons.sparkleAction)}
	{@render modeToggleButton('documentation', 'Documentation', 'Alt+D', icons.bookInformation)}
</footer>

<style>
	.sidebar-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		height: 70px;
		padding: 0px 20px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.title {
		font-size: 14px;
		font-weight: 600;
		color: #fff;
		font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
	}

	.email-list {
		flex: 1;
		overflow-y: auto;
	}

	.email-item {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: var(--nav-item-padding-y) var(--nav-item-padding-x);
		text-decoration: none;
		color: var(--nav-item-text);
		transition: background 0.15s ease;
		border-left: var(--nav-item-selected-border-width) solid transparent;
	}

	.email-item.even {
		background: var(--nav-item-even);
	}

	.email-item.odd {
		background: var(--nav-item-odd);
	}

	.email-item:hover {
		background: var(--nav-item-selected);
	}

	.email-item.selected {
		background: var(--nav-item-selected);
		border-left-color: var(--nav-item-selected-border);
	}

	.email-name {
		font-weight: 400;
		font-size: 14px;
	}

	.email-item.selected .email-name {
		font-weight: 700;
	}

	.email-preview {
		font-size: 12px;
		opacity: var(--nav-item-preview-opacity);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.email-item.selected .email-preview {
		opacity: var(--nav-item-preview-opacity-selected);
	}

	.email-item.in-folder {
		padding-left: calc(var(--nav-item-padding-x) + 20px);
	}

	.folder-header {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		padding: var(--nav-item-padding-y) var(--nav-item-padding-x);
		border: none;
		background: transparent;
		color: var(--nav-item-text);
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.15s ease;
		text-align: left;
		border-left: var(--nav-item-selected-border-width) solid transparent;
	}

	.folder-header.even {
		background: var(--nav-item-even);
	}

	.folder-header.odd {
		background: var(--nav-item-odd);
	}

	.folder-header:hover {
		background: var(--nav-item-selected);
	}

	.folder-chevron {
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform 0.15s ease;
	}

	.folder-chevron.collapsed {
		transform: rotate(0deg);
	}

	.folder-chevron:not(.collapsed) {
		transform: rotate(90deg);
	}

	.folder-name {
		flex: 1;
		transform: translateY(1px);
	}

	.folder-count {
		font-size: 11px;
		opacity: 0.5;
		padding: 2px 6px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 10px;
	}

	.empty-state {
		padding: 24px 16px;
		text-align: center;
		color: rgba(255, 255, 255, 0.5);
	}

	.empty-state p {
		margin-bottom: 8px;
	}

	.empty-state .hint {
		font-size: 12px;
		opacity: 0.7;
	}

	.sidebar-footer {
		padding: 10px 8px;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.sidebar-footer .mode-toggle {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		border-radius: 6px;
		text-decoration: none;
		color: rgba(255, 255, 255, 0.6);
		font-size: 13px;
		transition: all 0.15s ease;
		background: transparent;
		border: none;
		cursor: pointer;
		width: 100%;
		text-align: left;
	}

	.sidebar-footer .mode-toggle:hover {
		background: rgba(255, 255, 255, 0.05);
		color: #fff;
	}

	.sidebar-footer .mode-toggle.active {
		background: rgba(255, 255, 255, 0.1);
		color: #fff;
	}

	.mode-label {
		flex: 1;
	}

	.mode-shortcut {
		font-size: 10px;
		font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
		padding: 2px 6px;
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 4px;
		color: rgba(255, 255, 255, 0.4);
		transition: all 0.15s ease;
	}

	.mode-toggle:hover .mode-shortcut {
		background: rgba(255, 255, 255, 0.12);
		color: rgba(255, 255, 255, 0.6);
	}
</style>
