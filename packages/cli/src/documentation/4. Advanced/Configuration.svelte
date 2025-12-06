<script lang="ts">
	/**
	 * Configuration & Theming
	 * 
	 * Customizing the look and feel with presets and themes.
	 */
	import {
		Email,
		Div,
		Text,
		Button,
		Spacer,
		Divider,
		Table
	} from 'svelte-emails'

	const colors = {
		primary: '#10b981',
		primaryDark: '#059669',
		text: '#111827',
		textMuted: '#4b5563',
		background: '#f3f4f6',
		white: '#ffffff',
		border: '#d1d5db',
		code: '#1f2937',
		codeBg: '#f9fafb'
	}

	const scriptTag = '<' + '/script>'
	const presetCode = `<script>
  import { Email, presets, merge } from 'svelte-emails'
  
  const myStyle = merge(presets.base, {
    Button: {
      backgroundColor: '#10b981',
      borderRadius: '8px'
    }
  })
${scriptTag}

<Email style={myStyle}>...</Email>`

</script>

<Email
	order=2
	category='4. Advanced'
	preview="Configuration and theming guide"
	body-bg={colors.background}
	bg={colors.white}
	max-w-[700px]
>
	<!-- Header -->
	<Div p-8 bg={colors.primary}>
		<Text.H1 content="🎨 Configuration" text={colors.white} text-3xl font-bold />
		<Spacer h-2 />
		<Text content="Global theming and style presets." text={colors.white} text-opacity-90 text-lg />
	</Div>

	<!-- Presets -->
	<Div p-8>
		<Text.H2 content="Style Presets" text={colors.text} />
		<Spacer h-2 />
		<Text.Paragraph content="We provide several built-in presets to get you started quickly." text={colors.textMuted} />
		<Spacer h-4 />
		
		<Table cols="30% 70%" border>
			<Table.Row header bg={colors.background}>
				<Text content="Preset" font-bold />
				<Text content="Description" font-bold />
			</Table.Row>
			<Table.Row>
				<Text.Code content="presets.base" />
				<Text content="Clean, neutral defaults (default)" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="presets.dark" />
				<Text content="Dark mode styling" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="presets.serif" />
				<Text content="Serif typography (Georgia, etc.)" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="presets.monospace" />
				<Text content="Monospace typography" />
			</Table.Row>
		</Table>
	</Div>

	<Divider border={colors.border} />

	<!-- Custom Theming -->
	<Div p-8>
		<Text.H2 content="Custom Theming" text={colors.text} />
		<Spacer h-2 />
		<Text.Paragraph content="You can override any component style globally using the `style` prop on `<Email>`. Use the `merge` helper to extend a preset." text={colors.textMuted} />
		<Spacer h-4 />
		<Div bg={colors.codeBg} p-4 border={colors.border} rounded>
			<Text.Codeblock content={presetCode} highlight="svelte" />
		</Div>
		<Spacer h-4 />
		<Text.Small content="**Configurable Components:**" text={colors.text} font-bold />
		<Text content="
- `root` (Global font, line-height)
- `Text` (H1-H6, Paragraph, Small)
- `Button`
- `Link`
- `Code`, `Codeblock`
- `Divider`
- `Table`
" text={colors.textMuted} />
	</Div>

	<!-- Footer -->
	<Div p-6 bg={colors.codeBg} align-center border-t={colors.border}>
		<Text.Small content="You're now an expert! Happy coding." text={colors.textMuted} />
	</Div>
</Email>
