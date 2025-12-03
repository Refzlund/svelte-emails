<!-- @component
Image component for displaying images in emails.

Best practices for email images:
- Always include explicit `width` and `height` attributes
- Always include meaningful `alt` text (images may be blocked)
- Use absolute HTTPS URLs for the `src`
- Prefer PNG, JPEG, or GIF formats (SVG has ~40% support inline)
- For SVG, use `<Img src="file.svg">` instead of inline SVG

@example
```svelte
	<Img
		src='https://example.com/logo.png'
		alt='Company Logo'
		w-[200px]
		h-[50px]
	/>
```

@see EMAIL_CLIENT_SUPPORT.md for image format support details
-->
<script lang='ts'>
	import { onDestroy } from 'svelte'
	import type { ImgAttributes } from '../style-attributes'
	import { getEmailParent, addChild, normalizeAttrs, type Mail } from '../context'

	interface Props extends ImgAttributes {
		/** Image source URL (use absolute HTTPS URLs) */
		src: string
		/** Alternative text (required for accessibility and when images are blocked) */
		alt: string
		/** Image width (recommended for consistent rendering) */
		width?: number | string
		/** Image height (recommended for consistent rendering) */
		height?: number | string
		/** Optional link URL - makes the image clickable (opens in new tab) */
		href?: string
	}

	const { src, alt, width, height, href, ...attrs }: Props = $props()

	const parent = getEmailParent()

	const node: Mail.ImgNode = $state({
		type: 'img',
		attrs: normalizeAttrs(attrs),
		get src() { return src },
		get alt() { return alt },
		get width() { return width },
		get height() { return height },
		get href() { return href }
	})

	onDestroy(addChild(parent, node))
</script>