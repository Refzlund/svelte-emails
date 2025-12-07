---
"svelte-emails": patch
---

fix(render): improve reactivity and race condition handling in preview components

- Fixed race condition in `Render.svelte` with proper render queue system ensuring latest render always wins
- Made `Email.svelte` attribute processing reactive using `$derived.by()` 
- Fixed `IframePreview.svelte` reactivity by using `untrack()` to prevent unnecessary re-renders
- Made `Text.svelte` attrs reactive using getter pattern with `$derived()`
