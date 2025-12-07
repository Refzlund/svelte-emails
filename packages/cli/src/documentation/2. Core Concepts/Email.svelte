<script lang="ts">
	/**
	 * Email Component
	 * 
	 * The root component for all email templates.
	 */
	import {
		Email,
		Div,
		Text,
		Divider,
		Table
	} from 'svelte-emails'
	import { colors, style } from '../theme'
	import { footer } from '../Shared/Footer.svelte'
	import { callout } from '../Shared/Callout.svelte'

	const basicExample = `<script lang="ts">
  import { Email, Div, Text } from 'svelte-emails'
` + '<' + `/script>

<Email preview="Welcome to our newsletter!">
  <Div p-6 bg-[#ffffff]>
    <Text.H1 content="Hello World" />
  </Div>
</Email>`

	const layoutExample = `<Email
  preview="Your order has shipped!"
  body-bg-[#f3f4f6]
  bg-[#ffffff]
  max-w-[600px]
>
  <!-- Email content here -->
</Email>`

	const cliMetaExample = `<Email
  order=1
  category='Getting Started'
  preview="Welcome email"
>
  ...
</Email>`

	const styleExample = `<Email
  style={{
    H1: { color: '#2563eb' },
    Button: { background: '#10b981', borderRadius: '8px' },
    Paragraph: { lineHeight: '1.6' }
  }}
>
  <!-- All H1s, Buttons, Paragraphs get these defaults -->
  ...
</Email>`

	const responsiveExample = `<Email mobile-threshold-[425px]>
  <Div cols responsive>
    <!-- Stacks at 425px instead of default 480px -->
  </Div>
</Email>`

</script>

<Email
	order=0
	category='2. Core Concepts'
	preview="Understanding the Email root component"
	body-bg={colors.background}
	bg={colors.white}
	max-w-[700px]
