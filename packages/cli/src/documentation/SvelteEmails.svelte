<script lang="ts">
	/**
	 * Svelte Emails Overview
	 * 
	 * A high-level overview of the library's capabilities and the CLI experience.
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
	import { colors, style } from './theme'
	import { footer } from './Shared/Footer.svelte'

	const getStarted = '/documentation/1__getting_started-introduction'

</script>

{#snippet featureCard(icon: string, title: string, description: string)}
	<Div bg={colors.codeBg} p-6 rounded border={colors.border} h-full>
		<Text.H4 content="{icon} {title}" text={colors.text} />
		<Spacer h-2 />
		<Text.Small content={description} text={colors.textMuted} />
	</Div>
{/snippet}

{#snippet tableCell(icon: string, title: string, description: string)}
	<Div p-4 rows gap-2>
		<Text.H5 content="{icon} {title}" text={colors.text} />
		<Text.Small content={description} text={colors.textMuted} />
	</Div>
{/snippet}

<Email
	order=0
	preview="Why svelte-emails? The modern email stack explained."
	body-bg={colors.background}
	bg={colors.white}
	max-w-[800px]
>
	<!-- Hero Section -->
	<Div p-10 bg={colors.primary} align-center>
		<Text.H1 content="🚀 The Modern Email Stack" text={colors.white} text-4xl font-bold />
		<Spacer h-4 />
		<Text.Paragraph 
			content="Build, Preview, and Ship emails with the power of Svelte." 
			text={colors.white} 
			text-opacity-90 
			text-xl
		/>
		<Spacer h-8 />
		<Button 
			href={getStarted} 
			bg={colors.white} 
			text={colors.primaryDark} 
			font-bold 
			px-4 py-2
			rounded-lg
			content="Get Started →"
		/>
	</Div>

	<!-- Section 1: The Library -->
	<Div p-8>
		<Div cols responsive gap-4 align-middle>
			<Div>
				<Text.H2 content="The Library" text={colors.primaryDark} />
				<Text.Small content="`svelte-emails`" text={colors.textMuted} font-mono />
			</Div>
			<Div>
				<Text content="A rendering engine that abstracts away the pain of HTML email." text={colors.textMuted} />
			</Div>
		</Div>
		
		<Spacer h-6 />

		<Div cols responsive gap-6>
			{@render featureCard(
				"🛡️", 
				"Bulletproof Rendering", 
				"We don't just output HTML. We compile your components into a battle-tested structure of nested tables, VML (for Outlook), and inline styles. You write modern code; we handle the 1990s quirks."
			)}
			{@render featureCard(
				"🎨", 
				"Magic Emulation", 
				"CSS `margin`, `opacity`, and `rem`-units are broken in many clients. We emulate them automatically: margins become wrapper table padding, opacity becomes calculated color blending, and rem units convert to pixels."
			)}
		</Div>

		<Spacer h-6 />

		<Div cols responsive gap-6>
			{@render featureCard(
				"📐", 
				"Grid Workflow", 
				"Forget `<table>` hell. Use `<Div cols>` and `<Div rows>` to build complex layouts that feel like CSS Grid/Flexbox but render everywhere."
			)}
			{@render featureCard(
				"📱", 
				"Responsive Core", 
				"Just add the `responsive`, `desktop-only` or `mobile-only` attribute. We generate the complex media queries and stack logic to ensure your email looks great on iPhone, Android, and Desktop."
			)}
		</Div>

		<Spacer h-6 />

		<Div cols responsive gap-6>
			{@render featureCard(
				"👀", 
				"Previewable", 
				"The library provides `<Email.Render>` so you can preview emails directly in your Svelte apps for end-users to see."
			)}
			{@render featureCard(
				"✍️", 
				"Extended Markdown", 
				"Rich text made easy. Use **bold**, *italic*, [links](https://github.com/refzlund/svelte-emails), lists, checkboxes, and even tables—all parsed automatically from `content` props."
			)}
		</Div>

		<Spacer h-6 />

		<Div cols responsive gap-6>
			{@render featureCard(
				"🎭", 
				"Style Presets", 
				"Jump-start your design with built-in presets: `base`, `dark`, `serif`, `sansSerif`, `monospace`, `rounded`, `humanist`, and `geometric`. Mix with `merge()`."
			)}
			{@render featureCard(
				"🔤", 
				"Placeholders", 
				"Support for `[[variable]]` syntax lets your users personalize emails at runtime. Perfect for names, dates, or any dynamic content."
			)}
		</Div>
	</Div>

	<Divider border={colors.border} />

	<!-- Section 2: The CLI -->
	<Div p-8 bg={colors.codeBg}>
		<Div cols responsive gap-4 align-middle>
			<Div>
				<Text.H2 content="The Studio" text={colors.purple} />
				<Text.Small content="`bunx svelte-emails`" text={colors.textMuted} font-mono />
			</Div>
			<Div>
				<Text content="A dedicated development environment for crafting emails." text={colors.textMuted} />
			</Div>
		</Div>

		<Spacer h-6 />

		<Div cols gap-6 responsive>
			{@render tableCell("⚡", "Hot Module Reloading", "Instant feedback. Tweak a color or padding and see it update immediately without a full page refresh.")}
			{@render tableCell("🔍", "Smart Discovery", "Zero config. We automatically find any file ending in `.email.svelte` and add it to your sidebar.")}
		</Div>
		<Div cols gap-6 responsive>
			{@render tableCell("📱", "Dynamic Preview", "You can resize the container to ensure it's responsive all from desktops to mobile.")}
			{@render tableCell("🎯", "Steady Scroll", "Edit content or resize the preview—your scroll position stays rock solid. Smart anchor detection keeps your focus exactly where it should be.")}
		</Div>
		<Div cols gap-6 responsive>
			{@render tableCell("📚", "Integrated Docs", "Stuck? The full documentation (this page!) and examples are built right into the tool.")}
			{@render tableCell("🛠️", "Output Inspector", "View the generated HTML, Plain Text, and Headers side-by-side with your visual preview.")}
		</Div>
		<Div cols gap-6 responsive>
			{@render tableCell("🖌️", "Syntax Highlighting", "Code blocks powered by Shiki. Beautiful, accurate highlighting for dozens of languages right in your emails.")}
			{@render tableCell("📦", "Static Builds", "Generate a standalone HTML site of your previews. Deploy to Vercel, Netlify, or GitHub Pages to share with your team.")}
		</Div>
	</Div>

	<!-- Footer CTA -->
	<Div rows gap-4 p-10 bg="{colors.codeBg}" align-center border-t={colors.border}>
		<Text.H3 content="Ready to build?" text={colors.text} />
		<Button 
			href={getStarted} 
			bg={colors.primary} 
			text={colors.white} 
			font-bold 
			px-8 py-4
			rounded
			content="Start the Guide"
		/>

		{@render footer()}
	</Div>
</Email>
