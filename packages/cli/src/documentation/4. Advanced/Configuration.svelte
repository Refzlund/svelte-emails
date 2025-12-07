<script lang="ts">
	/**
	 * Configuration & Theming
	 * 
	 * Customizing the look and feel with presets and themes.
	 */
	import {
		Email,
		Div,
		Text,
		Button,
		Divider,
		Table
	} from 'svelte-emails'
	import { colors, style } from '../theme'
	import { footer } from '../Shared/Footer.svelte'
	import { callout } from '../Shared/Callout.svelte'

	const presetCode = `<script>
  import { Email, presets, merge } from 'svelte-emails'
  
  const myStyle = merge(presets.base, {
    Button: {
      background: '#10b981',
      borderRadius: '8px'
    }
  })
` + '<' + `/script>

<Email style={myStyle}>...</Email>`

	const configurableComponents = `- \`root\` (size, color, background, lineHeight, fontFamily, monoFontFamily)
- \`Text\` (H1-H6, Paragraph, Small, Span)
- \`Button\` (color, background, padding, borderRadius, fontWeight, border)
- \`Link\` (color, textDecoration)
- \`Code\`, \`Codeblock\` (color, background, padding, border, fontFamily, theme)
- \`Divider\` (color, thickness, style)
- \`Table\` (borderColor, headerBackground, stripedBackground, cellPadding)
- \`Highlight\` (color, background)
- \`Unsubscribe\` (color, size)`

	const rootSizeExample = `const myStyle = merge(presets.base, {
  root: {
    size: 18,  // Base font size in px
    color: '#1f2937',
    background: '#ffffff',
    lineHeight: 1.6,
    fontFamily: 'Arial, sans-serif'
  }
})`

	const fullStyleConfigExample = `import type { StyleConfig } from 'svelte-emails'
import { merge, presets } from 'svelte-emails'

const myTheme: StyleConfig = merge(presets.base, {
  // Root-level styles (base values for all components)
  root: {
    size: 16,                              // Base font size for rem→px conversion
    color: '#1f2937',                      // Default text color
    background: '#ffffff',                 // Default background
    lineHeight: 1.5,                       // Default line height
    fontFamily: 'Arial, Helvetica, sans-serif',
    monoFontFamily: 'Consolas, Monaco, monospace'
  },

  // Text component styles
  Text: {
    color: 'inherit',
    H1: {
      size: '2rem',
      weight: 700,
      lineHeight: 1.2,
      color: '#111827',
      padding: '0 0 8px 0'
    },
    H2: { size: '1.5rem', weight: 600, lineHeight: 1.3 },
    H3: { size: '1.25rem', weight: 600, lineHeight: 1.4 },
    H4: { size: '1.125rem', weight: 600, lineHeight: 1.4 },
    H5: { size: '1rem', weight: 600, lineHeight: 1.5 },
    H6: { size: '0.875rem', weight: 600, lineHeight: 1.5 },
    Paragraph: {
      size: '1rem',
      lineHeight: 1.6,
      color: '#374151',
      padding: '0 0 16px 0'
    },
    Small: {
      size: '0.875rem',
      lineHeight: 1.5,
      color: '#6b7280',
      padding: '0'
    },
    Span: {
      size: '1rem',
      lineHeight: 1.5
    }
  },

  // Link styles
  Link: {
    color: '#2563eb',
    textDecoration: 'underline'
  },

  // Button styles
  Button: {
    color: '#ffffff',
    background: '#2563eb',
    padding: '12px 24px',
    borderRadius: '6px',
    fontWeight: 600,
    border: 'none'
  },

  // Spacer default size
  Spacer: {
    size: '24px'
  },

  // Divider styles
  Divider: {
    color: '#e5e7eb',
    thickness: '1px',
    style: 'solid'
  },

  // Inline code styles
  Code: {
    color: '#1f2937',
    background: '#f3f4f6',
    padding: '2px 6px',
    fontFamily: 'Consolas, Monaco, monospace',
    size: '0.875em',
    border: {
      color: '#e5e7eb',
      width: '1px',
      style: 'solid',
      radius: '4px'
    },
    theme: 'github-light'   // Shiki theme for syntax highlighting
  },

  // Code block styles
  Codeblock: {
    color: '#1f2937',
    background: '#f9fafb',
    padding: '16px',
    fontFamily: 'Consolas, Monaco, monospace',
    size: '0.875rem',
    lineHeight: 1.5,
    border: {
      color: '#e5e7eb',
      width: '1px',
      style: 'solid',
      radius: '8px'
    },
    theme: 'github-light'
  },

  // Text highlight styles
  Highlight: {
    color: '#1f2937',
    background: '#fef08a'
  },

  // Unsubscribe link styles
  Unsubscribe: {
    color: '#9ca3af',
    size: '12px'
  },

  // Table styles
  Table: {
    borderColor: '#e5e7eb',
    borderWidth: '1px',
    headerBackground: '#f9fafb',
    headerColor: '#111827',
    headerWeight: 600,
    stripedBackground: '#f9fafb',
    cellPadding: '12px 16px',
    compactCellPadding: '8px 12px'
  }
})`

