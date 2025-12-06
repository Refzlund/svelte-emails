<!-- @component
	Responsive layout wrapper that switches between mobile and desktop layouts.
	
	Uses media queries to detect viewport size and renders the appropriate
	layout. Mobile threshold is 768px.

	Desktop: Sidebar + EmailViewer (side by side)
	Mobile: MobileSidebar (overlay) + MobileEmailViewer + MobileBottomNav

@example
```svelte
<ResponsiveLayout />
```
-->
<script lang="ts">
	import { onMount } from 'svelte'
	import { browser } from '$app/environment'
	import { goto } from '$app/navigation'
	import { base } from '$app/paths'
	import { createResponsiveState } from '$lib/utils/responsive.svelte'
	import { createViewMode } from '$lib/utils/view-mode.svelte'
	import { deriveViewMode, deriveItemId } from '$lib/utils/derive-view-mode'
	import { createHighlightManager } from '$lib/highlight.svelte'
	import { createEmailViewerState } from './email-viewer.svelte.js'
	import { emailStore, type ViewMode as EmailViewMode } from '$lib/email-store'
	import { registerShortcuts } from '$lib/utils/keyboard-shortcuts'
	import emailData from 'virtual:email-list'

	// Desktop components
	import Sidebar from './Sidebar.svelte'
	import EmailViewer from './EmailViewer.svelte'

	// Mobile components
	import MobileSidebar from './mobile/MobileSidebar.svelte'
	import MobileBottomNav from './mobile/MobileBottomNav.svelte'
	import MobileEmailPreview from './mobile/MobileEmailPreview.svelte'
	import CodeView from './CodeView.svelte'
	import LoadingBar from './LoadingBar.svelte'

	// Responsive state
	const responsive = createResponsiveState()

	// Derive view mode and item ID from URL
	const emailMode: EmailViewMode = $derived.by(() => deriveViewMode())
	const itemId = $derived.by(() => deriveItemId())

	// Check if we need to redirect to first item
	const needsRedirect = $derived(!itemId && (
		(emailMode === 'emails' && emailData.emails.length > 0) ||
		(emailMode === 'examples' && emailStore.examples.length > 0) ||
		(emailMode === 'documentation' && emailStore.documentation.length > 0)
	))

	// Check for empty state (no items available)
	const isEmpty = $derived(!itemId && emailMode === 'emails' && emailData.emails.length === 0)

	// View mode for tabs
	const viewMode = createViewMode()

	// Mobile sidebar state
	let showMobileSidebar = $state(false)

	// Shared email viewer state (used by mobile layout)
	const viewer = createEmailViewerState(
		() => emailMode,
		() => itemId
	)

	// Highlighter for code views
	const highlighter = createHighlightManager()

	// Trigger highlighting when data changes (mobile)
	$effect(() => {
		if (!responsive.isMobile) return
		if (!viewer.email || !viewer.source) return
		highlighter.highlight(viewer.email.id, viewer.source, viewer.formattedHtml, viewer.rendered?.text ?? null)
	})

	// Loading states for mobile bottom nav
	const isLoading = $derived({
		preview: (viewer.isLoading || viewer.isRerendering) && viewMode.value === 'preview',
		source: highlighter.loading.source,
		html: highlighter.loading.html,
		raw: false, // Raw doesn't have syntax highlighting
		text: highlighter.loading.text
	})

	// Loading messages
	const loadingMessage = $derived(
		emailMode === 'emails' ? 'Rendering email...'
			: emailMode === 'examples' ? 'Rendering example...'
			: 'Rendering documentation...'
	)

	// Handle redirect for index pages (no itemId selected)
	$effect(() => {
		if (!browser) return
		if (!needsRedirect) return

		if (emailMode === 'emails' && emailData.emails.length > 0) {
			goto(`${base}/${emailData.emails[0].id}`, { replaceState: true })
		} else if (emailMode === 'examples' && emailStore.examples.length > 0) {
			goto(`${base}/examples/${emailStore.examples[0].id}`, { replaceState: true })
		} else if (emailMode === 'documentation' && emailStore.documentation.length > 0) {
			goto(`${base}/documentation/${emailStore.documentation[0].id}`, { replaceState: true })
		}
	})

	onMount(() => {
		// Setup content change listener for live reload (mobile)
		const unsubscribeViewer = viewer.setupContentChangeListener()

		// Register keyboard shortcuts for tabs (mobile doesn't use tooltips but still supports shortcuts)
		const unsubscribeShortcuts = registerShortcuts({
			setTab1: () => viewMode.set('preview'),
			setTab2: () => viewMode.set('source'),
			setTab3: () => viewMode.set('html'),
			setTab4: () => viewMode.set('text')
		})

		return () => {
			unsubscribeViewer()
			unsubscribeShortcuts()
		}
	})
</script>

