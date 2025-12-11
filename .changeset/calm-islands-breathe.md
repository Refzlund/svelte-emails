---
"svelte-emails": patch
---

fix(iframe): improve content height calculation to eliminate scrollable gaps

Enhanced `calculateContentHeight()` to use multiple measurement techniques (body.scrollHeight, body.offsetHeight, documentElement.scrollHeight, documentElement.offsetHeight) and take the maximum value. This ensures all content is visible without scrolling, handling edge cases like margin collapse, subpixel rendering differences, and floated/absolutely positioned elements.
