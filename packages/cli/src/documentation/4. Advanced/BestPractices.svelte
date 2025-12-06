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
		codeBg: '#f9fafb',
		success: '#10b981',
		danger: '#ef4444'
	}

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
	<Div p-8 bg={colors.primary}>
		<Text.H1 content="✨ Best Practices" text={colors.white} text-3xl font-bold />
		<Spacer h-2 />
		<Text content="Ensure your emails look great everywhere." text={colors.white} text-opacity-90 text-lg />
	</Div>

	<!-- Do's and Don'ts -->
	<Div p-8>
		<Text.H2 content="The Golden Rules" text={colors.text} />
		<Spacer h-4 />
		
		<Div cols responsive gap-6>
			<Div bg={colors.codeBg} p-6 rounded border-l-4 border-l={colors.success}>
				<Text.H4 content="✅ DO" text={colors.success} />
				<Spacer h-2 />
				<Text content="
- Use `cols` and `rows` for layout
- Include `alt`, `width`, `height` on images
- Use absolute URLs (`https://`)
- Keep HTML under 100KB
- Test in Outlook and Gmail
" text={colors.textMuted} />
			</Div>
			
			<Div bg={colors.codeBg} p-6 rounded border-l-4 border-l={colors.danger}>
				<Text.H4 content="❌ DON'T" text={colors.danger} />
				<Spacer h-2 />
				<Text content="
- Use CSS Flexbox or Grid
- Use `position: absolute`
- Use external stylesheets
- Use JavaScript
- Rely on `border-radius` in Outlook
" text={colors.textMuted} />
			</Div>
		</Div>
	</Div>

	<Divider border={colors.border} />

	<!-- Outlook -->
	<Div p-8>
		<Text.H2 content="Outlook Quirks" text={colors.text} />
		<Spacer h-2 />
		<Text.Paragraph content="Outlook on Windows uses Word's rendering engine, which is... unique. Here's how we handle it:" text={colors.textMuted} />
		<Spacer h-4 />
		
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

	<!-- Images -->
	<Div p-8>
		<Text.H2 content="Image Handling" text={colors.text} />
		<Spacer h-2 />
		<Text.Paragraph content="Images are often blocked by default. Design for degradation." text={colors.textMuted} />
		<Spacer h-4 />
		<Text content="
1. **Alt Text**: Essential for accessibility and when images are blocked.
2. **Dimensions**: Always set `width` and `height` to prevent layout shifts.
3. **Retina**: Use 2x sized images but set 1x dimensions in attributes.
4. **Format**: JPG for photos, PNG for graphics. SVG support is spotty (Gmail strips inline SVG).
" text={colors.textMuted} />
	</Div>

	<!-- Footer -->
	<Div p-6 bg={colors.codeBg} align-center border-t={colors.border}>
		<Text.Small content="Next: [Configuration](11)" text={colors.textMuted} />
	</Div>
</Email>
