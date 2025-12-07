<script lang="ts">
	/**
	 * Responsive Layout
	 * 
	 * Comprehensive guide to cols, rows, responsive, and gap-* attributes.
	 */
	import {
		Email,
		Div,
		Text,
		Divider,
		Table
	} from 'svelte-emails'
	import { colors, style } from '../theme'
	import { footer } from '../Shared/Footer.svelte'
	import { callout } from '../Shared/Callout.svelte'
	import Preview from '../Shared/Preview.svelte'

	const colsExample = `<Div cols gap-4>
  <Div bg-[${colors.demoA}] p-4>
    <Text content="Column 1" />
  </Div>
  <Div bg-[${colors.demoB}] p-4>
    <Text content="Column 2" />
  </Div>
</Div>`

	const colsWidthsExample = `<!-- Equal widths (default) -->
<Div cols gap-4>
  <Div p-4 bg-[#gray]><Text content="50%" /></Div>
  <Div p-4 bg-[#gray]><Text content="50%" /></Div>
</Div>

<!-- Custom percentages -->
<Div cols="30% 40% 30%" gap-4>
  <Div p-4 bg-[#gray]><Text content="30%" /></Div>
  <Div p-4 bg-[#gray]><Text content="40%" /></Div>
  <Div p-4 bg-[#gray]><Text content="30%" /></Div>
</Div>`

	const rowsExample = `<Div rows gap-4>
  <Div bg-[${colors.demoA}] p-4>
    <Text content="Top" />
  </Div>
  <Div bg-[${colors.demoB}] p-4>
    <Text content="Bottom" />
  </Div>
</Div>`

	const responsiveExample = `<Div cols responsive gap-4>
  <Div p-4 bg-[${colors.demoA}]>
    <Text content="Side by side on desktop" />
    <Text content="Stacked on mobile" />
  </Div>
  <Div p-4 bg-[${colors.demoB}]>
    <Text content="Column 2" />
  </Div>
</Div>`

	const gapExample = `<!-- Gap applies between children -->
<Div rows gap-6>
  <Text.H1 content="Title" />
  <Text.Paragraph content="First paragraph..." />
  <Text.Paragraph content="Second paragraph..." />
</Div>`

	const nestedExample = `<Div cols responsive gap-4>
  <Div rows gap-2>
    <Text.H3 content='Section A' />
    <Text content='Content for section A' />
  </Div>
  <Div rows gap-2>
    <Text.H3 content='Section B' />
    <Text content='Content for section B' />
  </Div>
</Div>`

	const visibilityExample = `<Div cols gap-4>
  <Div desktop-only p-4 bg-[${colors.demoB}]>
    <Text content="Visible on desktop only" />
  </Div>
  <Div mobile-only p-4 bg-[${colors.demoA}]>
    <Text content="Visible on mobile only" />
  </Div>
</Div>`

</script>

<Email
	order=3
	category='3. Components'
	preview="Responsive layouts with cols, rows, and gap"
	body-bg={colors.background}
	bg={colors.white}
	max-w-[700px]
