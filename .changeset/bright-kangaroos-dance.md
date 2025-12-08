---
"svelte-emails": patch
---

fix(context): correct child ordering for conditional rendering with DOM markers

- Add `generateMarkerId()` to create unique IDs for correlating IR nodes with DOM position
- Add `<svelte-email-marker>` elements to all components for DOM-based ordering
- Add `reorderChildrenByDom()` function to sort IR tree children based on actual DOM order
- Fix ordering issues when using `{#if}` and `{#each}` blocks which caused children to register out of source order
- Note: This only affects client-side preview; SSR renders synchronously in correct order