>
	<!-- Header -->
	<Div rows gap-2 p-8 bg={colors.primary}>
		<Text.H1 content="📧 Email Component" text={colors.white} text-3xl font-bold />
		<Text content="The root wrapper for all email templates." text={colors.white} text-opacity-90 text-lg />
	</Div>

	<!-- Overview -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Overview" text={colors.text} />
		<Text.Paragraph content="Every email template must be wrapped in an `<Email>` component. It sets up the rendering context, defines the email layout, and provides metadata for the CLI." text={colors.textMuted} />
		<Text.Codeblock content={basicExample} highlight="svelte" />
	</Div>

	<Divider border={colors.border} />

	<!-- Email Layout -->
	<Div rows gap-6 p-8>
		<Div rows gap-2>
			<Text.H2 content="Email Layout" text={colors.text} />
			<Text.Paragraph content="Configure the visual structure with **preview text**, **backgrounds**, and **content width**:" text={colors.textMuted} />
		</Div>
		
		<Text.Codeblock content={layoutExample} highlight="svelte" />

		<Table cols="30% 45% 25%" border>
			<Table.Row header bg={colors.background}>
				<Text content="Attribute" font-bold />
				<Text content="Purpose" font-bold />
				<Text content="Default" font-bold />
			</Table.Row>
			<Table.Row>
				<Text.Code content="preview" />
				<Text content="Preheader text shown in inbox list (before opening)" />
				<Text.Code content='""' />
			</Table.Row>
			<Table.Row>
				<Text.Code content="body-bg-[#hex]" />
				<Text content="Outer background — the full-width page color" />
				<Text.Code content="#ffffff" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="bg-[#hex]" />
				<Text content="Inner background — the centered content area" />
				<Text.Code content="#ffffff" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="max-w-[Npx]" />
				<Text content="Content container width (also supports presets like `max-w-xl`)" />
				<Text.Code content="600px" />
			</Table.Row>
		</Table>

		{@render callout('tip', 'Keep preview text under 100 characters. It\'s hidden in the email body but visible in inbox previews — use it to entice opens!')}
	</Div>

	<Divider border={colors.border} />

	<!-- CLI Metadata -->
	<Div rows gap-4 p-8>
		<Text.H2 content="CLI Metadata" text={colors.text} />
		<Text.Paragraph content="Organize emails in the development CLI with folders and custom ordering:" text={colors.textMuted} />
		
		<Text.Codeblock content={cliMetaExample} highlight="svelte" />

		<Table cols="25% 75%" border>
			<Table.Row header bg={colors.background}>
				<Text content="Attribute" font-bold />
				<Text content="Purpose" font-bold />
			</Table.Row>
			<Table.Row>
				<Text.Code content="category" />
				<Text content="Groups emails into folders. Emails with the same category appear together." />
			</Table.Row>
			<Table.Row>
				<Text.Code content="order" />
				<Text content="Sort position within a category. Lower values appear first; unordered emails sort alphabetically." />
			</Table.Row>
		</Table>
		
		{@render callout('note', 'These are **CLI-only** features — they don\'t affect the rendered email output.')}
	</Div>

	<Divider border={colors.border} />

	<!-- Style Configuration -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Style Configuration" text={colors.text} />
		<Text.Paragraph content="Set default styles for components with the `style` prop:" text={colors.textMuted} />
		
		<Text.Codeblock content={styleExample} highlight="svelte" />
		
		<Text.Paragraph content="**Merge order** (later wins):" text={colors.textMuted} />
		<Div pl-4>
			<Text content="1. `presets.base` — Library defaults" text={colors.textMuted} />
			<Text content="2. `Email.style` — Email-level overrides" text={colors.textMuted} />
			<Text content="3. `render().style` — Render-time overrides" text={colors.textMuted} />
			<Text content="4. Inline attributes — `<Text text-[#red] />` always wins" text={colors.textMuted} />
		</Div>
	</Div>

	<Divider border={colors.border} />

	<!-- Mobile Threshold -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Responsive Breakpoint" text={colors.text} />
		<Text.Paragraph content="Control when responsive layouts switch to mobile with `mobile-threshold`:" text={colors.textMuted} />
		
		<Text.Codeblock content={responsiveExample} highlight="svelte" />
		
		<Table cols="50% 50%" border>
			<Table.Row header bg={colors.background}>
				<Text content="Value" font-bold />
				<Text content="Behavior" font-bold />
			</Table.Row>
			<Table.Row>
				<Text.Code content="mobile-threshold-[425px]" />
				<Text content="Tighter — columns stack on smaller screens" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="mobile-threshold-[600px]" />
				<Text content="Looser — columns stack on larger screens" />
			</Table.Row>
		</Table>
		
		<Text.Small content="Default is **480px**. Affects `responsive` columns, `mobile-only`, and `desktop-only` visibility." text={colors.textMuted} />
	</Div>

	<Divider border={colors.border} />

	<!-- Quick Reference -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Quick Reference" text={colors.text} />
		<Text.Small content="All Email component attributes at a glance:" text={colors.textMuted} />
		
		<Table cols="35% 50% 15%" border compact>
			<Table.Row header bg={colors.background}>
				<Text content="Attribute" font-bold />
				<Text content="Description" font-bold />
				<Text content="Default" font-bold />
			</Table.Row>
			<Table.Row>
				<Text.Code content="preview" />
				<Text content="Inbox preview text" />
				<Text.Code content='""' />
			</Table.Row>
			<Table.Row>
				<Text.Code content="body-bg-[#hex]" />
				<Text content="Full-width outer background" />
				<Text.Code content="#fff" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="bg-[#hex]" />
				<Text content="Content container background" />
				<Text.Code content="#fff" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="max-w-[Npx]" />
				<Text content="Content max-width" />
				<Text.Code content="600px" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="mobile-threshold-[Npx]" />
				<Text content="Responsive breakpoint" />
				<Text.Code content="480px" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="style" />
				<Text content="Component style overrides" />
				<Text.Code content="&#123;&#125;" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="category" />
				<Text content="CLI folder grouping" />
				<Text.Code content='""' />
			</Table.Row>
			<Table.Row>
				<Text.Code content="order" />
				<Text content="CLI sort order" />
				<Text.Code content="—" />
			</Table.Row>
		</Table>
	</Div>

	{@render footer()}
</Email>
