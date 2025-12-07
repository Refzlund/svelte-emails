<script lang="ts">
	/**
	 * Layout System
	 * 
	 * Rows, columns, and responsive layouts.
	 */
	import {
		Email,
		Div,
		Text,
		Divider,
		Table,
		Button,
		Br
	} from 'svelte-emails'
	import { colors, style } from '../theme'
	import { footer } from '../Shared/Footer.svelte'
	import { callout } from '../Shared/Callout.svelte'
	import Preview from '../Shared/Preview.svelte'

	const colsExample = `<Div cols gap-4>
  <Div bg-[${colors.demoA}] p-4>
    <Text content="Left" />
  </Div>
  <Div bg-[${colors.demoB}] p-4>
    <Text content="Right" />
  </Div>
</Div>`

	const rowsExample = `<Div rows gap-4>
  <Div bg-[${colors.demoA}] p-4>
    <Text content="Top" />
  </Div>
  <Div bg-[${colors.demoB}] p-4>
    <Text content="Bottom" />
  </Div>
</Div>`

	const explicitWidthsExample = `<!-- Equal widths (default) -->
<Div cols gap-4>
  <Div p-4 bg-[#gray]><Text content="50%" /></Div>
  <Div p-4 bg-[#gray]><Text content="50%" /></Div>
</Div>

<!-- Fixed left, flexible right -->
<Div cols gap-4>
  <Div w-[200px] p-4 bg-[#gray]><Text content="200px fixed" /></Div>
  <Div p-4 bg-[#gray]><Text content="Fills remaining" /></Div>
</Div>

<!-- Percentage-based -->
<Div cols gap-4>
  <Div w-[30%] p-4 bg-[#gray]><Text content="30%" /></Div>
  <Div w-[70%] p-4 bg-[#gray]><Text content="70%" /></Div>
</Div>`

	const gapSpacingExample = `<!-- Gap applies between children -->
<Div rows gap-6>
  <Text.H1 content="Title" />
  <Text.Paragraph content="First paragraph..." />
  <Text.Paragraph content="Second paragraph..." />
</Div>

<!-- Multiple gap sizes in one layout -->
<Div rows gap-8>
  <Div rows gap-2>
    <Text.H2 content="Section 1" />
    <Text.Paragraph content="Tight spacing within..." />
  </Div>
  <Div rows gap-2>
    <Text.H2 content="Section 2" />
    <Text.Paragraph content="More content..." />
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

	const visibilityExample = `<Div cols gap-4>
  <Div desktop-only p-4 bg-[${colors.demoB}]>
    <Text content="Visible on desktop only" />
  </Div>
  <Div mobile-only p-4 bg-[${colors.demoA}]>
    <Text content="Visible on mobile only" />
  </Div>
</Div>`

	const alignItemsExample = `<Div cols gap-4 align-items-center h-[150px]>
  <Div p-4 bg-[${colors.demoA}]>
    <Text content="Tall" />
    <Br />
    <Text content="Content" />
  </Div>
  <Div p-4 bg-[${colors.demoB}]>
    <Text content="Centered vertically" />
  </Div>
</Div>`

	const alignCenterExample = `<Div align-center p-4>
  <Text content="Centered content" />
</Div>

<!-- All alignment options -->
<Div align-top-left />      <!-- Top left -->
<Div align-top />           <!-- Top center -->
<Div align-top-right />     <!-- Top right -->
<Div align-left />          <!-- Middle left -->
<Div align-center />        <!-- Middle center -->
<Div align-right />         <!-- Middle right -->
<Div align-bottom-left />   <!-- Bottom left -->
<Div align-bottom />        <!-- Bottom center -->
<Div align-bottom-right />  <!-- Bottom right -->`

	const textInlineExample = `<Div>
  <Text inline content="Hello, " />
  <Text inline content="World!" font-bold />
</Div>

<!-- Result: "Hello, World!" on one line -->`

	const brExample = `<Text content="Line one" />
