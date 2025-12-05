<script lang='ts'>
	import {
		Email,
		Div,
		Text,
		Button,
		Img,
		Spacer,
		Link,
		Divider,
		Unsubscribe
	} from 'svelte-emails'

	// Color palette
	const colors = {
		brand: '#4353ff',
		text: '#1a1a1a',
		muted: '#666666',
		light: '#999999',
		bg: '#f5f5f5',
		border: '#e5e5e5',
		white: '#ffffff'
	}

	// Spacing scale
	const spacing = {
		section: '1.5rem',
		content: '1rem',
		small: '0.5rem'
	}

	interface Testimonial {
		quote: string
		name: string
		title: string
		imageUrl: string
	}

	interface Props {
		testimonials?: Testimonial[]
		ctaUrl?: string
		faqUrl?: string
		speakerApplicationUrl?: string
	}

	const {
		testimonials = [
			{
				quote: 'I almost jumped out of my seat with excitement [during the product keynote]. It really shows Webflow is listening to its community.',
				name: 'TIMOTHY RICKS',
				title: 'Content Creator',
				imageUrl: 'https://fpoimg.com/80x80'
			},
			{
				quote: 'The Webflow community is incredible and you leave feeling energized and connected to other people in this space.',
				name: 'JACOB SUSSMAN',
				title: 'CEO & Co-Founder at BX Studio',
				imageUrl: 'https://fpoimg.com/80x80'
			},
			{
				quote: 'Webflow Conf had me feeling both inspired and challenged. Name a more iconic duo.',
				name: 'CAT LIM',
				title: 'Freelance Art Director',
				imageUrl: 'https://fpoimg.com/80x80'
			},
			{
				quote: "Seeing Webflow's evolution has just made me realize that this tool is on the right track and it's doing amazing things for everybody.",
				name: 'ANFERNEE GRANT',
				title: 'Designer & Developer at 8020',
				imageUrl: 'https://fpoimg.com/80x80'
			}
		],
		ctaUrl = 'https://webflow.com/conf',
		faqUrl = 'https://webflow.com/conf/faq',
		speakerApplicationUrl = 'https://webflow.com/conf/speakers'
	}: Props = $props()
</script>

<Email
	category='Test'
	preview="Don't just take our word for it — Learn why past attendees love Webflow Conf!"
	body-bg={colors.bg}
	bg={colors.white}
	max-w-[600px]
