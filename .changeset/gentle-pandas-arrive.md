---
"svelte-emails": patch
---

fix(renderer): handle undefined/null content and children in conditional rendering

- Add `normalizeContent()` and `normalizeOptionalContent()` helpers to gracefully handle null/undefined content props with console warnings
- Filter out undefined/null children before processing in renderer functions to prevent "Cannot read properties of undefined" errors
- Add defensive child handling in `renderChildren()`, `renderDivNode()`, `renderDivAsGrid()`, `renderTableNode()`, `renderTableRowNode()`, and plain text renderers
- Components with required content (Text, H1-H6, etc.) now show helpful warnings when receiving null/undefined values
- Components with optional content (Button, Link, Unsubscribe) silently accept null/undefined
