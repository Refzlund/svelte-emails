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
		Divider,
		Table
	} from 'svelte-emails'
	import { colors, style } from '../theme'
	import { footer } from '../Shared/Footer.svelte'
	import { callout } from '../Shared/Callout.svelte'

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
	{style}
>
	<!-- Header -->
	<Div rows gap-2 p-8 bg={colors.primary}>
		<Text.H1 content="🛠️ Development Workflow" text={colors.white} text-3xl font-bold />
		<Text content="Master the CLI and preview tools." text={colors.white} text-opacity-90 text-lg />
	</Div>

	<!-- CLI -->
	<Div rows gap-6 p-8>
		<Div rows gap-4>
			<Text.H2 content="CLI Commands" text={colors.text} />
			<Text.Paragraph content="The CLI is your main tool for developing and building emails." text={colors.textMuted} />
			<Text.Codeblock content={cliCommands} highlight="bash" />
		</Div>
		
		<Div rows gap-2>
			<Text.H4 content="Dev Server Features" text={colors.text} />
			<Text content="
- **Hot Reloading**: Changes reflect instantly
- **Preview UI**: Toggle mobile/desktop views
- **Variable Editor**: Test placeholders interactively
- **Output View**: Inspect generated HTML and Plain Text
" text={colors.textMuted} />
		</Div>
	</Div>

	<Divider border={colors.border} />

	<!-- File Structure -->
	<Div rows gap-4 p-8>
		<Text.H2 content="File Structure" text={colors.text} />
		<Text.Paragraph content="We recommend organizing your emails in a dedicated folder. Files ending in `.email.svelte` are automatically discovered by the CLI." text={colors.textMuted} />
		<Text.Codeblock content={fileStructure} highlight="bash" />
		{@render callout('note', 'You can import regular Svelte components (like `Header.svelte`) into your emails. Only `.email.svelte` files become standalone templates.')}
	</Div>

	<Divider border={colors.border} />

	<!-- VSCode Color Picker -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Color Picking Setup" text={colors.text} />
		<Text.Paragraph content="Easily select and modify colors in your email templates. Use any color picker extension, such [Color Picker Universal](https://marketplace.visualstudio.com/items?itemName=JeronimoEkerdt.color-picker-universal) or any other. An extension lets you visually pick colors directly in attributes like `bg-[#ffffff]` and `text-[#333333]`." text={colors.textMuted} />
		
		<Div rows gap-3>
			<Text.H4 content="Setup Steps" text={colors.text} />
			<Text
				text={colors.textMuted}
				content={`
**1. Install the extension**

Install [Color Picker Universal](https://marketplace.visualstudio.com/items?itemName=JeronimoEkerdt.color-picker-universal) from the marketplace.

**2. Configure for Svelte files IF required**		

**3. Restart the extension host**

Run the command **'Developer: Restart Extension Host'** in VSCode (Ctrl+Shift+P / Cmd+Shift+P).
`}
			/>
		</Div>

		{@render callout('tip', 'Once configured, clicking on any color value like \`#ffffff\` in your Svelte files will open a visual color picker. This works for all Tailwind-like color attributes: \`bg-[#...]\`, \`text-[#...]\`, \`border-[#...]\`, etc.')}
	</Div>

	<Divider border={colors.border} />

	<!-- Pre-send Checklist -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Pre-send Checklist" text={colors.text} />
		<Text.Paragraph content="Before sending your emails, ensure:" text={colors.textMuted} />
		<Text
			content={
`- [ ] **Size** — HTML is under 100KB (Gmail clips larger emails)
- [ ] **Images** — All have \`alt\`, \`width\`, and \`height\` attributes
- [ ] **Links** — All use absolute \`https://\` URLs
- [ ] **Preview Text** — Set via the \`preview\` prop on \`<Email>\``
			}
			text={colors.textMuted}
		/>
		<Text.Paragraph content="We do this to ensure mail-client compatibility." text={colors.textMuted} />
	</Div>

	{@render footer()}
</Email>