<Br />
<Br />
<Text content="Line two (with extra space above)" />`

</script>

<Email
	order=1
	category='2. Core Concepts'
	preview="Building layouts with rows, cols, and responsive design"
	body-bg={colors.background}
	bg={colors.white}
	max-w-[700px]
>
	<!-- Header -->
	<Div rows gap-2 p-8 bg={colors.primary}>
		<Text.H1 content="📐 Layout System" text={colors.white} text-3xl font-bold />
		<Text content="Rows, columns, and responsive email layouts." text={colors.white} text-opacity-90 text-lg />
	</Div>

	<!-- Overview -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Overview" text={colors.text} />
		<Text.Paragraph content="Email layouts use **tables** under the hood. The `<Div>` component abstracts this complexity with two simple layout modes:" text={colors.textMuted} />
		
		<Table cols="30% 70%" border>
			<Table.Row header bg={colors.background}>
				<Text content="Attribute" font-bold />
				<Text content="Behavior" font-bold />
			</Table.Row>
			<Table.Row>
				<Text.Code content="cols" />
				<Text content="Horizontal layout (side by side) — children become table cells" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="rows" />
				<Text content="Vertical layout (stacked) — children become table rows" />
			</Table.Row>
		</Table>
	</Div>

	<Divider border={colors.border} />

	<!-- Columns -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Horizontal: cols" text={colors.text} />
		<Text.Paragraph content="Place elements side by side with `cols`:" text={colors.textMuted} />
		
		<Text.Codeblock content={colsExample} highlight="svelte" />
		
		<!-- Live demo -->
		<Div cols gap-4>
			<Div bg={colors.demoA} border={colors.demoABorder} p-4 rounded align-center>
				<Text content="Left" />
			</Div>
			<Div bg={colors.demoB} border={colors.demoBBorder} p-4 rounded align-center>
				<Text content="Right" />
			</Div>
		</Div>
		
		<Text.Small content="By default, columns share width equally. Add more children for more columns." text={colors.textMuted} />
	</Div>

	<Divider border={colors.border} />

	<!-- Rows -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Vertical: rows" text={colors.text} />
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

	<!-- Responsive Layouts -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Responsive Layouts" text={colors.text} />
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

	<!-- Conditional Visibility -->
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

	<!-- Explicit Widths -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Explicit Widths" text={colors.text} />
		<Text.Paragraph content="Control column widths with `w-[value]`:" text={colors.textMuted} />
		
		<Text.Codeblock content={explicitWidthsExample} highlight="svelte" />
		
		<Div cols gap-4>
			<Div w-[30%] bg={colors.codeBg} p-4 border={colors.border} rounded align-center>
				<Text content="30%" font-mono />
			</Div>
			<Div w-[70%] bg={colors.primary} p-4 rounded align-center>
				<Text content="70%" text={colors.white} font-mono />
			</Div>
		</Div>
		
		<Text.Small content="Mix fixed (`w-[200px]`), percentage (`w-[70%]`), and flexible widths in the same row." text={colors.textMuted} />
	</Div>

	<Divider border={colors.border} />

	<!-- Gap Spacing -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Gap Spacing" text={colors.text} />
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
				<Text.Code content="gap-3" />
				<Text content="0.75rem" />
				<Text content="12px" />
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
				<Text.Code content="gap-10" />
				<Text content="2.5rem" />
				<Text content="40px" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="gap-12" />
				<Text content="3rem" />
				<Text content="48px" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="gap-[20px]" />
				<Text content="—" />
				<Text content="Arbitrary value" />
			</Table.Row>
		</Table>
		
		{@render callout('tip', 'All `gap-*`, `p-*`, and `m-*` values use rem units, converted to px based on `root.size` in your StyleConfig (default: 16px).')}
		
		<Text.Codeblock content={gapSpacingExample} highlight="svelte" />
	</Div>

	<!-- Best Practice Callout -->
	<Div rows gap-4 p-6 m-8 bg-[#ecfdf5] border-[#10b981] rounded>
		<Text.H3 content="✅ Best Practice: Use gap-* Instead of Spacer" text-[#065f46] />
		<Text.Paragraph content="While `<Spacer h-4 />` works, the **recommended approach** is to wrap content in a `<Div>` with `rows` or `cols` and use `gap-*` for spacing. This creates cleaner, more maintainable layouts." text-[#065f46] />
		
		<Div cols responsive gap-4>
			<Div rows gap-2>
				<Text.Small content="❌ Avoid:" text-[#991b1b] font-bold />
				<Text.Codeblock content={`<Text content='A' />
