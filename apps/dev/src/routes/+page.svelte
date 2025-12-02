<svelte:options runes={true} />
<script lang='ts'>

	import { Email, type RenderOutput } from 'svelte-emails'
	import MyEmail from './MyEmail.email.svelte'

	interface Props {
		data: {
			serverOutput: RenderOutput
		}
	}

	const { data }: Props = $props()

	let output: RenderOutput | null = $state(null)
	let mode: 'preview' | 'text' | 'html' | 'server' = $state('preview')
	let prettify: 'none' | 'html' | 'html+style' = $state('html+style')
	let serverOutputMode: 'html' | 'text' | 'headers' = $state('html')

</script>

<div style='width: 100vw; height: 100vh; margin: 0; padding: 0; box-sizing: border-box; display: flex; flex-direction: column; background: #1a1a2e;'>
	<!-- Navigation Bar -->
	<nav style='
		display: flex;
		align-items: center;
		justify-content: start;
		gap: 8px;
		padding: 12px 24px;
		background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
		border-bottom: 1px solid rgba(255,255,255,0.1);
		box-shadow: 0 2px 10px rgba(0,0,0,0.3);
	'>
		<div style='
			display: flex;
			background: rgba(255,255,255,0.05);
			border-radius: 12px;
			padding: 4px;
			gap: 4px;
		'>
			<button
				onclick={() => mode = 'preview'}
				style='
					padding: 10px 20px;
					border: none;
					border-radius: 8px;
					font-size: 14px;
					font-weight: 600;
					cursor: pointer;
					transition: all 0.2s ease;
					background: {mode === "preview" ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "transparent"};
					color: {mode === "preview" ? "#fff" : "rgba(255,255,255,0.6)"};
					box-shadow: {mode === "preview" ? "0 4px 15px rgba(102, 126, 234, 0.4)" : "none"};
				'
			>
				<span style='margin-right: 6px;'>🖼️</span> Preview
			</button>
			<button
				onclick={() => mode = 'html'}
				style='
					padding: 10px 20px;
					border: none;
					border-radius: 8px;
					font-size: 14px;
					font-weight: 600;
					cursor: pointer;
					transition: all 0.2s ease;
					background: {mode === "html" ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "transparent"};
					color: {mode === "html" ? "#fff" : "rgba(255,255,255,0.6)"};
					box-shadow: {mode === "html" ? "0 4px 15px rgba(102, 126, 234, 0.4)" : "none"};
				'
			>
				<span style='margin-right: 6px;'>📝</span> HTML
			</button>
			<button
				onclick={() => mode = 'text'}
				style='
					padding: 10px 20px;
					border: none;
					border-radius: 8px;
					font-size: 14px;
					font-weight: 600;
					cursor: pointer;
					transition: all 0.2s ease;
					background: {mode === "text" ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "transparent"};
					color: {mode === "text" ? "#fff" : "rgba(255,255,255,0.6)"};
					box-shadow: {mode === "text" ? "0 4px 15px rgba(102, 126, 234, 0.4)" : "none"};
				'
			>
				<span style='margin-right: 6px;'>📄</span> Text
			</button>
			<button
				onclick={() => mode = 'server'}
				style='
					padding: 10px 20px;
					border: none;
					border-radius: 8px;
					font-size: 14px;
					font-weight: 600;
					cursor: pointer;
					transition: all 0.2s ease;
					background: {mode === "server" ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "transparent"};
					color: {mode === "server" ? "#fff" : "rgba(255,255,255,0.6)"};
					box-shadow: {mode === "server" ? "0 4px 15px rgba(102, 126, 234, 0.4)" : "none"};
				'
			>
				<span style='margin-right: 6px;'>🖥️</span> Server
			</button>
		</div>

		<!-- Prettify toggle (only visible in HTML mode) -->
		{#if mode === 'html'}
			<div style='
				display: flex;
				background: rgba(255,255,255,0.05);
				border-radius: 8px;
				padding: 3px;
				gap: 2px;
				margin-left: 16px;
			'>
				<button
					onclick={() => prettify = 'none'}
					style='
						padding: 6px 12px;
						border: none;
						border-radius: 6px;
						font-size: 12px;
						font-weight: 500;
						cursor: pointer;
						transition: all 0.2s ease;
						background: {prettify === "none" ? "rgba(255,255,255,0.15)" : "transparent"};
						color: {prettify === "none" ? "#fff" : "rgba(255,255,255,0.5)"};
					'
				>
					Raw
				</button>
				<button
					onclick={() => prettify = 'html'}
					style='
						padding: 6px 12px;
						border: none;
						border-radius: 6px;
						font-size: 12px;
						font-weight: 500;
						cursor: pointer;
						transition: all 0.2s ease;
						background: {prettify === "html" ? "rgba(255,255,255,0.15)" : "transparent"};
						color: {prettify === "html" ? "#fff" : "rgba(255,255,255,0.5)"};
					'
				>
					HTML
				</button>
				<button
					onclick={() => prettify = 'html+style'}
					style='
						padding: 6px 12px;
						border: none;
						border-radius: 6px;
						font-size: 12px;
						font-weight: 500;
						cursor: pointer;
						transition: all 0.2s ease;
						background: {prettify === "html+style" ? "rgba(255,255,255,0.15)" : "transparent"};
						color: {prettify === "html+style" ? "#fff" : "rgba(255,255,255,0.5)"};
					'
				>
					HTML+Style
				</button>
			</div>
		{/if}

		<!-- Server output toggle (only visible in Server mode) -->
		{#if mode === 'server'}
			<div style='
				display: flex;
				background: rgba(255,255,255,0.05);
				border-radius: 8px;
				padding: 3px;
				gap: 2px;
				margin-left: 16px;
			'>
				<button
					onclick={() => serverOutputMode = 'html'}
					style='
						padding: 6px 12px;
						border: none;
						border-radius: 6px;
						font-size: 12px;
						font-weight: 500;
						cursor: pointer;
						transition: all 0.2s ease;
						background: {serverOutputMode === "html" ? "rgba(255,255,255,0.15)" : "transparent"};
						color: {serverOutputMode === "html" ? "#fff" : "rgba(255,255,255,0.5)"};
					'
				>
					HTML
				</button>
				<button
					onclick={() => serverOutputMode = 'text'}
					style='
						padding: 6px 12px;
						border: none;
						border-radius: 6px;
						font-size: 12px;
						font-weight: 500;
						cursor: pointer;
						transition: all 0.2s ease;
						background: {serverOutputMode === "text" ? "rgba(255,255,255,0.15)" : "transparent"};
						color: {serverOutputMode === "text" ? "#fff" : "rgba(255,255,255,0.5)"};
					'
				>
					Text
				</button>
				<button
					onclick={() => serverOutputMode = 'headers'}
					style='
						padding: 6px 12px;
						border: none;
						border-radius: 6px;
						font-size: 12px;
						font-weight: 500;
						cursor: pointer;
						transition: all 0.2s ease;
						background: {serverOutputMode === "headers" ? "rgba(255,255,255,0.15)" : "transparent"};
						color: {serverOutputMode === "headers" ? "#fff" : "rgba(255,255,255,0.5)"};
					'
				>
					Headers
				</button>
			</div>
		{/if}
	</nav>

	<!-- Email Render Area -->
	<div style='flex: 1; overflow: hidden;'>
		{#if mode === 'server'}
			<div style='height: 100%; overflow: auto; background: #0d1117;'>
				<pre style='
					margin: 0;
					padding: 20px;
					font-family: "SF Mono", "Fira Code", "Consolas", monospace;
					font-size: 13px;
					line-height: 1.5;
					color: #e6edf3;
					white-space: pre-wrap;
					word-wrap: break-word;
				'>{#if serverOutputMode === 'html'}{data.serverOutput.html}{:else if serverOutputMode === 'text'}{data.serverOutput.text}{:else}{JSON.stringify(data.serverOutput.headers, null, 2)}{/if}</pre>
			</div>
		{:else}
			<Email.Render bind:output {mode} {prettify} placeholders={{ first_name: 'John'}}>
				<MyEmail />
			</Email.Render>
		{/if}
	</div>
</div>
