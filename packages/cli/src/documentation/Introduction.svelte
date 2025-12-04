<script lang="ts">
	/**
	 * Introduction Documentation
	 * 
	 * A documentation page rendered as an email, demonstrating:
	 * - How to structure documentation content
	 * - All text formatting capabilities
	 * - Code examples and syntax highlighting
	 * - Navigation and sections
	 */
	import {
		Email,
		Div,
		Text,
		Button,
		Spacer,
		Divider,
		Table
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
		codeBg: '#f9fafb'
	}

	// Code examples as variables to avoid parsing issues
	const codeInstall = 'npm install svelte-emails'
	
	const codeExample = `<script>
  import { Email, Div, Text } from 'svelte-emails'
<\/script>

<Email preview="Hello World">
  <Div p-6>
    <Text content="Hello, World!" />
  </Div>
</Email>`

	const codeLayout = `<Div 
  cols 
  responsive 
  gap-4 
  p-6 
  bg={colors.white}
>
  <Div>Column 1</Div>
  <Div>Column 2</Div>
</Div>`

	const features = `- **Tailwind-like styling** - Use familiar utility classes
- **Email-safe components** - Table-based layouts that work everywhere
- **Variable interpolation** - Dynamic content in props
- **Markdown support** - Bold, italic, links, and more in text content`

	const spacingExamples = 'p-4, px-6, py-2, m-4, mx-auto'
	const colorExamples = 'bg, text, border props accept color values'
	const typographyExamples = 'text-xl, font-bold, leading-relaxed'
	const layoutExamples = 'cols, rows, gap-4, responsive'

	const doList = `**DO:**
- ✅ Use table-based layouts (the library handles this)
- ✅ Include width and height on all images
- ✅ Use absolute URLs for images
- ✅ Keep HTML under 100KB (Gmail clips larger emails)
- ✅ Test in multiple clients (Outlook, Gmail, Apple Mail)`

	const dontList = `**DON'T:**
- ❌ Use CSS flexbox or grid directly
- ❌ Rely on border-radius in Outlook
- ❌ Use inline SVGs (use img src instead)
- ❌ Expect web fonts to work everywhere
- ❌ Use JavaScript (it won't run)`
</script>

<Email
	preview="Getting Started with svelte-emails - Build beautiful emails with Svelte"
	body-bg={colors.background}
	bg={colors.white}
	max-w-[700px]