<Spacer h-4 />
<Text content='B' />
<Spacer h-4 />
<Text content='C' />`} highlight="svelte" />
			</Div>
			<Div rows gap-2>
				<Text.Small content="✅ Prefer:" text-[#065f46] font-bold />
				<Text.Codeblock content={`<Div rows gap-4>
  <Text content='A' />
  <Text content='B' />
  <Text content='C' />
</Div>`} highlight="svelte" />
			</Div>
		</Div>
	</Div>

	<Divider border={colors.border} />

	<!-- Alignment -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Alignment" text={colors.text} />
		<Text.Paragraph content="Control content positioning with `align-*` attributes. These set both horizontal (`text-align`) and vertical (`vertical-align`) alignment." text={colors.textMuted} />
		
		<Text.Codeblock content={alignCenterExample} highlight="svelte" />
		
		<!-- 3x3 Alignment Grid Demo -->
		<Div rows gap-2>
			<Div cols gap-2>
				<Div h-[80px] bg={colors.demoA} border={colors.demoABorder} p-2 rounded align-top-left>
					<Text content="top-left" text-xs font-mono />
				</Div>
				<Div h-[80px] bg={colors.demoB} border={colors.demoBBorder} p-2 rounded align-top>
					<Text content="top" text-xs font-mono />
				</Div>
				<Div h-[80px] bg={colors.demoA} border={colors.demoABorder} p-2 rounded align-top-right>
					<Text content="top-right" text-xs font-mono />
				</Div>
			</Div>
			<Div cols gap-2>
				<Div h-[80px] bg={colors.demoB} border={colors.demoBBorder} p-2 rounded align-left>
					<Text content="left" text-xs font-mono />
				</Div>
				<Div h-[80px] bg={colors.primary} p-2 rounded align-center>
					<Text content="center" text-xs font-mono text={colors.white} />
				</Div>
				<Div h-[80px] bg={colors.demoB} border={colors.demoBBorder} p-2 rounded align-right>
					<Text content="right" text-xs font-mono />
				</Div>
			</Div>
			<Div cols gap-2>
				<Div h-[80px] bg={colors.demoA} border={colors.demoABorder} p-2 rounded align-bottom-left>
					<Text content="bottom-left" text-xs font-mono />
				</Div>
				<Div h-[80px] bg={colors.demoB} border={colors.demoBBorder} p-2 rounded align-bottom>
					<Text content="bottom" text-xs font-mono />
				</Div>
				<Div h-[80px] bg={colors.demoA} border={colors.demoABorder} p-2 rounded align-bottom-right>
					<Text content="bottom-right" text-xs font-mono />
				</Div>
			</Div>
		</Div>

		<Table cols="35% 65%" border>
			<Table.Row header bg={colors.background}>
				<Text content="Attribute" font-bold />
				<Text content="Position" font-bold />
			</Table.Row>
			<Table.Row>
				<Text.Code content="align-top-left" />
				<Text content="Top left corner" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="align-top" />
				<Text content="Top center" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="align-top-right" />
				<Text content="Top right corner" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="align-left" />
				<Text content="Middle left" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="align-center" />
				<Text content="Middle center (default for buttons)" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="align-right" />
				<Text content="Middle right" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="align-bottom-left" />
				<Text content="Bottom left corner" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="align-bottom" />
				<Text content="Bottom center" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="align-bottom-right" />
				<Text content="Bottom right corner" />
			</Table.Row>
		</Table>
	</Div>

	<Divider border={colors.border} />

	<!-- Br component -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Line Breaks: Br" text={colors.text} />
		<Text.Paragraph content="Use `<Br />` for explicit line breaks within content:" text={colors.textMuted} />
		
		<Text.Codeblock content={brExample} highlight="svelte" />
		
		<Preview>
			<Text content="Line one" />
			<Br />
			<Br />
			<Text content="Line two (with extra space above)" />
		</Preview>
		
		<Text.Small content="`<Br />` renders as a `<br>` tag. Stack multiple for more vertical space when gap-* isn't appropriate." text={colors.textMuted} />
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
				<Text.Code content="align-*" />
				<Text content="Vertical and horizontal alignment" />
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

	{@render footer()}
</Email>
