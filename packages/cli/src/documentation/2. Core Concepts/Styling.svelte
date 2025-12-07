<script lang="ts">
	/**
	 * Styling
	 * 
	 * Tailwind-like attributes and syntax options.
	 */
	import {
		Email,
		Div,
		Text,
		Divider,
		Table,
		Button
	} from 'svelte-emails'
	import { colors, style } from '../theme'
	import { footer } from '../Shared/Footer.svelte'
	import { callout } from '../Shared/Callout.svelte'

	const basicSyntaxExample = `<!-- Tailwind-like attributes on any component -->
<Div p-6 bg-[#ffffff] rounded border-[#e5e7eb]>
  <Text content="Hello!" text-lg font-bold text-[#111827] />
</Div>`

	const valueSyntaxExample = `<!-- All of these are equivalent: -->

<!-- 1. Bare attribute (Tailwind style) -->
<Div p-6>

<!-- 2. Boolean attribute (Svelte style) -->
<Div p-6={true}>

<!-- 3. String value -->
<Div p="6">

<!-- 4. Shorthand prop -->
<Div {p}>  <!-- if let p = '6' -->

<!-- 5. Dynamic value -->
<Div bg={brandColor}>`

	const paddingExample = `<!-- All sides -->
<Div p-4>          <!-- 16px all around -->

<!-- Horizontal / Vertical -->
<Div px-4>         <!-- 16px left + right -->
<Div py-4>         <!-- 16px top + bottom -->

<!-- Individual sides -->
<Div pt-4>         <!-- Top only -->
<Div pr-4>         <!-- Right only -->
<Div pb-4>         <!-- Bottom only -->
<Div pl-4>         <!-- Left only -->

<!-- Arbitrary values -->
<Div p-[20px]>     <!-- Exact pixel value -->
<Div px-[5%]>      <!-- Percentage -->`

	const marginExample = `<!-- Margin works the same as padding -->
<Div m-4>          <!-- 16px margin all sides -->
<Div mx-4>         <!-- 16px left + right -->
<Div my-4>         <!-- 16px top + bottom -->
<Div mt-4 mb-8>    <!-- Top: 16px, Bottom: 32px -->

<!-- Centering with auto -->
<Div mx-auto>      <!-- Horizontally centered -->`

	const colorsExample = `<!-- Background colors -->
<Div bg-[#ef4444]>     <!-- Red background -->
<Div bg-[#3b82f6]>     <!-- Blue background -->

<!-- Text colors -->
<Text text-[#ffffff]>  <!-- White text -->
<Text text-[#6b7280]>  <!-- Gray text -->

<!-- Border colors -->
<Div border-[#e5e7eb]> <!-- Gray border -->

<!-- Using Svelte variables -->
<Div bg={brandColor} text={textColor}>`

	const opacityExample = `<!-- Background opacity -->
<Div bg-[#000000] bg-opacity-50>
  <!-- 50% black → blends to #808080 on white -->
</Div>

<!-- Slash syntax (same result) -->
<Div bg-[#000000]/50>

<!-- Text opacity -->
<Text text-[#000000] text-opacity-60>

<!-- Element opacity (applies to all colors) -->
<Div opacity-50 bg-[#ff0000] text-[#000000]>
  <!-- Both bg and text become 50% opacity -->`

	const widthExample = `<!-- Percentage widths -->
<Div w-full>           <!-- 100% width -->
<Div w-[50%]>          <!-- 50% of parent -->

<!-- Fixed widths -->
<Div w-[200px]>        <!-- Exact 200px -->
<Div w-[25rem]>        <!-- 25rem (400px default) -->

<!-- Max-width (common for email containers) -->
<Div max-w-[600px]>    <!-- Standard email width -->
<Div max-w-md>         <!-- 448px -->
<Div max-w-lg>         <!-- 512px -->
<Div max-w-xl>         <!-- 576px -->`

	const heightExample = `<!-- Fixed heights -->
<Div h-[100px]>        <!-- Exact 100px -->
<Div h-[50%]>          <!-- 50% of parent -->

<!-- Full height -->
<Div h-full>           <!-- 100% height -->

<!-- Auto (content-driven) -->
<Div h-auto>           <!-- Height from content -->`

	const fontSizeExample = `<!-- Named sizes -->
<Text text-xs>         <!-- 12px -->
<Text text-sm>         <!-- 14px -->
<Text text-base>       <!-- 16px (default) -->
<Text text-lg>         <!-- 18px -->
<Text text-xl>         <!-- 20px -->
<Text text-2xl>        <!-- 24px -->
<Text text-3xl>        <!-- 30px -->
<Text text-4xl>        <!-- 36px -->

<!-- Arbitrary sizes -->
<Text text-[22px]>     <!-- Exact 22px -->`

	const fontWeightExample = `<!-- Weight scale -->
<Text font-thin>       <!-- 100 -->
<Text font-light>      <!-- 300 -->
<Text font-normal>     <!-- 400 -->
<Text font-medium>     <!-- 500 -->
<Text font-semibold>   <!-- 600 -->
<Text font-bold>       <!-- 700 -->
<Text font-extrabold>  <!-- 800 -->
<Text font-black>      <!-- 900 -->`

	const textStyleExample = `<!-- Font style -->
<Text italic>          <!-- Italic text -->
<Text not-italic>      <!-- Remove italic -->

<!-- Text decoration -->
<Text underline>       <!-- Underlined -->
<Text line-through>    <!-- Strikethrough -->
<Text no-underline>    <!-- Remove underline -->

<!-- Text transform -->
<Text uppercase>       <!-- UPPERCASE -->
<Text lowercase>       <!-- lowercase -->
<Text capitalize>      <!-- Capitalize Each Word -->`

	const fontFamilyExample = `<!-- Switch to monospace -->
<Text font-mono>Code style text</Text>

<!-- Reset to base font -->
<Div font-mono>
  <Text content="Monospace" />
  <Text content="Back to normal" font-base />
</Div>`

	const lineHeightExample = `<!-- Line height presets -->
<Text leading-none>    <!-- 1 (tight) -->
<Text leading-tight>   <!-- 1.25 -->
<Text leading-snug>    <!-- 1.375 -->
<Text leading-normal>  <!-- 1.5 (default) -->
<Text leading-relaxed> <!-- 1.625 -->
<Text leading-loose>   <!-- 2 (spacious) -->

<!-- Arbitrary values -->
<Text leading-[1.8]>   <!-- Custom 1.8 -->`

	const letterSpacingExample = `<!-- Letter spacing -->
<Text tracking-tighter> <!-- -0.05em -->
<Text tracking-tight>   <!-- -0.025em -->
<Text tracking-normal>  <!-- 0 -->
<Text tracking-wide>    <!-- 0.025em -->
<Text tracking-wider>   <!-- 0.05em -->
<Text tracking-widest>  <!-- 0.1em -->`

	const bordersExample = `<!-- Border on all sides -->
<Div border-[#e5e7eb]>

<!-- Individual sides -->
<Div border-t-[#e5e7eb]>  <!-- Top only -->
<Div border-b-[#e5e7eb]>  <!-- Bottom only -->
<Div border-l-[#e5e7eb]>  <!-- Left only -->
<Div border-r-[#e5e7eb]>  <!-- Right only -->

<!-- Horizontal / Vertical -->
<Div border-x-[#e5e7eb]>  <!-- Left + Right -->
<Div border-y-[#e5e7eb]>  <!-- Top + Bottom -->

<!-- Border width -->
<Div border-[#e5e7eb] border-2>     <!-- 2px -->
<Div border-[#e5e7eb] border-4>     <!-- 4px -->
<Div border-[#e5e7eb] border-[3px]> <!-- Arbitrary -->

<!-- Border style -->
<Div border-[#e5e7eb] border-dashed>
<Div border-[#e5e7eb] border-dotted>`

	const roundedExample = `<!-- Rounded corners -->
<Div rounded>          <!-- Default radius -->
<Div rounded-sm>       <!-- Small radius -->
<Div rounded-md>       <!-- Medium radius -->
<Div rounded-lg>       <!-- Large radius -->
<Div rounded-xl>       <!-- Extra large -->
<Div rounded-full>     <!-- Fully rounded (pill) -->

<!-- Arbitrary values -->
<Div rounded-[8px]>    <!-- Exact 8px -->`

	const alignExample = `<!-- 9-point alignment grid -->
<Div align-top-left />
<Div align-top />           <!-- Top center -->
<Div align-top-right />

<Div align-left />          <!-- Middle left -->
<Div align-center />        <!-- Middle center -->
<Div align-right />         <!-- Middle right -->

<Div align-bottom-left />
<Div align-bottom />        <!-- Bottom center -->
<Div align-bottom-right />`

	const justifyExample = `<!-- Text justification -->
<Text justify-left>Left aligned</Text>
<Text justify-center>Centered</Text>
<Text justify-right>Right aligned</Text>
<Text justify-full>Full justified text</Text>`

