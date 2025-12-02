<!--
	Internal wrapper component for server-side rendering.
	Sets up the IR tree collector context and renders the user's email component.
	This is used by the render() function to programmatically instantiate components.
-->
<script lang='ts' module>
	import type { Component } from 'svelte'
	import type { Collector } from './context'

	/**
	 * Props for the RenderWrapper component.
	 */
	export interface RenderWrapperProps {
		/** The email component to render */
		component: Component<Record<string, unknown>>
		/** Props to pass to the email component */
		componentProps: Record<string, unknown>
		/** Collector to receive the IR tree */
		collector: Collector
	}
</script>

<script lang='ts'>
	import { setEmailRoot } from './context'

	const { component: EmailComponent, componentProps, collector }: RenderWrapperProps = $props()

	// Set up the collector context so Email component can register itself
	setEmailRoot(collector)
</script>

<!-- Render the user's email component with its props -->
<EmailComponent {...componentProps} />
