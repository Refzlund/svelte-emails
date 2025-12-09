<!--
	MINIMAL REPRODUCTION: svelte-emails conditional block reactivity bug
	====================================================================
	
	BUG SUMMARY:
	When data changes cause a conditional block inside an Email component to toggle 
	from false to true, the newly mounted content does NOT appear in the rendered HTML.
	
	HOW TO REPRODUCE:
	1. Load page (text is empty, conditional is false, "NO TEXT PROVIDED" renders)
	2. Click "Set Text" (text becomes "hello world", conditional becomes true)
	3. EXPECTED: "HELLO WORLD" appears in rendered output
	4. ACTUAL: Empty content - the Text component inside conditional doesn't render
	
	WHY THIS HAPPENS:
	================
	
	1. EMAIL IR TREE ARCHITECTURE:
	   - svelte-emails builds an Internal Representation (IR) tree
	   - Each component (Email, Text, Div, etc.) registers itself via addChild()
	   - Render.svelte has a $effect that calls renderTree() when tree changes
	
	2. THE $effect IN Render.svelte (around line 109):
	   $effect(() => {
	       const currentRoot = $state.snapshot(root)  // THE PROBLEM
	       // ...
	       renderTree(currentRoot, ...)
	   })
	
	3. THE addChild() IN context.js (around line 226):
	   export function addChild(parent, child, markerId) {
	       const children = parent.children
	       children.push(child)  // MUTATION, not reassignment!
	   }
	
	4. ROOT CAUSE:
	   - $state.snapshot(root) only tracks the `root` REFERENCE
	   - It does NOT track mutations to root.children (like push())
	   - When conditional toggles true, Text mounts, addChild() pushes to children
	   - But root reference unchanged, so $effect doesn't re-run, no re-render!
	
	5. WHY INITIAL RENDER WORKS:
	   - On mount, Email calls collector.registerRoot(node) 
	   - This sets root = node (a NEW reference)
	   - $effect runs once with whatever children exist at that moment
	   - Children added AFTER this don't trigger re-render
	
	POTENTIAL FIXES (for svelte-emails library):
	============================================
	
	Option A: Version counter
	   let treeVersion = $state(0)
	   const collector = {
	       registerRoot(node) { root = node },
	       markDirty() { treeVersion++ }
	   }
	   $effect(() => {
	       treeVersion  // Track version changes
	       const currentRoot = $state.snapshot(root)
	       renderTree(currentRoot, ...)
	   })
	   // Call collector.markDirty() in addChild()
	
	Option B: Explicitly track children length
	   $effect(() => {
	       function trackTree(node) {
	           if (node?.children) {
	               node.children.length  // Establish dependency
	               node.children.forEach(trackTree)
	           }
	       }
	       trackTree(root)
	       const currentRoot = $state.snapshot(root)
	       renderTree(currentRoot, ...)
	   })
-->

<script lang='ts'>
	import { Email } from 'svelte-emails'
	import Issue from './Issue.svelte'

	let text = $state('')

	function setText() {
		text = 'hello world'
	}

	function clearText() {
		text = ''
	}
</script>

<main style="padding: 1rem; font-family: system-ui, sans-serif;">
	<h1>Minimal Reproduction: svelte-emails conditional reactivity bug</h1>
	
	<div style="display: flex; gap: 0.5rem; margin: 1rem 0;">
		<button onclick={setText}>Set Text</button>
		<button onclick={clearText}>Clear Text</button>
	</div>

	<p><strong>Current text:</strong> "{text}"</p>

	<div style="border: 1px solid #ccc; padding: 1rem; margin-top: 1rem;">
		<h2>Email Render Output:</h2>
		<Email.Render placeholders={{}}>
			<Issue {text} />
		</Email.Render>
	</div>

	<div style="margin-top: 1rem; padding: 1rem; background: #fffbe6; border: 1px solid #ffe58f;">
		<h3>Expected vs Actual:</h3>
		<ul>
			<li><strong>Initial:</strong> "NO TEXT PROVIDED" ✓</li>
			<li><strong>After "Set Text":</strong> Should show "HELLO WORLD" — but shows nothing ✗</li>
			<li><strong>After "Clear Text":</strong> Should show "NO TEXT PROVIDED" — but shows nothing ✗</li>
		</ul>
	</div>
</main>
