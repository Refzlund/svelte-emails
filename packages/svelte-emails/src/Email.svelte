<!-- @component
Root email component.

This is the top-level wrapper for all email content. It sets up the
IR tree collector context and registers itself as the root node.

Must be used inside `<Email.Preview>` or `render()` to provide the collector.

## Background Colors

The Email component supports two background layers:
- `body-bg-[#hex]` — Full-width body/wrapper background (defaults to white)
- `bg-[#hex]` — Content container background (the centered area, default 600px)

## Content Width

Use `max-w-*` to customize the content container width:
- `max-w-[700px]` — Arbitrary pixel value
- `max-w-xl`, `max-w-2xl`, etc. — Preset values

@example
```svelte
<Email
	body-bg-[#f5f5f5]
	bg-[#ffffff]
	max-w-[700px]
	preview='Check out our latest updates...'
>
	<Div cols>
		<Div>Content here</Div>
	</Div>
</Email>
```

@see ARCHITECTURE.md for the component registration flow
-->
<script lang='ts'>
	import type { Snippet } from 'svelte'
	import type { EmailAttributes } from './style-attributes'
	import { getEmailRoot, getSSRCollector, setEmailParent, type Mail, type Collector } from './context'

	interface Props extends EmailAttributes {
		/** Preview text shown in email client inbox (before opening) */
		preview?: string
		/** Email content */
		children?: Snippet
	}

	const { preview = '', children, ...attrs }: Props = $props()

	// Get the collector from parent (Email.Preview or render())
	// Try Svelte context first, fall back to SSR collector
	let collector: Collector | null = null
	try {
		collector = getEmailRoot()
	} catch {
		// Context not available (SSR), use module-level fallback
		collector = getSSRCollector()
	}
	
	if (!collector) {
		throw new Error(
			'<Email> must be used inside <Email.Render> or render(). ' +
			'No collector context found.'
		)
	}

	// Extract body-bg-[#...] from attrs
	const attrKeys = Object.keys(attrs)
	let bodyBackground: string | undefined
	let maxWidth: number | undefined
	const filteredAttrs: string[] = []

	for (const attr of attrKeys) {
		// Extract body-bg-[#hex]
		const bodyBgMatch = attr.match(/^body-bg-\[(#[0-9a-fA-F]{3,8})\]$/)
		if (bodyBgMatch) {
			bodyBackground = bodyBgMatch[1]
			continue
		}

		// Extract max-w-[value] or max-w-{preset}
		const maxWArbitraryMatch = attr.match(/^max-w-\[(\d+)(?:px)?\]$/)
		if (maxWArbitraryMatch) {
			maxWidth = parseInt(maxWArbitraryMatch[1])
			continue
		}

		// Extract max-w-{preset}
		const presetWidths: Record<string, number> = {
			'max-w-xs': 320,
			'max-w-sm': 384,
			'max-w-md': 448,
			'max-w-lg': 512,
			'max-w-xl': 576,
			'max-w-2xl': 672,
			'max-w-3xl': 768,
			'max-w-4xl': 896,
			'max-w-5xl': 1024,
			'max-w-6xl': 1152,
			'max-w-7xl': 1280
		}
		if (attr in presetWidths) {
			maxWidth = presetWidths[attr]
			continue
		}

		// Keep all other attrs (including bg-[#...] for content background)
		filteredAttrs.push(attr)
	}

	// Create this node
	const node: Mail.EmailNode = $state({
		type: 'email',
		preview,
		bodyBackground,
		maxWidth,
		attrs: filteredAttrs,
		children: []
	})

	// Register with collector
	collector.registerRoot(node)

	// Set this node as parent for children
	setEmailParent(node)
</script>

{@render children?.()}