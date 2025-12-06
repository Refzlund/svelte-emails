<script lang="ts">
	/**
	 * Development Guide
	 * 
	 * CLI usage, preview features, and workflow.
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

	const cliCommands = `bunx svelte-emails        # Start dev server
bunx svelte-emails build  # Build emails to static HTML`

	const fileStructure = `src/
  emails/
    Welcome.email.svelte
    ResetPassword.email.svelte
    components/
      Header.svelte
      Footer.svelte`
</script>

<Email
	order=2
	category='1. Getting Started'
	preview="Development workflow with svelte-emails"
	body-bg={colors.background}
	bg={colors.white}
	max-w-[700px]
>
	<!-- Header -->
	<Div p-8 bg={colors.primary}>
		<Text.H1 content="🛠️ Development Workflow" text={colors.white} text-3xl font-bold />
		<Spacer h-2 />
		<Text content="Master the CLI and preview tools." text={colors.white} text-opacity-90 text-lg />
	</Div>

	<!-- CLI -->
	<Div p-8>
		<Text.H2 content="CLI Commands" text={colors.text} />
		<Spacer h-4 />
		<Text.Paragraph content="The CLI is your main tool for developing and building emails." text={colors.textMuted} />
		<Spacer h-3 />
		<Text.Codeblock content={cliCommands} highlight="bash" />
		
		<Spacer h-6 />
		
		<Text.H4 content="Dev Server Features" text={colors.text} />
		<Spacer h-2 />
		<Text content="
- **Hot Reloading**: Changes reflect instantly
- **Preview UI**: Toggle mobile/desktop views
- **Variable Editor**: Test placeholders interactively
- **Output View**: Inspect generated HTML and Plain Text
" text={colors.textMuted} />
	</Div>

	<Divider border={colors.border} />

	<!-- File Structure -->
	<Div p-8>
		<Text.H2 content="File Structure" text={colors.text} />
		<Spacer h-4 />
		<Text.Paragraph content="We recommend organizing your emails in a dedicated folder. Files ending in `.email.svelte` are automatically discovered by the CLI." text={colors.textMuted} />
		<Spacer h-3 />
		<Text.Codeblock content={fileStructure} highlight="bash" />
		<Spacer h-4 />
		<Div bg={colors.codeBg} p-4 rounded border={colors.border}>
			<Text.Small content="**Note:** You can import regular Svelte components (like `Header.svelte`) into your emails. Only `.email.svelte` files become standalone templates." text={colors.textMuted} />
		</Div>
	</Div>

	<Divider border={colors.border} />

	<!-- Pre-send Checklist -->
	<Div p-8>
		<Text.H2 content="Pre-send Checklist" text={colors.text} />
		<Spacer h-4 />
		<Text.Paragraph content="Before sending your emails, ensure:" text={colors.textMuted} />
		<Spacer h-3 />
		<Text content="
- [ ] **Size**: HTML is under 100KB (Gmail clips larger emails)
- [ ] **Images**: All have `alt`, `width`, and `height` attributes
- [ ] **Links**: All use absolute `https://` URLs
- [ ] **Preview Text**: Set via the `preview` prop on `<Email>`
" text={colors.textMuted} />
	</Div>

	<!-- Footer -->
	<Div p-6 bg={colors.codeBg} align-center border-t={colors.border}>
		<Text.Small content="Next: Learn about [Core Concepts](3)" text={colors.textMuted} />
	</Div>
</Email>
