<script lang="ts">
	/**
	 * Best Practices Documentation
	 * 
	 * Comprehensive guide covering:
	 * - Snippets for reusable markup
	 * - Responsive column layouts
	 * - Markdown vs styling attributes
	 * - Variable interpolation
	 * - Style importing and merging
	 * - Block vs inline text
	 * - Opacity and margin emulation
	 * - Outlook-specific limitations
	 * - Image best practices
	 * - Props vs placeholders
	 * - Equal-height columns
	 * - href types (mailto:, tel:, URLs)
	 * - Email client compatibility matrix
	 */
	import {
		Email,
		Div,
		Text,
		Button,
		Link,
		Spacer,
		Divider,
		Table,
		Img
	} from 'svelte-emails'

	// Documentation theme colors
	const colors = {
		primary: '#10b981',
		primaryDark: '#059669',
		text: '#111827',
		textMuted: '#4b5563',
		background: '#f3f4f6',
		white: '#ffffff',
		border: '#d1d5db',
		code: '#1f2937',
		codeBg: '#f9fafb',
		warning: '#f59e0b',
		warningBg: '#fffbeb',
		danger: '#ef4444',
		dangerBg: '#fef2f2',
		success: '#10b981',
		successBg: '#ecfdf5'
	}

	// Code examples
	const snippetExample = `{#snippet articleCard(article)}
  <Div bg={colors.white} p-4 h-full>
    <Text.H5 content="**{article.title}**" />
    <Text.Small content={article.description} />
  </Div>
{/snippet}

<Div cols responsive gap-4>
  {@render articleCard(articles[0])}
  {@render articleCard(articles[1])}
</Div>`

	const moduleSnippetExample = `<script lang="ts" module>
  // Export snippets for use in other components
  export { myIcon, socialLink }
<\/script>

{#snippet myIcon(opts = {})}
  <Img src="icon.png" width={opts.size ?? 16} height={opts.size ?? 16} />
{/snippet}

{#snippet socialLink(href, label)}
  <Link {href} text={colors.primary}>{label}</Link>
{/snippet}`

	const responsiveColsExample = `// Basic responsive columns
<Div cols responsive gap-4>
  <Div><Text content="Column 1" /></Div>
  <Div><Text content="Column 2" /></Div>
</Div>

// Custom column widths
<Div cols="30% 70%" responsive gap-4>
  <Div><Text content="Sidebar" /></Div>
  <Div><Text content="Main Content" /></Div>
</Div>`

	const markdownVsStylingExample = `// Markdown in content prop - for inline formatting
<Text content="**Bold**, *italic*, and [links](url)" />

// Style attributes - for colors, spacing, sizing
<Text 
  content="Hello" 
  text={colors.primary} 
  text-xl 
  font-bold 
/>`

	const variablesExample = `// Props - compile-time, Svelte expressions
<Text content="Hello, {userName}!" />

// Placeholders - runtime substitution
<Text content="Dear [[recipient_name]]," />

// Usage: render(Email, { placeholders: { recipient_name: 'John' } })`

	const styleImportExample = `// In your email component
import { merge, presets } from 'svelte-emails'
const { base, sansSerif } = presets

<Email
  style={merge(base, sansSerif, {
    root: { 
      textColor: '#333',
      backgroundColor: '#fff'
    }
  })}
>
  ...
</Email>`

	const blockVsInlineExample = `// Block elements - rendered as table cells
<Text.Paragraph content="Full-width paragraph" />
<Text.H1 content="Heading" />

// Inline elements - rendered as spans
<Text content="inline text" />
<Link href="url" content="link" />

// Mix inline within block
<Text.Paragraph content='Visit [our site](url) today!' />
`

	const hFullExample = `// h-full makes columns equal height
<Div cols responsive gap-4>
  <Div bg={colors.white} p-4 h-full>
    <Text content="Short content" />
  </Div>
  <Div bg={colors.white} p-4 h-full>
    <Text content="Much longer content that spans multiple lines..." />
  </Div>
</Div>`

	const hrefTypesExample = `// Web URLs
<Link href="https://example.com" content="Visit site" />
<Button href="https://example.com" content="Click here" />

// Email links
<Link href="mailto:support@example.com" content="Email us" />
<Link href="mailto:hi@x.com?subject=Hello" content="Send email" />

// Phone links
<Link href="tel:+1234567890" content="Call us" />

// Images can also be links
<Img href="https://example.com" src="..." width={100} height={100} />`

	// CSS Support matrix data
	const cssSupport = [
		{ property: 'padding', outlook: '✅', gmail: '✅', apple: '✅', yahoo: '✅', note: 'Universal support' },
		{ property: 'margin', outlook: '☑️', gmail: '☑️', apple: '☑️', yahoo: '☑️', note: '**Emulated** via wrapper tables' },
		{ property: 'opacity', outlook: '☑️', gmail: '☑️', apple: '☑️', yahoo: '☑️', note: '**Emulated** via color blending' },
		{ property: 'border-radius', outlook: '❌', gmail: '✅', apple: '✅', yahoo: '✅', note: 'Outlook shows square corners' },
		{ property: 'box-shadow', outlook: '❌', gmail: '❌', apple: '✅', yahoo: '❌', note: 'Design without shadows' },
		{ property: 'flex/grid', outlook: '☑️', gmail: '☑️', apple: '☑️', yahoo: '☑️', note: '**Emulated** via tables' },
		{ property: 'media queries', outlook: '❌', gmail: '⚠️', apple: '✅', yahoo: '✅', note: 'Progressive enhancement only' },
		{ property: 'max-width', outlook: '❌', gmail: '✅', apple: '✅', yahoo: '✅', note: 'Use fixed width for Outlook' },
		{ property: 'background-image', outlook: '⚠️', gmail: '⚠️', apple: '✅', yahoo: '✅', note: 'VML needed for Outlook' },
		{ property: 'web fonts', outlook: '❌', gmail: '❌', apple: '✅', yahoo: '❌', note: 'Use fallback font stacks' }
	]
