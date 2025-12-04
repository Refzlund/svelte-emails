<script lang='ts'>
	import {
		Email,
		Div,
		Text,
		Button,
		Img,
		Spacer,
		Divider,
		Table
	} from 'svelte-emails'

	interface ProgramItem {
		time: string
		description: string
	}

	interface Match {
		home: string
		away: string
		arena: string
	}

	interface Props {
		origin?: string
		coverImage?: string
		title?: string
		introduction?: string
		eventDate?: string
		match?: Match
		program?: ProgramItem[]
		signature?: string
		showSponsors?: boolean
		sponsorToast?: string
		sponsorLogos?: string[]
		footer?: string
		inviteeId?: string
	}

	const {
		origin = 'http://localhost:5173',
		coverImage = 'https://fpoimg.com/400x200?text=Event+Cover+Image',
		title = 'Invitation til arrangement',
		introduction = 'Du er hermed inviteret til vores kommende arrangement.\n\nVi glæder os til at se dig!',
		eventDate = 'Lørdag d. 13 april kl. 15:00',
		match = {
			home: 'Hjemmeholdet',
			away: 'Udeholdet',
			arena: 'Stadion Arena'
		},
		program = [
			{ time: '14:00', description: 'Ankomst og velkomst' },
			{ time: '15:00', description: 'Kampstart' },
			{ time: '17:00', description: 'Afslutning' }
		],
		signature = 'Med venlig hilsen\nArrangørteamet',
		showSponsors = true,
		sponsorToast = 'Tak til vores sponsorer',
		sponsorLogos = [
			'https://fpoimg.com/100x50?text=Sponsor+1',
			'https://fpoimg.com/100x50?text=Sponsor+2'
		],
		footer = 'Sports Organisation ApS\nAddress Line 1\nCity, Postal Code',
		inviteeId = 'invitee-123'
	}: Props = $props()

	const colors = {
		brand: '#007bff',
		text: '#333333',
		muted: '#666666',
		green: '#22c55e',
		bg: '#f8fafc'
	}
</script>

<Email
	preview={introduction.split('\n')[0]}
	body-bg={colors.bg}
	bg-[#ffffff]
>
	<!-- Cover Image -->
	{#if coverImage}
		<Div p-4 align-middle>
			<Img
				src={coverImage}
				alt="Event cover"
				width={400}
				height={200}
			/>
		</Div>
	{/if}

	<!-- Title -->
	{#if title}
		<Div px-8 align-middle>
			<Text.H1 content={title} text={colors.text} />
		</Div>
		<Spacer h-4 />
	{/if}

	<!-- Introduction -->
	{#if introduction}
		<Div px-8>
			<Text.Paragraph content={introduction} text={colors.text} leading-relaxed />
		</Div>
		<Spacer h-4 />
	{/if}

	<!-- Event Date -->
	{#if eventDate}
		<Div px-8 align-middle>
			<Text
				content={eventDate}
				text={colors.text}
				text-[24px]
				font-light
			/>
		</Div>
		<Spacer h-6 />
	{/if}

	<!-- CTA Button -->
	<Div px-8 pb-8 align-middle>
		<Button
			href="{origin}/event/{inviteeId}"
			bg={colors.brand}
			text-[#ffffff]
			px-8
			py-4
			rounded-full
			font-bold
			content="Åben tilmelding"
		/>
	</Div>

	<!-- Match Details -->
	{#if match?.home && match?.away}
		<Div px-8 align-middle gap-2 rows my-2>
			<Text.H3 content="**Kampdetaljer**" text={colors.green} />
			<Div rows>
				<Text content="{match.home} - {match.away}" text={colors.text} />
				<Text content="Arena: {match.arena}" text={colors.text} />
			</Div>
		</Div>
		<Spacer h-4 />
	{/if}

	<!-- Program -->
	{#if program && program.length > 0}
		<Div px-8>
			<Text.H3 content="**Program**" text={colors.green} />
			<Spacer h-2 />
			<Table cols-[15%_85%] cell-padding-0>
				{#each program as item}
					<Table.Row pb-2>
						<Text content={item.time} text={colors.text} />
						<Text content={item.description} text={colors.text} />
					</Table.Row>
				{/each}
			</Table>
		</Div>
		<Spacer h-4 />
	{/if}

	<!-- Signature -->
	{#if signature}
		<Div px-8>
			<Text.Paragraph content={signature} text={colors.text} />
		</Div>
		<Spacer h-6 />
	{/if}

	<!-- Sponsors -->
	{#if showSponsors && (sponsorToast || sponsorLogos?.length)}
		<Divider border-[#e5e7eb] />
		<Spacer h-4 />

		{#if sponsorToast}
			<Div px-8 align-middle>
				<Text content={sponsorToast} text={colors.muted} />
			</Div>
			<Spacer h-4 />
		{/if}

		{#if sponsorLogos && sponsorLogos.length > 0}
			<Div px-8 align-middle cols gap-4>
				{#each sponsorLogos as logo}
					<Div p-4 align-middle>
						<Img src={logo} alt="Sponsor logo" width={100} height={50} />
					</Div>
				{/each}
			</Div>
		{/if}
	{/if}

	<Divider border-[#e5e7eb] />

	<!-- Footer -->
	<Div p-6 align-middle>
		<Text.Small content={footer} text={colors.muted} />
	</Div>
</Email>
