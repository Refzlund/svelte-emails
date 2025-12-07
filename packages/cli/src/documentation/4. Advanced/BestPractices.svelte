<script lang="ts">
	/**
	 * Best Practices
	 * 
	 * Guidelines for creating reliable emails.
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

	const dosContent = `- Use \`cols\` and \`rows\` for layout
- Include \`alt\`, \`width\`, \`height\` on images
- Use absolute URLs (\`https://\`)
- Keep HTML under 100KB
- Test in Outlook and Gmail`

	const dontsContent = `- Use CSS Flexbox or Grid
- Use \`position: absolute\`
- Use external stylesheets
- Use JavaScript
- Rely on \`border-radius\` in Outlook`

	const imageContent = `1. **Alt Text**: Essential for accessibility and when images are blocked.
2. **Dimensions**: Always set \`width\` and \`height\` to prevent layout shifts.
3. **Retina**: Use 2x sized images but set 1x dimensions in attributes.
4. **Format**: JPG for photos, PNG for graphics. SVG support is spotty (Gmail strips inline SVG).`

</script>

<Email
	order=1
	category='4. Advanced'
	preview="Best practices for email development"
	body-bg={colors.background}
	bg={colors.white}
	max-w-[700px]
>
	<!-- Header -->
	<Div rows gap-2 p-8 bg={colors.primary}>
		<Text.H1 content="✨ Best Practices" text={colors.white} text-3xl font-bold />
		<Text content="Ensure your emails look great everywhere." text={colors.white} text-opacity-90 text-lg />
	</Div>

	<!-- Do's and Don'ts -->
	<Div rows gap-4 p-8>
		<Text.H2 content="The Golden Rules" text={colors.text} />
		
		<Div cols responsive gap-6>
			<Div rows gap-2 bg={colors.codeBg} p-6 rounded border-l-4 border-l={colors.success}>
				<Text.H4 content="✅ DO" text={colors.success} />
				<Text content={dosContent} text={colors.textMuted} />
			</Div>
			
			<Div rows gap-2 bg={colors.codeBg} p-6 rounded border-l-4 border-l={colors.danger}>
				<Text.H4 content="❌ DON'T" text={colors.danger} />
				<Text content={dontsContent} text={colors.textMuted} />
			</Div>
		</Div>
	</Div>

	<Divider border={colors.border} />

	<!-- Outlook -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Outlook Quirks" text={colors.text} />
		<Text.Paragraph content="Outlook on Windows uses Word's rendering engine, which is... unique. Here's how we handle it:" text={colors.textMuted} />
		
		<Table cols="30% 70%" border>
			<Table.Row header bg={colors.background}>
				<Text content="Feature" font-bold />
				<Text content="Outlook Behavior" font-bold />
			</Table.Row>
			<Table.Row>
				<Text content="Rounded Corners" />
				<Text content="Ignored (falls back to square). Buttons use VML to support it." />
			</Table.Row>
			<Table.Row>
				<Text content="Background Images" />
				<Text content="Requires VML (we handle this automatically)." />
			</Table.Row>
			<Table.Row>
				<Text content="Shadows" />
				<Text content="Not supported." />
			</Table.Row>
			<Table.Row>
				<Text content="Flex/Grid" />
				<Text content="Not supported (use our `<Div cols>` instead)." />
			</Table.Row>
		</Table>
	</Div>

	<Divider border={colors.border} />

	<!-- Emulated Properties -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Emulated CSS Properties" text={colors.text} />
		<Text.Paragraph content="Some CSS properties don't work in emails, so we emulate them for 100% compatibility:" text={colors.textMuted} />
		
		<Table cols="30% 70%" border>
			<Table.Row header bg={colors.background}>
				<Text content="Property" font-bold />
				<Text content="How it's emulated" font-bold />
			</Table.Row>
			<Table.Row>
				<Text.Code content="m-*, margin" />
				<Text content="Wrapped in table with padding. Safe to use!" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="opacity-*" />
				<Text content="Colors blended against background to solid hex." />
			</Table.Row>
			<Table.Row>
				<Text.Code content="bg-[#hex]/50" />
				<Text content="Color modifiers blended to solid hex values." />
			</Table.Row>
		</Table>
		
		<Text.Small content="**Not emulated (avoid):** `flex`, `grid`, `box-shadow`, `transform`, `filter`, `transition`, `animation`, `object-fit`" text={colors.textMuted} />
	</Div>

	<Divider border={colors.border} />

	<!-- Images -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Image Handling" text={colors.text} />
		<Text.Paragraph content="Images are often blocked by default. Design for degradation." text={colors.textMuted} />
		<Text content={imageContent} text={colors.textMuted} />
	</Div>

	<!-- Footer -->
	{@render footer()}
</Email>
