<script lang="ts">
	/**
	 * Rendering svelte-emails
	 * 
	 * How to render email components to HTML and plain text.
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
	import Preview from '../Shared/Preview.svelte'

	const basicRenderCode = `import { render } from 'svelte-emails'
import WelcomeEmail from './WelcomeEmail.email.svelte'

const { html, text, headers } = await render(WelcomeEmail)`

	const placeholdersCode = `// Your email template uses [[variable]] syntax:
// <Text content="Hello [[first_name]]!" />

const { html, text } = await render(WelcomeEmail, {
  placeholders: {
    first_name: 'Alice',
    order_id: '12345',
    company_name: 'Acme Inc.'
  }
})`

	const propsCode = `// Your email component accepts props:
// export let orderTotal: number

const { html, text } = await render(OrderConfirmation, {
  props: {
    orderTotal: 99.99,
    items: ['Widget', 'Gadget']
  }
})`

	const stylePresetsCode = `import { render, presets } from 'svelte-emails'

// Use a built-in preset
const { html } = await render(MyEmail, {
  style: presets.minimal
})

// Or customize
import { merge, basePreset } from 'svelte-emails'

const customStyle = merge(basePreset, {
  rootSize: 18,
  Text: {
    color: '#333333'
  },
  Button: {
    backgroundColor: '#007bff',
    borderRadius: '8px'
  }
})

const { html } = await render(MyEmail, {
  style: customStyle
})`

	const headersCode = `const { html, text, headers } = await render(MyEmail)

// headers contains email-specific metadata:
// {
//   'List-Unsubscribe': '<mailto:unsub@example.com>',
//   'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
// }

// Pass to your email provider
await resend.emails.send({
  from: 'hello@example.com',
  to: 'user@example.com',
  subject: 'Your Order',
  html,
  text,
  headers
})`

	const nodemailerCode = `import nodemailer from 'nodemailer'
import { render } from 'svelte-emails'
import WelcomeEmail from './WelcomeEmail.email.svelte'

const transporter = nodemailer.createTransport({
  host: 'smtp.example.com',
  port: 587,
  auth: { user: 'user', pass: 'pass' }
})

const { html, text, headers } = await render(WelcomeEmail, {
  placeholders: { first_name: 'Alice' }
})

await transporter.sendMail({
  from: 'hello@example.com',
  to: 'alice@example.com',
  subject: 'Welcome!',
  html,
  text,
  headers
})`

	const resendCode = `import { Resend } from 'resend'
import { render } from 'svelte-emails'
import WelcomeEmail from './WelcomeEmail.email.svelte'

const resend = new Resend('re_xxxxx')

const { html, text } = await render(WelcomeEmail, {
  placeholders: { first_name: 'Alice' }
})

await resend.emails.send({
  from: 'hello@example.com',
  to: 'alice@example.com',
  subject: 'Welcome!',
  html,
  text
})`

	const sendgridCode = `import sgMail from '@sendgrid/mail'
import { render } from 'svelte-emails'
import WelcomeEmail from './WelcomeEmail.email.svelte'

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const { html, text } = await render(WelcomeEmail, {
  placeholders: { first_name: 'Alice' }
})

await sgMail.send({
  from: 'hello@example.com',
  to: 'alice@example.com',
  subject: 'Welcome!',
  html,
  text
})`

	const awsSesCode = `import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { render } from 'svelte-emails'
import WelcomeEmail from './WelcomeEmail.email.svelte'

const ses = new SESClient({ region: 'us-east-1' })

const { html, text } = await render(WelcomeEmail, {
  placeholders: { first_name: 'Alice' }
})

await ses.send(new SendEmailCommand({
  Source: 'hello@example.com',
  Destination: { ToAddresses: ['alice@example.com'] },
  Message: {
    Subject: { Data: 'Welcome!' },
    Body: {
      Html: { Data: html },
      Text: { Data: text }
    }
  }
}))`

</script>

<Email
	order=3
	category='1. Getting Started'
	preview="Render email templates to HTML and plain text"
	body-bg={colors.background}
	bg={colors.white}
	max-w-[700px]
>
	<!-- Header -->
	<Div rows gap-2 p-8 bg={colors.primary}>
		<Text.H1 content="📤 Rendering Emails" text={colors.white} text-3xl font-bold />
		<Text content="Convert your Svelte templates to HTML and plain text." text={colors.white} text-opacity-90 text-lg />
	</Div>

	<!-- Basic Usage -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Basic Usage" text={colors.text} />
		<Text.Paragraph content="The `render()` function converts your email component to HTML and plain text. It runs server-side and returns everything you need to send." text={colors.textMuted} />
		<Text.Codeblock content={basicRenderCode} highlight="typescript" />
		
		<Table cols="20% 80%" border>
			<Table.Row header bg={colors.background}>
				<Text content="Output" font-bold />
				<Text content="Description" font-bold />
			</Table.Row>
			<Table.Row>
				<Text.Code content="html" />
				<Text content="Full HTML document with inline styles, ready for email clients" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="text" />
				<Text content="Plain text version with markdown formatting (links as footnotes)" />
			</Table.Row>
			<Table.Row>
				<Text.Code content="headers" />
				<Text content="Email headers (e.g., `List-Unsubscribe` from `<Unsubscribe>` component)" />
			</Table.Row>
		</Table>
	</Div>

	<Divider border={colors.border} />

	<!-- Placeholders -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Placeholders" text={colors.text} />
		<Text.Paragraph content="Use `[[variable]]` syntax in your templates for dynamic content. Pass values via the `placeholders` option:" text={colors.textMuted} />
		<Text.Codeblock content={placeholdersCode} highlight="typescript" />
		{@render callout('tip', 'Placeholders work in all text content, including markdown. Missing placeholders are left as-is (useful for ESP merge tags).')}
	</Div>

	<Divider border={colors.border} />

	<!-- Component Props -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Component Props" text={colors.text} />
		<Text.Paragraph content="For more complex data, pass props directly to your email component:" text={colors.textMuted} />
		<Text.Codeblock content={propsCode} highlight="typescript" />
		<Text.Small content="Props are passed to Svelte's server-side render, so you can use them for loops, conditionals, and computed values." text={colors.textMuted} />
	</Div>

	<Divider border={colors.border} />

	<!-- Style Presets -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Style Presets" text={colors.text} />
		<Text.Paragraph content="Customize the look of your emails with style presets. These control default colors, typography, and component styling:" text={colors.textMuted} />
		<Text.Codeblock content={stylePresetsCode} highlight="typescript" />
		{@render callout('note', 'See the **Configuration** guide for all available style options.')}
	</Div>

	<Divider border={colors.border} />

	<!-- Headers -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Email Headers" text={colors.text} />
		<Text.Paragraph content="The `headers` object contains email-specific metadata extracted from your template. Currently supports the `<Unsubscribe>` component:" text={colors.textMuted} />
		<Text.Codeblock content={headersCode} highlight="typescript" />
	</Div>

	<Divider border={colors.border} />

	<!-- Integration Examples -->
	<Div rows gap-4 p-8>
		<Text.H2 content="Integration Examples" text={colors.text} />
		<Text.Paragraph content="Here's how to integrate with popular email providers:" text={colors.textMuted} />
	</Div>

	<!-- Resend -->
	<Div rows gap-4 px-8 pb-4>
		<Text.H3 content="Resend" text={colors.text} />
		<Text.Codeblock content={resendCode} highlight="typescript" />
	</Div>

	<!-- Nodemailer -->
	<Div rows gap-4 px-8 pb-4>
		<Text.H3 content="Nodemailer (SMTP)" text={colors.text} />
		<Text.Codeblock content={nodemailerCode} highlight="typescript" />
	</Div>

	<!-- SendGrid -->
	<Div rows gap-4 px-8 pb-4>
		<Text.H3 content="SendGrid" text={colors.text} />
		<Text.Codeblock content={sendgridCode} highlight="typescript" />
	</Div>

	<!-- AWS SES -->
	<Div rows gap-4 px-8 pb-8>
		<Text.H3 content="AWS SES" text={colors.text} />
		<Text.Codeblock content={awsSesCode} highlight="typescript" />
	</Div>

	<!-- Footer -->
	{@render footer()}
</Email>
