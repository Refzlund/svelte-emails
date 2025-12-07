<script lang="ts">
	/**
	 * Previewing Emails
	 * 
	 * How to preview emails in your application using Email.Render.
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

	const basicRenderCode = `<script>
  import { Email, Div, Text } from 'svelte-emails'
  import MyEmail from './MyEmail.email.svelte'
  
  let output = $state()
` + '<' + `/script>

<!-- Renders in an isolated iframe -->
<Email.Render bind:output>
  <MyEmail />
</Email.Render>

<!-- Access rendered output -->
{#if output}
  <p>HTML size: {output.html.length} bytes</p>
  <p>Text preview: {output.text.slice(0, 100)}...</p>
{/if}`

	const placeholdersCode = `<script>
  import { Email } from 'svelte-emails'
  import WelcomeEmail from './WelcomeEmail.email.svelte'
  
  let name = $state('Alice')
  let output = $state()
` + '<' + `/script>

<input bind:value={name} placeholder="Enter name" />

<!-- Placeholders are interpolated into [[variable]] syntax -->
<Email.Render bind:output placeholders={{ name }}>
  <WelcomeEmail />
</Email.Render>`

	const modesCode = `<!-- Preview mode (default): Renders in iframe -->
<Email.Render mode="preview">
  <MyEmail />
</Email.Render>

<!-- Text mode: Shows plain text output -->
<Email.Render mode="text">
  <MyEmail />
</Email.Render>

<!-- HTML mode: Shows HTML source code -->
<Email.Render mode="html">
  <MyEmail />
</Email.Render>

<!-- HTML mode with prettify options -->
<Email.Render mode="html" prettify="html+style">
  <MyEmail />
</Email.Render>`

	const stylePresetsCode = `<script>
  import { Email, presets } from 'svelte-emails'
  import MyEmail from './MyEmail.email.svelte'
` + '<' + `/script>

<!-- Apply a style preset -->
<Email.Render style={presets.minimal}>
  <MyEmail />
</Email.Render>`

	const outputStructureCode = `interface RenderOutput {
  html: string      // Full HTML document
  text: string      // Plain text version
  headers: Record<string, string>  // Email headers (e.g., List-Unsubscribe)
}`

	const interactiveEditorCode = `<script>
  import { Email, Div, Text } from 'svelte-emails'
  
  let firstName = $state('Alice')
  let lastName = $state('Smith')
  let output = $state()
` + '<' + `/script>

<div class="editor">
  <div class="controls">
    <label>
      First Name
      <input bind:value={firstName} />
    </label>
    <label>
      Last Name
      <input bind:value={lastName} />
    </label>
  </div>
  
  <div class="preview">
    <Email.Render 
      bind:output
      placeholders={{ first_name: firstName, last_name: lastName }}
    >
      <Email preview="Welcome!">
        <Div p-6 bg-[#ffffff]>
          <Text.H1 content="Hello [[first_name]] [[last_name]]!" />
          <Text content="Welcome to our service." />
        </Div>
      </Email>
    </Email.Render>
  </div>
</div>`

</script>

<Email
	order=4
	category='1. Getting Started'
	preview="Preview emails using Email.Render"
	body-bg={colors.background}
	bg={colors.white}
	max-w-[700px]
>
	<!-- Header -->
	<Div rows gap-2 p-8 bg={colors.primary}>
		<Text.H1 content="👁️ Previewing Emails" text={colors.white} text-3xl font-bold />
		<Text content="Preview your email templates with live updates." text={colors.white} text-opacity-90 text-lg />
	</Div>

	<!-- Overview -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Overview" text={colors.text} />
		<Text.Paragraph content="The `<Email.Render>` component renders your email templates in an isolated iframe. It handles the IR tree collection, HTML rendering, and display—all reactively updating when your template or placeholders change." text={colors.textMuted} />
		<Text.Codeblock content={basicRenderCode} highlight="svelte" />
	</Div>

	<Divider border={colors.border} />

	<!-- Props Reference -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Props Reference" text={colors.text} />
		
		<Table cols="25% 75%" border>
			<Table.Row header bg={colors.background}>
				<Text content="Prop" font-bold />
				<Text content="Description" font-bold />
			</Table.Row>
			<Table.Row>
				<Text.Code content="mode" />
				<Text content="`'preview'` (iframe), `'text'` (plain text), or `'html'` (source code)" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="prettify" />
				<Text content="HTML formatting: `'none'`, `'html'`, or `'html+style'` (default)" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="placeholders" />
				<Text content="Object of values for `[[variable]]` interpolation" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="style" />
				<Text content="Style configuration (presets, theming)" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="bind:output" />
				<Text content="Bindable object containing `html`, `text`, and `headers`" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="children" />
				<Text content="Your email template (must contain `<Email>` at root)" />
			</Table.Row>
		</Table>
	</Div>

	<Divider border={colors.border} />

	<!-- Placeholders -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Placeholders" text={colors.text} />
		<Text.Paragraph content="Pass dynamic values to your templates using the `placeholders` prop. These replace `[[variable]]` syntax in your content:" text={colors.textMuted} />
		<Text.Codeblock content={placeholdersCode} highlight="svelte" />
		{@render callout('tip', 'The preview updates reactively when placeholder values change—perfect for building live editors.')}
	</Div>

	<Divider border={colors.border} />

	<!-- Render Modes -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Render Modes" text={colors.text} />
		<Text.Paragraph content="Switch between different output views:" text={colors.textMuted} />
		<Text.Codeblock content={modesCode} highlight="svelte" />
		
		<Table cols="25% 75%" border>
			<Table.Row header bg={colors.background}>
				<Text content="Mode" font-bold />
				<Text content="Description" font-bold />
			</Table.Row>
			<Table.Row>
				<Text.Code content="preview" />
				<Text content="Renders in isolated iframe (default)" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="text" />
				<Text content="Shows plain text output (markdown-formatted)" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="html" />
				<Text content="Shows HTML source code" />
			</Table.Row>
		</Table>
	</Div>

	<Divider border={colors.border} />

	<!-- Style Presets -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Style Presets" text={colors.text} />
		<Text.Paragraph content="Apply style presets to customize the look of your preview:" text={colors.textMuted} />
		<Text.Codeblock content={stylePresetsCode} highlight="svelte" />
		<Text.Small content="See the **Configuration** guide for all available style options." text={colors.textMuted} />
	</Div>

	<Divider border={colors.border} />

	<!-- Output Structure -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Output Structure" text={colors.text} />
		<Text.Paragraph content="The `output` binding provides access to the rendered result:" text={colors.textMuted} />
		<Text.Codeblock content={outputStructureCode} highlight="typescript" />
		{@render callout('note', 'The `headers` object contains email-specific metadata like `List-Unsubscribe` from the `<Unsubscribe>` component.')}
	</Div>

	<Divider border={colors.border} />

	<!-- Interactive Editor Example -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Building an Interactive Editor" text={colors.text} />
		<Text.Paragraph content="Combine placeholders with form inputs to build a live email editor:" text={colors.textMuted} />
		<Text.Codeblock content={interactiveEditorCode} highlight="svelte" />
	</Div>

	<Divider border={colors.border} />

	<!-- Advanced -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Advanced: IframePreview" text={colors.text} />
		<Text.Paragraph content="For more control over the preview iframe (scroll anchoring, mouse events, API-driven HTML), see the **Custom Previewing** guide in Advanced." text={colors.textMuted} />
	</Div>

	<!-- Footer -->
	{@render footer()}
</Email>
