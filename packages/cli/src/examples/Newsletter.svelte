<script lang="ts">
	/**
	 * Newsletter Example
	 * 
	 * Demonstrates a typical newsletter email with:
	 * - Header with logo and navigation
	 * - Hero section with featured content
	 * - Multi-column article grid (responsive)
	 * - Call-to-action buttons
	 * - Footer with social links and unsubscribe
	 */
	import {
		Email,
		Div,
		Text,
		Button,
		Link,
		Img,
		Spacer,
		Divider,
		Unsubscribe
	} from 'svelte-emails'

	// Brand colors
	const colors = {
		primary: '#6366f1',
		primaryDark: '#4f46e5',
		text: '#1f2937',
		textMuted: '#6b7280',
		background: '#f9fafb',
		white: '#ffffff',
		border: '#e5e7eb'
	}

	interface Props {
		companyName?: string
		recipientName?: string
		issueNumber?: number
	}

	const {
		companyName = 'Svelte Weekly',
		recipientName = 'Developer',
		issueNumber = 42
	}: Props = $props()
</script>

<Email
	preview="Issue #{issueNumber} - The latest in Svelte development"
	body-bg={colors.background}
	bg={colors.white}
	max-w-[600px]
>
	<!-- Header -->
	<Div p-6 bg={colors.primary}>
		<Div cols responsive align-middle>
			<Div>
				<Text.H1 
					content="📧 {companyName}" 
					text={colors.white}
					text-2xl
					font-bold
				/>
			</Div>
			<Div align-right>
				<Text content="Issue #{issueNumber}" text={colors.white} text-opacity-75 text-sm />
			</Div>
		</Div>
	</Div>

	<!-- Greeting -->
	<Div p-6>
		<Text.H2 
			content="Hello, {recipientName}! 👋" 
			text={colors.text}
			text-xl
		/>
		<Spacer h-2 />
		<Text.Paragraph 
			content="Welcome to this week's roundup of the best Svelte content. We've curated the top articles, tutorials, and releases just for you."
			text={colors.textMuted}
			leading-relaxed
		/>
	</Div>

	<Divider border={colors.border} />

	<!-- Featured Article -->
	<Div p-6>
		<Text.H3 content="🌟 Featured Article" text={colors.text} />
		<Spacer h-4 />
		
		<Div border={colors.border} border-1 rounded-lg>
			<Img 
				src="https://placehold.co/600x300/6366f1/ffffff?text=Featured+Article"
				alt="Featured article hero"
				width={600}
				height={300}
			/>
			<Div p-4>
				<Text.H4 content="**Understanding Svelte 5 Runes**" text={colors.text} />
				<Spacer h-2 />
				<Text.Paragraph 
					content="A deep dive into the new reactivity system that powers Svelte 5. Learn how `$state`, `$derived`, and `$effect` work under the hood."
					text={colors.textMuted}
					text-sm
				/>
				<Spacer h-4 />
				<Button
					href="https://example.com/article"
					bg={colors.primary}
					text={colors.white}
					px-6
					py-3
					rounded-md
					font-semibold
					content='Read More →'
				/>
			</Div>
		</Div>
	</Div>

	<!-- Article Grid -->
	<Div p-6 bg={colors.background}>
		<Text.H3 content="📚 More Articles" text={colors.text} />
		<Spacer h-4 />
		
		<Div cols responsive gap-4>
			<!-- Article 1 -->
			<Div bg={colors.white} border={colors.border} border-1 rounded-lg p-4 h-full>
				<Text.H5 content="**Building Forms with Superforms**" text={colors.text} />
				<Spacer h-2 />
				<Text.Small 
					content="Type-safe forms made easy with SvelteKit Superforms."
					text={colors.textMuted}
				/>
				<Spacer h-3 />
				<Link href="https://example.com/forms" text={colors.primary} content='Read article →' />
			</Div>

			<!-- Article 2 -->
			<Div bg={colors.white} border={colors.border} border-1 rounded-lg p-4 h-full>
				<Text.H5 content="**SvelteKit + Tailwind CSS**" text={colors.text} />
				<Spacer h-2 />
				<Text.Small 
					content="The ultimate guide to styling your SvelteKit apps."
					text={colors.textMuted}
				/>
				<Spacer h-3 />
				<Link href="https://example.com/tailwind" text={colors.primary} content='Read article →' align-bottom />
			</Div>
		</Div>

		<Spacer h-4 />

		<Div cols responsive gap-4>
			<!-- Article 3 -->
			<Div bg={colors.white} border={colors.border} border-1 rounded-lg p-4>
				<Text.H5 content="**Auth with Lucia**" text={colors.text} />
				<Spacer h-2 />
				<Text.Small 
					content="Implement authentication in your SvelteKit app."
					text={colors.textMuted}
				/>
				<Spacer h-3 />
				<Link href="https://example.com/auth" text={colors.primary} content='Read article →' />
			</Div>

			<!-- Article 4 -->
			<Div bg={colors.white} border={colors.border} border-1 rounded-lg p-4>
				<Text.H5 content="**Server Actions Deep Dive**" text={colors.text} />
				<Spacer h-2 />
				<Text.Small 
					content="Master form actions and progressive enhancement."
					text={colors.textMuted}
				/>
				<Spacer h-3 />
				<Link href="https://example.com/actions" text={colors.primary} content='Read article →' />
			</Div>
		</Div>
	</Div>

	<!-- CTA Section -->
	<Div p-6 bg={colors.primaryDark} align-center>
		<Text.H3 content="🚀 Start Building Today" text={colors.white} />
		<Spacer h-2 />
		<Text.Paragraph 
			content="Join thousands of developers building with Svelte."
			text={colors.white}
			text-opacity-75
		/>
		<Spacer h-4 />
		<Button
			href="https://svelte.dev"
			bg={colors.white}
			text={colors.primaryDark}
			px-8
			py-4
			rounded-lg
			font-bold
			text-lg
			content='Get Started'
		/>
	</Div>

	<!-- Footer -->
	<Div p-6 bg={colors.background}>
		<Div align-center>
			<Text content={companyName} text={colors.text} font-semibold />
			<Spacer h-2 />
			<Text.Small 
				content="You're receiving this because you subscribed to {companyName}."
				text={colors.textMuted}
			/>
			<Spacer h-4 />
			
			<Div cols align-middle gap-4>
				<Link href="https://twitter.com" text={colors.textMuted}>Twitter</Link>
				<Text content="•" text={colors.border} />
				<Link href="https://github.com" text={colors.textMuted}>GitHub</Link>
				<Text content="•" text={colors.border} />
				<Link href="https://discord.com" text={colors.textMuted}>Discord</Link>
			</Div>
			
			<Spacer h-4 />
			<Unsubscribe href="https://example.com/unsubscribe" text={colors.textMuted} text-xs />
		</Div>
	</Div>
</Email>
