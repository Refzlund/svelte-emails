<script lang="ts">
	/**
	 * Custom Previewing
	 * 
	 * Advanced: Using IframePreview for custom preview implementations.
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

	const comparisonCode = `<!-- Simple: Use Email.Render for most cases -->
<Email.Render bind:output placeholders={{ name: 'Alice' }}>
  <MyEmail />
</Email.Render>

<!-- Advanced: Use IframePreview when you need:
     - Pre-rendered HTML from an API
     - Custom scroll anchoring
     - Mouse event forwarding
     - Fine-grained iframe control -->
<IframePreview html={preRenderedHtml} />`

	const iframePreviewCode = `<script>
  import { IframePreview } from 'svelte-emails'
  
  let emailHtml = $state('')
  
  async function loadPreview() {
    const res = await fetch('/api/render-email')
    emailHtml = await res.text()
  }
` + '<' + `/script>

<IframePreview html={emailHtml} />`

	const iframePreviewImportCode = `import { Email } from 'svelte-emails'

// IframePreview is available as Email.IframePreview
const { IframePreview } = Email

// Or import directly
import { IframePreview } from 'svelte-emails'`

	const bindHeightCode = `<script>
  import { IframePreview } from 'svelte-emails'
  
  let iframeHeight = $state(0)
` + '<' + `/script>

<div class="preview-container">
  <IframePreview 
    html={emailHtml} 
    bind:height={iframeHeight}
  />
</div>

<p>Email height: {iframeHeight}px</p>`

	const scrollAnchoringCode = `<script>
  import { IframePreview } from 'svelte-emails'
  
  let scrollContainer: HTMLElement
  let heightTarget: HTMLElement
  let iframeHeight = $state(0)
` + '<' + `/script>

<!-- Scroll container with resizable preview -->
<div 
  class="scroll-area overflow-auto h-[600px]" 
  bind:this={scrollContainer}
>
  <div 
    class="preview-wrapper" 
    bind:this={heightTarget}
  >
    <IframePreview 
      html={emailHtml}
      bind:height={iframeHeight}
      {scrollContainer}
      {heightTarget}
    />
  </div>
</div>`

	const mouseEventsCode = `<script>
  import { IframePreview } from 'svelte-emails'
  
  let mouseX = $state(0)
  let mouseY = $state(0)
` + '<' + `/script>

<IframePreview 
  html={emailHtml}
  oniframemousemove={(e) => {
    mouseX = e.clientX
    mouseY = e.clientY
  }}
  oniframemouseup={(e) => {
    console.log('Click at', e.clientX, e.clientY)
  }}
/>`

	const pendingSnippetCode = `<script>
  import { IframePreview } from 'svelte-emails'
` + '<' + `/script>

<IframePreview html={emailHtml}>
  {#snippet pending()}
    <div class="loading-skeleton">
      Loading preview...
    </div>
  {/snippet}
</IframePreview>`

	const apiRouteCode = `// src/routes/api/preview/[template]/+server.ts
import { render } from 'svelte-emails'
import { json } from '@sveltejs/kit'

// Import your email templates
import WelcomeEmail from '$lib/emails/Welcome.email.svelte'
import OrderEmail from '$lib/emails/Order.email.svelte'

const templates = {
  welcome: WelcomeEmail,
  order: OrderEmail
}

export async function GET({ params, url }) {
  const template = templates[params.template]
  if (!template) {
    return json({ error: 'Template not found' }, { status: 404 })
  }
  
  // Parse placeholders from query string
  const placeholders = Object.fromEntries(url.searchParams)
  
  const { html, text } = await render(template, { placeholders })
  
  return json({ html, text })
}`

	const dashboardExampleCode = `<script>
  import { IframePreview } from 'svelte-emails'
  
  let selectedTemplate = $state('welcome')
  let placeholders = $state({ first_name: 'Alice' })
  let previewHtml = $state('')
  
  async function updatePreview() {
    const params = new URLSearchParams(placeholders)
    const res = await fetch(\`/api/preview/\${selectedTemplate}?\${params}\`)
    const data = await res.json()
    previewHtml = data.html
  }
  
  $effect(() => {
    updatePreview()
  })
` + '<' + `/script>

<div class="email-dashboard">
  <aside class="controls">
    <select bind:value={selectedTemplate}>
      <option value="welcome">Welcome Email</option>
      <option value="order">Order Confirmation</option>
    </select>
    
    <input 
      bind:value={placeholders.first_name} 
      placeholder="First Name"
    />
  </aside>
  
  <main class="preview">
    <IframePreview html={previewHtml} />
  </main>
</div>`

</script>

<Email
	order=4
	category='4. Advanced'
	preview="Advanced iframe preview customization"
	body-bg={colors.background}
	bg={colors.white}
	max-w-[700px]
>
	<!-- Header -->
	<Div rows gap-2 p-8 bg={colors.primary}>
		<Text.H1 content="🔧 Custom Previewing" text={colors.white} text-3xl font-bold />
		<Text content="Advanced iframe control for custom preview implementations." text={colors.white} text-opacity-90 text-lg />
	</Div>

	<!-- When to Use -->
	<Div rows gap-4 p-8>
		<Text.H2 content="When to Use IframePreview" text={colors.text} />
		<Text.Paragraph content="For most use cases, `<Email.Render>` is the recommended way to preview emails. It handles rendering and display automatically. Use `IframePreview` directly when you need advanced control:" text={colors.textMuted} />
		
		<Table cols="50% 50%" border>
			<Table.Row header bg={colors.background}>
				<Text content="Email.Render" font-bold />
				<Text content="IframePreview" font-bold />
			</Table.Row>
			<Table.Row>
				<Text content="Renders Svelte components directly" />
				<Text content="Requires pre-rendered HTML" />
			</Table.Row>
			<Table.Row>
				<Text content="Automatic placeholder interpolation" />
				<Text content="HTML must already be interpolated" />
			</Table.Row>
			<Table.Row>
				<Text content="Simple API with bind:output" />
				<Text content="Fine-grained iframe control" />
			</Table.Row>
			<Table.Row>
				<Text content="Best for: Development, simple previews" />
				<Text content="Best for: Dashboards, API-driven previews" />
			</Table.Row>
		</Table>

		<Text.Codeblock content={comparisonCode} highlight="svelte" />
	</Div>

	<Divider border={colors.border} />

	<!-- IframePreview Features -->
	<Div rows gap-4 p-8>
		<Text.H2 content="IframePreview Features" text={colors.text} />
		
		<Div rows gap-2>
			<Text content="
- **No Flash**: Uses morphdom for smooth DOM diffing
- **Scroll Preservation**: Maintains scroll position across updates
- **Image Caching**: Images don't reload on content changes
- **Auto Height**: Iframe height adjusts to content
- **Scroll Anchoring**: Optional anchor preservation during resize
- **Mouse Forwarding**: Track mouse events inside the iframe
" text={colors.textMuted} />
		</Div>
	</Div>

	<Divider border={colors.border} />

	<!-- Basic Usage -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Basic Usage" text={colors.text} />
		<Text.Paragraph content="Pass HTML content to the `IframePreview` component:" text={colors.textMuted} />
		<Text.Codeblock content={iframePreviewCode} highlight="svelte" />
		
		<Div rows gap-2>
			<Text.H4 content="Import Options" text={colors.text} />
			<Text.Codeblock content={iframePreviewImportCode} highlight="typescript" />
		</Div>
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
				<Text.Code content="html" />
				<Text content="HTML content to render in the iframe (required)" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="bind:height" />
				<Text content="Bindable iframe height (auto-calculated from content)" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="pending" />
				<Text content="Snippet to render while loading (before first content)" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="scrollContainer" />
				<Text content="Element for scroll anchoring during width changes" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="heightTarget" />
				<Text content="Element for direct height updates (works with scrollContainer)" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="oniframemousemove" />
				<Text content="Callback for mouse move events (viewport coordinates)" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="oniframemouseup" />
				<Text content="Callback for mouse up events (viewport coordinates)" />
			</Table.Row>
		</Table>
	</Div>

	<Divider border={colors.border} />

	<!-- Bindable Height -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Auto-Sizing Height" text={colors.text} />
		<Text.Paragraph content="The iframe automatically resizes to fit its content. Bind to the `height` prop to access this value:" text={colors.textMuted} />
		<Text.Codeblock content={bindHeightCode} highlight="svelte" />
	</Div>

	<Divider border={colors.border} />

	<!-- Scroll Anchoring -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Scroll Anchoring" text={colors.text} />
		<Text.Paragraph content="For resizable preview containers, provide `scrollContainer` and `heightTarget` to maintain visual position during width changes:" text={colors.textMuted} />
		<Text.Codeblock content={scrollAnchoringCode} highlight="svelte" />
		{@render callout('tip', 'Scroll anchoring tracks an element near the viewport top and preserves its position when the container resizes.')}
	</Div>

	<Divider border={colors.border} />

	<!-- Mouse Events -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Mouse Event Forwarding" text={colors.text} />
		<Text.Paragraph content="Track mouse events inside the iframe for visual effects or interactions:" text={colors.textMuted} />
		<Text.Codeblock content={mouseEventsCode} highlight="svelte" />
	</Div>

	<Divider border={colors.border} />

	<!-- Loading State -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Loading State" text={colors.text} />
		<Text.Paragraph content="Show a placeholder while the initial content loads using the `pending` snippet:" text={colors.textMuted} />
		<Text.Codeblock content={pendingSnippetCode} highlight="svelte" />
	</Div>

	<Divider border={colors.border} />

	<!-- Building a Preview Dashboard -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Building a Preview Dashboard" text={colors.text} />
		<Text.Paragraph content="Here's a complete example of an email preview dashboard with template selection and placeholder editing:" text={colors.textMuted} />
		
		<Div rows gap-2>
			<Text.H4 content="1. API Route (SvelteKit)" text={colors.text} />
			<Text.Codeblock content={apiRouteCode} highlight="typescript" />
		</Div>
		
		<Div rows gap-2>
			<Text.H4 content="2. Dashboard Component" text={colors.text} />
			<Text.Codeblock content={dashboardExampleCode} highlight="svelte" />
		</Div>
	</Div>

	<Divider border={colors.border} />

	<!-- Security -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Security Considerations" text={colors.text} />
		
		<Table cols="30% 70%" border>
			<Table.Row header bg={colors.background}>
				<Text content="Feature" font-bold />
				<Text content="Details" font-bold />
			</Table.Row>
			<Table.Row>
				<Text content="Script Stripping" />
				<Text content="`<script>` tags are automatically removed from HTML content" />
			</Table.Row>
			<Table.Row>
				<Text content="Iframe Isolation" />
				<Text content="Content runs in a sandboxed iframe, isolated from your app" />
			</Table.Row>
			<Table.Row>
				<Text content="Trusted Content" />
				<Text content="Only render HTML from trusted sources (your own `render()` output)" />
			</Table.Row>
		</Table>
		
		{@render callout('warning', 'Never render user-provided HTML directly. Always use `render()` to generate HTML from your own templates.')}
	</Div>

	<!-- Footer -->
	{@render footer()}
</Email>
