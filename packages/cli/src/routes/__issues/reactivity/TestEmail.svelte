<script lang='ts'>
	import { Email, Text, Div } from 'svelte-emails'

	interface Props {
		message: string
		bgColor: string
	}

	const { message, bgColor }: Props = $props()
</script>

<Email preview={message}>
	<Div p-4 bg={bgColor}>
		<Text.Paragraph content={message} />
	</Div>
	<Div p-4>
		<Text.Paragraph content="Static content for comparison" />
	</Div>
</Email>
