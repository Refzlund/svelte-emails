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

	<!-- Tall box 1 - for scroll testing -->
	<Div p-4 bg="#e3f2fd">
		<Text.H2 content="Section 1 - Scroll Test" />
		<Div h-[200px] bg="#bbdefb" p-4>
			<Text content="Tall box 1 (200px) - scroll down to test persistence" />
		</Div>
	</Div>

	<!-- Tall box 2 -->
	<Div p-4 bg="#f3e5f5">
		<Text.H2 content="Section 2" />
		<Div h-[200px] bg="#ce93d8" p-4>
			<Text content="Tall box 2 (200px)" />
		</Div>
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

	<!-- Tall box 3 -->
	<Div p-4 bg="#e8f5e9">
		<Text.H2 content="Section 3" />
		<Div h-[200px] bg="#a5d6a7" p-4>
			<Text content="Tall box 3 (200px)" />
		</Div>
	</Div>

	<!-- This causes the crash when footer is undefined -->
	<Div p-4>
		<Text content={footer} />
	</Div>

	<!-- Tall box 4 -->
	<Div p-4 bg="#fff3e0">
		<Text.H2 content="Section 4" />
		<Div h-[200px] bg="#ffcc80" p-4>
			<Text content="Tall box 4 (200px)" />
		</Div>
	</Div>

	<Div p-4>
		<Text.Paragraph content="Static content for comparison" />
	</Div>

	<!-- Tall box 5 - bottom of email -->
	<Div p-4 bg="#fce4ec">
		<Text.H2 content="Section 5 - Bottom" />
		<Div h-[200px] bg="#f48fb1" p-4>
			<Text content="Tall box 5 (200px) - bottom section" />
		</Div>
	</Div>
</Email>
