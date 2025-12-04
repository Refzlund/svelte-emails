<script lang='ts'>
	import {
		Email,
		Div,
		Text,
		Spacer
	} from 'svelte-emails'

	interface Props {
		code?: string
	}

	const {
		code = 'LGWOKA20'
	}: Props = $props()

	const colors = {
		brand: '#007bff',
		text: '#333333',
		muted: '#666666',
		bg: '#f8fafc',
		codeBg: '#f3f4f6'
	}
</script>

<Email
	preview="Sponsy - Reset password request"
	body-bg={colors.bg}
	bg-[#ffffff]
>
	<!-- Header -->
	<Div p-8 align-middle>
		<Text.H1 content="Reset your password" text={colors.text} />
	</Div>

	<!-- Content -->
	<Div px-8>
		<Text.Paragraph
			content="We received a request to reset your password. Use the code below to complete the process."
			text={colors.text}
			leading-relaxed
		/>
		<Spacer h-2 />
		<Text.Paragraph
			content="If this wasn't you, you can comfortably ignore this mail."
			text={colors.muted}
			leading-relaxed
		/>
	</Div>

	<Spacer h-6 />

	<!-- Reset Code -->
	<Div px-8 align-middle>
		<Text.H2 content="Reset Code" text={colors.text} />
		<Spacer h-4 />
		<Div bg={colors.codeBg} p-6 rounded-lg align-middle>
			<Text.H2
				content={code}
				text={colors.brand}
				tracking-widest
				font-bold
			/>
		</Div>
	</Div>

	<Spacer h-8 />

	<!-- Footer -->
	<Div p-6 align-middle bg={colors.bg}>
		<Text.Small content="© Sponsy - Sponsorship Management" text={colors.muted} />
	</Div>
</Email>
