<script lang='ts'>
	import {
		Email,
		Div,
		Text,
		Button,
		Spacer
	} from 'svelte-emails'

	interface Props {
		inviteLink?: string
		organisationName?: string
	}

	const {
		inviteLink = 'https://sponsy.net/invite/1234567890',
		organisationName = 'Sponsy Organisation'
	}: Props = $props()

	const colors = {
		brand: '#007bff',
		text: '#333333',
		muted: '#666666',
		bg: '#f8fafc'
	}
</script>

<Email
	preview="Accept your invitation to join {organisationName} on Sponsy"
	body-bg={colors.bg}
	bg-[#ffffff]
>
	<!-- Header -->
	<Div p-8 align-middle>
		<Text.H1 content="You have been invited!" text={colors.text} />
	</Div>

	<!-- Content -->
	<Div px-8 pb-4>
		<Text.Paragraph
			content="You have been invited to join **{organisationName}** on Sponsy."
			text={colors.text}
			leading-relaxed
		/>
		<Spacer h-2 />
		<Text.Paragraph
			content="If you don't want to join, you can comfortably ignore this mail."
			text={colors.muted}
			leading-relaxed
		/>
	</Div>

	<!-- CTA Button -->
	<Div p-8 align-middle>
		<Button
			href={inviteLink}
			bg={colors.brand}
			text-[#ffffff]
			px-8
			py-4
			rounded-full
			font-bold
			content="Accept Invitation"
		/>
	</Div>

	<Spacer h-8 />

	<!-- Footer -->
	<Div p-6 align-middle bg={colors.bg}>
		<Text.Small content="© Sponsy - Sponsorship Management" text={colors.muted} />
	</Div>
</Email>
