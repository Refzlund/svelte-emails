<script lang='ts'>
	import { Email } from 'svelte-emails'
	import Issue from './Issue.svelte'

	let showContent = $state(false)

	function toggleContent() {
		showContent = !showContent
	}
</script>

<main style="padding: 1rem; font-family: system-ui, sans-serif;">
	<h1>Comprehensive Conditional Elements Test</h1>
	
	<div style="display: flex; gap: 0.5rem; margin: 1rem 0;">
		<button onclick={toggleContent}>
			{showContent ? 'Hide Content' : 'Show Content'}
		</button>
	</div>

	<p><strong>Content visible:</strong> {showContent ? 'Yes' : 'No'}</p>

	<div style="border: 1px solid #ccc; padding: 1rem; margin-top: 1rem;">
		<h2>Email Render Output:</h2>
		<Email.Render placeholders={{}}>
			<Issue {showContent} />
		</Email.Render>
	</div>

	<div style="margin-top: 1rem; padding: 1rem; background: #e6f7ff; border: 1px solid #91d5ff;">
		<h3>Test Coverage:</h3>
		<ul>
			<li>✓ Text elements (Text, Paragraph, Small, H1-H6, Code, Codeblock)</li>
			<li>✓ Interactive elements (Button, Link, Unsubscribe)</li>
			<li>✓ Layout elements (Div, Spacer, Divider, Img)</li>
			<li>✓ Table elements (Table, Table.Row)</li>
			<li>✓ Deeply nested elements (3+ levels)</li>
			<li>✓ Mixed conditionals (nested {'{#if}'} blocks)</li>
		</ul>
	</div>
</main>
