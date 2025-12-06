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

	const installCode = `bun add -D svelte-emails`
	
	const exampleCode = `<script lang="ts">
  import { Email, Div, Text } from 'svelte-emails'
` + '<' + `/script>

<Email preview="Welcome!">
  <Div p-6 bg="#ffffff">
    <Text.H1 content="Hello World" />
    <Text content="This is my first email." />
  </Div>
</Email>`

</script>

<Email
	order=1
	category='1. Getting Started'
	preview="Welcome to svelte-emails - The modern way to build emails"
	body-bg={colors.background}
	bg={colors.white}
	max-w-[700px]
>
	<!-- Header -->
	<Div p-8 bg={colors.primary}>
		<Text.H1 content="👋 Welcome to svelte-emails" text={colors.white} text-3xl font-bold />
		<Spacer h-2 />
		<Text content="Build responsive, reliable emails with Svelte and Tailwind-like styling." text={colors.white} text-opacity-90 text-lg />
	</Div>

	<!-- What is it? -->
	<Div p-8>
		<Text.H2 content="What is svelte-emails?" text={colors.text} />
		<Spacer h-4 />
		<Text.Paragraph 
			content="Think **Tailwind for emails**. We handle the messy parts of HTML email rendering—tables, VML, inline styles, and client quirks—so you can focus on building beautiful templates using Svelte components."
			text={colors.textMuted}
			leading-relaxed
		/>
		
		<Spacer h-6 />
		
		<Div cols responsive gap-4>
			<Div bg={colors.codeBg} p-4 rounded border={colors.border}>
				<Text.H4 content="🎨 Tailwind-like Styling" text={colors.primaryDark} />
				<Spacer h-2 />
				<Text.Small content="Use familiar attributes like `p-4`, `bg-white`, `rounded` directly on components." text={colors.textMuted} />
			</Div>
			<Div bg={colors.codeBg} p-4 rounded border={colors.border}>
				<Text.H4 content="📱 Responsive by Default" text={colors.primaryDark} />
				<Spacer h-2 />
				<Text.Small content="Grid layouts that stack automatically on mobile. No media query headaches." text={colors.textMuted} />
			</Div>
			<Div bg={colors.codeBg} p-4 rounded border={colors.border}>
				<Text.H4 content="📧 Client Compatible" text={colors.primaryDark} />
				<Spacer h-2 />
				<Text.Small content="Works in Outlook, Gmail, Apple Mail, and more. We handle the fallbacks." text={colors.textMuted} />
			</Div>
		</Div>
	</Div>

	<Divider border={colors.border} />

	<!-- Installation -->
	<Div p-8>
		<Text.H2 content="Installation" text={colors.text} />
		<Spacer h-4 />
		<Text.Paragraph content="Get started by adding the package to your project:" text={colors.textMuted} />
		<Spacer h-3 />
		<Text.Codeblock content={installCode} highlight="bash" />
	</Div>

	<Divider border={colors.border} />

	<!-- Quick Start -->
	<Div p-8>
		<Text.H2 content="Quick Start" text={colors.text} />
		<Spacer h-4 />
		<Text.Paragraph content="Create a file named `MyEmail.email.svelte`:" text={colors.textMuted} />
		<Spacer h-3 />
		<Text.Codeblock content={exampleCode} highlight="svelte" />
		<Spacer h-4 />
		<Text.Paragraph content="Then run the dev server to preview it:" text={colors.textMuted} />
		<Spacer h-3 />
		<Text.Codeblock content="bunx svelte-emails" highlight="bash" />
	</Div>

	<!-- Footer -->
	<Div p-6 bg={colors.codeBg} align-center border-t={colors.border}>
		<Text.Small content="Next: Check out the [Development Guide](2)" text={colors.textMuted} />
	</Div>
</Email>
