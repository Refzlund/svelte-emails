<script lang='ts'>
	import {
		Email,
		Div,
		Text,
		Img,
		Spacer,
		Divider
	} from 'svelte-emails'

	interface Props {
		coverImage?: string
		title?: string
		introduction?: string
		participantCount?: number
		showSponsors?: boolean
		sponsorToast?: string
		sponsorLogos?: string[]
		footer?: string
	}

	const {
		coverImage = 'https://fpoimg.com/400x200?text=Event+Cover+Image',
		title = 'Tak for din tilmelding!',
		introduction = 'Tak for din tilmelding til vores arrangement.\n\nVi glæder os til at se dig!',
		participantCount = 2,
		showSponsors = true,
		sponsorToast = 'Tak til vores sponsorer',
		sponsorLogos = [
			'https://fpoimg.com/100x50?text=Sponsor+1',
			'https://fpoimg.com/100x50?text=Sponsor+2'
		],
		footer = 'Sports Organisation ApS\nAddress Line 1\nCity, Postal Code'
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

	<!-- Participant Count -->
	{#if participantCount}
		<Div px-8 align-middle>
			<Text
				content="Du har tilmeldt **{participantCount}** deltager{participantCount > 1 ? 'e' : ''}"
				text={colors.green}
				font-bold
			/>
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
					<Div p-4>
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
