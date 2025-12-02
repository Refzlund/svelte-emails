# Current Issue: Server-Side `render()` Function Not Working

## Problem

The `render()` function in `svelte-emails` fails when called from a SvelteKit `+page.server.ts` load function:

```
Error: render() failed: No <Email> component found in the component tree.
```

## What We're Trying to Do

Call `render(MyEmail, { vars, props })` from server-side code to get the rendered HTML/text output, then pass it to the frontend for display in a "Server" tab.

```typescript
// +page.server.ts
import { render } from 'svelte-emails'
import MyEmail from './MyEmail.email.svelte'

export function load() {
	const output = render(MyEmail, {
		vars: { first_name: 'John' },
		props: {}
	})
	return { serverOutput: output }
}
```

## Root Cause Analysis

### How the Library Works (Client-Side)

1. `<Email.Render>` component sets up a **collector** via Svelte's context API
2. Child components (including the user's email template) render inside it
3. `<Email>` component calls `getEmailRoot()` to get the collector
4. `<Email>` registers itself with the collector via `collector.registerRoot(node)`
5. Child components register with their parents via `addChild(parent, node)`
6. After rendering, the IR tree is passed to `renderTree()` to generate HTML/text

### Why SSR Fails

The `render()` function uses Svelte's `render()` from `svelte/server`:

```typescript
import { render as svelteRender } from 'svelte/server'

svelteRender(EmailComponent, { props })
```

**The problem:** Svelte 5's `createContext` API (used for `getEmailRoot`/`setEmailRoot`) **throws an error** when `get` is called and no parent has called `set`. During SSR:

1. We set `ssrCollector` at module level before calling `svelteRender()`
2. We try to catch the context error in `<Email>` and fall back to `getSSRCollector()`
3. But the collector never receives the root node registration

### Hypothesis: Why the Fallback Doesn't Work

The issue is likely one of:

1. **Timing**: The module-level `ssrCollector` might be getting cleared before the component finishes initializing
2. **Module isolation**: SvelteKit's SSR might use a different module instance than the one where we set the collector
3. **Svelte's SSR internals**: The `svelteRender()` function might not execute component initialization in a way that allows our collector pattern to work
4. **Component tree not executing**: The component's `<script>` block might not run during `svelteRender()` in the way we expect

## Approaches Tried

### 1. RenderWrapper Component (Failed)
Created a wrapper component that sets up context, but Svelte's context doesn't propagate correctly in SSR.

### 2. Module-Level SSR Collector (Failed)
Added `setSSRCollector()`/`getSSRCollector()` functions to bypass Svelte context:
- Set collector before `svelteRender()`
- `<Email>` falls back to `getSSRCollector()` when context throws
- Still doesn't work - collector never receives the root node

### 3. Try-Catch in Email.svelte (Failed)
Wrapped `getEmailRoot()` in try-catch to handle the thrown error:
```typescript
try {
	collector = getEmailRoot()
} catch {
	collector = getSSRCollector()
}
```
Still fails - the component code may not be executing as expected during SSR.

## Potential Solutions to Explore

### A. Use `mount()` Instead of `render()`
Svelte 5's `mount()` function might work differently than `render()` for SSR. However, `mount()` requires a DOM target which doesn't exist in SSR.

### B. Investigate Svelte's SSR Internals
Need to understand:
- Does `render()` from `svelte/server` actually execute component `<script>` blocks?
- How does Svelte's internal context work during SSR?
- Are there alternative patterns (like `getAllContexts()`) that work in SSR?

### C. Different Architecture
Instead of relying on Svelte's context API:
- Pass collector as a prop through the entire tree
- Use a global/singleton pattern specifically for SSR
- Create a custom SSR implementation that doesn't use Svelte's render

### D. Check How Other Libraries Do It
Look at how libraries like `svelte-email` (if it exists) or React email libraries handle SSR rendering.

### E. AsyncLocalStorage (Node.js)
Use Node.js `AsyncLocalStorage` to maintain context across the async SSR render:
```typescript
import { AsyncLocalStorage } from 'node:async_hooks'
const collectorStorage = new AsyncLocalStorage<Collector>()
```

## Files Modified During Debugging

- `packages/svelte-emails/src/context.ts` - Added `setSSRCollector`/`getSSRCollector`
- `packages/svelte-emails/src/Email.svelte` - Added try-catch fallback to SSR collector
- `packages/svelte-emails/src/index.ts` - Modified `render()` to use SSR collector
- `apps/dev/src/routes/+page.server.ts` - Test file calling `render()`
- `apps/dev/src/routes/+page.svelte` - Added "Server" tab UI

## Current State

The UI changes for the "Server" tab are complete in `+page.svelte`. The issue is purely in making `render()` work server-side.

## Next Steps

1. Add logging to understand what's happening during SSR
2. Check if `svelteRender()` output contains any clues
3. Research Svelte 5 SSR patterns and context handling
4. Consider alternative architectures that don't rely on context

---

*Last updated: December 2, 2025*
