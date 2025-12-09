<!-- @component
Line break component.

Renders as a `<br>` element for forcing line breaks within text.

@example
```svelte
<Text content='Line 1' />
<Br />
<Text content='Line 2' />
```

Note: For line breaks within text content, use `\n` in the content string instead.
-->
<script lang='ts'>
	import { untrack } from 'svelte'
	import { getEmailParent, getEmailRoot, addChild, removeChild, generateMarkerId, type Mail } from '../context'

	const parent = getEmailParent()
	const collector = getEmailRoot()
	const markerId = generateMarkerId()

	const node: Mail.BrNode = $state({
		type: 'br',
		attrs: []
	})

	// Synchronous registration for SSR (effects don't run during SSR)
	addChild(parent, node, markerId, collector)

	// Effect handles client-side lifecycle (see Text.svelte for explanation)
	$effect(() => {
		untrack(() => addChild(parent, node, markerId, collector))
		return () => untrack(() => removeChild(parent, markerId, collector))
	})
</script>

<svelte-email-marker id={markerId}></svelte-email-marker>