>
	<!-- Header -->
	<Div p-6 bg={colors.primary}>
		<Text.H1 content="📚 svelte-emails Documentation" text={colors.white} text-2xl font-bold />
		<Spacer h-2 />
		<Text content="Build beautiful, responsive emails with Svelte components" text={colors.white} text-opacity-80 />
	</Div>

	<!-- Table of Contents -->
	<Div p-6 bg={colors.codeBg} border-b={colors.border} border-1>
		<Text.H4 content="**Table of Contents**" text={colors.text} />
		<Spacer h-3 />
		<Text.Paragraph content="1. Introduction" text={colors.primary} />
		<Text.Paragraph content="2. Getting Started" text={colors.primary} />
		<Text.Paragraph content="3. Core Components" text={colors.primary} />
		<Text.Paragraph content="4. Styling System" text={colors.primary} />
		<Text.Paragraph content="5. Best Practices" text={colors.primary} />
	</Div>

	<!-- Introduction Section -->
	<Div p-6>
		<Text.H2 content="1. Introduction" text={colors.text} />
		<Spacer h-3 />
		<Text.Paragraph 
			content="**svelte-emails** is a library for building HTML emails using Svelte components. It provides a set of email-safe components that render to compatible HTML across all major email clients."
			text={colors.textMuted}
			leading-relaxed
		/>
		<Spacer h-4 />
		<Text.Paragraph 
			content="Key features include:"
			text={colors.text}
			font-semibold
		/>
		<Spacer h-2 />
		<Text.Paragraph 
			content={features}
			text={colors.textMuted}
		/>
	</Div>

	<Divider border={colors.border} />

	<!-- Getting Started Section -->
	<Div p-6>
		<Text.H2 content="2. Getting Started" text={colors.text} />
		<Spacer h-3 />
		<Text.Paragraph 
			content="Install svelte-emails in your SvelteKit project:"
			text={colors.textMuted}
		/>
		<Spacer h-3 />
		
		<!-- Code Block -->
		<Div bg={colors.code} p-4 rounded-md>
			<Text content={codeInstall} text={colors.white} font-mono text-sm />
		</Div>

		<Spacer h-4 />
		<Text.Paragraph 
			content="Create your first email by creating a file ending in .email.svelte:"
			text={colors.textMuted}
		/>
		<Spacer h-3 />

		<Div bg={colors.code} p-4 rounded-md>
			<Text 
				content={codeExample}
				text={colors.white}
				font-mono
				text-sm
				whitespace-pre
			/>
		</Div>
	</Div>

	<Divider border={colors.border} />

	<!-- Components Section -->
	<Div p-6>
		<Text.H2 content="3. Core Components" text={colors.text} />
		<Spacer h-3 />
		<Text.Paragraph 
			content="svelte-emails provides several core components for building emails:"
			text={colors.textMuted}
		/>
		<Spacer h-4 />

		<Table cols="30% 70%" border>
			<Table.Row header bg={colors.primary}>
				<Div><Text content="Component" text={colors.white} font-bold /></Div>
				<Div><Text content="Description" text={colors.white} font-bold /></Div>
			</Table.Row>
			<Table.Row>
				<Div><Text content="Email" text={colors.code} font-mono /></Div>
				<Div><Text content="Root wrapper for all emails" text={colors.textMuted} /></Div>
			</Table.Row>
			<Table.Row>
				<Div><Text content="Div" text={colors.code} font-mono /></Div>
				<Div><Text content="Generic container with layout support" text={colors.textMuted} /></Div>
			</Table.Row>
			<Table.Row>
				<Div><Text content="Text" text={colors.code} font-mono /></Div>
				<Div><Text content="Text component with markdown support" text={colors.textMuted} /></Div>
			</Table.Row>
			<Table.Row>
				<Div><Text content="Button" text={colors.code} font-mono /></Div>
				<Div><Text content="Call-to-action buttons" text={colors.textMuted} /></Div>
			</Table.Row>
			<Table.Row>
				<Div><Text content="Img" text={colors.code} font-mono /></Div>
				<Div><Text content="Images with required dimensions" text={colors.textMuted} /></Div>
			</Table.Row>
			<Table.Row>
				<Div><Text content="Link" text={colors.code} font-mono /></Div>
				<Div><Text content="Inline links" text={colors.textMuted} /></Div>
			</Table.Row>
			<Table.Row>
				<Div><Text content="Spacer" text={colors.code} font-mono /></Div>
				<Div><Text content="Vertical/horizontal spacing" text={colors.textMuted} /></Div>
			</Table.Row>
			<Table.Row>
				<Div><Text content="Divider" text={colors.code} font-mono /></Div>
				<Div><Text content="Horizontal rule/divider" text={colors.textMuted} /></Div>
			</Table.Row>
		</Table>
	</Div>

	<Divider border={colors.border} />

	<!-- Styling Section -->
	<Div p-6>
		<Text.H2 content="4. Styling System" text={colors.text} />
		<Spacer h-3 />
		<Text.Paragraph 
			content="All components support Tailwind-like style attributes that get converted to inline CSS:"
			text={colors.textMuted}
		/>
		<Spacer h-4 />

		<Div bg={colors.codeBg} p-4 rounded-md border={colors.border} border-1>
			<Text.H5 content="**Spacing**" text={colors.text} />
			<Text content={spacingExamples} text={colors.textMuted} font-mono text-sm />
			
			<Spacer h-3 />
			<Text.H5 content="**Colors**" text={colors.text} />
			<Text content={colorExamples} text={colors.textMuted} font-mono text-sm />
			
			<Spacer h-3 />
			<Text.H5 content="**Typography**" text={colors.text} />
			<Text content={typographyExamples} text={colors.textMuted} font-mono text-sm />
			
			<Spacer h-3 />
			<Text.H5 content="**Layout**" text={colors.text} />
			<Text content={layoutExamples} text={colors.textMuted} font-mono text-sm />
		</Div>

		<Spacer h-4 />
		<Text.Paragraph 
			content="Example using multiple style attributes:"
			text={colors.textMuted}
		/>
		<Spacer h-3 />

		<Div bg={colors.code} p-4 rounded-md>
			<Text 
				content={codeLayout}
				text={colors.white}
				font-mono
				text-sm
				whitespace-pre
			/>
		</Div>
	</Div>

	<Divider border={colors.border} />

	<!-- Best Practices Section -->
	<Div p-6>
		<Text.H2 content="5. Best Practices" text={colors.text} />
		<Spacer h-3 />
		
		<Div bg={colors.primaryDark} bg-opacity-10 p-4 rounded-md border-l={colors.primary} border-4>
			<Text.H5 content="⚠️ Important Constraints" text={colors.text} />
			<Spacer h-2 />
			<Text.Paragraph 
				content="Email clients have limited CSS support. Keep these rules in mind:"
				text={colors.textMuted}
			/>
		</Div>

		<Spacer h-4 />

		<Text.Paragraph 
			content={doList}
			text={colors.textMuted}
		/>

		<Spacer h-4 />

		<Text.Paragraph 
			content={dontList}
			text={colors.textMuted}
		/>
	</Div>

	<!-- Footer CTA -->
	<Div p-6 bg={colors.primary} align-center>
		<Text.H3 content="Ready to Build?" text={colors.white} />
		<Spacer h-2 />
		<Text content="Check out the examples to see more patterns" text={colors.white} text-opacity-80 />
		<Spacer h-4 />
		<Button
			href="https://github.com/Refzlund/svelte-emails"
			bg={colors.white}
			text={colors.primary}
			px-6
			py-3
			rounded-md
			font-semibold
			content="View on GitHub →"
		/>
	</Div>

	<!-- Footer -->
	<Div p-4 bg={colors.codeBg} align-center>
		<Text.Small content="svelte-emails documentation • MIT License" text={colors.textMuted} />
	</Div>
</Email>
