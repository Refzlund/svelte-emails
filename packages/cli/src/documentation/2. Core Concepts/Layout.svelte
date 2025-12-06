<script lang="ts">
	/**
	 * Layout System
	 * 
	 * Grid layouts, responsiveness, and tables.
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

	const gridExample = `<Div cols="50% 50%" gap-4>
  <Div>Left</Div>
  <Div>Right</Div>
</Div>`

	const responsiveExample = `<Div cols responsive gap-4>
  <Div>Column 1</Div>
  <Div>Column 2</Div>
</Div>`

</script>

<Email
	order=2
	category='2. Core Concepts'
	preview="Master layouts with svelte-emails"
	body-bg={colors.background}
	bg={colors.white}
	max-w-[700px]
>
	<!-- Header -->
	<Div p-8 bg={colors.primary}>
		<Text.H1 content="📐 Layout System" text={colors.white} text-3xl font-bold />
		<Spacer h-2 />
		<Text content="Build complex layouts without touching a single <table> tag." text={colors.white} text-opacity-90 text-lg />
	</Div>

	<!-- The Grid -->
	<Div p-8>
		<Text.H2 content="The Grid System" text={colors.text} />
		<Spacer h-4 />
		<Text.Paragraph content="Forget CSS Grid and Flexbox (they don't work in email). Use our `cols` and `rows` attributes on `<Div>` components." text={colors.textMuted} />
		
		<Spacer h-6 />
		
		<Text.H4 content="Columns (Horizontal)" text={colors.text} />
		<Text.Codeblock content={gridExample} highlight="svelte" />
		
		<Spacer h-4 />
		
		<Div cols="50% 50%" gap-4>
			<Div bg={colors.codeBg} p-4 border={colors.border} align-center><Text content="Left" /></Div>
			<Div bg={colors.codeBg} p-4 border={colors.border} align-center><Text content="Right" /></Div>
		</Div>
	</Div>

	<Divider border={colors.border} />

	<!-- Responsiveness -->
	<Div p-8>
		<Text.H2 content="Responsiveness" text={colors.text} />
		<Spacer h-4 />
		<Text.Paragraph content="Add the `responsive` attribute to stack columns on mobile devices." text={colors.textMuted} />
		<Spacer h-3 />
		<Text.Codeblock content={responsiveExample} highlight="svelte" />
		
		<Spacer h-4 />
		
		<Div bg={colors.codeBg} p-4 rounded border={colors.border}>
			<Text.Small content="**How it works:** On desktop, it renders as a table row. On mobile, we use media queries to switch cells to `display: block`, causing them to stack vertically." text={colors.textMuted} />
		</Div>
	</Div>

	<Divider border={colors.border} />

	<!-- Spanning -->
	<Div p-8>
		<Text.H2 content="Column Spanning" text={colors.text} />
		<Spacer h-4 />
		<Text.Paragraph content="Use `span-N` to make a child span multiple columns." text={colors.textMuted} />
		
		<Spacer h-4 />
		
		<Div cols="25% 25% 25% 25%" gap-2>
			<Div span-2 bg={colors.primary} p-2 align-center><Text content="Span 2" text={colors.white} /></Div>
			<Div bg={colors.codeBg} p-2 align-center border={colors.border}><Text content="1" /></Div>
			<Div bg={colors.codeBg} p-2 align-center border={colors.border}><Text content="1" /></Div>
		</Div>
	</Div>

	<!-- Footer -->
	<Div p-6 bg={colors.codeBg} align-center border-t={colors.border}>
		<Text.Small content="Next: Learn about [Content & Markdown](6)" text={colors.textMuted} />
	</Div>
</Email>
