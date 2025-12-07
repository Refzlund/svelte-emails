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
		Divider,
		Table,
		Img,
		Link
	} from 'svelte-emails'
	import { colors, style } from '../theme'
	import { footer } from '../Shared/Footer.svelte'
	import Preview from '../Shared/Preview.svelte'

	const buttonCode = `<Button 
  href="https://example.com"
  bg-[#10b981]
  text-[#ffffff]
  p-3
  rounded
  content="Click Me"
/>`

	const linkCode = `<Link href="https://example.com" text-[#10b981] content="Visit Website" />`

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
	<Div rows gap-2 p-8 bg={colors.primary}>
		<Text.H1 content="👆 Interactive Components" text={colors.white} text-3xl font-bold />
		<Text content="Engage your users with buttons, links, and images." text={colors.white} text-opacity-90 text-lg />
	</Div>

	<!-- Button -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Button" text={colors.text} />
		<Text.Paragraph content="A call-to-action button. Renders as a VML button in Outlook for full clickability." text={colors.textMuted} />
		
		<Div cols responsive gap-8>
			<Text.Codeblock content={buttonCode} highlight="svelte" />
			<Preview>
				<Div align-center>
					<Button href="#" bg={colors.primary} text={colors.white} p-3 rounded content="Click Me" />
				</Div>
			</Preview>
		</Div>
	</Div>

	<Divider border={colors.border} />

	<!-- Link -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Link" text={colors.text} />
		<Text.Paragraph content="An inline text link. For links inside paragraphs, use markdown `[text](url)` instead." text={colors.textMuted} />
		<Text.Codeblock content={linkCode} highlight="svelte" />
		<Link href="#" text={colors.primary} content="Visit Website" />
	</Div>

	<Divider border={colors.border} />

	<!-- Img -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Img" text={colors.text} />
		<Text.Paragraph content="Renders an image. Always include `width`, `height`, and `alt` for best results." text={colors.textMuted} />
		<Text.Codeblock content={imgCode} highlight="svelte" />
		<Img src="https://placehold.co/600x200" width={600} height={200} alt="Banner" />
	</Div>

	<!-- Footer -->
	{@render footer()}
</Email>
