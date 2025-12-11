# svelte-emails

## 1.0.7

### Patch Changes

- fix(iframe): improve content height calculation to eliminate scrollable gaps ([#16](https://github.com/Refzlund/svelte-emails/pull/16))

  Enhanced `calculateContentHeight()` to use multiple measurement techniques (body.scrollHeight, body.offsetHeight, documentElement.scrollHeight, documentElement.offsetHeight) and take the maximum value. This ensures all content is visible without scrolling, handling edge cases like margin collapse, subpixel rendering differences, and floated/absolutely positioned elements.

## 1.0.6

### Patch Changes

- fix(reactivity): resolve conditional rendering issues with null-safety checks ([#14](https://github.com/Refzlund/svelte-emails/pull/14))

  Fixed a bug where toggling conditional blocks (`{#if}`) would cause errors when checking for duplicate children. Added null-safety checks (`c?._markerId`) in `addChild()` and `removeChild()` functions to handle cases where array elements might be undefined during Svelte's reactive proxy operations.

  This ensures that all element types (Text, Div, Button, Link, Table, etc.) and deeply nested structures properly render when conditionals toggle between true/false states.

## 1.0.5

### Patch Changes

- fix(reactivity): conditional blocks now properly re-render when toggled ([#12](https://github.com/Refzlund/svelte-emails/pull/12))

  Fixed critical issue where `{#if}` blocks containing email components would not re-render when toggling from false to true. This was caused by Svelte 5's $state proxies not triggering reactivity on array mutations.

  The fix implements a hybrid registration pattern combining synchronous registration (for SSR compatibility) with effect-based lifecycle management (for client-side reactivity). All element components now use marker-based identity for stable node references across proxy accesses.

## 1.0.4

### Patch Changes

- fix(context): filter out undefined/null children in reorderChildrenByDom ([#10](https://github.com/Refzlund/svelte-emails/pull/10))

- chore: add link/unlink scripts to package.json ([#10](https://github.com/Refzlund/svelte-emails/pull/10))

## 1.0.3

### Patch Changes

- fix(context): correct child ordering for conditional rendering with DOM markers ([#8](https://github.com/Refzlund/svelte-emails/pull/8))

  - Add `generateMarkerId()` to create unique IDs for correlating IR nodes with DOM position
  - Add `<svelte-email-marker>` elements to all components for DOM-based ordering
  - Add `reorderChildrenByDom()` function to sort IR tree children based on actual DOM order
  - Fix ordering issues when using `{#if}` and `{#each}` blocks which caused children to register out of source order
  - Note: This only affects client-side preview; SSR renders synchronously in correct order

- docs(architecture): add patterns for defensive child handling and DOM-based ordering ([#8](https://github.com/Refzlund/svelte-emails/pull/8))

  - Document the "Defensive Child Handling" pattern for filtering undefined/null children
  - Document the "DOM-Based Ordering for Conditional Content" pattern explaining marker-based sorting
  - List all affected renderer functions and component patterns

- fix(renderer): handle undefined/null content and children in conditional rendering ([#8](https://github.com/Refzlund/svelte-emails/pull/8))

  - Add `normalizeContent()` and `normalizeOptionalContent()` helpers to gracefully handle null/undefined content props with console warnings
  - Filter out undefined/null children before processing in renderer functions to prevent "Cannot read properties of undefined" errors
  - Add defensive child handling in `renderChildren()`, `renderDivNode()`, `renderDivAsGrid()`, `renderTableNode()`, `renderTableRowNode()`, and plain text renderers
  - Components with required content (Text, H1-H6, etc.) now show helpful warnings when receiving null/undefined values
  - Components with optional content (Button, Link, Unsubscribe) silently accept null/undefined

## 1.0.2

### Patch Changes

- fix(email): resolve reactivity issues in Email component for SSR rendering ([#6](https://github.com/Refzlund/svelte-emails/pull/6))

  Refactored the Email component to properly maintain reactivity:

  - Changed from `$derived` and `$effect` to `$state` with getters for reactive node properties
  - Moved `processAttrs` logic into a helper function for better encapsulation
  - Replaced `$effect` for collector registration with synchronous registration (required for SSR - effects don't run during SSR)
  - The node now uses getters to ensure attrs/preview/style changes are properly reflected

## 1.0.1

### Patch Changes

- fix(render): improve reactivity and race condition handling in preview components ([#3](https://github.com/Refzlund/svelte-emails/pull/3))

  - Fixed race condition in `Render.svelte` with proper render queue system ensuring latest render always wins
  - Made `Email.svelte` attribute processing reactive using `$derived.by()`
  - Fixed `IframePreview.svelte` reactivity by using `untrack()` to prevent unnecessary re-renders
  - Made `Text.svelte` attrs reactive using getter pattern with `$derived()`

## 1.0.0

### Major Changes

- feat: svelte-emails 1.0.0 - The Modern Email Stack 🚀 ([#1](https://github.com/Refzlund/svelte-emails/pull/1))

  **Bulletproof Email Rendering**

  - Table-based HTML output for maximum email client compatibility
  - VML support for Outlook Windows
  - All styles automatically inlined

  **Tailwind-like Styling**

  - Familiar attribute syntax: `p-4`, `bg-[#fff]`, `rounded`, `text-xl`
  - Support for arbitrary values: `w-[200px]`, `bg-[#f3f4f6]`
  - Spacing scale (gap, padding, margin) with rem-to-px conversion

  **Magic Emulation**

  - `margin` emulated via wrapper table padding (100% client support)
  - `opacity` emulated via color blending (100% client support)
  - `rem` units automatically converted to pixels

  **Grid Workflow**

  - `cols` and `rows` attributes for intuitive layouts
  - `gap-*` spacing between children
  - Explicit widths with `w-[value]` on columns

  **Responsive Design**

  - `responsive` attribute to stack columns on mobile
  - `mobile-only` and `desktop-only` visibility controls
  - Configurable mobile threshold via `mobile-threshold-[Npx]`

  **Extended Markdown in Content**

  - Bold (`**text**`), italic (`*text*`), inline code (`` `code` ``)
  - Links (`[text](url)`)
  - Unordered and ordered lists with nesting
  - Checkboxes (`- [ ]` and `- [x]`)
  - Markdown tables

  **Placeholder Variables**

  - `[[variable]]` syntax for runtime interpolation
  - Pass values via `render()` options
  - Missing variables preserved for ESP merge tags

  **Style Presets**

  - Built-in presets: `base`, `dark`, `serif`, `sansSerif`, `monospace`, `rounded`, `humanist`, `geometric`
  - `merge()` utility to combine and customize presets
  - Full `StyleConfig` type for complete theming control

  **Code Highlighting**

  - `<Text.Code>` for inline code
  - `<Text.Codeblock>` for multi-line code blocks
  - Shiki-powered syntax highlighting (optional dependency)

  **Email Compliance**

  - `<Unsubscribe>` component with automatic `List-Unsubscribe` header
  - Plain text output generation
  - Headers extraction for email providers

  **Components**

  - `<Email>` - Root wrapper with preview text, body background, max-width
  - `<Div>` - Layout container with cols/rows/responsive
  - `<Text>` - Text with markdown support (H1-H6, Paragraph, Small, etc.)
  - `<Button>` - CTA buttons with full styling
  - `<Link>` - Inline links
  - `<Img>` - Images with width/height/alt
  - `<Table>` - Data tables with header/row support
  - `<Spacer>` - Vertical spacing
  - `<Divider>` - Horizontal rules
  - `<Br>` - Line breaks

  **The Studio (CLI)**

  - `bunx svelte-emails` / `npx svelte-emails` to launch
  - Hot Module Reloading via Vite
  - Smart discovery of `*.email.svelte` files
  - Dynamic preview with resizable container
  - Steady scroll with morphdom DOM diffing
  - Output inspector (HTML, Plain Text, Headers)
  - Integrated documentation
  - Static builds for deployment (`--build`)

  **Developer Experience**

  - Full TypeScript support
  - Svelte 5 runes and snippets
  - Works with any email provider (Resend, SendGrid, Nodemailer, AWS SES, etc.)
