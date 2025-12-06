<script lang="ts">
	/**
	 * Basic Components
	 * 
	 * The building blocks of your email.
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

</script>

<Email
	order=1
	category='3. Components'
	preview="Basic components reference"
	body-bg={colors.background}
	bg={colors.white}
	max-w-[700px]
>
	<!-- Header -->
	<Div p-8 bg={colors.primary}>
		<Text.H1 content="🧱 Basic Components" text={colors.white} text-3xl font-bold />
		<Spacer h-2 />
		<Text content="The fundamental building blocks for every email." text={colors.white} text-opacity-90 text-lg />
	</Div>

	<!-- Div -->
	<Div p-8>
		<Text.H2 content="Div" text={colors.text} />
		<Spacer h-2 />
		<Text.Paragraph content="The universal container. Use it for layout, spacing, backgrounds, and grouping." text={colors.textMuted} />
		<Spacer h-4 />
		<Div bg={colors.codeBg} p-4 border={colors.border} rounded>
			<Text.Codeblock content={`<Div p-4 bg="#f0f0f0">Content</Div>`} highlight="svelte" />
		</Div>
	</Div>

	<Divider border={colors.border} />

	<!-- Text -->
	<Div p-8>
		<Text.H2 content="Text" text={colors.text} />
		<Spacer h-2 />
		<Text.Paragraph content="Renders text with markdown support. Comes in several variants:" text={colors.textMuted} />
		<Spacer h-4 />
		
		<Table cols="30% 70%" border>
			<Table.Row header bg={colors.background}>
				<Text content="Component" font-bold />
				<Text content="Description" font-bold />
			</Table.Row>
			<Table.Row>
				<Text.Code content="<Text />" />
				<Text content="Inline text (span)" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="<Text.Paragraph />" />
				<Text content="Block text (p) with margins" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="<Text.H1 />" />
				<Text content="Headings (H1-H6)" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="<Text.Small />" />
				<Text content="Small text" />
			</Table.Row>
		</Table>
	</Div>

	<Divider border={colors.border} />

	<!-- Spacer -->
	<Div p-8>
		<Text.H2 content="Spacer" text={colors.text} />
		<Spacer h-2 />
		<Text.Paragraph content="Creates empty space. Context-aware: creates vertical space in rows, horizontal space in columns." text={colors.textMuted} />
		<Spacer h-4 />
		<Div bg={colors.codeBg} p-4 border={colors.border} rounded>
			<Text.Codeblock content={`<Spacer h-8 /> <!-- 2rem height -->`} highlight="svelte" />
		</Div>
	</Div>

	<Divider border={colors.border} />

	<!-- Divider -->
	<Div p-8>
		<Text.H2 content="Divider" text={colors.text} />
		<Spacer h-2 />
		<Text.Paragraph content="A horizontal rule (hr) to separate content sections." text={colors.textMuted} />
		<Spacer h-4 />
		<Div bg={colors.codeBg} p-4 border={colors.border} rounded>
			<Text.Codeblock content={`<Divider border="#ccc" />`} highlight="svelte" />
		</Div>
	</Div>

	<!-- Footer -->
	<Div p-6 bg={colors.codeBg} align-center border-t={colors.border}>
		<Text.Small content="Next: [Interactive Components](8)" text={colors.textMuted} />
	</Div>
</Email>