</script>

<Email
	order=2
	category='4. Advanced'
	preview="Configuration and theming guide"
	body-bg={colors.background}
	bg={colors.white}
	max-w-[700px]
>
	<!-- Header -->
	<Div rows gap-2 p-8 bg={colors.primary}>
		<Text.H1 content="🎨 Configuration" text={colors.white} text-3xl font-bold />
		<Text content="Global theming and style presets." text={colors.white} text-opacity-90 text-lg />
	</Div>

	<!-- Presets -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Style Presets" text={colors.text} />
		<Text.Paragraph content="We provide several built-in presets to get you started quickly." text={colors.textMuted} />
		
		<Table cols="30% 70%" border>
			<Table.Row header bg={colors.background}>
				<Text content="Preset" font-bold />
				<Text content="Description" font-bold />
			</Table.Row>
			<Table.Row>
				<Text.Code content="presets.base" />
				<Text content="Clean, neutral defaults (default)" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="presets.dark" />
				<Text content="Dark mode styling" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="presets.sansSerif" />
				<Text content="Sans-serif typography (default fonts)" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="presets.serif" />
				<Text content="Serif typography (Georgia, etc.)" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="presets.monospace" />
				<Text content="Monospace typography" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="presets.rounded" />
				<Text content="Rounded, friendly font stack" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="presets.humanist" />
				<Text content="Humanist sans-serif fonts" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="presets.geometric" />
				<Text content="Geometric sans-serif fonts" />
			</Table.Row>
		</Table>
	</Div>

	<Divider border={colors.border} />

	<!-- Custom Theming -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Custom Theming" text={colors.text} />
		<Text.Paragraph content="You can override any component style globally using the `style` prop on `<Email>`. Use the `merge` helper to extend a preset." text={colors.textMuted} />
		<Text.Codeblock content={presetCode} highlight="svelte" />
		<Text.Small content="**Configurable Components:**" text={colors.text} font-bold />
		<Text content={configurableComponents} text={colors.textMuted} />
	</Div>

	<Divider border={colors.border} />

	<!-- Root Configuration -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Root Configuration" text={colors.text} />
		<Text.Paragraph content="The `root` object controls base values that affect the entire email:" text={colors.textMuted} />
		
		<Text.Codeblock content={rootSizeExample} highlight="typescript" />
		
		<Table cols="30% 70%" border>
			<Table.Row header bg={colors.background}>
				<Text content="Property" font-bold />
				<Text content="Effect" font-bold />
			</Table.Row>
			<Table.Row>
				<Text.Code content="size" />
				<Text content="Base font size for rem→px conversion (default: 16). Affects all spacing utilities." />
			</Table.Row>
			<Table.Row>
				<Text.Code content="color" />
				<Text content="Default text color inherited by all components" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="background" />
				<Text content="Default background color (used for opacity blending)" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="lineHeight" />
				<Text content="Default line height for text elements" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="fontFamily" />
				<Text content="Default font stack (used by `font-base` to reset from `font-mono`)" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="monoFontFamily" />
				<Text content="Monospace font stack (used by `font-mono`)" />
			</Table.Row>
		</Table>
		
		{@render callout('tip', 'All `gap-*`, `p-*`, `m-*`, `text-*`, `rounded-*` and other size utilities use rem values internally. Setting `root.size: 18` makes `p-4` equal 18px (1rem × 18) instead of 16px.')}
	</Div>

	<Divider border={colors.border} />

	<!-- Full StyleConfig Example -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Full StyleConfig Example" text={colors.text} />
		<Text.Paragraph content="Import the `StyleConfig` type for full TypeScript support. Here's a complete example showing all configurable properties:" text={colors.textMuted} />
		
		<Text.Codeblock content={fullStyleConfigExample} highlight="typescript" />
		
		{@render callout('tip', 'Use the `merge()` helper to extend a preset. This deep-merges your overrides while preserving default values you don\'t specify.')}
	</Div>

	{@render footer()}
</Email>
