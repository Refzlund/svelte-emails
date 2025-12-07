<script lang="ts">
	/**
	 * Introduction to svelte-emails
	 * 
	 * Overview of the library, installation, and quick start guide.
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

	const installCode = `bun add -D svelte-emails`
	
	const shikiInstall = `bun add -D shiki`
	
	const exampleCode = `<script lang="ts">
  import { Email, Div, Text } from 'svelte-emails'
` + '<' + `/script>

<Email preview="Welcome!">
  <Div p-6 bg-[#ffffff]>
    <Text.H1 content="Hello World" />
    <Text content="This is my first email." />
  </Div>
</Email>`

	const sendingCode = `import { render } from 'svelte-emails'
import WelcomeEmail from './WelcomeEmail.email.svelte'

// Render to HTML and plain text
const { html, text, headers } = await render(WelcomeEmail, {
  placeholders: { first_name: 'Alice' }
})

// Send with your provider (e.g., Nodemailer, Resend, SendGrid, etc.)
await emailer.send({
  from: 'hello@example.com',
  to: 'alice@example.com',
  subject: 'Welcome!',
  html,
  text,
  headers
})`

</script>

{#snippet featureCard(icon: string, title: string, description: string)}
	<Div rows gap-2 bg={colors.codeBg} p-4 rounded border={colors.border} h-full>
		<Text.H4 content="{icon} {title}" text={colors.primaryDark} />
		<Text.Small content={description} text={colors.textMuted} />
	</Div>
{/snippet}

{#snippet codeStep(description: string, code: string, language: string)}
	<Div rows gap-3>
		<Text.Paragraph content={description} text={colors.textMuted} />
		<Text.Codeblock content={code} highlight={language} />
	</Div>
{/snippet}

<Email
	order=1
	category='1. Getting Started'
	preview="Welcome to svelte-emails - The modern way to build emails"
	body-bg={colors.background}
	bg={colors.white}
	max-w-[700px]
>
	<!-- Header -->
	<Div rows gap-2 p-8 bg={colors.primary}>
		<Text.H1 content="👋 Welcome to svelte-emails" text={colors.white} text-3xl font-bold />
		<Text content="Build responsive, reliable emails with Svelte and Tailwind-like styling." text={colors.white} text-opacity-90 text-lg />
	</Div>

	<!-- What is it? -->
	<Div rows gap-6 p-8>
		<Div rows gap-4>
			<Text.H2 content="What is svelte-emails?" text={colors.text} />
			<Text.Paragraph 
				content="Think **Tailwind for emails**. We handle the messy parts of HTML email rendering—tables, VML, inline styles, and client quirks—so you can focus on building beautiful templates using Svelte components."
				text={colors.textMuted}
				leading-relaxed
			/>
		</Div>
		
		<Div cols responsive gap-4>
			{@render featureCard("🎨", "Tailwind-like Styling", "Use familiar attributes like `p-4`, `bg-[#fff]`, `rounded` directly on components.")}
			{@render featureCard("📱", "Responsive by Default", "Grid layouts that stack automatically on mobile. No media query headaches.")}
			{@render featureCard("📧", "Client Compatible", "Works in Outlook, Gmail, Apple Mail, and more. We handle the fallbacks.")}
		</Div>
	</Div>

	<Divider border={colors.border} />

	<!-- Installation -->
	<Div rows gap-6 p-8>
		<Div rows gap-4>
			<Text.H2 content="Installation" text={colors.text} />
			{@render codeStep("Get started by adding the package to your project:", installCode, "bash")}
		</Div>
		
		<Div rows gap-2>
			<Text.H4 content="Optional: Code Highlighting" text={colors.text} />
			{@render codeStep("For syntax highlighting in `<Text.Codeblock highlight='...' />`, install [shiki](https://github.com/shikijs/shiki):", shikiInstall, "bash")}
		</Div>
	</Div>

	<Divider border={colors.border} />

	<!-- Quick Start -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Quick Start" text={colors.text} />
		{@render codeStep("Create a file named `MyEmail.email.svelte`:", exampleCode, "svelte")}
		{@render codeStep("Then run the dev server to preview it:", "bunx svelte-emails", "bash")}
		<Text content="It's just that simple!" text={colors.text} />
	</Div>

	<Divider border={colors.border} />

	<!-- Sending -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Sending Emails" text={colors.text} />
		<Text.Paragraph content="Use the `render()` function to generate HTML and plain text, then send with any email provider:" text={colors.textMuted} />
		<Text.Codeblock content={sendingCode} highlight="typescript" />
		<Text.Small content="See the **Rendering** guide for more options like props and style presets." text={colors.textMuted} />
	</Div>

	{@render footer()}
</Email>
