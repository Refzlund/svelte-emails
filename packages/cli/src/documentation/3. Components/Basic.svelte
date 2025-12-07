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
		Divider,
		Table
	} from 'svelte-emails'
	import { colors, style } from '../theme'
	import { footer } from '../Shared/Footer.svelte'
	import Preview from '../Shared/Preview.svelte'

	const divExample = `<Div p-4 bg-[#f0f0f0]>
  <Text content="Content inside a Div" />
</Div>`

	const tableExample = `<Table cols="40% 30% 30%" border striped>
  <Table.Row header bg-[#eee]>
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

	const cellPaddingExample = `<Table cols="50% 50%" border cell-padding-6>
  <Table.Row header bg-[#f3f4f6]>
    <Text content="Feature" font-bold />
    <Text content="Status" font-bold />
  </Table.Row>
  <Table.Row>
    <Text content="Cell padding" />
    <Text content="Spacious!" />
  </Table.Row>
</Table>`

	const borderOptionsExample = `<!-- border: Full borders (outer + cells) -->
<Table cols="50% 50%" border>...</Table>

<!-- border-outer: Outer border only -->
<Table cols="50% 50%" border-outer>...</Table>

<!-- No border (default) -->
<Table cols="50% 50%">...</Table>`

	const dividerExample = `<Divider border-[#ccc] />`

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
	<Div rows gap-2 p-8 bg={colors.primary}>
		<Text.H1 content="🧱 Basic Components" text={colors.white} text-3xl font-bold />
		<Text content="The fundamental building blocks for every email." text={colors.white} text-opacity-90 text-lg />
	</Div>

	<!-- Div -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Div" text={colors.text} />
		<Text.Paragraph content="The universal container. Use it for layout, spacing, backgrounds, and grouping." text={colors.textMuted} />
		<Text.Codeblock content={divExample} highlight="svelte" />
		
		<Preview>
			<Text content="Content inside a Div" />
		</Preview>
	</Div>

	<Divider border={colors.border} />

	<!-- Text -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Text" text={colors.text} />
		<Text.Paragraph content="Renders text with markdown support. Comes in several variants:" text={colors.textMuted} />
		
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
			<Table.Row>
				<Text.Code content="<Text.Code />" />
				<Text content="Inline code (with optional syntax highlighting)" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="<Text.Codeblock />" />
				<Text content="Multi-line code block (pre)" />
			</Table.Row>
		</Table>
	</Div>

	<Divider border={colors.border} />

	<!-- Divider -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Divider" text={colors.text} />
		<Text.Paragraph content="A horizontal rule (hr) to separate content sections." text={colors.textMuted} />
		<Text.Codeblock content={dividerExample} highlight="svelte" />
		
		<Preview>
			<Text content="Content above" text={colors.textMuted} />
			<Divider border={colors.border} />
			<Text content="Content below" text={colors.textMuted} />
		</Preview>
	</Div>

	<Divider border={colors.border} />

	<!-- Table -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Table" text={colors.text} />
		<Text.Paragraph content="For tabular data (not layout). Supports headers, striping, borders, and cell padding options." text={colors.textMuted} />
		<Text.Codeblock content={tableExample} highlight="svelte" />
		
		<Preview>
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
		</Preview>
	</Div>

	<Divider border={colors.border} />

	<!-- Table Attributes Reference -->
	<Div rows gap-4 p-8>
		<Text.H3 content="Table Attributes" text={colors.text} />
		
		<Table cols="30% 70%" border>
			<Table.Row header bg={colors.background}>
				<Text content="Attribute" font-bold />
				<Text content="Description" font-bold />
			</Table.Row>
			<Table.Row>
				<Text.Code content='cols="40% 30% 30%"' />
				<Text content="Column widths (percentages, px, or fr units)" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="border" />
				<Text content="Full borders (outer + cells)" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="border-outer" />
				<Text content="Outer border only (no cell borders)" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="striped" />
				<Text content="Alternating row backgrounds" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="compact" />
				<Text content="Reduced cell padding" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="cell-padding-*" />
				<Text content="Cell padding (0-12 scale or arbitrary: `cell-padding-[16px]`)" />
			</Table.Row>
		</Table>
	</Div>

	<Divider border={colors.border} />

	<!-- Border Options -->
	<Div rows gap-4 p-8>
		<Text.H3 content="Border Options" text={colors.text} />
		<Text.Paragraph content="Control where borders appear on your table." text={colors.textMuted} />
		<Text.Codeblock content={borderOptionsExample} highlight="svelte" />

		<Preview>
			<Div cols gap-4 responsive>
				<Div rows gap-2>
					<Text.Small content="**border** (full)" text={colors.textMuted} />
					<Table cols="50% 50%" border>
						<Table.Row header bg={colors.background}>
							<Text content="A" font-bold />
							<Text content="B" font-bold />
						</Table.Row>
						<Table.Row>
							<Text content="1" />
							<Text content="2" />
						</Table.Row>
					</Table>
				</Div>

				<Div rows gap-2>
					<Text.Small content="**border-outer** (outer only)" text={colors.textMuted} />
					<Table cols="50% 50%" border-outer>
						<Table.Row header bg={colors.background}>
							<Text content="A" font-bold />
							<Text content="B" font-bold />
						</Table.Row>
						<Table.Row>
							<Text content="1" />
							<Text content="2" />
						</Table.Row>
					</Table>
				</Div>

				<Div rows gap-2>
					<Text.Small content="**(no border)** default" text={colors.textMuted} />
					<Table cols="50% 50%">
						<Table.Row header bg={colors.background}>
							<Text content="A" font-bold />
							<Text content="B" font-bold />
						</Table.Row>
						<Table.Row>
							<Text content="1" />
							<Text content="2" />
						</Table.Row>
					</Table>
				</Div>
			</Div>
		</Preview>
	</Div>

	<Divider border={colors.border} />

	<!-- Cell Padding -->
	<Div rows gap-4 p-8>
		<Text.H3 content="Cell Padding" text={colors.text} />
		<Text.Paragraph content="Control the padding inside table cells. Use scale values (0-12) or arbitrary values." text={colors.textMuted} />
		<Text.Codeblock content={cellPaddingExample} highlight="svelte" />

		<Div cols gap-4>
			<Div rows gap-2>
				<Text.Small content="**compact**" text={colors.textMuted} />
				<Table cols="50% 50%" border compact>
					<Table.Row header bg={colors.background}>
						<Text content="Compact" font-bold />
						<Text content="Table" font-bold />
					</Table.Row>
					<Table.Row>
						<Text content="Tight" />
						<Text content="Cells" />
					</Table.Row>
				</Table>
			</Div>

			<Div rows gap-2>
				<Text.Small content="**cell-padding-4** (default)" text={colors.textMuted} />
				<Table cols="50% 50%" border cell-padding-4>
					<Table.Row header bg={colors.background}>
						<Text content="Normal" font-bold />
						<Text content="Padding" font-bold />
					</Table.Row>
					<Table.Row>
						<Text content="Standard" />
						<Text content="Cells" />
					</Table.Row>
				</Table>
			</Div>

			<Div rows gap-2>
				<Text.Small content="**cell-padding-8**" text={colors.textMuted} />
				<Table cols="50% 50%" border cell-padding-8>
					<Table.Row header bg={colors.background}>
						<Text content="Spacious" font-bold />
						<Text content="Padding" font-bold />
					</Table.Row>
					<Table.Row>
						<Text content="Roomy" />
						<Text content="Cells" />
					</Table.Row>
				</Table>
			</Div>
		</Div>
	</Div>

	<!-- Footer -->
	{@render footer()}
</Email>
