<script lang="ts">
	/**
	 * Styling System
	 * 
	 * Tailwind-like attributes, value syntax, and theming.
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

	const booleanSyntax = `<Div p-4 bg-[#f3f4f6] rounded-lg />`
	const valueSyntax = `<Div p="1rem" bg="#f3f4f6" rounded="8px" />`
	const variableSyntax = `<script>
  let theme = { bg: '#f3f4f6', spacing: '1rem' }
` + '<' + `/script>

<Div p={theme.spacing} bg={theme.bg} />`

</script>

<Email
	order=1
	category='2. Core Concepts'
	preview="Master the styling system in svelte-emails"
	body-bg={colors.background}
	bg={colors.white}
	max-w-[700px]
>
	<!-- Header -->
	<Div p-8 bg={colors.primary}>
		<Text.H1 content="🎨 Styling System" text={colors.white} text-3xl font-bold />
		<Spacer h-2 />
		<Text content="Tailwind-like utility attributes for rapid development." text={colors.white} text-opacity-90 text-lg />
	</Div>

	<!-- Syntax Options -->
	<Div p-8>
		<Text.H2 content="Two Syntax Options" text={colors.text} />
		<Spacer h-4 />
		<Text.Paragraph content="We support two ways to define styles. Choose the one that fits your needs." text={colors.textMuted} />
		
		<Spacer h-6 />
		
		<Text.H4 content="1. Boolean Syntax (Tailwind-like)" text={colors.text} />
		<Text.Small content="Best for static values. Uses brackets for arbitrary values." text={colors.textMuted} />
		<Spacer h-2 />
		<Text.Codeblock content={booleanSyntax} highlight="svelte" />

		<Spacer h-6 />

		<Text.H4 content="2. Value Syntax" text={colors.text} />
		<Text.Small content="Best for dynamic values or Svelte variables." text={colors.textMuted} />
		<Spacer h-2 />
		<Text.Codeblock content={valueSyntax} highlight="svelte" />
		<Spacer h-2 />
		<Text.Codeblock content={variableSyntax} highlight="svelte" />
	</Div>

	<Divider border={colors.border} />

	<!-- Categories -->
	<Div p-8>
		<Text.H2 content="Style Categories" text={colors.text} />
		<Spacer h-4 />
		
		<Table cols="30% 70%" border>
			<Table.Row header bg={colors.background}>
				<Text content="Category" font-bold />
				<Text content="Examples" font-bold />
			</Table.Row>
			<Table.Row>
				<Text content="Spacing" font-semibold />
				<Text.Code content="p-4, m-2, px-6, my-auto" />
			</Table.Row>
			<Table.Row>
				<Text content="Sizing" font-semibold />
				<Text.Code content="w-full, h-[200px], max-w-lg" />
			</Table.Row>
			<Table.Row>
				<Text content="Colors" font-semibold />
				<Text.Code content="bg-[#fff], text-red-500" />
			</Table.Row>
			<Table.Row>
				<Text content="Typography" font-semibold />
				<Text.Code content="font-bold, text-xl, leading-tight" />
			</Table.Row>
			<Table.Row>
				<Text content="Borders" font-semibold />
				<Text.Code content="border, border-b-2, rounded-md" />
			</Table.Row>
		</Table>
	</Div>

	<Divider border={colors.border} />

	<!-- Emulation -->
	<Div p-8>
		<Text.H2 content="Magic Emulation" text={colors.text} />
		<Spacer h-4 />
		<Text.Paragraph content="Some CSS properties don't work well in email. We emulate them for you:" text={colors.textMuted} />
		<Spacer h-4 />
		
		<Div bg={colors.codeBg} p-4 rounded border={colors.border}>
			<Text.H5 content="Margins (`m-*`)" text={colors.primaryDark} />
			<Text content="Emulated via wrapper tables with padding. Safe to use!" text={colors.textMuted} />
		</Div>
		<Spacer h-3 />
		<Div bg={colors.codeBg} p-4 rounded border={colors.border}>
			<Text.H5 content="Opacity (`opacity-*`)" text={colors.primaryDark} />
			<Text content="Calculated by blending colors against the background. Renders as solid hex codes." text={colors.textMuted} />
		</Div>
	</Div>

	<!-- Footer -->
	<Div p-6 bg={colors.codeBg} align-center border-t={colors.border}>
		<Text.Small content="Next: Learn about [Layouts](5)" text={colors.textMuted} />
	</Div>
</Email>
