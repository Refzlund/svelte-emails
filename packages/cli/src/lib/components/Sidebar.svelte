<!-- @component
	Navigation sidebar for the email viewer (desktop).
	
	Displays a list of emails/examples/documentation with folder grouping,
	and mode switching buttons.

@example
```svelte
<Sidebar />
```
-->
<script lang="ts">
	import SidebarContent from './shared/SidebarContent.svelte'
</script>

<aside class="sidebar">
	<SidebarContent showShortcuts={true} />
</aside>

<style>
	.sidebar {
		width: 320px;
		min-width: 320px;
		background: var(--nav-bg);
		display: flex;
		flex-direction: column;
	}
</style>
