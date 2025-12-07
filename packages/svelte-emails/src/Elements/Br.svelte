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
	import { onDestroy } from 'svelte'
	import { getEmailParent, addChild, generateMarkerId, type Mail } from '../context'

	const parent = getEmailParent()
	const markerId = generateMarkerId()

	const node: Mail.BrNode = $state({
		type: 'br',
		attrs: []
	})

	onDestroy(addChild(parent, node, markerId))
</script>

<svelte-email-marker id={markerId}></svelte-email-marker>
