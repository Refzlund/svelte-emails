<script lang="ts">
	/**
	 * Email Specific Components
	 * 
	 * Root component, Unsubscribe, and Data Tables.
	 */
	import {
		Email,
		Div,
		Text,
		Button,
		Spacer,
		Divider,
		Table,
		Unsubscribe
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

	const emailCode = `<Email
  preview="Your receipt"
  body-bg="#f3f4f6"
  bg="#ffffff"
  max-w="600px"
>
  ...
</Email>`

	const tableCode = `<Table cols="40% 30% 30%" border striped>
  <Table.Row header bg="#eee">
    <Text content="Item" />
    <Text content="Qty" />
    <Text content="Price" />
  </Table.Row>
  <Table.Row>
    <Text content="Widget" />
    <Text content="1" />
    <Text content="$10" />
  </Table.Row>
</Table>`

</script>

<Email
	order=3
	category='3. Components'
	preview="Email specific components reference"
	body-bg={colors.background}
	bg={colors.white}
	max-w-[700px]
>
	<!-- Header -->
	<Div p-8 bg={colors.primary}>
		<Text.H1 content="📧 Email Specifics" text={colors.white} text-3xl font-bold />
		<Spacer h-2 />
		<Text content="Components designed specifically for email requirements." text={colors.white} text-opacity-90 text-lg />
	</Div>

	<!-- Email Root -->
	<Div p-8>
		<Text.H2 content="Email (Root)" text={colors.text} />
		<Spacer h-2 />
		<Text.Paragraph content="The required root component for every template. Handles the HTML shell, head, and body." text={colors.textMuted} />
		<Spacer h-4 />
		<Div bg={colors.codeBg} p-4 border={colors.border} rounded>
			<Text.Codeblock content={emailCode} highlight="svelte" />
		</Div>
		<Spacer h-4 />
		<Text.Small content="**Props:**" text={colors.text} font-bold />
		<Text content="
- `preview`: Preheader text shown in inbox
- `body-bg`: Background color of the full email window
- `bg`: Background color of the content container
- `max-w`: Max width of the content (default 600px)
" text={colors.textMuted} />
	</Div>

	<Divider border={colors.border} />

	<!-- Table -->
	<Div p-8>
		<Text.H2 content="Table" text={colors.text} />
		<Spacer h-2 />
		<Text.Paragraph content="For tabular data (not layout). Supports headers, striping, and borders." text={colors.textMuted} />
		<Spacer h-4 />
		<Div bg={colors.codeBg} p-4 border={colors.border} rounded>
			<Text.Codeblock content={tableCode} highlight="svelte" />
		</Div>
		<Spacer h-4 />
		
		<Table cols="40% 30% 30%" border striped>
			<Table.Row header bg={colors.background}>
				<Text content="Item" font-bold />
				<Text content="Qty" font-bold />
				<Text content="Price" font-bold />
			</Table.Row>
			<Table.Row>
				<Text content="Widget" />
				<Text content="1" />
				<Text content="$10.00" />
			</Table.Row>
			<Table.Row>
				<Text content="Gadget" />
				<Text content="2" />
				<Text content="$20.00" />
			</Table.Row>
		</Table>
	</Div>

	<Divider border={colors.border} />

	<!-- Unsubscribe -->
	<Div p-8>
		<Text.H2 content="Unsubscribe" text={colors.text} />
		<Spacer h-2 />
		<Text.Paragraph content="Renders a standard unsubscribe link. Required by CAN-SPAM laws." text={colors.textMuted} />
		<Spacer h-4 />
		<Div bg={colors.codeBg} p-4 border={colors.border} rounded>
			<Text.Codeblock content={`<Unsubscribe href="[[unsubscribe_url]]" content="Unsubscribe here" />`} highlight="svelte" />
		</Div>
		<Spacer h-4 />
		<Unsubscribe href="#" content="Unsubscribe here" text={colors.textMuted} />
	</Div>

	<!-- Footer -->
	<Div p-6 bg={colors.codeBg} align-center border-t={colors.border}>
		<Text.Small content="Next: [Best Practices](10)" text={colors.textMuted} />
	</Div>
</Email>
