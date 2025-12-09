---
"svelte-emails": patch
---

fix(reactivity): resolve conditional rendering issues with null-safety checks

Fixed a bug where toggling conditional blocks (`{#if}`) would cause errors when checking for duplicate children. Added null-safety checks (`c?._markerId`) in `addChild()` and `removeChild()` functions to handle cases where array elements might be undefined during Svelte's reactive proxy operations.

This ensures that all element types (Text, Div, Button, Link, Table, etc.) and deeply nested structures properly render when conditionals toggle between true/false states.