>
	<!-- Header -->
	<Div rows gap-2 p-8 bg={colors.primary}>
		<Text.H1 content="📱 Responsive Layout" text={colors.white} text-3xl font-bold />
		<Text content="Master cols, rows, responsive, and gap-* for email layouts." text={colors.white} text-opacity-90 text-lg />
	</Div>

	<!-- Cols -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Columns (cols)" text={colors.text} />
		<Text.Paragraph content="Place elements side by side with `cols`:" text={colors.textMuted} />
		
		<Text.Codeblock content={colsExample} highlight="svelte" />
		
		<!-- Live demo -->
		<Div cols gap-4>
			<Div bg={colors.demoA} border={colors.demoABorder} p-4 rounded align-center>
				<Text content="Column 1" />
			</Div>
			<Div bg={colors.demoB} border={colors.demoBBorder} p-4 rounded align-center>
				<Text content="Column 2" />
			</Div>
		</Div>
		
		<Text.Small content="By default, columns share width equally. Add more children for more columns." text={colors.textMuted} />
	</Div>

	<Div rows gap-4 p-8>
		<Text.H3 content="Custom Column Widths" text={colors.text} />
		<Text.Paragraph content={'Control column widths with `cols="..."` or `w-[value]`:'} text={colors.textMuted} />
		
		<Text.Codeblock content={colsWidthsExample} highlight="svelte" />
		
		<Div cols="30% 40% 30%" gap-4>
			<Div bg={colors.codeBg} p-4 border={colors.border} rounded align-center>
				<Text content="30%" font-mono />
			</Div>
			<Div bg={colors.primary} p-4 rounded align-center>
				<Text content="40%" text={colors.white} font-mono />
			</Div>
			<Div bg={colors.codeBg} p-4 border={colors.border} rounded align-center>
				<Text content="30%" font-mono />
			</Div>
		</Div>
	</Div>

	<Divider border={colors.border} />

	<!-- Rows -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Rows (rows)" text={colors.text} />
		<Text.Paragraph content="Stack elements vertically with `rows`:" text={colors.textMuted} />
		
		<Text.Codeblock content={rowsExample} highlight="svelte" />
		
		<!-- Live demo -->
		<Div rows gap-4>
			<Div bg={colors.demoA} border={colors.demoABorder} p-4 rounded align-center>
				<Text content="Top" />
			</Div>
			<Div bg={colors.demoB} border={colors.demoBBorder} p-4 rounded align-center>
				<Text content="Bottom" />
			</Div>
		</Div>
	</Div>

	<Divider border={colors.border} />

	<!-- Gap -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Gap Spacing (gap-*)" text={colors.text} />
		<Text.Paragraph content="Add consistent spacing between children with `gap-*`:" text={colors.textMuted} />
		
		<Table cols="20% 25% 55%" border>
			<Table.Row header bg={colors.background}>
				<Text content="Attribute" font-bold />
				<Text content="rem" font-bold />
				<Text content="Default (16px root)" font-bold />
			</Table.Row>
			<Table.Row>
				<Text.Code content="gap-1" />
				<Text content="0.25rem" />
				<Text content="4px" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="gap-2" />
				<Text content="0.5rem" />
				<Text content="8px" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="gap-4" />
				<Text content="1rem" />
				<Text content="16px" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="gap-6" />
				<Text content="1.5rem" />
				<Text content="24px" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="gap-8" />
				<Text content="2rem" />
				<Text content="32px" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="gap-[20px]" />
				<Text content="—" />
				<Text content="Arbitrary value" />
			</Table.Row>
		</Table>
		
		<Text.Codeblock content={gapExample} highlight="svelte" />
		
		<Div rows gap-4>
			<Div rows gap-1>
				<Text.Small content="gap-2 (0.5rem):" text={colors.textMuted} />
				<Div cols gap-2>
					<Div bg={colors.primary} p-2 rounded align-center><Text content="A" text={colors.white} /></Div>
					<Div bg={colors.primary} p-2 rounded align-center><Text content="B" text={colors.white} /></Div>
					<Div bg={colors.primary} p-2 rounded align-center><Text content="C" text={colors.white} /></Div>
				</Div>
			</Div>
			<Div rows gap-1>
				<Text.Small content="gap-4 (1rem):" text={colors.textMuted} />
				<Div cols gap-4>
					<Div bg={colors.primary} p-2 rounded align-center><Text content="A" text={colors.white} /></Div>
					<Div bg={colors.primary} p-2 rounded align-center><Text content="B" text={colors.white} /></Div>
					<Div bg={colors.primary} p-2 rounded align-center><Text content="C" text={colors.white} /></Div>
				</Div>
			</Div>
			<Div rows gap-1>
				<Text.Small content="gap-8 (2rem):" text={colors.textMuted} />
				<Div cols gap-8>
					<Div bg={colors.primary} p-2 rounded align-center><Text content="A" text={colors.white} /></Div>
					<Div bg={colors.primary} p-2 rounded align-center><Text content="B" text={colors.white} /></Div>
					<Div bg={colors.primary} p-2 rounded align-center><Text content="C" text={colors.white} /></Div>
				</Div>
			</Div>
		</Div>
		
		{@render callout('tip', 'All `gap-*`, `p-*`, and `m-*` values use rem units, converted to px based on `root.size` in your StyleConfig (default: 16px).')}
	</Div>

	<Divider border={colors.border} />

	<!-- Responsive -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Responsive Columns" text={colors.text} />
		<Text.Paragraph content="Add `responsive` to `cols` to stack columns on mobile:" text={colors.textMuted} />
		
		<Text.Codeblock content={responsiveExample} highlight="svelte" />
		
		<!-- Live demo -->
		<Div cols responsive gap-4>
			<Div bg={colors.demoA} border={colors.demoABorder} p-4 rounded align-center>
				<Text content="Column 1" />
			</Div>
			<Div bg={colors.demoB} border={colors.demoBBorder} p-4 rounded align-center>
				<Text content="Column 2" />
			</Div>
		</Div>
		
		<Text.Small content="Default breakpoint is 480px. Customize with `mobile-threshold-[Npx]` on the `<Email>` component." text={colors.textMuted} />
	</Div>

	<Divider border={colors.border} />

	<!-- Mobile/Desktop Only -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Conditional Visibility" text={colors.text} />
		<Text.Paragraph content="Show or hide elements based on screen size:" text={colors.textMuted} />
		
		<Table cols="35% 65%" border>
			<Table.Row header bg={colors.background}>
				<Text content="Attribute" font-bold />
				<Text content="Behavior" font-bold />
			</Table.Row>
			<Table.Row>
				<Text.Code content="desktop-only" />
				<Text content="Visible only on screens wider than mobile threshold" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="mobile-only" />
				<Text content="Visible only on screens narrower than mobile threshold" />
			</Table.Row>
		</Table>
		
		<Text.Codeblock content={visibilityExample} highlight="svelte" />
		
		<!-- Live demo -->
		<Div cols>
			<Div desktop-only bg={colors.demoB} border={colors.demoBBorder} p-4 rounded align-center>
				<Text content="Visible on desktop only" />
			</Div>
			<Div mobile-only bg={colors.demoA} border={colors.demoABorder} p-4 rounded align-center>
				<Text content="Visible on mobile only" />
			</Div>
		</Div>
		
		{@render callout('note', 'These use CSS media queries. In clients that don\'t support media queries (like Outlook Windows), `desktop-only` content is shown and `mobile-only` content is hidden — a graceful fallback to the desktop version.')}
	</Div>

	<Divider border={colors.border} />

	<!-- Nested Layouts -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Nested Layouts" text={colors.text} />
		<Text.Paragraph content="Combine `cols` and `rows` to create complex nested layouts:" text={colors.textMuted} />
		
		<Text.Codeblock content={nestedExample} highlight="svelte" />
		
		<Div cols responsive gap-4>
			<Div rows gap-2 bg={colors.codeBg} p-4 border={colors.border} rounded>
				<Text.H4 content="Section A" text={colors.text} />
				<Text content="Content for section A goes here." text={colors.textMuted} />
			</Div>
			<Div rows gap-2 bg={colors.codeBg} p-4 border={colors.border} rounded>
				<Text.H4 content="Section B" text={colors.text} />
				<Text content="Content for section B goes here." text={colors.textMuted} />
			</Div>
		</Div>
	</Div>

	<Divider border={colors.border} />

	<!-- Quick Reference -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Quick Reference" text={colors.text} />
		
		<Table cols="35% 65%" border>
			<Table.Row header bg={colors.background}>
				<Text content="Attribute" font-bold />
				<Text content="Description" font-bold />
			</Table.Row>
			<Table.Row>
				<Text.Code content="cols" />
				<Text content="Horizontal layout (side by side)" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="rows" />
				<Text content="Vertical layout (stacked)" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="responsive" />
				<Text content="Stack columns on mobile (use with cols)" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="gap-*" />
				<Text content="Spacing between children" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="w-[value]" />
				<Text content="Explicit width for columns" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="desktop-only" />
				<Text content="Hide on mobile" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="mobile-only" />
				<Text content="Hide on desktop" />
			</Table.Row>
		</Table>
	</Div>

	<!-- Footer -->
	{@render footer()}
</Email>
