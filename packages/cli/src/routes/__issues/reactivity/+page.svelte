<script lang='ts'>
	import { Email } from 'svelte-emails'
	import TestEmail from './TestEmail.svelte'
	
	let message = $state('Initial message')
	let bgColor = $state('#ffffff')
	let items = $state<{ name: string; value: string }[]>([])
	let footer = $state<string | undefined>(undefined)
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
		<label>
			Footer (leave empty for undefined):
			<input
				type="text"
				value={footer ?? ''}
				oninput={(e) => {
					const val = e.currentTarget.value
					footer = val === '' ? undefined : val
				}}
			/>
		</label>
		<p>Current values:</p>
		<pre>message: {message}
bgColor: {bgColor}
items: {JSON.stringify(items, null, 2)}
footer: {footer === undefined ? 'undefined' : footer}</pre>

		<h3>Items (Table)</h3>
		<button onclick={() => items = [...items, { name: 'Item ' + (items.length + 1), value: 'Value ' + (items.length + 1) }]}>
			Add Item
		</button>
		<button onclick={() => items = items.slice(0, -1)} disabled={items.length === 0}>
			Remove Item
		</button>
		<button onclick={() => items = []} disabled={items.length === 0}>
			Clear All
		</button>
	</div>

	<div class="preview">
		<h2>Email Preview</h2>
		<p class="hint">
			<strong>Test page:</strong> Tests conditional rendering ({'{#if}'}, {'{#each}'}) and 
			undefined content handling. Add/remove items and toggle footer to verify correct behavior.
		</p>
		<Email.Render>
			<TestEmail {message} {bgColor} {items} {footer} />
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
		overflow-y: auto;
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
	
	.controls button {
		padding: 0.5rem 1rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		background: #f5f5f5;
		cursor: pointer;
	}
	
	.controls button:hover:not(:disabled) {
		background: #e5e5e5;
	}
	
	.controls button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.preview {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}
	
	.preview h2 {
		margin: 0 0 1rem;
	}
	
	.hint {
		background: #fff3cd;
		border: 1px solid #ffc107;
		padding: 0.75rem;
		border-radius: 4px;
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}
	
	pre {
		background: #f5f5f5;
		padding: 0.5rem;
		border-radius: 4px;
		font-size: 0.875rem;
	}
</style>
