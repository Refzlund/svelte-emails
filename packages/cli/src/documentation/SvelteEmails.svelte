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

	const colors = {
		primary: '#10b981',
		primaryDark: '#059669',
		secondary: '#8b5cf6', // Purple
		text: '#111827',
		textMuted: '#4b5563',
		background: '#f3f4f6',
		white: '#ffffff',
		border: '#d1d5db',
		codeBg: '#f9fafb'
	}

</script>

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
			href="/1-getting-started/introduction" 
			bg={colors.white} 
			text={colors.primaryDark} 
			font-bold 
			p-4 
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
			<!-- Feature 1 -->
			<Div bg={colors.codeBg} p-6 rounded border={colors.border} h-full>
				<Text.H4 content="🛡️ Bulletproof Rendering" text={colors.text} />
				<Spacer h-2 />
				<Text.Small content="We don't just output HTML. We compile your components into a battle-tested structure of nested tables, VML (for Outlook), and inline styles. You write modern code; we handle the 1990s quirks." text={colors.textMuted} />
			</Div>

			<!-- Feature 2 -->
			<Div bg={colors.codeBg} p-6 rounded border={colors.border} h-full>
				<Text.H4 content="🎨 Magic Emulation" text={colors.text} />
				<Spacer h-2 />
				<Text.Small content="CSS `margin` and `opacity` are broken in many clients. We emulate them automatically: margins become wrapper table padding, and opacity becomes calculated color blending." text={colors.textMuted} />
			</Div>
		</Div>

		<Spacer h-6 />

		<Div cols responsive gap-6>
			<!-- Feature 3 -->
			<Div bg={colors.codeBg} p-6 rounded border={colors.border} h-full>
				<Text.H4 content="📐 Grid Workflow" text={colors.text} />
				<Spacer h-2 />
				<Text.Small content="Forget `<table>` hell. Use `<Div cols>` and `<Div rows>` to build complex layouts that feel like CSS Grid/Flexbox but render everywhere." text={colors.textMuted} />
			</Div>

			<!-- Feature 4 -->
			<Div bg={colors.codeBg} p-6 rounded border={colors.border} h-full>
				<Text.H4 content="📱 Responsive Core" text={colors.text} />
				<Spacer h-2 />
				<Text.Small content="Just add the `responsive`, `desktop-only` or `mobile-only` attribute. We generate the complex media queries and stack logic to ensure your email looks great on iPhone, Android, and Desktop." text={colors.textMuted} />
			</Div>
		</Div>
	</Div>

	<Divider border={colors.border} />

	<!-- Section 2: The CLI -->
	<Div p-8 bg={colors.codeBg}>
		<Div cols responsive gap-4 align-middle>
			<Div>
				<Text.H2 content="The Studio" text={colors.secondary} />
				<Text.Small content="`bunx svelte-emails`" text={colors.textMuted} font-mono />
			</Div>
			<Div>
				<Text content="A dedicated development environment for crafting emails." text={colors.textMuted} />
			</Div>
		</Div>

		<Spacer h-6 />

		<Table cols="50% 50%">
			<Table.Row>
				<Div p-4 border-b={colors.border}>
					<Text.H5 content="⚡ Hot Module Reloading" text={colors.text} />
					<Text.Small content="Instant feedback. Tweak a color or padding and see it update immediately without a full page refresh." text={colors.textMuted} />
				</Div>
				<Div p-4 border-b={colors.border}>
					<Text.H5 content="🔍 Smart Discovery" text={colors.text} />
					<Text.Small content="Zero config. We automatically find any file ending in `.email.svelte` and add it to your sidebar." text={colors.textMuted} />
				</Div>
			</Table.Row>
			<Table.Row>
				<Div p-4 border-b={colors.border}>
					<Text.H5 content="📱 Mobile Preview" text={colors.text} />
					<Text.Small content="Toggle between mobile and desktop views with one click. Resize the viewport while keeping your scroll position intact." text={colors.textMuted} />
				</Div>
				<Div p-4 border-b={colors.border}>
					<Text.H5 content="📚 Integrated Docs" text={colors.text} />
					<Text.Small content="Stuck? The full documentation (this page!) and examples are built right into the tool." text={colors.textMuted} />
				</Div>
			</Table.Row>
			<Table.Row>
				<Div p-4>
					<Text.H5 content="🛠️ Output Inspector" text={colors.text} />
					<Text.Small content="View the generated HTML, Plain Text, and Headers side-by-side with your visual preview." text={colors.textMuted} />
				</Div>
				<Div p-4>
					<Text.H5 content="🧩 Variable Editor" text={colors.text} />
					<Text.Small content="Test your `[[placeholders]]` interactively. See how long names or empty values affect your layout." text={colors.textMuted} />
				</Div>
			</Table.Row>
		</Table>
	</Div>

	<!-- Footer CTA -->
	<Div p-10 bg={colors.codeBg} align-center border-t={colors.border}>
		<Text.H3 content="Ready to build?" text={colors.text} />
		<Spacer h-4 />
		<Button 
			href="/documentation/1__getting_started-introduction" 
			bg={colors.primary} 
			text={colors.white} 
			font-bold 
			p-3 
			px-6
			rounded
			content="Start the Guide"
		/>
	</Div>
</Email>
