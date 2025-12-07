<script lang='ts'>
	import { Email, Div, Text, Table } from 'svelte-emails'

	interface Props {
		message: string
		bgColor: string
		items?: { name: string; value: string }[]
		footer?: string
	}

	const {
		message,
		bgColor,
		items = [],
		footer
	}: Props = $props()
</script>

<Email preview={message}>
	<Div p-4 bg={bgColor}>
		<Text.Paragraph content={message} />
	</Div>

	<!-- This causes the crash when items is an empty array -->
	{#if items.length > 0}
		<Div p-4>
			<Table cols-[50%_50%]>
				{#each items as item}
					<Table.Row>
						<Text content={item.name} />
						<Text content={item.value} />
					</Table.Row>
				{/each}
			</Table>
		</Div>
	{/if}

	<!-- This causes the crash when footer is undefined -->
	<Div p-4>
		<Text content={footer} />
	</Div>

	<Div p-4>
		<Text.Paragraph content="Static content for comparison" />
	</Div>
</Email>
