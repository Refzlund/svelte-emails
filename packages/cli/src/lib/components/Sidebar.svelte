<!-- @component
	Navigation sidebar for the email viewer.
	
	Displays a list of emails/examples/documentation with folder grouping,
	and mode switching buttons.

@example
```svelte
<Sidebar />
```
-->
<script lang="ts">
	import { onMount } from 'svelte'
	import { createSidebarState } from './Sidebar.svelte.js'
	import type { SafeEmail } from '../../cli/types.js'
	import * as icons from '$lib/Icons.svelte'

	const sidebar = createSidebarState()

	onMount(() => sidebar.subscribeToUpdates())
</script>

{#snippet emailItem(item: SafeEmail, index: number, inFolder: boolean = false)}
	<a
		href="{sidebar.urlPrefix}/{item.id}"
		class="email-item"
		class:in-folder={inFolder}
		class:selected={sidebar.selectedId === item.id}
		class:even={index % 2 === 0}
		class:odd={index % 2 === 1}
		onclick={(e) => sidebar.handleItemClick(e, item.id)}
	>
		<span class="email-name">{item.name}</span>
		{#if item.previewText}
			<span class="email-preview">{item.previewText}</span>
		{/if}
	</a>
{/snippet}

<aside class="sidebar">
	<header class="sidebar-header">
		<img src="/svelte-emails.png" alt="svelte-emails logo" width="24" height="24" />
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
		<button
			class="mode-toggle"
			class:active={sidebar.viewMode === 'examples'}
			onclick={() => sidebar.navigateToMode('examples')}
		>
			{@render icons.sparkleAction({ size: 24, opacity: sidebar.viewMode === 'examples' ? 1 : .5 })}
			Examples
		</button>
		<button
			class="mode-toggle"
			class:active={sidebar.viewMode === 'documentation'}
			onclick={() => sidebar.navigateToMode('documentation')}
		>
			{@render icons.bookInformation({ size: 24, opacity: sidebar.viewMode === 'documentation' ? 1 : .5 })}
			Documentation
		</button>
	</footer>
</aside>

<style>
	.sidebar {
		width: 320px;
		min-width: 320px;
		background: var(--nav-bg);
		display: flex;
		flex-direction: column;
	}

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
</style>