</script>

<Email
	order=2
	category='2. Core Concepts'
	preview="Tailwind-like styling syntax for emails"
	body-bg={colors.background}
	bg={colors.white}
	max-w-[700px]
>
	<!-- Header -->
	<Div rows gap-2 p-8 bg={colors.primary}>
		<Text.H1 content="🎨 Styling" text={colors.white} text-3xl font-bold />
		<Text content="Tailwind-like attributes for email styling." text={colors.white} text-opacity-90 text-lg />
	</Div>

	<!-- Overview -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Overview" text={colors.text} />
		<Text.Paragraph content="Style components using **Tailwind-inspired attributes**. Styles are converted to inline CSS for maximum email client compatibility." text={colors.textMuted} />
		
		<Text.Codeblock content={basicSyntaxExample} highlight="svelte" />
		
		{@render callout('note', `All styles become inline. There are no external stylesheets in email — everything is \`style="..."\`.`)}
	</Div>

	<Divider border={colors.border} />

	<!-- Syntax Options -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Syntax Options" text={colors.text} />
		<Text.Paragraph content="Multiple ways to apply styles — pick your preference:" text={colors.textMuted} />
		
		<Text.Codeblock content={valueSyntaxExample} highlight="svelte" />
		
		<Text.Small content={'The bare attribute style (`p-6`) is recommended for readability. Use the value syntax (`bg={color}`) for dynamic values.'} text={colors.textMuted} />
	</Div>

	<Divider border={colors.border} />

	<!-- Spacing -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Spacing" text={colors.text} />
		
		<Text.H3 content="Padding" text={colors.text} />
		<Text.Paragraph content="Padding is the primary spacing tool in emails. Works on all sides:" text={colors.textMuted} />
		
		<Text.Codeblock content={paddingExample} highlight="svelte" />
		
		<!-- Live demo -->
		<Div cols responsive gap-4>
			<Div rows gap-2>
				<Text.Small content="p-4 (all sides):" text={colors.textMuted} />
				<Div p-4 bg={colors.demoA} border={colors.demoABorder} rounded align-center>
					<Text content="Content" />
				</Div>
			</Div>
			<Div rows gap-2>
				<Text.Small content="px-8 py-2:" text={colors.textMuted} />
				<Div px-8 py-2 bg={colors.demoB} border={colors.demoBBorder} rounded align-center>
					<Text content="Content" />
				</Div>
			</Div>
		</Div>
		
		<Text.H3 content="Margin" text={colors.text} />
		<Text.Paragraph content="Margin is emulated via wrapper tables for 100% compatibility:" text={colors.textMuted} />
		
		<Text.Codeblock content={marginExample} highlight="svelte" />
		
		{@render callout('tip', 'For spacing between elements, prefer `gap-*` on a parent `<Div rows>` or `<Div cols>` instead of individual margins.')}
		
		<Text.H3 content="Spacing Scale" text={colors.text} />
		<Text.Paragraph content="Spacing uses the Tailwind scale in rem, converted to px based on `root.size` (default: 16px):" text={colors.textMuted} />
		
		<Table cols="15% 20% 20% 45%" border>
			<Table.Row header bg={colors.background}>
				<Text content="Value" font-bold />
				<Text content="rem" font-bold />
				<Text content="px" font-bold />
				<Text content="Usage" font-bold />
			</Table.Row>
			<Table.Row>
				<Text.Code content="1" />
				<Text content="0.25rem" />
				<Text content="4px" />
				<Text.Code content="p-1, m-1, gap-1" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="2" />
				<Text content="0.5rem" />
				<Text content="8px" />
				<Text.Code content="p-2, m-2, gap-2" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="4" />
				<Text content="1rem" />
				<Text content="16px" />
				<Text.Code content="p-4, m-4, gap-4" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="6" />
				<Text content="1.5rem" />
				<Text content="24px" />
				<Text.Code content="p-6, m-6, gap-6" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="8" />
				<Text content="2rem" />
				<Text content="32px" />
				<Text.Code content="p-8, m-8, gap-8" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="12" />
				<Text content="3rem" />
				<Text content="48px" />
				<Text.Code content="p-12, m-12, gap-12" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="16" />
				<Text content="4rem" />
				<Text content="64px" />
				<Text.Code content="p-16, m-16, gap-16" />
			</Table.Row>
		</Table>
	</Div>

	<Divider border={colors.border} />

	<!-- Colors -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Colors" text={colors.text} />
		<Text.Paragraph content="Use hex colors with the `[#hex]` syntax for backgrounds, text, and borders:" text={colors.textMuted} />
		
		<Text.Codeblock content={colorsExample} highlight="svelte" />
		
		<!-- Color demo -->
		<Div cols responsive gap-4>
			<Div bg-[#ef4444] p-4 rounded align-center>
				<Text content="Red" text-[#ffffff] font-bold />
			</Div>
			<Div bg-[#3b82f6] p-4 rounded align-center>
				<Text content="Blue" text-[#ffffff] font-bold />
			</Div>
			<Div bg-[#10b981] p-4 rounded align-center>
				<Text content="Green" text-[#ffffff] font-bold />
			</Div>
			<Div bg-[#f59e0b] p-4 rounded align-center>
				<Text content="Amber" text-[#ffffff] font-bold />
			</Div>
		</Div>
	</Div>

	<Divider border={colors.border} />

	<!-- Opacity -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Opacity (Emulated)" text={colors.text} />
		<Text.Paragraph content="Opacity is **emulated by blending colors** against the background. This ensures 100% email client support — the result is always a solid hex color:" text={colors.textMuted} />
		
		<Text.Codeblock content={opacityExample} highlight="svelte" />
		
		<!-- Opacity demo -->
		<Div rows gap-4>
			<Text.Small content="Background opacity (blended against white):" text={colors.textMuted} />
			<Div cols gap-2>
				<Div bg-[#000000] bg-opacity-10 p-4 rounded align-center>
					<Text content="10%" />
				</Div>
				<Div bg-[#000000] bg-opacity-25 p-4 rounded align-center>
					<Text content="25%" />
				</Div>
				<Div bg-[#000000] bg-opacity-50 p-4 rounded align-center>
					<Text content="50%" text-[#ffffff] />
				</Div>
				<Div bg-[#000000] bg-opacity-75 p-4 rounded align-center>
					<Text content="75%" text-[#ffffff] />
				</Div>
				<Div bg-[#000000] bg-opacity-100 p-4 rounded align-center>
					<Text content="100%" text-[#ffffff] />
				</Div>
			</Div>
			
			<Text.Small content="Works with any color:" text={colors.textMuted} />
			<Div cols gap-2>
				<Div bg-[#3b82f6] bg-opacity-25 p-4 rounded align-center>
					<Text content="Blue 25%" />
				</Div>
				<Div bg-[#3b82f6] bg-opacity-50 p-4 rounded align-center>
					<Text content="Blue 50%" />
				</Div>
				<Div bg-[#3b82f6] bg-opacity-75 p-4 rounded align-center>
					<Text content="Blue 75%" text-[#ffffff] />
				</Div>
				<Div bg-[#ef4444] bg-opacity-50 p-4 rounded align-center>
					<Text content="Red 50%" />
				</Div>
				<Div bg-[#10b981] bg-opacity-50 p-4 rounded align-center>
					<Text content="Green 50%" />
				</Div>
			</Div>
		</Div>
		
		<Text.Small content="Blending uses the `body-bg` color from `<Email>` as the base. Make sure it's set for accurate results." text={colors.textMuted} />
	</Div>

	<Divider border={colors.border} />

	<!-- Sizing -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Sizing" text={colors.text} />
		
		<Text.H3 content="Width" text={colors.text} />
		<Text.Paragraph content="Control element widths with percentages, fixed values, or max-width constraints:" text={colors.textMuted} />
		
		<Text.Codeblock content={widthExample} highlight="svelte" />
		
		<!-- Width demo -->
		<Div rows gap-2>
			<Div w-full bg={colors.demoA} border={colors.demoABorder} p-3 rounded align-center>
				<Text content="w-full (100%)" font-mono text-sm />
			</Div>
			<Div w-[75%] bg={colors.demoB} border={colors.demoBBorder} p-3 rounded align-center>
				<Text content="w-[75%]" font-mono text-sm />
			</Div>
			<Div w-[50%] bg={colors.demoA} border={colors.demoABorder} p-3 rounded align-center>
				<Text content="w-[50%]" font-mono text-sm />
			</Div>
			<Div w-[200px] bg={colors.demoB} border={colors.demoBBorder} p-3 rounded align-center>
				<Text content="w-[200px]" font-mono text-sm />
			</Div>
		</Div>
		
		<Text.H3 content="Max-Width Scale" text={colors.text} />
		<Table cols="25% 25% 50%" border>
			<Table.Row header bg={colors.background}>
				<Text content="Attribute" font-bold />
				<Text content="Width" font-bold />
				<Text content="Use Case" font-bold />
			</Table.Row>
			<Table.Row>
				<Text.Code content="max-w-xs" />
				<Text content="320px" />
				<Text content="Narrow content columns" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="max-w-sm" />
				<Text content="384px" />
				<Text content="Small cards" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="max-w-md" />
				<Text content="448px" />
				<Text content="Medium containers" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="max-w-lg" />
				<Text content="512px" />
				<Text content="Large content areas" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="max-w-xl" />
				<Text content="576px" />
				<Text content="Wide content" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="max-w-2xl" />
				<Text content="672px" />
				<Text content="Full email width" />
			</Table.Row>
		</Table>
		
		<Text.H3 content="Height" text={colors.text} />
		<Text.Codeblock content={heightExample} highlight="svelte" />
		
		<!-- Height demo -->
		<Div cols gap-4>
			<Div h-[60px] bg={colors.demoA} border={colors.demoABorder} p-2 rounded align-center>
				<Text content="h-[60px]" font-mono text-sm />
			</Div>
			<Div h-[100px] bg={colors.demoB} border={colors.demoBBorder} p-2 rounded align-center>
				<Text content="h-[100px]" font-mono text-sm />
			</Div>
			<Div h-[140px] bg={colors.demoA} border={colors.demoABorder} p-2 rounded align-center>
				<Text content="h-[140px]" font-mono text-sm />
			</Div>
		</Div>
	</Div>

	<Divider border={colors.border} />

	<!-- Typography -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Typography" text={colors.text} />
		
		<Text.H3 content="Font Size" text={colors.text} />
		<Text.Codeblock content={fontSizeExample} highlight="svelte" />
		
		<!-- Font size demo -->
		<Div rows gap-1 bg={colors.codeBg} p-4 rounded border={colors.border}>
			<Text content="text-xs (12px)" text-xs />
			<Text content="text-sm (14px)" text-sm />
			<Text content="text-base (16px)" text-base />
			<Text content="text-lg (18px)" text-lg />
			<Text content="text-xl (20px)" text-xl />
			<Text content="text-2xl (24px)" text-2xl />
			<Text content="text-3xl (30px)" text-3xl />
		</Div>
		
		<Text.H3 content="Font Weight" text={colors.text} />
		<Text.Codeblock content={fontWeightExample} highlight="svelte" />
		
		<!-- Font weight demo -->
		<Div rows gap-1 bg={colors.codeBg} p-4 rounded border={colors.border}>
			<Text content="font-thin (100)" font-thin />
			<Text content="font-light (300)" font-light />
			<Text content="font-normal (400)" font-normal />
			<Text content="font-medium (500)" font-medium />
			<Text content="font-semibold (600)" font-semibold />
			<Text content="font-bold (700)" font-bold />
			<Text content="font-extrabold (800)" font-extrabold />
			<Text content="font-black (900)" font-black />
		</Div>
		
		<Text.H3 content="Text Styles" text={colors.text} />
		<Text.Codeblock content={textStyleExample} highlight="svelte" />
		
		<!-- Text style demo -->
		<Div cols responsive gap-4>
			<Div rows gap-2 bg={colors.codeBg} p-4 rounded border={colors.border}>
				<Text content="Italic text" italic />
				<Text content="Underlined text" underline />
				<Text content="Strikethrough" line-through />
			</Div>
			<Div rows gap-2 bg={colors.codeBg} p-4 rounded border={colors.border}>
				<Text content="uppercase text" uppercase />
				<Text content="LOWERCASE TEXT" lowercase />
				<Text content="capitalize text" capitalize />
			</Div>
		</Div>
		
		<Text.H3 content="Font Family" text={colors.text} />
		<Text.Paragraph content="Switch between base and monospace fonts:" text={colors.textMuted} />
		<Text.Codeblock content={fontFamilyExample} highlight="svelte" />
		
		<Div cols responsive gap-4>
			<Div bg={colors.codeBg} p-4 rounded border={colors.border}>
				<Text content="Regular font (font-base)" />
			</Div>
			<Div bg={colors.codeBg} p-4 rounded border={colors.border} font-mono>
				<Text content="Monospace font (font-mono)" />
			</Div>
		</Div>
		
		<Text.H3 content="Line Height" text={colors.text} />
		<Text.Codeblock content={lineHeightExample} highlight="svelte" />
		
		<!-- Line height demo -->
		<Div cols responsive gap-4>
			<Div rows gap-2>
				<Text.Small content="leading-tight (1.25):" text={colors.textMuted} />
				<Div bg={colors.codeBg} p-3 rounded border={colors.border}>
					<Text content="This is example text with tight line height. Notice how the lines are close together." leading-tight text-sm />
				</Div>
			</Div>
			<Div rows gap-2>
				<Text.Small content="leading-relaxed (1.625):" text={colors.textMuted} />
				<Div bg={colors.codeBg} p-3 rounded border={colors.border}>
					<Text content="This is example text with relaxed line height. The lines have more breathing room." leading-relaxed text-sm />
				</Div>
			</Div>
		</Div>
		
		<Text.H3 content="Letter Spacing" text={colors.text} />
		<Text.Codeblock content={letterSpacingExample} highlight="svelte" />
		
		<Div rows gap-1 bg={colors.codeBg} p-4 rounded border={colors.border}>
			<Text content="tracking-tighter" tracking-tighter />
			<Text content="tracking-tight" tracking-tight />
			<Text content="tracking-normal" tracking-normal />
			<Text content="tracking-wide" tracking-wide />
			<Text content="tracking-wider" tracking-wider />
			<Text content="tracking-widest" tracking-widest />
		</Div>
	</Div>

	<Divider border={colors.border} />

	<!-- Borders -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Borders" text={colors.text} />
		<Text.Paragraph content="Apply borders to any side with color, width, and style control:" text={colors.textMuted} />
		
		<Text.Codeblock content={bordersExample} highlight="svelte" />
		
		<!-- Border demo -->
		<Div cols responsive gap-4>
			<Div border-[#6b7280] p-4 align-center rounded>
				<Text content="All sides" text-sm />
			</Div>
			<Div border-t-[#6b7280] border-b-[#6b7280] p-4 align-center>
				<Text content="Top + Bottom" text-sm />
			</Div>
			<Div border-l-[#10b981] border-l-4 p-4 bg={colors.codeBg}>
				<Text content="Left accent" text-sm />
			</Div>
			<Div border-[#3b82f6] border-2 border-dashed p-4 align-center rounded>
				<Text content="Dashed" text-sm />
			</Div>
		</Div>
		
		<Text.H3 content="Rounded Corners" text={colors.text} />
		<Text.Codeblock content={roundedExample} highlight="svelte" />
		
		<Div cols responsive gap-4>
			<Div bg={colors.primary} p-4 align-center>
				<Text content="No radius" text-sm text={colors.white} />
			</Div>
			<Div bg={colors.primary} p-4 align-center rounded-sm>
				<Text content="rounded-sm" text-sm text={colors.white} />
			</Div>
			<Div bg={colors.primary} p-4 align-center rounded-md>
				<Text content="rounded-md" text-sm text={colors.white} />
			</Div>
			<Div bg={colors.primary} p-4 align-center rounded-lg>
				<Text content="rounded-lg" text-sm text={colors.white} />
			</Div>
			<Div bg={colors.primary} p-4 align-center rounded-full>
				<Text content="rounded-full" text-sm text={colors.white} />
			</Div>
		</Div>
		
		{@render callout('note', 'Rounded corners work in most email clients but fall back to square in Outlook Windows. Design with this in mind.')}
	</Div>

	<Divider border={colors.border} />

	<!-- Alignment -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Alignment" text={colors.text} />
		
		<Text.H3 content="Content Alignment" text={colors.text} />
		<Text.Paragraph content="Position content within containers using the 9-point alignment grid:" text={colors.textMuted} />
		
		<Text.Codeblock content={alignExample} highlight="svelte" />
		
		<!-- 3x3 Alignment Grid Demo -->
		<Div rows gap-2>
			<Div cols gap-2>
				<Div h-[70px] bg={colors.demoA} border={colors.demoABorder} p-2 rounded align-top-left>
					<Text content="top-left" text-xs font-mono />
				</Div>
				<Div h-[70px] bg={colors.demoB} border={colors.demoBBorder} p-2 rounded align-top>
					<Text content="top" text-xs font-mono />
				</Div>
				<Div h-[70px] bg={colors.demoA} border={colors.demoABorder} p-2 rounded align-top-right>
					<Text content="top-right" text-xs font-mono />
				</Div>
			</Div>
			<Div cols gap-2>
				<Div h-[70px] bg={colors.demoB} border={colors.demoBBorder} p-2 rounded align-left>
					<Text content="left" text-xs font-mono />
				</Div>
				<Div h-[70px] bg={colors.primary} p-2 rounded align-center>
					<Text content="center" text-xs font-mono text={colors.white} />
				</Div>
				<Div h-[70px] bg={colors.demoB} border={colors.demoBBorder} p-2 rounded align-right>
					<Text content="right" text-xs font-mono />
				</Div>
			</Div>
			<Div cols gap-2>
				<Div h-[70px] bg={colors.demoA} border={colors.demoABorder} p-2 rounded align-bottom-left>
					<Text content="bottom-left" text-xs font-mono />
				</Div>
				<Div h-[70px] bg={colors.demoB} border={colors.demoBBorder} p-2 rounded align-bottom>
					<Text content="bottom" text-xs font-mono />
				</Div>
				<Div h-[70px] bg={colors.demoA} border={colors.demoABorder} p-2 rounded align-bottom-right>
					<Text content="bottom-right" text-xs font-mono />
				</Div>
			</Div>
		</Div>
		
		<Text.H3 content="Text Justification" text={colors.text} />
		<Text.Paragraph content="Control how text flows within text elements:" text={colors.textMuted} />
		
		<Text.Codeblock content={justifyExample} highlight="svelte" />
		
		<Div rows gap-2>
			<Div bg={colors.codeBg} p-3 rounded border={colors.border}>
				<Text content="Left aligned text flows naturally from the left edge." justify-left />
			</Div>
			<Div bg={colors.codeBg} p-3 rounded border={colors.border}>
				<Text content="Centered text is balanced in the middle." justify-center />
			</Div>
			<Div bg={colors.codeBg} p-3 rounded border={colors.border}>
				<Text content="Right aligned text flows from the right edge." justify-right />
			</Div>
		</Div>
	</Div>

	<Divider border={colors.border} />

	<!-- Quick Reference -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Quick Reference" text={colors.text} />
		
		<Table cols="30% 70%" border>
			<Table.Row header bg={colors.background}>
				<Text content="Category" font-bold />
				<Text content="Common Attributes" font-bold />
			</Table.Row>
			<Table.Row>
				<Text content="Spacing" font-semibold />
				<Text.Code content="p-*, px-*, py-*, m-*, mx-*, my-*, gap-*" />
			</Table.Row>
			<Table.Row>
				<Text content="Colors" font-semibold />
				<Text.Code content="bg-[#hex], text-[#hex], border-[#hex]" />
			</Table.Row>
			<Table.Row>
				<Text content="Opacity" font-semibold />
				<Text.Code content="bg-opacity-*, text-opacity-*, opacity-*" />
			</Table.Row>
			<Table.Row>
				<Text content="Sizing" font-semibold />
				<Text.Code content="w-*, h-*, max-w-*, min-w-*" />
			</Table.Row>
			<Table.Row>
				<Text content="Typography" font-semibold />
				<Text.Code content="text-*, font-*, leading-*, tracking-*" />
			</Table.Row>
			<Table.Row>
				<Text content="Borders" font-semibold />
				<Text.Code content="border-*, rounded-*" />
			</Table.Row>
			<Table.Row>
				<Text content="Alignment" font-semibold />
				<Text.Code content="align-*, justify-*" />
			</Table.Row>
		</Table>
	</Div>
	
	{@render footer()}
</Email>