{#if responsive.isMobile}
	<!-- Mobile Layout -->
	<div class="mobile-layout">
		<!-- Main content area -->
		<main class="mobile-main">
			{#if isEmpty}
				<div class="welcome">
					<h1>svelte-emails</h1>
					<p>No email templates found.</p>
					<p class="hint">Create a file ending with <code>.email.svelte</code> to get started.</p>
				</div>
			{:else if !itemId}
				<div class="loading-panel">
					<p>Loading...</p>
				</div>
			{:else}
				<LoadingBar visible={viewer.isLoading || viewer.isRerendering} />

				<div class="mobile-content">
					{#if viewer.isLoading}
						<div class="loading-panel">
							<p>{loadingMessage}</p>
						</div>
					{:else if viewer.renderError}
						<div class="error-panel">
							<h3>⚠️ Render Error</h3>
							<pre>{viewer.renderError}</pre>
						</div>
					{:else if viewMode.value === 'preview'}
						{#if viewer.rendered}
							<MobileEmailPreview html={viewer.rendered.html} emailId={itemId} mode={emailMode} />
						{/if}
					{:else if viewMode.value === 'source'}
						<CodeView code={viewer.source ?? ''} highlightedHtml={highlighter.state.source} />
					{:else if viewMode.value === 'html' || viewMode.value === 'raw'}
						{#if viewer.rendered}
							<CodeView
								code={viewMode.isRaw ? viewer.rendered.html : (viewer.formattedHtml ?? viewer.rendered.html)}
								rawCode={viewer.rendered.html}
								highlightedHtml={viewMode.isRaw ? null : highlighter.state.html}
							/>
						{/if}
					{:else if viewMode.value === 'text'}
						{#if viewer.rendered}
							<CodeView code={viewer.rendered.text} highlightedHtml={highlighter.state.text} />
						{/if}
					{/if}
				</div>
			{/if}
		</main>

		<!-- Bottom navigation (hide if empty) -->
		{#if !isEmpty && itemId}
			<MobileBottomNav
				emailName={viewer.email?.name ?? itemId ?? 'Loading...'}
				previewText={viewer.email?.previewText ?? ''}
				currentTab={viewMode.value}
				onmenuclick={() => showMobileSidebar = !showMobileSidebar}
				ontabselect={(tab) => viewMode.set(tab)}
				{isLoading}
			/>
		{/if}

		<!-- Sidebar overlay -->
		<MobileSidebar bind:open={showMobileSidebar} />
	</div>
{:else}
	<!-- Desktop Layout -->
	<div class="desktop-layout">
		<Sidebar />
		<main class="desktop-main">
			{#if isEmpty}
				<div class="welcome">
					<h1>svelte-emails</h1>
					<p>No email templates found.</p>
					<p class="hint">Create a file ending with <code>.email.svelte</code> to get started.</p>
				</div>
			{:else if itemId}
				<EmailViewer mode={emailMode} {itemId} />
			{:else}
				<div class="empty-view">
					<p>
						{#if emailMode === 'emails'}
							Loading...
						{:else if emailMode === 'examples'}
							Select an example from the sidebar
						{:else}
							Select a documentation page from the sidebar
						{/if}
					</p>
				</div>
			{/if}
		</main>
	</div>
{/if}

<style>
	/* Mobile Layout */
	.mobile-layout {
		display: flex;
		flex-direction: column;
		height: 100vh;
		width: 100vw;
		overflow: hidden;
	}

	.mobile-main {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		/* Account for bottom nav */
		padding-bottom: 64px;
		background: var(--nav-top-bg);
	}

	.mobile-content {
		flex: 1;
		overflow: hidden;
	}

	/* Desktop Layout */
	.desktop-layout {
		display: flex;
		height: 100vh;
		width: 100vw;
		overflow: hidden;
	}

	.desktop-main {
		flex: 1;
		background: var(--nav-top-bg);
		border-left: 1px solid var(--nav-top-border-left);
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	/* Shared styles */
	.error-panel {
		padding: 24px;
		background: #fef2f2;
		color: #991b1b;
	}

	.error-panel h3 {
		margin-bottom: 12px;
	}

	.error-panel pre {
		background: #fee2e2;
		padding: 16px;
		border-radius: 8px;
		overflow: auto;
		font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
		font-size: 13px;
	}

	.loading-panel {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		gap: 16px;
		color: rgba(255, 255, 255, 0.6);
	}

	.welcome {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		text-align: center;
		padding: 24px;
		color: rgba(255, 255, 255, 0.6);
	}

	.welcome h1 {
		font-size: 32px;
		margin-bottom: 16px;
		color: rgba(255, 255, 255, 0.9);
	}

	.welcome p {
		margin-bottom: 8px;
	}

	.welcome .hint {
		font-size: 14px;
		color: rgba(255, 255, 255, 0.4);
	}

	.welcome code {
		background: rgba(255, 255, 255, 0.1);
		padding: 2px 6px;
		border-radius: 4px;
		font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
	}

	.empty-view {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: rgba(255, 255, 255, 0.5);
		font-size: 14px;
	}
</style>
