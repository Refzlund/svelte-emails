---
"svelte-emails": patch
---

fix(email): resolve reactivity issues in Email component for SSR rendering

Refactored the Email component to properly maintain reactivity:
- Changed from `$derived` and `$effect` to `$state` with getters for reactive node properties
- Moved `processAttrs` logic into a helper function for better encapsulation
- Replaced `$effect` for collector registration with synchronous registration (required for SSR - effects don't run during SSR)
- The node now uses getters to ensure attrs/preview/style changes are properly reflected
