---
"svelte-emails": patch
---

fix(reactivity): conditional blocks now properly re-render when toggled

Fixed critical issue where `{#if}` blocks containing email components would not re-render when toggling from false to true. This was caused by Svelte 5's $state proxies not triggering reactivity on array mutations.

The fix implements a hybrid registration pattern combining synchronous registration (for SSR compatibility) with effect-based lifecycle management (for client-side reactivity). All element components now use marker-based identity for stable node references across proxy accesses.
