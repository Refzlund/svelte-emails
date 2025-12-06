<script lang="ts">
	/**
	 * Content & Markdown
	 * 
	 * Text formatting, markdown syntax, and variable interpolation.
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

	const markdownExample = `<Text content="**Bold**, *italic*, and [links](https://example.com)" />`
	
	const placeholderExample = `<Text content="Hello [[first_name]]!" />`
	
	const propsExample = `<script>
  let { name } = $props()
` + '<' + `/script>

<Text content="Hello {name}!" />`

</script>

<Email
	order=3
	category='2. Core Concepts'
	preview="Master content and markdown in svelte-emails"
	body-bg={colors.background}
	bg={colors.white}
	max-w-[700px]
>
	<!-- Header -->
	<Div p-8 bg={colors.primary}>
		<Text.H1 content="📝 Content & Markdown" text={colors.white} text-3xl font-bold />
		<Spacer h-2 />
		<Text content="Rich text formatting and dynamic content made easy." text={colors.white} text-opacity-90 text-lg />
	</Div>

	<!-- Markdown -->
	<Div p-8>
		<Text.H2 content="Markdown Support" text={colors.text} />
		<Spacer h-4 />
		<Text.Paragraph content="All `content` props support extended markdown syntax. No need for complex HTML structures for simple formatting." text={colors.textMuted} />
		<Spacer h-3 />
		<Text.Codeblock content={markdownExample} highlight="svelte" />
		
		<Spacer h-6 />
		
		<Table cols="30% 70%" border>
			<Table.Row header bg={colors.background}>
				<Text content="Syntax" font-bold />
				<Text content="Result" font-bold />
			</Table.Row>
			<Table.Row>
				<Text.Code content="**bold**" />
				<Text content="**bold**" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="*italic*" />
				<Text content="*italic*" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="[link](url)" />
				<Text content="[link](#)" text={colors.primary} />
			</Table.Row>
			<Table.Row>
				<Text.Code content="(#f00)red(/)" />
				<Text content="(#ef4444)red(/)" />
			</Table.Row>
		</Table>
	</Div>

	<Divider border={colors.border} />

	<!-- Variables -->
	<Div p-8>
		<Text.H2 content="Dynamic Content" text={colors.text} />
		<Spacer h-4 />
		<Text.Paragraph content="There are two ways to inject dynamic data into your emails:" text={colors.textMuted} />
		
		<Spacer h-6 />
		
		<Text.H4 content="1. Svelte Props (Build Time)" text={colors.text} />
		<Text.Small content="Use standard Svelte props when you know the data at render time (e.g., looping over items)." text={colors.textMuted} />
		<Spacer h-2 />
		<Text.Codeblock content={propsExample} highlight="svelte" />

		<Spacer h-6 />

		<Text.H4 content="2. Placeholders (Send Time)" text={colors.text} />
		<Text.Small content="Use `[[variable]]` syntax for data filled by your ESP (e.g., Mailchimp, SendGrid)." text={colors.textMuted} />
		<Spacer h-2 />
		<Text.Codeblock content={placeholderExample} highlight="svelte" />
	</Div>

	<!-- Footer -->
	<Div p-6 bg={colors.codeBg} align-center border-t={colors.border}>
		<Text.Small content="Next: Explore [Basic Components](7)" text={colors.textMuted} />
	</Div>
</Email>
