<script lang='ts'>
	import { Email } from 'svelte-emails'
	import TestEmail from './TestEmail.svelte'
	
	let message = $state('Initial message')
	let bgColor = $state('#ffffff')
</script>

<div class="container">
	<div class="controls">
		<h2>Controls</h2>
		<label>
			Message:
			<input type="text" bind:value={message} />
		</label>
		<label>
			Background Color:
			<input type="color" bind:value={bgColor} />
		</label>
		<p>Current values:</p>
		<pre>message: {message}
bgColor: {bgColor}</pre>
	</div>

	<div class="preview">
		<h2>Email Preview</h2>
		<Email.Render>
			<TestEmail {message} {bgColor} />
		</Email.Render>
	</div>
</div>

<style>
	.container {
		display: flex;
		gap: 2rem;
		padding: 2rem;
		height: 100vh;
		box-sizing: border-box;
	}
	
	.controls {
		flex: 0 0 300px;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	.controls label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	
	.controls input[type="text"] {
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
	}
	
	.preview {
		flex: 1;
		display: flex;
		flex-direction: column;
	}
	
	.preview h2 {
		margin: 0 0 1rem;
	}
	
	pre {
		background: #f5f5f5;
		padding: 0.5rem;
		border-radius: 4px;
		font-size: 0.875rem;
	}
</style>