</script>

<Email
	category='1. Getting Started'
	preview="Best Practices for building emails with svelte-emails"
	body-bg={colors.background}
	bg={colors.white}
	max-w-[700px]
	style={{
		Codeblock: {
			background: '#1f2937',
			color: '#f9fafb',
			padding: '12px',
			fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
			size: '0.875rem',
			border: {
				radius: '6px'
			},
			theme: 'github-dark'
		}
	}}
>
	<!-- Header -->
	<Div p-6 bg={colors.primary}>
		<Text.H1 content="✨ Best Practices" text={colors.white} text-2xl font-bold />
		<Spacer h-2 />
		<Text content="Patterns and techniques for building reliable emails" text={colors.white} text-opacity-80 />
	</Div>

	<!-- Table of Contents -->
	<Div p-6 bg={colors.codeBg} border-b={colors.border} border-1>
		<Text.H4 content="**Contents**" text={colors.text} />
		<Spacer h-3 />
		<Text.Paragraph content="1. Svelte Snippets" text={colors.primary} />
		<Text.Paragraph content="2. Responsive Columns" text={colors.primary} />
		<Text.Paragraph content="3. Markdown vs Style Attributes" text={colors.primary} />
		<Text.Paragraph content="4. Variables & Placeholders" text={colors.primary} />
		<Text.Paragraph content="5. Style Presets & Merging" text={colors.primary} />
		<Text.Paragraph content="6. Block vs Inline Elements" text={colors.primary} />
		<Text.Paragraph content="7. Opacity & Margin Emulation" text={colors.primary} />
		<Text.Paragraph content="8. Outlook Limitations" text={colors.primary} />
		<Text.Paragraph content="9. Images" text={colors.primary} />
		<Text.Paragraph content="10. Equal-Height Columns" text={colors.primary} />
		<Text.Paragraph content="11. Link Types" text={colors.primary} />
		<Text.Paragraph content="12. Compatibility Matrix" text={colors.primary} />
	</Div>

	<!-- 1. Svelte Snippets -->
	<Div p-6>
		<Text.H2 content="1. Svelte Snippets" text={colors.text} />
		<Spacer h-3 />
		<Text.Paragraph 
			content="Use Svelte 5 **snippets** to create reusable markup patterns within your email. This keeps code DRY and makes templates easier to maintain."
			text={colors.textMuted}
			leading-relaxed
		/>
		<Spacer h-4 />
		<Text.Codeblock highlight='svelte' content={snippetExample} />
		<Spacer h-4 />
		<Text.Paragraph 
			content="You can also **export snippets** from a module script to share them across components:"
			text={colors.textMuted}
		/>
		<Spacer h-4 />
		<Text.Codeblock highlight='svelte' content={moduleSnippetExample} />
		<Spacer h-4 />
		<Div bg={colors.successBg} p-4 border-l={colors.success} border-4>
			<Text.Paragraph content="💡 **Tip:** Snippets are perfect for article cards, social links, repeated sections, and any pattern used multiple times in your email." text={colors.text} />
		</Div>
	</Div>

	<Divider border={colors.border} />

	<!-- 2. Responsive Columns -->
	<Div p-6>
		<Text.H2 content="2. Responsive Columns" text={colors.text} />
		<Spacer h-3 />
		<Text.Paragraph 
			content="The `cols` and `responsive` attributes work together to create layouts that stack on mobile devices."
			text={colors.textMuted}
			leading-relaxed
		/>
		<Spacer h-4 />
		<Text.Codeblock highlight='svelte' content={responsiveColsExample} />
		<Spacer h-4 />
		<Div bg={colors.warningBg} p-4 border-l={colors.warning} border-4>
			<Text.Paragraph content="⚠️ **Note:** The library renders columns as HTML tables for maximum compatibility. CSS flexbox/grid are NOT used." text={colors.text} />
		</Div>
	</Div>

	<Divider border={colors.border} />

	<!-- 3. Markdown vs Style Attributes -->
	<Div p-6>
		<Text.H2 content="3. Markdown vs Style Attributes" text={colors.text} />
		<Spacer h-3 />
		<Text.Paragraph 
			content="Understanding when to use markdown in `content` vs style attributes is key to clean templates."
			text={colors.textMuted}
			leading-relaxed
		/>
		<Spacer h-4 />

		<Table cols="50% 50%">
			<Table.Row header bg={colors.primary}>
				<Div><Text content="Markdown (content)" text={colors.white} font-bold /></Div>
				<Div><Text content="Style Attributes" text={colors.white} font-bold /></Div>
			</Table.Row>
			<Table.Row>
				<Div><Text content="**Bold**, *italic*" text={colors.textMuted} /></Div>
				<Div><Text content="font-bold, italic" text={colors.textMuted} /></Div>
			</Table.Row>
			<Table.Row>
				<Div><Text content="[links](url)" text={colors.textMuted} /></Div>
				<Div><Text content="Colors, spacing" text={colors.textMuted} /></Div>
			</Table.Row>
			<Table.Row>
				<Div><Text content="~~strikethrough~~" text={colors.textMuted} /></Div>
				<Div><Text content="Sizing (text-xl)" text={colors.textMuted} /></Div>
			</Table.Row>
			<Table.Row>
				<Div><Text content="Dynamic text" text={colors.textMuted} /></Div>
				<Div><Text content="Layout (p-4, m-2)" text={colors.textMuted} /></Div>
			</Table.Row>
		</Table>

		<Spacer h-4 />
		<Text.Codeblock highlight='svelte' content={markdownVsStylingExample} />
	</Div>

	<Divider border={colors.border} />

	<!-- 4. Variables & Placeholders -->
	<Div p-6>
		<Text.H2 content="4. Variables & Placeholders" text={colors.text} />
		<Spacer h-3 />
		<Text.Paragraph 
			content="There are two ways to inject dynamic content into emails:"
			text={colors.textMuted}
			leading-relaxed
		/>
		<Spacer h-4 />

		<Table cols="30% 70%">
			<Table.Row header bg={colors.primary}>
				<Div><Text content="Type" text={colors.white} font-bold /></Div>
				<Div><Text content="When to Use" text={colors.white} font-bold /></Div>
			</Table.Row>
			<Table.Row>
				<Div><Text content="**Props** {'{value}'}" text={colors.text} font-mono /></Div>
				<Div><Text content="Compile-time values known when rendering the email" text={colors.textMuted} /></Div>
			</Table.Row>
			<Table.Row>
				<Div><Text content="**Placeholders** [[name]]" text={colors.text} font-mono /></Div>
				<Div><Text content="Runtime substitution by email service (e.g., SendGrid, Mailchimp)" text={colors.textMuted} /></Div>
			</Table.Row>
		</Table>

		<Spacer h-4 />
		<Text.Codeblock highlight='svelte' content={variablesExample} />
	</Div>

	<Divider border={colors.border} />

	<!-- 5. Style Presets & Merging -->
	<Div p-6>
		<Text.H2 content="5. Style Presets & Merging" text={colors.text} />
		<Spacer h-3 />
		<Text.Paragraph 
			content="Use built-in presets and merge them with custom styles for consistent theming."
			text={colors.textMuted}
			leading-relaxed
		/>
		<Spacer h-4 />

		<Div bg={colors.codeBg} p-4 rounded-md border={colors.border}>
			<Text.H5 content="**Available Presets**" text={colors.text} />
			<Spacer h-2 />
			<Text.Paragraph content="• `base` — Default styles for all components" text={colors.textMuted} />
			<Text.Paragraph content="• `dark` — Dark mode colors" text={colors.textMuted} />
			<Text.Paragraph content="• `sansSerif` — System sans-serif fonts" text={colors.textMuted} />
			<Text.Paragraph content="• `serif` — System serif fonts" text={colors.textMuted} />
			<Text.Paragraph content="• `monospace` — Monospace font stack" text={colors.textMuted} />
		</Div>

		<Spacer h-4 />
		<Text.Codeblock highlight='svelte' content={styleImportExample} />
	</Div>

	<Divider border={colors.border} />

	<!-- 6. Block vs Inline Elements -->
	<Div p-6>
		<Text.H2 content="6. Block vs Inline Elements" text={colors.text} />
		<Spacer h-3 />
		<Text.Paragraph 
			content="Understanding the difference helps you structure content correctly."
			text={colors.textMuted}
			leading-relaxed
		/>
		<Spacer h-4 />

		<Table cols="40% 60%">
			<Table.Row header bg={colors.primary}>
				<Div><Text content="Block Elements" text={colors.white} font-bold /></Div>
				<Div><Text content="Inline Elements" text={colors.white} font-bold /></Div>
			</Table.Row>
			<Table.Row>
				<Div><Text content="Text.Paragraph, Text.H1-H6" text={colors.textMuted} /></Div>
				<Div><Text content="Text, Link" text={colors.textMuted} /></Div>
			</Table.Row>
			<Table.Row>
				<Div><Text content="Div, Button, Spacer" text={colors.textMuted} /></Div>
				<Div><Text content="Text (default)" text={colors.textMuted} /></Div>
			</Table.Row>
			<Table.Row>
				<Div><Text content="Full-width containers" text={colors.textMuted} /></Div>
				<Div><Text content="Flow within text" text={colors.textMuted} /></Div>
			</Table.Row>
		</Table>

		<Spacer h-4 />
		<Text.Codeblock highlight='svelte' content={blockVsInlineExample} />
	</Div>

	<Divider border={colors.border} />

	<!-- 7. Opacity & Margin Emulation -->
	<Div p-6>
		<Text.H2 content="7. Opacity & Margin Emulation" text={colors.text} />
		<Spacer h-3 />
		<Text.Paragraph 
			content="The library **emulates** unsupported CSS properties to provide consistent behavior across email clients."
			text={colors.textMuted}
			leading-relaxed
		/>
		<Spacer h-4 />

		<Div bg={colors.successBg} p-4 border-l={colors.success} border-4 mb-4>
			<Text.H5 content="✅ What the Library Handles" text={colors.text} />
			<Spacer h-2 />
			<Text.Paragraph content="• **Opacity** (`opacity-50`, `bg-[#000]/50`) → Blended to solid hex color at render time" text={colors.textMuted} />
			<Text.Paragraph content="• **Margins** (`m-4`, `mx-auto`) → Emulated via wrapper table padding (100% support)" text={colors.textMuted} />
		</Div>

		<Div bg={colors.dangerBg} p-4 border-l={colors.danger} border-4>
			<Text.H5 content="❌ What You Should Avoid" text={colors.text} />
			<Spacer h-2 />
			<Text.Paragraph content="• `box-shadow` — Not emulated, ~63% support" text={colors.textMuted} />
			<Text.Paragraph content="• `border-radius` in Outlook — Falls back to square" text={colors.textMuted} />
			<Text.Paragraph content="• `transform`, `filter`, `animation` — Not supported" text={colors.textMuted} />
		</Div>
	</Div>

	<Divider border={colors.border} />

	<!-- 8. Outlook Limitations -->
	<Div p-6>
		<Text.H2 content="8. Outlook Limitations" text={colors.text} />
		<Spacer h-3 />
		<Text.Paragraph 
			content="Outlook on Windows uses the **Word rendering engine**, not a browser. This causes significant CSS limitations."
			text={colors.textMuted}
			leading-relaxed
		/>
		<Spacer h-4 />

		<Div bg={colors.warningBg} p-4 border-l={colors.warning} border-4>
			<Text.H5 content="⚠️ Outlook-Specific Issues" text={colors.text} />
			<Spacer h-2 />
			<Text.Paragraph content="• **border-radius** is ignored — buttons/containers appear square" text={colors.textMuted} />
			<Text.Paragraph content="• **box-shadow** is ignored — design without shadows" text={colors.textMuted} />
			<Text.Paragraph content="• **max-width** is ignored — use fixed width with VML for fallback" text={colors.textMuted} />
			<Text.Paragraph content="• **background-image** needs VML — complex to implement" text={colors.textMuted} />
			<Text.Paragraph content="• **media queries** are ignored — mobile-first doesn't work" text={colors.textMuted} />
		</Div>

		<Spacer h-4 />
		<Div bg={colors.codeBg} p-4 rounded-md border={colors.border}>
			<Text.H5 content="💡 **Pro Tips for Outlook**" text={colors.text} />
			<Spacer h-2 />
			<Text.Paragraph content="• Accept square corners as graceful degradation" text={colors.textMuted} />
			<Text.Paragraph content="• Use solid background colors instead of images" text={colors.textMuted} />
			<Text.Paragraph content="• Test with Outlook Windows specifically" text={colors.textMuted} />
			<Text.Paragraph content="• Keep layouts simple — complex nesting can break" text={colors.textMuted} />
		</Div>
	</Div>

	<Divider border={colors.border} />

	<!-- 9. Images -->
	<Div p-6>
		<Text.H2 content="9. Images" text={colors.text} />
		<Spacer h-3 />
		<Text.Paragraph 
			content="Images in emails have specific requirements for reliability."
			text={colors.textMuted}
			leading-relaxed
		/>
		<Spacer h-4 />

		<Div bg={colors.successBg} p-4 border-l={colors.success} border-4 mb-4>
			<Text.H5 content="✅ DO" text={colors.text} />
			<Spacer h-2 />
			<Text.Paragraph content="• Always include `width` and `height` attributes" text={colors.textMuted} />
			<Text.Paragraph content="• Use **HTTPS** absolute URLs for hosted images" text={colors.textMuted} />
			<Text.Paragraph content="• Provide meaningful `alt` text (images may be blocked)" text={colors.textMuted} />
			<Text.Paragraph content="• Use the `<Img>` component, NOT inline SVG" text={colors.textMuted} />
			<Text.Paragraph content="• Base64 data URIs work for small images" text={colors.textMuted} />
		</Div>

		<Div bg={colors.dangerBg} p-4 border-l={colors.danger} border-4>
			<Text.H5 content="❌ DON'T" text={colors.text} />
			<Spacer h-2 />
			<Text.Paragraph content="• Use inline `<svg>` elements (40% support, Gmail strips)" text={colors.textMuted} />
			<Text.Paragraph content="• Use HTTP (non-secure) image URLs" text={colors.textMuted} />
			<Text.Paragraph content="• Rely on images for critical information" text={colors.textMuted} />
			<Text.Paragraph content="• Use `object-fit` (~66% support)" text={colors.textMuted} />
		</Div>
	</Div>

	<Divider border={colors.border} />

	<!-- 10. Equal-Height Columns -->
	<Div p-6>
		<Text.H2 content="10. Equal-Height Columns" text={colors.text} />
		<Spacer h-3 />
		<Text.Paragraph 
			content="Use `h-full` to make columns in a row stretch to the same height, regardless of content."
			text={colors.textMuted}
			leading-relaxed
		/>
		<Spacer h-4 />
		<Text.Codeblock highlight='svelte' content={hFullExample} />
		<Spacer h-4 />
		<Div bg={colors.codeBg} p-4 rounded-md border={colors.border}>
			<Text.Paragraph content="💡 This is especially useful for card grids where you want consistent visual alignment even when content lengths vary." text={colors.text} />
		</Div>
	</Div>

	<Divider border={colors.border} />

	<!-- 11. Link Types -->
	<Div p-6>
		<Text.H2 content="11. Link Types (href)" text={colors.text} />
		<Spacer h-3 />
		<Text.Paragraph 
			content="The `href` prop supports various URI schemes for different interactions. These work with Link, Button, and Img components, as well as **markdown links** in content props: `\[text](mailto:x@y.com)`."
			text={colors.textMuted}
			leading-relaxed
		/>
		<Spacer h-4 />

		<Table cols="30% 70%">
			<Table.Row header bg={colors.primary}>
				<Div><Text content="Scheme" text={colors.white} font-bold /></Div>
				<Div><Text content="Usage" text={colors.white} font-bold /></Div>
			</Table.Row>
			<Table.Row>
				<Div><Text content="https://" text={colors.code} font-mono /></Div>
				<Div><Text content="Web URLs (always use HTTPS)" text={colors.textMuted} /></Div>
			</Table.Row>
			<Table.Row>
				<Div><Text content="mailto:" text={colors.code} font-mono /></Div>
				<Div><Text content="Opens email client with pre-filled address" text={colors.textMuted} /></Div>
			</Table.Row>
			<Table.Row>
				<Div><Text content="tel:" text={colors.code} font-mono /></Div>
				<Div><Text content="Initiates phone call (mobile)" text={colors.textMuted} /></Div>
			</Table.Row>
		</Table>

		<Spacer h-4 />
		<Text.Codeblock highlight='svelte' content={hrefTypesExample} />
	</Div>

	<Divider border={colors.border} />

	<!-- 12. Compatibility Matrix -->
	<Div p-6>
		<Text.H2 content="12. Email Client Compatibility Matrix" text={colors.text} />
		<Spacer h-3 />
		<Text.Paragraph 
			content="Email clients have wildly varying CSS support. This matrix shows what works where, and what the library handles for you."
			text={colors.textMuted}
			leading-relaxed
		/>
		<Spacer h-2 />
		<Text.Paragraph 
			content="**Legend:** ✅ Supported | ☑️ Emulated (works everywhere) | ⚠️ Partial | ❌ Not Supported"
			text={colors.text}
			text-sm
		/>
		<Spacer h-4 />

		<Table cols="20% 13% 13% 13% 13% 28%" border cell-padding-2>
			<Table.Row header bg={colors.primary}>
				<Div><Text content="Property" text={colors.white} font-bold text-sm /></Div>
				<Div align-center><Text content="Outlook" text={colors.white} font-bold text-sm /></Div>
				<Div align-center><Text content="Gmail" text={colors.white} font-bold text-sm /></Div>
				<Div align-center><Text content="Apple" text={colors.white} font-bold text-sm /></Div>
				<Div align-center><Text content="Yahoo" text={colors.white} font-bold text-sm /></Div>
				<Div><Text content="Notes" text={colors.white} font-bold text-sm /></Div>
			</Table.Row>
			{#each cssSupport as row}
				<Table.Row>
					<Div><Text content={row.property} text={colors.code} font-mono text-sm /></Div>
					<Div align-center><Text content={row.outlook} text={colors.text} /></Div>
					<Div align-center><Text content={row.gmail} text={colors.text} /></Div>
					<Div align-center><Text content={row.apple} text={colors.text} /></Div>
					<Div align-center><Text content={row.yahoo} text={colors.text} /></Div>
					<Div><Text content={row.note} text={colors.textMuted} text-sm /></Div>
				</Table.Row>
			{/each}
		</Table>

		<Spacer h-4 />
		<Div bg={colors.successBg} p-4 border-l={colors.success} border-4>
			<Text.H5 content="🎯 Key Takeaway" text={colors.text} />
			<Spacer h-2 />
			<Text.Paragraph 
				content="Design for the **lowest common denominator** (Outlook Windows), then let modern clients enjoy enhanced styling. The library handles margin and opacity emulation automatically — you write normal code and it works everywhere."
				text={colors.textMuted}
			/>
		</Div>
	</Div>

	<!-- Footer -->
	<Div p-6 bg={colors.primary} align-center>
		<Text.H3 content="Ready to Build?" text={colors.white} />
		<Spacer h-2 />
		<Text content="Check out the examples to see these patterns in action" text={colors.white} text-opacity-80 />
		<Spacer h-4 />
		<Button
			href="https://github.com/Refzlund/svelte-emails"
			bg={colors.white}
			text={colors.primary}
			px-6
			py-3
			rounded-md
			font-semibold
			content="View Examples →"
		/>
	</Div>

	<!-- Footer -->
	<Div p-4 bg={colors.codeBg} align-center>
		<Text.Small content="svelte-emails documentation • MIT License" text={colors.textMuted} />
	</Div>
</Email>
