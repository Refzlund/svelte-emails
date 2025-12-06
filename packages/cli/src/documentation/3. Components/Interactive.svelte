<script lang="ts">
	/**
	 * Interactive Components
	 * 
	 * Buttons, Links, and Images.
	 */
	import {
		Email,
		Div,
		Text,
		Button,
		Spacer,
		Divider,
		Table,
		Img,
		Link
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

	const buttonCode = `<Button 
  href="https://example.com"
  bg="#10b981"
  text="#ffffff"
  p-3
  rounded
  content="Click Me"
/>`

	const linkCode = `<Link href="https://example.com" text="#10b981" content="Visit Website" />`

	const imgCode = `<Img 
  src="https://placehold.co/600x200" 
  width={600} 
  height={200} 
  alt="Banner" 
/>`

</script>

<Email
	order=2
	category='3. Components'
	preview="Interactive components reference"
	body-bg={colors.background}
	bg={colors.white}
	max-w-[700px]
>
	<!-- Header -->
	<Div p-8 bg={colors.primary}>
		<Text.H1 content="👆 Interactive Components" text={colors.white} text-3xl font-bold />
		<Spacer h-2 />
		<Text content="Engage your users with buttons, links, and images." text={colors.white} text-opacity-90 text-lg />
	</Div>

	<!-- Button -->
	<Div p-8>
		<Text.H2 content="Button" text={colors.text} />
		<Spacer h-2 />
		<Text.Paragraph content="A call-to-action button. Renders as a VML button in Outlook for full clickability." text={colors.textMuted} />
		<Spacer h-4 />
		
		<Div cols responsive gap-8>
			<Div>
				<Text.Codeblock content={buttonCode} highlight="svelte" />
			</Div>
			<Div align-center justify-center bg={colors.codeBg} rounded border={colors.border} p-4>
				<Button href="#" bg={colors.primary} text={colors.white} p-3 rounded content="Click Me" />
			</Div>
		</Div>
	</Div>

	<Divider border={colors.border} />

	<!-- Link -->
	<Div p-8>
		<Text.H2 content="Link" text={colors.text} />
		<Spacer h-2 />
		<Text.Paragraph content="An inline text link. For links inside paragraphs, use markdown `[text](url)` instead." text={colors.textMuted} />
		<Spacer h-4 />
		<Div bg={colors.codeBg} p-4 border={colors.border} rounded>
			<Text.Codeblock content={linkCode} highlight="svelte" />
		</Div>
		<Spacer h-4 />
		<Link href="#" text={colors.primary} content="Visit Website" />
	</Div>

	<Divider border={colors.border} />

	<!-- Img -->
	<Div p-8>
		<Text.H2 content="Img" text={colors.text} />
		<Spacer h-2 />
		<Text.Paragraph content="Renders an image. Always include `width`, `height`, and `alt` for best results." text={colors.textMuted} />
		<Spacer h-4 />
		<Div bg={colors.codeBg} p-4 border={colors.border} rounded>
			<Text.Codeblock content={imgCode} highlight="svelte" />
		</Div>
		<Spacer h-4 />
		<Img src="https://placehold.co/600x200" width={600} height={200} alt="Banner" />
	</Div>

	<!-- Footer -->
	<Div p-6 bg={colors.codeBg} align-center border-t={colors.border}>
		<Text.Small content="Next: [Email Specifics](9)" text={colors.textMuted} />
	</Div>
</Email>
