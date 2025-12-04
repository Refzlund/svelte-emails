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
		sponsorCompanyName?: string
		contractId?: string
		footer?: string
	}

	const {
		origin = 'http://localhost:5173',
		organisationLogo = 'https://fpoimg.com/400x100?text=Organisation+Logo',
		organisationName = 'Sports Organisation ApS',
		organisationSignerName = 'John Smith',
		sponsorCompanyName = 'Acme Corp',
		contractId = 'contract-123',
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
	preview="Receipt: {sponsorCompanyName} has signed their contract digitally"
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
		<Text.Paragraph content="Kære {organisationSignerName}" text={colors.text} />

		<Spacer h-4 />

		<Text.Paragraph
			content="Dette er en kvittering på at **{sponsorCompanyName}** har underskrevet deres kontrakt digitalt."
			text={colors.text}
			leading-relaxed
		/>

		<Spacer h-2 />

		<Text.Paragraph
			content="Kontrakten kan tilgås via følgende link:"
			text={colors.text}
		/>
	</Div>

	<Spacer h-6 />

	<!-- CTA Button -->
	<Div px-8 align-middle>
		<Button
			href="{origin}/admin/contracts?id={contractId}&view=true"
			bg={colors.brand}
			text-[#ffffff]
			px-8
			py-4
			rounded-full
			font-bold
			content="Åben kontrakt"
		/>
	</Div>

	<Spacer h-6 />

	<!-- Signature -->
	<Div px-8>
		<Text.Paragraph content="Venlig hilsen," text={colors.text} />
		<Text.Paragraph content={organisationName} text={colors.text} />
	</Div>

	<Spacer h-6 />

	<Divider border-[#e5e7eb] />

	<!-- Footer -->
	<Div p-6 align-middle>
		<Text.Small content={footer} text={colors.muted} />
	</Div>
</Email>