>
	<!-- Header with Logo -->
	<Div p={spacing.section} align-middle>
		<Img
			src="https://fpoimg.com/40x40"
			alt="Webflow"
			width={40}
			height={40}
		/>
	</Div>

	<!-- Hero Section -->
	<Div p-8 align-middle>
		<Text.H1
			content="Don't just take our word for it"
			text={colors.text}
			text-[36px]
			font-bold
			leading-tight
			align-middle
		/>

		<Spacer h-4 />

		<Text.Paragraph
			content="Learn from past attendees why you'll love attending Webflow Conf!"
			text={colors.muted}
			text-lg
			align-middle
		/>

		<Spacer h-6 />

		<Button
			href={ctaUrl}
			content="Register now — it's free"
			bg={colors.brand}
			text={colors.white}
			px-8
			py-4
			font-semibold
			rounded-md
		/>
	</Div>

	<Spacer h-4 />

	<!-- Testimonial 1 - Image Left -->
	<Div p={spacing.section} border-t border={colors.border}>
		<Div cols="25% 75%" gap-4>
			<Div align-middle>
				<Img
					src={testimonials[0].imageUrl}
					alt={testimonials[0].name}
					width={80}
					height={80}
					rounded-full
				/>
			</Div>
			<Div>
				<Text.Paragraph
					content={`"${testimonials[0].quote}"`}
					text={colors.text}
					text-base
					leading-relaxed
					italic
				/>
				<Spacer h-2 />
				<Text.Small content="**{testimonials[0].name}**" text={colors.brand} />
				<Text.Small content="  {testimonials[0].title}" text={colors.muted} />
			</Div>
		</Div>
	</Div>

	<!-- Testimonial 2 - Image Right -->
	<Div p={spacing.section} border-t border={colors.border}>
		<Div cols="75% 25%" gap-4>
			<Div>
				<Text.Paragraph
					content={`"${testimonials[1].quote}"`}
					text={colors.text}
					text-base
					leading-relaxed
					italic
				/>
				<Spacer h-2 />
				<Text.Small content="**{testimonials[1].name}**" text={colors.brand} />
				<Text.Small content="  {testimonials[1].title}" text={colors.muted} />
			</Div>
			<Div align-middle>
				<Img
					src={testimonials[1].imageUrl}
					alt={testimonials[1].name}
					width={80}
					height={80}
					rounded-full
				/>
			</Div>
		</Div>
	</Div>

	<!-- Testimonial 3 - Highlighted Box -->
	<Div bg={colors.bg} p={spacing.section}>
		<Div cols="25% 75%" gap-4>
			<Div align-middle>
				<Img
					src={testimonials[2].imageUrl}
					alt={testimonials[2].name}
					width={80}
					height={80}
					rounded-full
				/>
			</Div>
			<Div>
				<Text.Paragraph
					content={`"${testimonials[2].quote}"`}
					text={colors.text}
					text-base
					leading-relaxed
					italic
				/>
				<Spacer h-2 />
				<Text.Small content="**{testimonials[2].name}**" text={colors.brand} />
				<Text.Small content="  {testimonials[2].title}" text={colors.muted} />
			</Div>
		</Div>
	</Div>

	<!-- Testimonial 4 - Image Right -->
	<Div p={spacing.section} border-t border={colors.border}>
		<Div cols="75% 25%" gap-4>
			<Div>
				<Text.Paragraph
					content={`"${testimonials[3].quote}"`}
					text={colors.text}
					text-base
					leading-relaxed
					italic
				/>
				<Spacer h-2 />
				<Text.Small content="**{testimonials[3].name}**" text={colors.brand} />
				<Text.Small content="  {testimonials[3].title}" text={colors.muted} />
			</Div>
			<Div align-middle>
				<Img
					src={testimonials[3].imageUrl}
					alt={testimonials[3].name}
					width={80}
					height={80}
					rounded-full
				/>
			</Div>
		</Div>
	</Div>

	<Spacer h-4 />

	<!-- CTA Section -->
	<Div p-8 align-middle>
		<Text.H2
			content="Get the full Webflow Conf experience by joining us online this October."
			text={colors.text}
			text-[24px]
			font-bold
			leading-snug
		/>

		<Spacer h-6 />

		<Button
			href={ctaUrl}
			content="Register now"
			bg={colors.brand}
			text={colors.white}
			px-8
			py-4
			font-semibold
			rounded-md
		/>
	</Div>

	<!-- Speaker Application Section -->
	<Div p={spacing.section}>
		<Div cols="35% 65%" gap-4>
			<Div>
				<Img
					src="https://fpoimg.com/200x200"
					alt="Speaker at conference"
					width={200}
					height={200}
					rounded-lg
				/>
			</Div>
			<Div>
				<Text.H3 content="**Share your expertise**" text={colors.text} text-lg />
				<Spacer h-2 />
				<Text.Paragraph
					content="Apply to speak at Webflow Conf and share your story with a worldwide audience. Applications are open through June 30."
					text={colors.muted}
					text-sm
					leading-relaxed
				/>
				<Spacer h-4 />
				<Link href={speakerApplicationUrl}>
					<Text content="Apply to speak →" text={colors.brand} font-semibold />
				</Link>
			</Div>
		</Div>
	</Div>

	<Spacer h-4 />

	<!-- FAQ Section -->
	<Div p={spacing.section} border-t border={colors.border}>
		<Text.Paragraph
			content="Have questions? [Check out our FAQ]({faqUrl}) or reply to this email."
			text={colors.muted}
			text-sm
		/>
	</Div>

	<Divider border={colors.border} />

	<!-- Social Links -->
	<Div p={spacing.section} align-middle>
		<Div cols gap-4 align-middle>
			<Link href="https://linkedin.com/company/webflow">
				<Img src="https://fpoimg.com/24x24" alt="LinkedIn" width={24} height={24} />
			</Link>
			<Link href="https://twitter.com/webflow">
				<Img src="https://fpoimg.com/24x24" alt="X (Twitter)" width={24} height={24} />
			</Link>
			<Link href="https://facebook.com/webflow">
				<Img src="https://fpoimg.com/24x24" alt="Facebook" width={24} height={24} />
			</Link>
			<Link href="https://instagram.com/webflow">
				<Img src="https://fpoimg.com/24x24" alt="Instagram" width={24} height={24} />
			</Link>
			<Link href="https://youtube.com/webflow">
				<Img src="https://fpoimg.com/24x24" alt="YouTube" width={24} height={24} />
			</Link>
			<Link href="https://dribbble.com/webflow">
				<Img src="https://fpoimg.com/24x24" alt="Dribbble" width={24} height={24} />
			</Link>
		</Div>

		<Spacer h-4 />

		<Text.Small
			content="Webflow Inc. 398 11th Street, 2nd floor, San Francisco, CA 94103"
			text={colors.light}
		/>

		<Spacer h-2 />

		<Unsubscribe
			href="https://webflow.com/unsubscribe"
			content="Unsubscribe from Webflow Conf emails"
			text={colors.light}
			text-xs
		/>
	</Div>
</Email>
