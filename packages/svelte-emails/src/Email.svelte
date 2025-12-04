<!-- @component
Root email component.

This is the top-level wrapper for all email content. It sets up the
IR tree collector context and registers itself as the root node.

## Usage

For SSR rendering via `render()`, the collector is set automatically at module level.
For client-side preview, use inside `<Email.Render>` which provides the collector via context.

## Background Colors

The Email component supports two background layers:
- `body-bg-[#hex]` — Full-width body/wrapper background (defaults to white)
- `bg-[#hex]` — Content container background (the centered area, default 600px)

## Content Width

Use `max-w-*` to customize the content container width:
- `max-w-[700px]` — Arbitrary pixel value
- `max-w-xl`, `max-w-2xl`, etc. — Preset values

## Responsive Breakpoint

The default mobile breakpoint is 480px. Use `mobile-threshold` to customize:
- `mobile-threshold-[425px]` — Tighter mobile breakpoint
- `mobile-threshold-[600px]` — Looser breakpoint (stacks earlier)

This affects `responsive` columns, `mobile-only`, and `desktop-only` elements.

@example
```svelte
<Email
	body-bg-[#f5f5f5]
	bg-[#ffffff]
	max-w-[700px]
	mobile-threshold-[425px]
	preview='Check out our latest updates...'
>
	<Div cols responsive>
		<Div>Stacks at 425px instead of 480px</Div>
	</Div>
</Email>
```

@see ARCHITECTURE.md for the component registration flow
-->
<script lang='ts'>
	import type { Snippet } from 'svelte'
	import type { EmailAttributes } from './style-attributes'
	import { setEmailParent, normalizeAttrs, type Mail, type Collector, EMAIL_ROOT_CONTEXT_KEY } from './context'
	import { getContext } from 'svelte'

	export interface Props extends EmailAttributes {
		/** Preview text shown in email client inbox (before opening) */
		preview?: string
		/** Email content */
		children?: Snippet
	}

	const { preview = '', children, ...attrs }: Props = $props()

	// Get collector from Svelte context
	// In SSR: render() passes collector via context Map
	// In client: Email.Render provides collector via setContext()
	// Both use the same Symbol.for() key which guarantees cross-module identity
	const collector = getContext<Collector>(EMAIL_ROOT_CONTEXT_KEY)
	
	if (!collector) {
		throw new Error(
			'<Email> must be used inside <Email.Render> or render(). ' +
			'No collector context found.'
		)
	}

	// normalizeAttrs converts value-attributes (body-bg="#f5f5f5") to bracket syntax (body-bg-[#f5f5f5])
	const attrKeys = normalizeAttrs(attrs)
	let bodyBackground: string | undefined
	let maxWidth: number | undefined
	let mobileBreakpoint: number | undefined
	const filteredAttrs: string[] = []

	for (const attr of attrKeys) {
		// Extract body-bg-[#hex]
		const bodyBgMatch = attr.match(/^body-bg-\[(#[0-9a-fA-F]{3,8})\]$/)
		if (bodyBgMatch) {
			bodyBackground = bodyBgMatch[1]
			continue
		}

		// Extract mobile-threshold-[value] for responsive breakpoint
		const mobileThresholdMatch = attr.match(/^mobile-threshold-\[(\d+)(?:px)?\]$/)
		if (mobileThresholdMatch) {
			mobileBreakpoint = parseInt(mobileThresholdMatch[1])
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

	const node: Mail.EmailNode = $state({
		type: 'email',
		attrs: filteredAttrs,
		children: [],
		get preview() { return preview },
		get bodyBackground() { return bodyBackground },
		get maxWidth() { return maxWidth },
		get mobileBreakpoint() { return mobileBreakpoint }
	})
	
	// Register with collector
	collector.registerRoot(node)

	// Set this node as parent for children
	setEmailParent(node)
</script>

{@render children?.()}