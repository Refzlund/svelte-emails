<script lang='ts'>
	import {
		Email,
		Div,
		Text,
		Button,
		Img,
		Spacer,
		Divider
	} from 'svelte-emails'

	interface Props {
		origin?: string
		organisationLogo?: string
		organisationName?: string
		organisationSignerName?: string
		sponsorName?: string
		linkId?: string
		footer?: string
	}

	const {
		origin = 'http://localhost:5173',
		organisationLogo = 'https://fpoimg.com/400x100?text=Organisation+Logo',
		organisationName = 'Sports Organisation ApS',
		organisationSignerName = 'John Smith',
		sponsorName = 'Jane Doe',
		linkId = 'link-123',
		footer = 'Sports Organisation ApS\nAddress Line 1\nCity, Postal Code'
	}: Props = $props()

	const colors = {
		brand: '#007bff',
		text: '#333333',
		muted: '#666666',
		bg: '#f8fafc'
	}
</script>

<Email
	preview="Kvittering på din digitale underskrift af samarbejdsaftalen"
	body-bg={colors.bg}
	bg-[#ffffff]
>
	<!-- Logo -->
	<Div p-8 align-middle>
		<Img
			src={organisationLogo}
			alt="{organisationName} logo"
			width={400}
			height={100}
		/>
	</Div>

	<!-- Content -->
	<Div px-8>
		<Text.Paragraph content="Kære {sponsorName}" text={colors.text} />

		<Spacer h-4 />

		<Text.Paragraph
			content="Dette er en kvittering på din digitale underskrift af samarbejdsaftalen indgået med **{organisationName}**."
			text={colors.text}
			leading-relaxed
		/>

		<Spacer h-2 />

		<Text.Paragraph
			content="Du kan til en hver tid se og downloade aftalen via følgende link:"
			text={colors.text}
		/>
	</Div>

	<Spacer h-6 />

	<!-- CTA Button -->
	<Div px-8 align-middle>
		<Button
			href="{origin}/sign/{linkId}"
			bg={colors.brand}
			text-[#ffffff]
			px-8
			py-4
			rounded-full
			font-bold
			content="Se og download aftalen"
		/>
	</Div>

	<Spacer h-6 />

	<!-- Signature -->
	<Div px-8>
		<Text.Paragraph content="Venlig hilsen," text={colors.text} />
		<Text.Paragraph content={organisationSignerName} text={colors.text} />
		<Text.Paragraph content={organisationName} text={colors.text} />
	</Div>

	<Spacer h-6 />

	<Divider border-[#e5e7eb] />

	<!-- Footer -->
	<Div p-6 align-middle>
		<Text.Small content={footer} text={colors.muted} />
	</Div>
</Email>
