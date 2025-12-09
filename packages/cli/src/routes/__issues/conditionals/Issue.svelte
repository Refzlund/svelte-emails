<script lang='ts'>
	import { Email, Text, Div, Button, Link, Br, Spacer, Divider, Img, Unsubscribe, Table } from 'svelte-emails'

	interface Props {
		showContent?: boolean
	}

	let { showContent }: Props = $props()
</script>

<Email preview='Comprehensive Conditional Test'>
	<Text.H1 content='Conditional Elements Test' />
	<Divider />

	<!-- Test 1: Simple Text Elements -->
	<Div bg-[#f3f4f6] p-4>
		<Text.H2 content='Test 1: Text Elements' />
		{#if showContent}
			<Text content='✓ Regular Text' />
			<Text.Paragraph content='✓ Paragraph Text' />
			<Text.Small content='✓ Small Text' />
			<Text.H3 content='✓ H3 Heading' />
			<Text.H4 content='✓ H4 Heading' />
			<Text.H5 content='✓ H5 Heading' />
			<Text.H6 content='✓ H6 Heading' />
			<Text.Code content='console.log("code")' />
			<Text.Codeblock content={'function test() {\n  return true\n}'} />
		{:else}
			<Text content='✗ Content hidden' text-[#dc2626] />
		{/if}
	</Div>

	<Spacer h-4 />

	<!-- Test 2: Interactive Elements -->
	<Div bg-[#eff6ff] p-4>
		<Text.H2 content='Test 2: Interactive Elements' />
		{#if showContent}
			<Button href='https://example.com' content='✓ Button Element' />
			<Br />
			<Link href='https://example.com' content='✓ Link Element' />
			<Br />
			<Unsubscribe href='https://example.com' content='✓ Unsubscribe Element' />
		{:else}
			<Text content='✗ Interactive elements hidden' text-[#dc2626] />
		{/if}
	</Div>

	<Spacer h-4 />

	<!-- Test 3: Layout Elements -->
	<Div bg-[#f0fdf4] p-4>
		<Text.H2 content='Test 3: Layout Elements' />
		{#if showContent}
			<Div border p-2 bg-[#ffffff]>
				<Text content='✓ Nested Div' />
			</Div>
			<Spacer h-2 />
			<Divider />
			<Spacer h-2 />
			<Img 
				src='https://via.placeholder.com/100x50' 
				alt='Test image' 
				width={100} 
				height={50} 
			/>
		{:else}
			<Text content='✗ Layout elements hidden' text-[#dc2626] />
		{/if}
	</Div>

	<Spacer h-4 />

	<!-- Test 4: Table Elements -->
	<Div bg-[#faf5ff] p-4>
		<Text.H2 content='Test 4: Table Elements' />
		{#if showContent}
			<Table border>
				<Table.Row header>
					<Text content='Header 1' />
					<Text content='Header 2' />
				</Table.Row>
				<Table.Row>
					<Text content='✓ Cell 1' />
					<Text content='✓ Cell 2' />
				</Table.Row>
			</Table>
		{:else}
			<Text content='✗ Table hidden' text-[#dc2626] />
		{/if}
	</Div>

	<Spacer h-4 />

	<!-- Test 5: Deeply Nested Elements -->
	<Div bg-[#fefce8] p-4>
		<Text.H2 content='Test 5: Deeply Nested Elements' />
		{#if showContent}
			<Div border p-2>
				<Text.H3 content='✓ Level 1' />
				<Div border p-2 ml-4>
					<Text.H4 content='✓ Level 2' />
					<Div border p-2 ml-4>
						<Text.H5 content='✓ Level 3' />
						<Div border p-2 ml-4>
							<Text content='✓ Deeply nested text' />
							<Button href='https://example.com' content='✓ Deeply nested button' />
							<Table border>
								<Table.Row>
									<Text content='✓ Nested table cell' />
								</Table.Row>
							</Table>
						</Div>
					</Div>
				</Div>
			</Div>
		{:else}
			<Text content='✗ Nested structure hidden' text-[#dc2626] />
		{/if}
	</Div>

	<Spacer h-4 />

	<!-- Test 6: Mixed Conditionals -->
	<Div bg-[#fff7ed] p-4>
		<Text.H2 content='Test 6: Mixed Conditionals' />
		<Div border p-2>
			{#if showContent}
				<Text content='✓ Outer condition true' />
				<Div ml-4>
					{#if showContent}
						<Text content='✓ Inner condition true' />
					{:else}
						<Text content='✗ Inner condition false (should not show)' />
					{/if}
				</Div>
			{:else}
				<Text content='✗ Outer condition false' />
			{/if}
		</Div>
	</Div>
</Email>
