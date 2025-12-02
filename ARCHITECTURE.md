# How does `svelte-emails` work

## Goals

`svelte-emails` aims for:
- **High compatibility** — works in Outlook, Gmail, Apple Mail, Yahoo, and all major email clients
- **Easy to author** — readable, declarative component syntax with Tailwind-like styling
- **Flexible** — high-velocity development with sensible defaults and full customization
- **Predictable** — same input always produces the same HTML output

---

## Table of Contents

1. [Architecture Overview](#architecture-overview) — IR tree, source files, node structure
2. [Component Registration Flow](#component-registration-flow) — how components build the tree
3. [Rendering Pipeline](#rendering-pipeline) — preview vs server render, HTML and text output
4. [Style System](#style-system) — attributes, inheritance, emulation strategies
5. [Content Parsing](#content-parsing) — markdown syntax, variable interpolation
6. [Attribute Parsing System](#attribute-parsing-system) — rem conversion, pattern reference
7. [HTML Output Strategy](#html-output-strategy) — table layout, inline styles
8. [Component Reference](#component-reference) — all components and their options
9. [Style Presets](#style-presets) — preset structure and customization
10. [SSR & Server Rendering](#ssr--server-rendering) — Symbol.for keys, onDestroy caveat, debugging
11. [Testing & Development](#testing--development) — dev server, file conventions
12. [Known Limitations](#known-limitations--workarounds) — email client constraints

---

## Architecture Overview

### Virtual Layout Tree

We create a "virtual" layout using `svelte-emails` components. These components don't render HTML directly — they build an intermediate representation (IR) that gets transformed into email-safe HTML.

Components register themselves via Svelte's `createContext`, forming a tree structure:

```svelte
<Email>
    <Div cols>
        <Text content='Some text' />
    </Div>
</Email>
```

Produces this IR:

```ts
{
  type: 'email',
  subject: '...',
  preview: '...',
  bodyBackground: '#f8fafc',  // From body-bg-[#f8fafc] (defaults to #ffffff)
  maxWidth: 600,              // From max-w-[800px] (defaults to 600)
  attrs: [],
  children: [{
    type: 'div',
    direction: 'cols',           // 'cols' | 'rows' | undefined
    responsiveGrid: true,        // Stack columns on mobile
    colWidths: ['40%', '30%', '30%'],  // From cols-[40%_30%_30%]
    rowHeights: undefined,       // From rows-[100px_auto]
    gap: '16px',                 // From gap-4
    attrs: [],
    children: [{
      type: 'text',
      content: 'Some text',
      variant: 'default',
      attrs: []
    }]
  }]
}
```

### Why Virtual Layout?

1. **Decouples authoring from output** — Authors write clean Svelte, renderer outputs ugly-but-compatible table HTML
2. **Enables optimization** — Can merge adjacent elements, flatten unnecessary nesting
3. **Single source of truth** — Both Preview and `render()` use the same tree
4. **Testable** — IR can be validated/tested without rendering

### Source Files

| File | Purpose |
|------|--------|
| `src/context.ts` | IR node types (`Mail` namespace) and Svelte context definitions |
| `src/renderer.ts` | IR tree → HTML/text conversion (main entry point: `renderTree()`) |
| `src/styles.ts` | `StyleConfig` types, presets, `merge()`, `getRootSize()` |
| `src/style-attributes.ts` | TypeScript types for all Tailwind-like utility attributes |
| `src/rendering/` | Modular rendering utilities (see below) |

#### Rendering Module (`src/rendering/`)

| File | Purpose |
|------|--------|
| `index.ts` | Re-exports all rendering utilities |
| `types.ts` | `InheritedStyles`, `ParsedAttrs`, `RenderContext`, `RenderOptions` |
| `CONSTANTS.ts` | Spacing scale (rem), font sizes (rem), border radii, max-widths |
| `parse-attrs.ts` | `parseAttrs()`, `remToPx()`, `parseColumnTemplate()`, `parseGap()`, `parseCellPadding()`, `extractColspanFromAttrs()`, `extractRowspanFromAttrs()`, and individual parsers |
| `colors.ts` | `blendColor()`, `parseHex()`, `rgbToHex()`, `parseColorWithOpacity()` |
| `html-helpers.ts` | `toInlineCSS()`, `htmlAttrs()`, `wrapWithMargin()`, `presentationTable()` |
| `content.ts` | `parseMarkdown()`, `interpolateVariables()`, `escapeHtml()` |

### IR Node Structure

Every IR node extends `BaseNode` which contains:

```ts
// From src/context.ts
interface BaseNode<T extends string> {
  type: T
  /** Tailwind-like utility attributes (e.g., 'p-4', 'bg-[#fff]') */
  attrs: string[]
}
```

**Key insight:** We don't store parsed CSS in the IR — we store the raw attribute strings. The conversion from attributes to CSS happens entirely in the renderer. This keeps the IR simple and allows the renderer to handle inheritance, opacity blending, and margin emulation in one pass.

#### DivNode Structure

The `DivNode` is the most versatile container, supporting both simple containers and grid layouts:

```ts
interface DivNode extends BaseNode<'div'> {
  /** Layout direction: 'cols' for horizontal, 'rows' for vertical, undefined for normal flow */
  direction?: 'cols' | 'rows'
  /** Collapse columns to single-column on mobile (only applies when direction='cols') */
  responsiveGrid?: boolean
  /** Column widths for grid layout, parsed from `cols-[40%_20%_20%_20%]` */
  colWidths?: string[]
  /** Row heights for grid layout, parsed from `rows-[100px_auto_50px]` */
  rowHeights?: string[]
  /** Gap between children in grid layout, parsed from `gap-4` or `gap-[20px]` */
  gap?: string
  children: IRNode[]
}
```

| Property | Source | Purpose |
|----------|--------|--------|
| `direction` | `cols` or `rows` attribute | Enables grid layout mode |
| `responsiveGrid` | `responsive` attribute | Adds `.responsive-grid` class for media query stacking |
| `colWidths` | `cols-[40%_30%_30%]` attribute | Defines column widths (underscore-separated) |
| `rowHeights` | `rows-[100px_auto]` attribute | Defines row heights (underscore-separated) |
| `gap` | `gap-4` or `gap-[20px]` attribute | Space between children |

#### TableNode Structure

The `TableNode` represents data tables with semantic markup:

```ts
interface TableNode extends BaseNode<'table'> {
  border?: boolean          // Full borders (outer + cells)
  borderOuter?: boolean     // Outer border only
  cellBorder?: boolean      // Cell borders only (no outer)
  striped?: boolean         // Alternating row backgrounds
  compact?: boolean         // Reduced cell padding
  colWidths?: string[]      // From cols-[40%_20%_20%_20%]
  cellPadding?: string      // From cell-padding-4 or cell-padding-[12px]
  children: TableRowNode[]
}
```

| Property | Source | Purpose |
|----------|--------|--------|
| `border` | `border` attribute | Adds borders to table and all cells |
| `borderOuter` | `border-outer` attribute | Adds border only around table |
| `cellBorder` | `cell-border` attribute | Adds borders between cells only |
| `striped` | `striped` attribute | Alternates row background colors |
| `compact` | `compact` attribute | Reduces default cell padding |
| `colWidths` | `cols-[...]` attribute | Defines column widths |
| `cellPadding` | `cell-padding-*` attribute | Sets padding for all cells |

#### TableRowNode Structure

```ts
interface TableRowNode extends BaseNode<'table-row'> {
  header?: boolean          // Render cells as <th> instead of <td>
  children: IRNode[]
}
```

### Render Types

The renderer uses several key types to manage state during traversal:

```ts
// Options passed to render() or renderTree()
interface RenderOptions {
  vars?: Record<string, string | number>  // Variable values for interpolation
  style?: StyleConfig                      // Theme/preset configuration
}

// Internal context passed through the render tree
interface RenderContext {
  vars: Record<string, string | number>   // Variables for content interpolation
  footnotes: Footnote[]                   // Collected link footnotes for text output
  headers: Record<string, string>         // Email headers (e.g., List-Unsubscribe)
  style: StyleConfig                      // Active style configuration
}

// Tracks CSS-inheritable properties through the tree
// (See Style Inheritance section for full definition)
interface InheritedStyles {
  backgroundColor: string  // For opacity blending (not CSS inheritance)
  color?: string
  fontFamily?: string
  fontSize?: string
  fontWeight?: string
  // ... other inheritable CSS properties
  opacity: number          // Element opacity multiplier
}
```

---

## Component Registration Flow

Context is managed via stable Symbol keys for SSR compatibility:

```ts
// context.ts
import { getContext, setContext } from 'svelte'

// Stable keys using Symbol.for() - required for SSR
export const EMAIL_ROOT_CONTEXT_KEY = Symbol.for('svelte-emails:root-collector')
export const EMAIL_PARENT_CONTEXT_KEY = Symbol.for('svelte-emails:parent-node')

export function getEmailRoot(): Collector {
	return getContext<Collector>(EMAIL_ROOT_CONTEXT_KEY)
}

export function setEmailRoot(collector: Collector): Collector {
	return setContext(EMAIL_ROOT_CONTEXT_KEY, collector)
}
```

> **Why Symbol.for() instead of createContext()?**  
> The `render()` function needs to inject context from *outside* the component tree via Svelte's server `render({ context: Map })` API. Svelte's `createContext()` generates an internal key that isn't accessible externally. Using `Symbol.for()` creates a stable, globally-unique key that can be used both in `index.ts` (when creating the context Map) and in components (when reading context). See [SSR & Server Rendering](#ssr--server-rendering) for full details.

```
┌─────────────────────────────────────────────────────────────┐
│  <Email.Preview> or render()                                │
│    │                                                        │
│    ├─ setEmailRoot(collector)                               │
│    │                                                        │
│    └─ <Email>                                               │
│         │                                                   │
│         ├─ getEmailRoot() → registers self                  │
│         ├─ setEmailParent(self)                             │
│         │                                                   │
│         └─ <Div cols>                                       │
│              │                                              │
│              ├─ getEmailParent() → registers                │
│              ├─ setEmailParent(self)                        │
│              │                                              │
│              └─ <Text content='...'>                        │
│                   └─ getEmailParent() → registers           │
└─────────────────────────────────────────────────────────────┘
```

Each component:
1. Gets its parent from context via `getEmailParent()`
2. Registers itself with that parent
3. Sets itself as the new parent for children via `setEmailParent(self)`

---

## Rendering Pipeline

The rendering pipeline transforms the IR tree into final HTML and plain text output. Both preview and server render follow the same core flow.

### Preview Mode (`<Email.Preview>`)

```
IR Tree → renderTree(root, { vars, style }) → HTML → Inject into <iframe>
```

The iframe isolation ensures:
- No CSS leakage from the host page
- Accurate representation of how the email will look
- Safe sandbox for testing dynamic content

### Server Render (`render()`)

```
IR Tree → renderTree(root, { vars, style }) → { html, text, headers }
```

The `render()` function returns HTML, plain text, and email headers:

```ts
const { html, text, headers } = render(MyEmail, { vars: { name: 'Alice' } })
// headers may include: { 'List-Unsubscribe': '<mailto:...>, <https://...>' }
```

### Plain Text Output (`text`)

The `text` output is a **Markdown-formatted** plain text version of the email, optimized for:
- Email clients that prefer plain text
- Accessibility (screen readers)
- Preview in non-HTML contexts

**Conversion Rules:**

| Element | Markdown Output |
|---------|-----------------|
| Links | `[text](url)` |
| Images | `![alt](url)` |
| Bold | `**text**` |
| Italic | `*text*` |
| Strikethrough | `~~text~~` |
| Code | `` `code` `` |
| Headings | `# H1`, `## H2`, etc. |
| Tables | Pretty markdown tables (see below) |
| Variables | Replaced with actual values |

**Note:** Underline (`__text__`) and others are non-standard markdown, and will be rendered as plain text in the text output since markdown doesn't support underline natively.

#### Grid Layout Reading Order

For multi-column layouts, text output reads **column by column** (left to right), then row by row within each column. This provides a logical reading flow for complex layouts.

**Example:**
```svelte
<Div cols>
  <Div>           <!-- Column 1 -->
    <Text content='A' />
    <Text content='B' />
    <Text content='C' />
  </Div>
  <Div>           <!-- Column 2 -->
    <Text content='X' />
  </Div>
</Div>
```

**Text output:**
```
A
B
C

X
```

This ensures that related content in a column is read together before moving to the next column, even when columns have different heights.

#### Table Rendering

HTML `<Table>` components are rendered as pretty markdown tables:

**Input:**
```svelte
<Table>
  <Table.Row header>
    <Text content='Name' />
    <Text content='Status' />
  </Table.Row>
  <Table.Row>
    <Text content='API' />
    <Text content='🟢 Good' />
  </Table.Row>
  <Table.Row>
    <Text content='Database' />
    <Text content='🟢 Good' />
  </Table.Row>
</Table>
```

**Text output:**
```
| Name     | Status   |
|----------|----------|
| API      | 🟢 Good  |
| Database | 🟢 Good  |
```

Column widths are auto-calculated based on content, with proper alignment using separator dashes.

#### Images and Links

```svelte
<Img src='https://example.com/logo.png' alt='Company Logo' />
<Text content='Visit [our site](https://example.com) for more info.' />
<Button href='https://example.com/action'>Click Here</Button>
```

**Text output:**
```
![Company Logo](https://example.com/logo.png)

Visit [our site](https://example.com)[^1] for more info.

[Click Here](https://example.com/action)[^2]
```

#### Whitespace Handling

- **Paragraphs:** Separated by blank lines
- **Spacers/Dividers:** Rendered as blank lines or `---` respectively
- **Nested containers:** Preserve logical grouping with appropriate spacing

#### Footers

Links in the HTML page should include a `[^1]` and contain additional context/information at the bottom of the text output.

```
Visit [our site](https://example.com)[^1] for more info.

[^1]: our site, https://example.com
```

---

## Style System

### Attribute-Based Styling

All styling in `svelte-emails` is done via **Tailwind-like attributes** on components, not CSS classes or style objects. This approach:

1. **Familiar syntax** — Developers who know Tailwind can use the same utilities
2. **Type-safe** — All attributes are typed in `src/style-attributes.ts`
3. **Declarative** — Styles are visible in the component markup
4. **Render-time conversion** — Attributes are converted to CSS during rendering

### How Attributes Flow Through the System

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Component (e.g., Div.svelte)                                           │
│    <Div p-4 bg-[#f0f0f0] text-[#333]>                                   │
│         │                                                               │
│         ├─ Props typed via DivAttributes (from style-attributes.ts)    │
│         │                                                               │
│         └─ Registers IR node with attrs: ['p-4', 'bg-[#f0f0f0]', ...]  │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  IR Tree (context.ts)                                                   │
│    { type: 'div', attrs: ['p-4', 'bg-[#f0f0f0]', 'text-[#333]'], ... } │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Renderer (renderer.ts)                                                 │
│    parseAttrs(['p-4', 'bg-[#f0f0f0]', 'text-[#333]'])                  │
│         │                                                               │
│         ├─ Extracts margin attrs → emulates via wrapper table          │
│         ├─ Extracts backgroundColor → tracks for opacity blending      │
│         ├─ Extracts opacity → compounds with color opacities           │
│         ├─ Merges with inherited styles (typography, colors)           │
│         │                                                               │
│         └─ Outputs: { css: { padding: '16px', ... }, margin: {...} }   │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  HTML Output                                                            │
│    <td style="padding: 16px; background-color: #f0f0f0; ...">          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Tailwind-like Attributes

Components accept Tailwind-inspired attributes that get parsed into inline styles:

```svelte
<Div p-4 bg-[#f0f0f0] align-middle max-w-[600px]>
```

Parsed as:

```ts
{
  padding: '16px',           // p-4 → 1rem → 16px
  backgroundColor: '#f0f0f0',
  textAlign: 'center',       // align-middle → center (horizontal)
  verticalAlign: 'middle',   // align-middle → middle (vertical)
  maxWidth: '600px'
}
```

### Style Inheritance (Renderer)

The renderer maintains an **inheritance stack** as it traverses the IR tree. CSS-inheritable properties are passed down to children via the `InheritedStyles` type:

> **See also:** [Render Types](#render-types) for how this fits into the overall rendering context.

```ts
// Full definition from src/rendering/types.ts
interface InheritedStyles {
  // --- Background (for opacity blending, not CSS inheritance) ---
  backgroundColor: string  // Current bg for opacity blending (default: #ffffff)

  // --- Color ---
  color?: string           // Text color (default: #000000)

  // --- Border (for opacity blending) ---
  borderColor?: string     // Border color (defaults to text color if not set)

  // --- Font Properties ---
  fontFamily?: string
  fontSize?: string        // Default: 16px
  fontWeight?: string
  fontStyle?: string       // normal, italic, oblique
  fontVariant?: string     // normal, small-caps

  // --- Text Properties ---
  textDecoration?: string  // underline, overline, line-through, none
  textTransform?: string   // uppercase, lowercase, capitalize, none
  textAlign?: string       // left, center, right, justify
  textIndent?: string

  // --- Spacing & Layout ---
  lineHeight?: string
  letterSpacing?: string
  wordSpacing?: string

  // --- Whitespace & Overflow ---
  whiteSpace?: string      // normal, nowrap, pre, pre-line, pre-wrap
  wordBreak?: string
  overflowWrap?: string

  // --- Vertical Alignment (for table cells) ---
  verticalAlign?: string

  // --- Visibility ---
  visibility?: string      // visible, hidden, collapse

  // --- List Properties ---
  listStyleType?: string
  listStylePosition?: string

  // --- Other ---
  cursor?: string
  direction?: string

  // --- Opacity (compounds with color opacities) ---
  opacity: number          // Element opacity multiplier (0-1)
}
```

> **Note:** `backgroundColor` and `borderColor` are not CSS-inherited properties, but we track them for opacity blending calculations (email clients don't support `rgba()` or `opacity`).

**Default Inherited Values:**

The renderer starts with sensible defaults for the root:

| Property | Default | Notes |
|----------|---------|-------|
| `backgroundColor` | `#ffffff` | White background for opacity blending |
| `color` | `#000000` | Black text |
| `borderColor` | Same as `color` | Inherits from text color |
| `fontSize` | `16px` | Standard base size for rem conversion |
| `opacity` | `1` | Fully opaque |

These defaults can be overridden via the `style.root` configuration.

**Inheritance flow:**

1. Renderer starts with default inherited values (see table above)
2. For each node, `parseAttrs()` converts attributes to CSS
3. Inherited values are merged with explicit values (explicit wins)
4. Typography, colors, and border color are extracted and passed to children
5. Children can override any inherited value with their own attributes
6. Border color inherits from text color if not explicitly set

### Attribute Categories

| Category | Examples | Email Support |
|----------|----------|---------------|
| **Spacing** | `p-4`, `px-2`, `py-6` | ✅ Full (padding only) |
| **Sizing** | `w-full`, `w-screen` (alias for 100%) | ✅ Full (avoid min/max in Outlook) |
| **Alignment** | `align-middle`, `align-top-left` | ✅ Full (content placement) |
| **Justify** | `justify-left`, `justify-center` | ✅ Full (text alignment) |
| **Typography** | `text-sm`, `font-bold` | ✅ Full |
| **Colors** | `text-[#333]`, `bg-[#fff]` | ✅ Full |
| **Color Opacity** | `text-opacity-50`, `bg-opacity-75` | ✅ Full (via blending) |
| **Borders** | `border`, `border-2`, `border-[#ccc]` | ✅ Full |
| **Border Opacity** | `border-opacity-50` | ✅ Full (via blending) |
| **Rounded** | `rounded`, `rounded-lg` | ⚠️ ~80% (not Outlook Windows) |
| **Display** | `hidden`, `block` | ✅ Full |

### Forbidden/Ignored Utilities

These are intentionally not supported due to poor email client compatibility:

| Utility | Reason | Alternative |
|---------|--------|-------------|
| `flex`, `grid` | CSS layout not supported in Outlook | Use `<Div cols>` or `<Div rows>` |
| `overflow-*` | Unreliable in email clients | None (content expands) |
| `max-h-*` | Requires overflow:hidden (unreliable) | None (let content dictate height) |
| `shadow-*` | ~63% support, Outlook ignores | None (degrade gracefully) |
| `object-fit` | ~66% support, Outlook ignores | Use explicit width/height |
| `z-index` | Outlook flattens layers | None |
| `transform-*` | Not supported | None |
| `transition-*` | Not supported | None |

### Supported via Emulation

These utilities have poor native support but are **fully emulated** by the renderer:

| Utility | Native Support | Emulation Strategy |
|---------|----------------|-------------------|
| `m-*`, `mx-*`, etc. | ~70% (Outlook.com dropped) | Wrapper table with padding |
| `opacity-*` | ~70% (Outlook ignores) | Compounds with color opacities |
| `*-opacity-*` | N/A (`rgba()` ~83%) | Background-aware color blending |

### Margin Emulation Strategy

CSS margins are unreliable (Outlook.com dropped support), so we **emulate margins using wrapper tables with padding**:

> **How it works:** The `parseAttrs()` function extracts margin attributes into a separate `margin` object. The renderer then uses `wrapWithMargin()` to generate the wrapper table structure.

```svelte
<Div m-4 p-2 bg-[#fff]>Content</Div>
```

The renderer separates margin from other attributes and wraps the element:

```html
<!-- Outer wrapper provides "margin" via padding -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding: 16px;">  <!-- m-4 becomes wrapper padding -->
      <!-- Inner element with its own styles -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding: 8px; background-color: #fff;">Content</td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```

**How it works:**

| Attribute | Applied To | CSS Property |
|-----------|------------|--------------|
| `m-4` | Outer wrapper `<td>` | `padding: 16px` |
| `mt-2` | Outer wrapper `<td>` | `padding-top: 8px` |
| `mx-auto` | Outer wrapper `<table>` | `margin: 0 auto` + `align="center"` |
| `p-2` | Inner element `<td>` | `padding: 8px` |
| `bg-[#fff]` | Inner element `<td>` | `background-color: #fff` |

**Centering with `mx-auto`:**

For horizontal centering, we use a combination that works everywhere:
- `align="center"` on parent container (most reliable)
- `margin: 0 auto` on the table (works for block tables)
- Fixed width required for centering to work

```html
<table align="center" style="margin: 0 auto; width: 300px;">
  ...
</table>
```

**Benefits:**
- ✅ 100% email client support (only uses padding)
- ✅ Familiar Tailwind-like API  
- ✅ Works in Outlook, Gmail, Apple Mail, Yahoo, etc.

**Trade-off:**
- Slightly more HTML nesting (one extra wrapper per element with margins)
- Renderer must detect margin attributes and generate wrapper

### Color Opacity Blending Strategy

CSS `opacity` (~70%) and `rgba()` (~83%) have poor email support — Outlook Windows fails on both. We solve this by **blending colors at render time** against the inherited background color.

> **Implementation:** See [Color Blending Algorithm](#color-blending-algorithm) for the `blendColor()` function.

**Syntax:** Use separate opacity modifier attributes (since `/` is invalid in HTML attributes):

```svelte
<Div bg-[#ffffff]>
  <Text text-opacity-50 text-[#000000]>This renders as #808080</Text>
  <Div bg-opacity-25 bg-[#ff0000]>25% red on white = #ffbfbf</Div>
</Div>
```

**How it works:**

The renderer tracks background and border colors through the component tree via context. When encountering an opacity modifier:

1. Get the appropriate inherited color (background, text, or border)
2. Get the nearest ancestor's background color for blending (default: `#ffffff`)
3. Blend using: `result = fg * alpha + bg * (1 - alpha)`
4. Output the solid hex result

```
text-opacity-50 text-[#000000] on bg-[#ffffff]
  → blend(#000000, #ffffff, 0.5)
  → #808080
```

**Using inherited colors with opacity:**

Border color inherits from text color by default, so you can apply opacity without specifying a color:

```svelte
<Div text-[#ff0000]>
  <!-- Border inherits red from text color -->
  <Div border border-opacity-50>50% red border</Div>
</Div>

<!-- Or use default black (inherited from root) -->
<Div border border-opacity-25>25% black border</Div>
```

**Supported opacity modifiers:**

| Attribute | Applies to | Inherits from |
|-----------|------------|---------------|
| `text-opacity-*` | Text color | Parent text color or default (#000000) |
| `bg-opacity-*` | Background color | Must specify `bg-[#color]` |
| `border-opacity-*` | Border color | Parent border color → text color → default (#000000) |

**Opacity values:**

| Syntax | Meaning |
|--------|---------|
| `*-opacity-0` | Fully transparent (= background color) |
| `*-opacity-50` | 50% opacity |
| `*-opacity-100` | Fully opaque (no blending) |
| `*-opacity-[0.33]` | Arbitrary decimal value |

**Nested transparency:**

When elements with semi-transparent backgrounds are nested, the blending compounds correctly:

```svelte
<Div bg-[#ffffff]>                         <!-- white -->
  <Div bg-opacity-50 bg-[#000000]>         <!-- 50% black = #808080 -->
    <Div bg-opacity-50 bg-[#000000]>       <!-- 50% black on #808080 = #404040 -->
    </Div>
  </Div>
</Div>
```

**Element opacity (`opacity-*`) as a multiplier:**

The `opacity-*` utility acts as a multiplier on all color opacities within that element. This allows you to fade an entire element without manually adjusting each color:

```svelte
<!-- These are equivalent: -->
<Div opacity-50 text-inherit bg-[#000000]>...</Div>
<Div text-opacity-50 text-inherit bg-opacity-50 bg-[#000000]>...</Div>

<!-- Opacities compound (multiply): -->
<Div opacity-50>
  <Text text-opacity-50 text-[#000000]>25% black (50% × 50%)</Text>
</Div>
```

**Compounding formula:** `final_opacity = element_opacity × color_opacity`

This is especially useful with `text-inherit` — inherited colors automatically get the element opacity applied.

**Benefits:**
- ✅ 100% email client support (outputs solid hex)
- ✅ Works as valid HTML attributes (no `/` character)
- ✅ Mathematically accurate visual result
- ✅ Works with inherited colors (especially useful for borders)
- ✅ `opacity-*` works as intuitive multiplier

**Trade-off:**
- Requires background color context (defaults to white if unknown)
- Renderer must track background and border colors through the tree

### Responsive Classes

```svelte
<Div mobile-only>Mobile content</Div>
<Div desktop-only>Desktop content</Div>
```

**Implementation strategy:**

Since media queries cannot be inlined, we use a multi-layered approach:

1. **Desktop-only content**: Visible by default, hidden via media query
2. **Mobile-only content**: Hidden by default via inline styles, revealed via media query
3. **Outlook handling**: Use `mso-hide:all` to ensure Outlook respects hidden state

```html
<style>
  @media screen and (max-width: 600px) {
    .desktop-only { display: none !important; }
    .mobile-only { display: block !important; }
  }
</style>

<!-- Desktop-only: visible by default -->
<div class="desktop-only">
  Desktop content
</div>

<!-- Mobile-only: hidden by default, revealed on small screens -->
<!--[if !mso]><!-->
<div class="mobile-only" style="display: none; mso-hide: all;">
  Mobile content
</div>
<!--<![endif]-->
```

**Why this works:**

| Client | Desktop Block | Mobile Block |
|--------|---------------|--------------|
| Desktop (wide viewport) | ✅ Visible | ❌ `display:none` |
| Mobile (narrow viewport) | ❌ Media query hides | ✅ Media query reveals |
| Outlook Windows | ✅ Visible | ❌ `mso-hide:all` + conditional |
| Clients stripping `<style>` | ✅ Visible (fallback) | ❌ Inline `display:none` |

**Note:** ~75% of clients support media queries. For the remaining 25%, desktop layout is shown (graceful degradation).

---

## Content Parsing

### Extended Markdown Syntax

The `content` prop supports inline formatting. All parsing happens during rendering via `parseMarkdown()`.

#### Inline Formatting

| Syntax | Output | HTML |
|--------|--------|------|
| `**bold**` | **bold** | `<strong>` |
| `*italic*` | *italic* | `<em>` |
| `~~strike~~` | ~~strike~~ | `<s>` |
| `__underline__` | <u>underline</u> | `<u>` |
| `[text](url)` | link | `<a href="url">` |
| `^super^` | <sup>super</sup> | `<sup>` |
| `_sub_` | <sub>sub</sub> | `<sub>` |
| `` `code` `` | `code` | `<code>` (inline) |
| ` ``` ` | codeblock | `<pre><code>` (block) |
| `(#hex)text(/)` | colored | `<span style="color:...">` |
| `[#hex]text[/]` | highlighted | `<span style="background:...">` |
| `--small--` | <small>small</small> | `<small>` |
| `\n` | line break | `<br>` |
| `\\` | escape next char | literal character |

#### Lists

Both ordered and unordered lists are supported:

```svelte
<Text content='
- First item
- Second item
- Third item
' />

<Text content='
1. Numbered item
2. Another item
a. Lettered item
A. Uppercase letter
I. Roman numeral
' />
```

**Unordered lists:** Lines starting with `-` become `<li>` inside `<ul>`.

**Ordered lists:** Lines starting with `1.`, `a.`, `A.`, or `I.` become `<li>` inside `<ol>`:
- `1.` — Numeric (`type="1"`)
- `a.` — Lowercase letters (`type="a"`)
- `A.` — Uppercase letters (`type="A"`)  
- `I.` — Roman numerals (`type="I"`)

**Rendered HTML:**
```html
<ul style="...">
  <li>First item</li>
  <li>Second item</li>
</ul>

<ol type="1" style="...">
  <li>Numbered item</li>
  <li>Another item</li>
</ol>
```

#### Code and Codeblocks

**Inline code:** Use single backticks for inline code:
```svelte
<Text content='Use the `render()` function to output HTML.' />
```
→ `<code>render()</code>`

**Codeblocks:** Use triple backticks for multi-line code:
```svelte
<Text content='
Here is an example:
\`\`\`
const x = 1
const y = 2
\`\`\`
' />
```
→ `<pre><code>const x = 1\nconst y = 2</code></pre>`

Codeblock styling uses the `Codeblock` preset (background, padding, font-family, etc.).

#### Escaping Characters

Use backslash `\` to escape markdown characters:

```svelte
<Text content='Use \*\*asterisks\*\* literally, not bold.' />
```
→ "Use **asterisks** literally, not bold."

#### Tables

Tables can be defined inline in `content` props:

```svelte
<Text content={`
| Name | Status | Description |
|------|--------|-------------|
| API | 🟢 Good | All systems operational |
| DB | 🟢 Good | Response time normal |
`} />
```

**Parsing rules:**
- First row = header (renders as `<th>`)
- Second row = separator (`|---|---|`) — determines column alignment
- Subsequent rows = data rows (renders as `<td>`)

**Column alignment (via separator row):**
- `|---|` or `|:---|` = left align
- `|:---:|` = center align
- `|---:|` = right align

**Rendered HTML:**
```html
<table role="presentation" style="...">
  <tr>
    <th style="...">Name</th>
    <th style="...">Status</th>
    <th style="...">Description</th>
  </tr>
  <tr>
    <td style="...">API</td>
    <td style="...">🟢 Good</td>
    <td style="...">All systems operational</td>
  </tr>
</table>
```

**Note:** Markdown table styling uses the `Table` preset defaults.

### Markdown Parsing Implementation

The `parseMarkdown()` function in `src/rendering/content.ts` handles all markdown processing. Understanding the implementation details helps avoid common pitfalls.

#### Processing Order

The order of operations is critical for correct parsing:

```ts
function parseMarkdown(content: string, context: RenderContext): string {
  // 1. Escape sequences FIRST — protect intentional literals
  content = processEscapes(content)
  
  // 2. Codeblocks BEFORE inline code — greedy match triple backticks
  content = parseCodeblocks(content)
  
  // 3. Inline code BEFORE other formatting — protect code content
  content = parseInlineCode(content)
  
  // 4. Tables — must happen before line-based processing
  content = parseTables(content)
  
  // 5. Lists — line-based, before inline formatting
  content = parseLists(content)
  
  // 6. Line breaks — \n to <br>
  content = parseLineBreaks(content)
  
  // 7. Inline formatting — order matters for nesting!
  content = parseInlineFormatting(content)
  
  // 8. Links — after inline formatting (links can contain formatted text)
  content = parseLinks(content)
  
  return content
}
```

**Why this order matters:**
- Escape sequences must be processed first, or `\*` would be parsed as italic
- Codeblocks must be extracted before inline code, or ` ``` ` would match as inline
- Code content must be protected before other formatting runs
- Lists need original line structure before `\n` becomes `<br>`

#### Nested Formatting

Markdown supports nested inline formatting. The key is **processing from outermost to innermost**:

```
Input:  '***bold and italic***'
        ↓
Step 1: Match bold (**...**) → '<strong>*bold and italic*</strong>'
        ↓  
Step 2: Match italic (*...*) → '<strong><em>bold and italic</em></strong>'
```

**Implementation strategy — recursive or multi-pass:**

```ts
// Option A: Multi-pass (simpler, recommended)
function parseInlineFormatting(content: string): string {
  // Process in order: longer delimiters first
  content = content.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')  // ***
  content = content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')               // **
  content = content.replace(/\*(.+?)\*/g, '<em>$1</em>')                           // *
  // ... other patterns
  return content
}

// Option B: Single regex with callback (handles arbitrary nesting)
function parseInlineFormatting(content: string): string {
  const patterns = [
    { regex: /\*\*(.+?)\*\*/g, tag: 'strong' },
    { regex: /\*(.+?)\*/g, tag: 'em' },
    // ...
  ]
  
  for (const { regex, tag } of patterns) {
    content = content.replace(regex, (_, inner) => {
      // Recursively parse inner content
      return `<${tag}>${parseInlineFormatting(inner)}</${tag}>`
    })
  }
  return content
}
```

**Nesting combinations to support:**

| Input | Output |
|-------|--------|
| `***text***` | `<strong><em>text</em></strong>` |
| `**_text_**` | `<strong><em>text</em></strong>` |
| `*__text__*` | `<em><u>text</u></em>` |
| `~~**text**~~` | `<s><strong>text</strong></s>` |
| `[**bold link**](url)` | `<a href="url"><strong>bold link</strong></a>` |

#### Pattern Reference

Each markdown syntax has a specific regex pattern:

```ts
const PATTERNS = {
  // Escape: backslash followed by special char
  escape: /\\([*_~`\[\]()#\\|^-])/g,
  
  // Bold/Italic (non-greedy, handles nesting)
  boldItalic: /\*\*\*(.+?)\*\*\*/g,      // *** → <strong><em>
  bold: /\*\*(.+?)\*\*/g,                 // ** → <strong>
  italic: /\*(.+?)\*/g,                   // * → <em>
  
  // Other inline
  strikethrough: /~~(.+?)~~/g,            // ~~ → <s>
  underline: /__(.+?)__/g,                // __ → <u>
  superscript: /\^(.+?)\^/g,              // ^ → <sup>
  subscript: /_([^_]+)_/g,                // _ → <sub> (careful: conflicts with __)
  small: /--(.+?)--/g,                    // -- → <small>
  
  // Code (capture content without backticks)
  codeblock: /```([\s\S]*?)```/g,         // ``` → <pre><code>
  inlineCode: /`([^`]+)`/g,               // ` → <code>
  
  // Colors
  textColor: /\(#([0-9a-fA-F]{3,6})\)(.+?)\(\/\)/g,   // (#hex)text(/)
  highlight: /\[#([0-9a-fA-F]{3,6})\](.+?)\[\/\]/g,   // [#hex]text[/]
  
  // Links
  link: /\[([^\]]+)\]\(([^)]+)\)/g,       // [text](url)
  
  // Lists (line-based)
  unorderedItem: /^- (.+)$/gm,            // - item
  orderedNumeric: /^(\d+)\. (.+)$/gm,     // 1. item
  orderedAlpha: /^([a-z])\. (.+)$/gmi,    // a. or A. item
  orderedRoman: /^([IVXLCDM]+)\. (.+)$/gm, // I. item
  
  // Tables
  tableRow: /^\|(.+)\|$/gm,               // | cell | cell |
  tableSeparator: /^\|[-:\s|]+\|$/m,      // |---|---|
  
  // Line breaks
  lineBreak: /\n/g,                       // \n → <br>
}
```

#### Common Pitfalls

**1. Greedy vs Non-Greedy Matching**

```ts
// ❌ WRONG: Greedy match consumes too much
/\*\*(.+)\*\*/g
'**one** and **two**' → '<strong>one** and **two</strong>'

// ✅ CORRECT: Non-greedy stops at first match
/\*\*(.+?)\*\*/g  
'**one** and **two**' → '<strong>one</strong> and <strong>two</strong>'
```

**2. Subscript vs Underline Conflict**

Both `_text_` (subscript) and `__text__` (underline) use underscores:

```ts
// ❌ WRONG: Underline pattern breaks subscript
'__underline__' with /_(.+?)_/g → '<sub>_underline_</sub>'

// ✅ CORRECT: Process underline FIRST (longer delimiter)
content = content.replace(/__(.+?)__/g, '<u>$1</u>')
content = content.replace(/_([^_]+)_/g, '<sub>$1</sub>')
```

**3. Code Content Must Be Protected**

Code blocks should not have their contents parsed as markdown:

```ts
// ❌ WRONG: Bold inside code gets parsed
'`**not bold**`' → '`<strong>not bold</strong>`'

// ✅ CORRECT: Extract and protect code first
function parseMarkdown(content: string): string {
  const codeBlocks: string[] = []
  
  // Extract code, replace with placeholders
  content = content.replace(/`([^`]+)`/g, (_, code) => {
    codeBlocks.push(code)
    return `\x00CODE${codeBlocks.length - 1}\x00`
  })
  
  // Parse all other markdown...
  content = parseInlineFormatting(content)
  
  // Restore code blocks
  content = content.replace(/\x00CODE(\d+)\x00/g, (_, i) => {
    return `<code>${escapeHtml(codeBlocks[parseInt(i)])}</code>`
  })
  
  return content
}
```

**4. Escape Sequence Edge Cases**

```ts
// Must handle: \\* (literal backslash + italic)
'\\\\*text*' → '\<em>text</em>'

// Implementation:
content = content.replace(/\\\\/g, '\x00BACKSLASH\x00')  // Protect \\
content = content.replace(/\\([*_~])/g, '\x00ESCAPED_$1\x00')  // Protect \*
// ... parse markdown ...
content = content.replace(/\x00BACKSLASH\x00/g, '\\')
content = content.replace(/\x00ESCAPED_(.)\x00/g, '$1')
```

**5. Multiline Content in Tables**

Table cells cannot contain newlines — they break the row structure:

```ts
// ❌ Problematic: Cell content has newline
'| Line1\nLine2 | Cell2 |'

// ✅ Solution: Strip newlines in table cells, or reject
```

**6. Nested Links**

Links cannot be nested (HTML doesn't allow `<a>` inside `<a>`):

```ts
// ❌ Invalid: Nested link syntax
'[outer [inner](url1)](url2)'

// ✅ Solution: Parse innermost links first, or reject nested brackets
```

**7. Empty Delimiters**

Empty formatting should be ignored, not produce empty tags:

```ts
// ❌ WRONG: Produces empty tags
'****' with /\*\*(.+?)\*\*/g → '<strong></strong>'

// ✅ CORRECT: Require at least one character
/\*\*(.+?)\*\*/g  // .+? requires 1+ chars
```

**8. HTML Entity Conflicts**

Markdown in variable content that contains `<`, `>`, `&`:

```ts
// Variable value: "1 < 2 & 3 > 0"
// Must escape HTML entities BEFORE markdown parsing
// But AFTER variable interpolation

// Processing order:
// 1. interpolateVariables() — replaces [[var]]
// 2. escapeHtml() — escapes <, >, & in variable values
// 3. parseMarkdown() — processes markdown syntax
```

#### Performance Considerations

For large emails with heavy markdown:

1. **Compile regexes once** — Don't create regex objects inside loops
2. **Early exit** — Skip parsing if content has no markdown characters
3. **Batch replacements** — Process similar patterns together
4. **Limit nesting depth** — Prevent pathological cases like `*****text*****`

```ts
// Quick check before expensive parsing
function hasMarkdown(content: string): boolean {
  return /[*_~`\[\]|^#-]/.test(content)
}

function parseMarkdown(content: string, context: RenderContext): string {
  if (!hasMarkdown(content)) return content
  // ... full parsing
}
```

### Variable Interpolation

Variables allow dynamic content to be inserted into emails at render time. This is the primary way to personalize emails with user-specific data.

#### Syntax

Use double brackets `[[variable_name]]` to insert variables:

```svelte
<Text content='Hello [[first_name]]!' />
<Text content='Your order #[[order_id]] has shipped.' />
<Button href='https://example.com/track/[[tracking_id]]'>Track Package</Button>
```

#### Providing Variables

Pass a `vars` object to `render()` or `<Email.Preview>`:

```ts
// Server-side rendering
const { html, text } = render(MyEmail, {
  vars: {
    first_name: 'Alice',
    order_id: '12345',
    tracking_id: 'TRK-789'
  }
})

// Preview component
<Email.Preview vars={{ first_name: 'Alice', order_id: '12345' }}>
  <MyEmail />
</Email.Preview>
```

#### When Variables Are Replaced

Variable interpolation happens **during the HTML/text rendering phase**, after the IR tree is built but before final output:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Rendering Pipeline                                                         │
│                                                                             │
│  1. Component Registration  → IR tree built (variables NOT replaced yet)   │
│                                                                             │
│  2. renderTree() called     → Traverse IR tree                              │
│       │                                                                     │
│       ├─ renderTextNode()   → interpolateVariables(content, vars)          │
│       │                        ↳ '[[first_name]]' → 'Alice'                │
│       │                                                                     │
│       ├─ renderButtonNode() → interpolateVariables(content, vars)          │
│       │                     → interpolateVariables(href, vars)             │
│       │                                                                     │
│       └─ renderLinkNode()   → interpolateVariables(content, vars)          │
│                             → interpolateVariables(href, vars)             │
│                                                                             │
│  3. HTML/Text output        → Variables fully replaced                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key insight:** The IR tree stores raw template strings (e.g., `'Hello [[first_name]]!'`). Variable replacement is deferred to render time, allowing the same IR tree to be rendered with different variable sets without rebuilding the component tree.

#### Where Variables Work

| Location | Supported | Example |
|----------|-----------|---------|
| `content` prop | ✅ | `<Text content='Hi [[name]]' />` |
| `href` prop | ✅ | `<Button href='https://example.com/u/[[id]]'>` |
| `src` prop | ✅ | `<Img src='https://cdn.example.com/[[avatar]]' />` |
| `alt` prop | ✅ | `<Img alt='Photo of [[name]]' />` |
| Markdown content | ✅ | `<Text content='**[[name]]** joined' />` |
| Style attributes | ❌ | `<Div bg-[[[color]]]>` — NOT supported |

#### Processing Order

When a `content` prop contains both variables and markdown:

1. **Variables first:** `[[var]]` replaced with actual values
2. **Markdown second:** Markdown syntax parsed to HTML
3. **HTML escape:** Variable values are escaped before insertion

```
Input:   'Hello **[[name]]**!'
         ↓
Step 1:  'Hello **Alice**!'        (variable replaced)
         ↓
Step 2:  'Hello <strong>Alice</strong>!'  (markdown parsed)
```

#### The `interpolateVariables()` Function

```ts
// From src/rendering/content.ts

/**
 * Replace [[variable]] placeholders with values from vars object.
 * Values are HTML-escaped to prevent XSS.
 * 
 * @param content - String containing [[variable]] placeholders
 * @param vars - Object mapping variable names to values
 * @returns String with variables replaced
 */
function interpolateVariables(
  content: string,
  vars: Record<string, string | number | undefined>
): string {
  return content.replace(/\[\[(\w+)\]\]/g, (match, varName) => {
    const value = vars[varName]
    if (value === undefined) {
      // Keep placeholder if variable not provided (helps debugging)
      return match
    }
    return escapeHtml(String(value))
  })
}
```

#### Security

**All variable values are HTML-escaped by default:**

```ts
vars: { name: '<script>alert("xss")</script>' }
// Renders as: &lt;script&gt;alert("xss")&lt;/script&gt;
```

This prevents XSS attacks when user-provided data is used in emails.

#### Missing Variables

If a variable is referenced but not provided, the placeholder remains in the output:

```ts
render(MyEmail, { vars: { first_name: 'Alice' } })
// <Text content='Hi [[first_name]], your code is [[code]]' />
// → "Hi Alice, your code is [[code]]"
```

This behavior helps identify missing variables during development/testing.

#### Best Practices

1. **Use descriptive names:** `[[customer_first_name]]` over `[[n]]`
2. **Provide all variables:** Check for `[[` in output during testing
3. **Avoid in URLs without encoding:** URL-encode values used in query params
4. **Don't use in style attributes:** Variables in `bg-[...]` won't work

---

## Attribute Parsing System

The attribute parser converts Tailwind-like attribute strings into CSS property-value pairs. This happens entirely at render time in `renderer.ts`, using utilities from `src/rendering/parse-attrs.ts`.

> **See also:** [Style System](#style-system) for how attributes flow through components, and [rem-First Strategy](#rem-first-strategy) for unit conversion.

### Parser Architecture

The `parseAttrs()` function is the core of attribute processing:

```ts
function parseAttrs(
  attrs: string[],           // Raw attribute strings from IR node
  inherited: InheritedStyles, // Current inherited styles (for opacity blending)
  rootSize: number = 16      // Root font size for rem→px conversion
): ParsedAttrs
```

**Processing flow:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  parseAttrs(['p-4', 'bg-[#f0f0f0]/50', 'text-[#333]', 'm-2'], inherited, 16)│
│                                                                             │
│    ┌───────────────────┐                                                    │
│    │  For each attr:   │                                                    │
│    │  1. Match pattern │                                                    │
│    │  2. Extract value │                                                    │
│    │  3. Convert units │  ← rem→px using rootSize                           │
│    │  4. Blend colors  │  ← against inherited.backgroundColor               │
│    └─────────┬─────────┘                                                    │
│              │                                                              │
│    ┌─────────▼─────────────────────────────────────────────────────────┐   │
│    │  Categorize into:                                                  │   │
│    │  - css: { padding, backgroundColor, color, ... }  (direct inline)  │   │
│    │  - margin: { top, right, bottom, left }  (wrapper emulation)       │   │
│    │  - backgroundColor: string  (for inheritance tracking)             │   │
│    │  - opacity: number  (element opacity multiplier)                   │   │
│    │  - responsive: 'mobile-only' | 'desktop-only' | null               │   │
│    └───────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Parsing Patterns

Each attribute type has a dedicated parser function. These are composed internally:

```ts
// Simplified pattern — actual implementation uses a parser chain
const parsers = [
  parsePadding,    // p-*, px-*, py-*, pt-*, pr-*, pb-*, pl-*
  parseMargin,     // m-*, mx-*, my-*, mt-*, mr-*, mb-*, ml-*
  parseWidth,      // w-*, min-w-*, max-w-*
  parseHeight,     // h-*, min-h-*, max-h-*
  parseColor,      // text-*, bg-*, border-[#...]
  parseTypography, // text-{size}, font-*, leading-*, tracking-*
  parseBorder,     // border-*, rounded-*
  parseDisplay,    // hidden, block, inline, inline-block
  parseAlignment,  // align-*, justify-*
  parseOpacity,    // opacity-*
  parseResponsive  // mobile-only, desktop-only
]
```

Each parser receives the attribute string, inherited styles, and root size, then returns partial `ParsedAttrs` or `null` if no match.

### rem-First Strategy

All spacing, sizing, and typography values in `svelte-emails` are defined in **rem units** internally. This provides:

1. **Relative spacing** — Values relate to each other proportionally
2. **Easy scaling** — Change the root size to scale everything uniformly
3. **Familiar Tailwind values** — `p-4` = `1rem`, `text-base` = `1rem`

#### How rem Conversion Works

Email clients don't reliably support rem units, so **all rem values are converted to px at parse time**:

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Attribute → rem (from constants) → px (in output CSS)                   │
│                                                                          │
│  'p-4'   → SPACING_SCALE['4'] → '1rem'    → remToPx('1rem', 16) → '16px'│
│  'w-[2rem]' ─────────────────→ '2rem'     → remToPx('2rem', 16) → '32px'│
│  'text-sm' → FONT_SIZES['sm'] → '0.875rem'→ remToPx('0.875rem', 16) → '14px'│
└──────────────────────────────────────────────────────────────────────────┘
```

#### Configuring Root Size

The default root size is `16px`. Override it via the `style` option:

```ts
render(MyEmail, {
  vars: { name: 'Alice' },
  style: {
    root: { size: 18 }  // 1rem = 18px
  }
})
```

With `root.size: 18`:
- `p-4` (1rem) → `18px`
- `text-base` (1rem) → `18px`
- `max-w-md` (28rem) → `504px`

#### The `remToPx()` Function

```ts
import { remToPx } from './rendering'

remToPx('1rem', 16)     // → '16px'
remToPx('1.5rem', 16)   // → '24px'
remToPx('0.25rem', 16)  // → '4px'
remToPx('100%', 16)     // → '100%' (non-rem values pass through)
remToPx('20px', 16)     // → '20px' (already px, unchanged)
```

**Arbitrary values with rem:**

Arbitrary values (e.g., `w-[2rem]`, `p-[1.5rem]`) are also converted:

```svelte
<Div p-[1.5rem] w-[30rem]>
  <!-- At root.size=16: padding: 24px, width: 480px -->
</Div>
```

#### Why Not Keep rem in Output?

Email clients have inconsistent (or no) support for rem:
- **Outlook Windows** — Ignores rem entirely
- **Gmail** — May strip or misinterpret
- **Apple Mail** — Supports rem, but inconsistent with other clients

Converting to px ensures **100% compatibility** while letting you author with convenient rem-based values.

### Spacing Scale (rem)

All spacing values are stored in rem in `CONSTANTS.ts`. The table below shows scale values and their px equivalent at the default root size (16px):

| Scale | rem | px (at root=16) |
|-------|-----|-----------------|
| `0` | 0 | 0 |
| `0.5` | 0.125rem | 2px |
| `1` | 0.25rem | 4px |
| `1.5` | 0.375rem | 6px |
| `2` | 0.5rem | 8px |
| `2.5` | 0.625rem | 10px |
| `3` | 0.75rem | 12px |
| `3.5` | 0.875rem | 14px |
| `4` | 1rem | 16px |
| `5` | 1.25rem | 20px |
| `6` | 1.5rem | 24px |
| `7` | 1.75rem | 28px |
| `8` | 2rem | 32px |
| `9` | 2.25rem | 36px |
| `10` | 2.5rem | 40px |
| `11` | 2.75rem | 44px |
| `12` | 3rem | 48px |
| `14` | 3.5rem | 56px |
| `16` | 4rem | 64px |
| `20` | 5rem | 80px |
| `24` | 6rem | 96px |
| `28` | 7rem | 112px |
| `32` | 8rem | 128px |
| `36` | 9rem | 144px |
| `40` | 10rem | 160px |
| `44` | 11rem | 176px |
| `48` | 12rem | 192px |
| `52` | 13rem | 208px |
| `56` | 14rem | 224px |
| `60` | 15rem | 240px |
| `64` | 16rem | 256px |
| `72` | 18rem | 288px |
| `80` | 20rem | 320px |
| `96` | 24rem | 384px |

### Attribute Pattern Reference

#### Padding (`p-*`, `px-*`, `py-*`, `pt-*`, etc.)

```ts
// Pattern: p-{scale} | p-[{value}]
'p-4'       → { padding: '16px' }
'p-[20px]'  → { padding: '20px' }
'px-2'      → { paddingLeft: '8px', paddingRight: '8px' }
'py-6'      → { paddingTop: '24px', paddingBottom: '24px' }
'pt-4'      → { paddingTop: '16px' }
```

#### Margin (`m-*`, `mx-*`, etc.) — Extracted for wrapper emulation

```ts
// Pattern: m-{scale} | m-[{value}] | m-auto
'm-4'       → margin: { top: '16px', right: '16px', bottom: '16px', left: '16px' }
'mx-auto'   → margin: { left: 'auto', right: 'auto' }  // + align="center" on table
'mt-2'      → margin: { top: '8px' }
```

**Note:** Margins are NOT added to `css` — they're extracted to `margin` for wrapper generation.

#### Width (`w-*`)

```ts
// Pattern: w-{scale} | w-[{value}] | w-full | w-screen | w-auto
'w-full'    → { width: '100%' }
'w-screen'  → { width: '100%' }  // Alias (viewport units not supported)
'w-[300px]' → { width: '300px' }
'w-[50%]'   → { width: '50%' }
'w-auto'    → { width: 'auto' }
'w-16'      → { width: '64px' }
```

#### Height (`h-*`)

```ts
// Pattern: h-{scale} | h-[{value}] | h-full | h-screen | h-auto
'h-full'    → { height: '100%' }
'h-screen'  → { height: '100%' }  // Alias
'h-[200px]' → { height: '200px' }
'h-auto'    → { height: 'auto' }
```

#### Min/Max Width (`min-w-*`, `max-w-*`)

```ts
// Pattern: min-w-{scale|preset} | min-w-[{value}]
'min-w-full'   → { minWidth: '100%' }
'min-w-[200px]'→ { minWidth: '200px' }

// Pattern: max-w-{scale|preset} | max-w-[{value}]
'max-w-sm'     → { maxWidth: '384px' }
'max-w-md'     → { maxWidth: '448px' }
'max-w-lg'     → { maxWidth: '512px' }
'max-w-xl'     → { maxWidth: '576px' }
'max-w-2xl'    → { maxWidth: '672px' }
'max-w-[600px]'→ { maxWidth: '600px' }
'max-w-none'   → { maxWidth: 'none' }
```

#### Colors (`text-[#...]`, `bg-[#...]`)

```ts
// Pattern: text-[{color}] | text-[{color}]/{opacity}
'text-[#333333]'     → { color: '#333333' }
'text-[#000000]/50'  → { color: '#808080' }  // Blended against background
'text-inherit'       → { color: 'inherit' }  // Uses inherited color

// Pattern: bg-[{color}] | bg-[{color}]/{opacity}
'bg-[#f0f0f0]'       → { backgroundColor: '#f0f0f0' }
'bg-[#ff0000]/25'    → { backgroundColor: '#ffbfbf' }  // 25% red on white
'bg-transparent'     → { backgroundColor: 'transparent' }
```

**Opacity modifier parsing:**

```ts
// Parse color with optional opacity
function parseColorWithOpacity(value: string): { color: string; opacity: number } {
  const match = value.match(/^(#[0-9a-fA-F]{3,8})(?:\/(\d+|\[[\d.]+\]))?$/)
  if (!match) return { color: value, opacity: 1 }
  
  const color = match[1]
  const opacityPart = match[2]
  
  if (!opacityPart) return { color, opacity: 1 }
  
  // /50 → 0.5, /[0.33] → 0.33
  const opacity = opacityPart.startsWith('[') 
    ? parseFloat(opacityPart.slice(1, -1))
    : parseInt(opacityPart) / 100
    
  return { color, opacity }
}
```

#### Alignment (`align-*`)

```ts
// Pattern: align-{position}
'align-top-left'     → { textAlign: 'left', verticalAlign: 'top' }
'align-top'          → { textAlign: 'center', verticalAlign: 'top' }
'align-top-right'    → { textAlign: 'right', verticalAlign: 'top' }
'align-left'         → { textAlign: 'left', verticalAlign: 'middle' }
'align-middle'       → { textAlign: 'center', verticalAlign: 'middle' }
'align-center'       → { textAlign: 'center', verticalAlign: 'middle' }  // Alias
'align-right'        → { textAlign: 'right', verticalAlign: 'middle' }
'align-bottom-left'  → { textAlign: 'left', verticalAlign: 'bottom' }
'align-bottom'       → { textAlign: 'center', verticalAlign: 'bottom' }
'align-bottom-right' → { textAlign: 'right', verticalAlign: 'bottom' }
```

#### Text Justification (`justify-*`)

```ts
// Pattern: justify-{alignment}
'justify-left'   → { textAlign: 'left' }
'justify-center' → { textAlign: 'center' }
'justify-right'  → { textAlign: 'right' }
'justify-full'   → { textAlign: 'justify' }
```

#### Typography (`text-*`, `font-*`, etc.)

```ts
// Font size: text-{size} | text-[{value}]
// (px values shown are at default root.size=16)
'text-xs'        → { fontSize: '12px', lineHeight: '16px' }   // 0.75rem
'text-sm'        → { fontSize: '14px', lineHeight: '20px' }   // 0.875rem
'text-base'      → { fontSize: '16px', lineHeight: '24px' }   // 1rem
'text-lg'        → { fontSize: '18px', lineHeight: '28px' }   // 1.125rem
'text-xl'        → { fontSize: '20px', lineHeight: '28px' }   // 1.25rem
'text-2xl'       → { fontSize: '24px', lineHeight: '32px' }   // 1.5rem
'text-3xl'       → { fontSize: '30px', lineHeight: '36px' }   // 1.875rem
'text-4xl'       → { fontSize: '36px', lineHeight: '40px' }   // 2.25rem
'text-5xl'       → { fontSize: '48px', lineHeight: '1' }      // 3rem
'text-6xl'       → { fontSize: '60px', lineHeight: '1' }      // 3.75rem
'text-7xl'       → { fontSize: '72px', lineHeight: '1' }      // 4.5rem
'text-8xl'       → { fontSize: '96px', lineHeight: '1' }      // 6rem
'text-9xl'       → { fontSize: '128px', lineHeight: '1' }     // 8rem
'text-[18px]'    → { fontSize: '18px' }                       // arbitrary

// Font weight: font-{weight}
'font-thin'       → { fontWeight: '100' }
'font-extralight' → { fontWeight: '200' }
'font-light'      → { fontWeight: '300' }
'font-normal'     → { fontWeight: '400' }
'font-medium'     → { fontWeight: '500' }
'font-semibold'   → { fontWeight: '600' }
'font-bold'       → { fontWeight: '700' }
'font-extrabold'  → { fontWeight: '800' }
'font-black'      → { fontWeight: '900' }

// Font style
'italic'     → { fontStyle: 'italic' }
'not-italic' → { fontStyle: 'normal' }

// Text decoration
'underline'    → { textDecoration: 'underline' }
'overline'     → { textDecoration: 'overline' }
'line-through' → { textDecoration: 'line-through' }
'no-underline' → { textDecoration: 'none' }

// Text transform
'uppercase'   → { textTransform: 'uppercase' }
'lowercase'   → { textTransform: 'lowercase' }
'capitalize'  → { textTransform: 'capitalize' }
'normal-case' → { textTransform: 'none' }

// Line height: leading-{preset} | leading-{scale} | leading-[{value}]
'leading-none'    → { lineHeight: '1' }
'leading-tight'   → { lineHeight: '1.25' }
'leading-snug'    → { lineHeight: '1.375' }
'leading-normal'  → { lineHeight: '1.5' }
'leading-relaxed' → { lineHeight: '1.625' }
'leading-loose'   → { lineHeight: '2' }
'leading-6'       → { lineHeight: '24px' }  // Scale value
'leading-[1.8]'   → { lineHeight: '1.8' }

// Letter spacing: tracking-{preset} | tracking-[{value}]
'tracking-tighter' → { letterSpacing: '-0.05em' }
'tracking-tight'   → { letterSpacing: '-0.025em' }
'tracking-normal'  → { letterSpacing: '0' }
'tracking-wide'    → { letterSpacing: '0.025em' }
'tracking-wider'   → { letterSpacing: '0.05em' }
'tracking-widest'  → { letterSpacing: '0.1em' }
'tracking-[2px]'   → { letterSpacing: '2px' }
```

#### Borders (`border-*`)

```ts
// Border width: border | border-{width} | border-[{value}]
'border'      → { borderWidth: '1px', borderStyle: 'solid' }
'border-0'    → { borderWidth: '0' }
'border-2'    → { borderWidth: '2px', borderStyle: 'solid' }
'border-4'    → { borderWidth: '4px', borderStyle: 'solid' }
'border-8'    → { borderWidth: '8px', borderStyle: 'solid' }
'border-[3px]'→ { borderWidth: '3px', borderStyle: 'solid' }

// Per-side: border-{side} | border-{side}-{width}
'border-t'    → { borderTopWidth: '1px', borderTopStyle: 'solid' }
'border-r-2'  → { borderRightWidth: '2px', borderRightStyle: 'solid' }
'border-b-4'  → { borderBottomWidth: '4px', borderBottomStyle: 'solid' }
'border-l-0'  → { borderLeftWidth: '0' }

// Border color: border-[#{hex}] | border-[#{hex}]/{opacity}
'border-[#cccccc]'     → { borderColor: '#cccccc' }
'border-[#000000]/20'  → { borderColor: '#cccccc' }  // 20% black on white
'border-transparent'   → { borderColor: 'transparent' }

// Border style
'border-solid'  → { borderStyle: 'solid' }
'border-dashed' → { borderStyle: 'dashed' }
'border-dotted' → { borderStyle: 'dotted' }
'border-double' → { borderStyle: 'double' }
'border-none'   → { borderStyle: 'none' }
```

#### Border Radius (`rounded-*`) — ⚠️ Outlook ignores

```ts
// Pattern: rounded | rounded-{size} | rounded-[{value}]
'rounded-none' → { borderRadius: '0' }
'rounded-sm'   → { borderRadius: '2px' }
'rounded'      → { borderRadius: '4px' }
'rounded-md'   → { borderRadius: '6px' }
'rounded-lg'   → { borderRadius: '8px' }
'rounded-xl'   → { borderRadius: '12px' }
'rounded-2xl'  → { borderRadius: '16px' }
'rounded-3xl'  → { borderRadius: '24px' }
'rounded-full' → { borderRadius: '9999px' }
'rounded-[10px]' → { borderRadius: '10px' }

// Per-corner: rounded-{corner}-{size}
'rounded-tl-lg' → { borderTopLeftRadius: '8px' }
'rounded-tr-lg' → { borderTopRightRadius: '8px' }
'rounded-br-lg' → { borderBottomRightRadius: '8px' }
'rounded-bl-lg' → { borderBottomLeftRadius: '8px' }

// Per-side: rounded-{side}-{size}
'rounded-t-lg' → { borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }
'rounded-r-lg' → { borderTopRightRadius: '8px', borderBottomRightRadius: '8px' }
'rounded-b-lg' → { borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }
'rounded-l-lg' → { borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px' }
```

#### Display (`hidden`, `block`, etc.)

```ts
'block'        → { display: 'block' }
'inline-block' → { display: 'inline-block' }
'inline'       → { display: 'inline' }
'hidden'       → { display: 'none' }
```

#### Opacity (`opacity-*`) — Element opacity multiplier

```ts
// Pattern: opacity-{value} | opacity-[{value}]
'opacity-0'    → opacity: 0      // Extracted, not added to css
'opacity-25'   → opacity: 0.25
'opacity-50'   → opacity: 0.5
'opacity-75'   → opacity: 0.75
'opacity-100'  → opacity: 1
'opacity-[0.33]' → opacity: 0.33
```

**Note:** `opacity` is extracted separately and used as a multiplier for all color opacities in the element.

#### Responsive (`mobile-only`, `desktop-only`)

```ts
'mobile-only'  → responsive: 'mobile-only'   // + display:none inline
'desktop-only' → responsive: 'desktop-only'  // + class for media query
```

### ParsedAttrs Structure

```ts
interface ParsedAttrs {
  /** CSS properties to apply inline */
  css: Record<string, string>
  
  /** Margin values (emulated via wrapper table padding) */
  margin?: {
    top?: string
    right?: string
    bottom?: string
    left?: string
  }
  
  /** Background color (for inheritance tracking) */
  backgroundColor?: string
  
  /** Element opacity (multiplier for all color opacities) */
  opacity?: number
  
  /** Responsive visibility class */
  responsive?: 'mobile-only' | 'desktop-only'
}
```

### Color Blending Algorithm

```ts
/**
 * Blend a foreground color with a background color at given opacity.
 * Uses standard alpha compositing formula.
 */
function blendColor(fg: string, bg: string, alpha: number): string {
  const fgRgb = parseHex(fg)  // { r, g, b } 0-255
  const bgRgb = parseHex(bg)
  
  const r = Math.round(fgRgb.r * alpha + bgRgb.r * (1 - alpha))
  const g = Math.round(fgRgb.g * alpha + bgRgb.g * (1 - alpha))
  const b = Math.round(fgRgb.b * alpha + bgRgb.b * (1 - alpha))
  
  return rgbToHex(r, g, b)
}

/**
 * Parse hex color to RGB components.
 * Supports #RGB, #RRGGBB, #RRGGBBAA formats.
 */
function parseHex(hex: string): { r: number; g: number; b: number } {
  hex = hex.replace('#', '')
  
  // Expand shorthand (#RGB → #RRGGBB)
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
  }
  
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16)
  }
}

/**
 * Convert RGB components to hex string.
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('')
}
```

### Applying Colors with Opacity

When processing a color attribute with an opacity modifier:

```ts
function processColor(
  attr: string,              // e.g., 'text-[#000000]/50'
  property: 'color' | 'backgroundColor' | 'borderColor',
  inherited: InheritedStyles
): string {
  const match = attr.match(/\[(#[0-9a-fA-F]+)\](?:\/(\d+|\[[\d.]+\]))?/)
  if (!match) return attr
  
  const color = match[1]
  let opacity = 1
  
  if (match[2]) {
    opacity = match[2].startsWith('[')
      ? parseFloat(match[2].slice(1, -1))
      : parseInt(match[2]) / 100
  }
  
  // Apply element opacity multiplier
  opacity *= inherited.opacity
  
  // Blend against background
  if (opacity < 1) {
    return blendColor(color, inherited.backgroundColor, opacity)
  }
  
  return color
}
```

### Inline CSS Generation

```ts
/**
 * Convert parsed CSS properties to inline style string.
 */
function toInlineCSS(css: Record<string, string>): string {
  return Object.entries(css)
    .filter(([_, value]) => value !== undefined && value !== '')
    .map(([property, value]) => `${kebabCase(property)}: ${value}`)
    .join('; ')
}

// Example:
// { padding: '16px', backgroundColor: '#f0f0f0', textAlign: 'center' }
// → "padding: 16px; background-color: #f0f0f0; text-align: center"
```

### Rendering Flow with Attributes

This example shows the complete flow for rendering a `Div` node:

```ts
function renderDivNode(
  node: Mail.DivNode,
  inherited: InheritedStyles,
  context: RenderContext,
  rootSize: number  // For rem → px conversion
): string {
  // 1. Parse attributes (converts rem to px using rootSize)
  const parsed = parseAttrs(node.attrs, inherited, rootSize)
  
  // 2. Color blending already happened in parseAttrs
  //    (opacity modifiers blended against inherited.backgroundColor)
  
  // 3. Extract inheritable values for children
  const childInherited = extractInheritable(parsed, inherited)
  
  // 4. Render children recursively
  const childrenHtml = node.children
    .map(child => renderNodeToHtml(child, childInherited, context, rootSize))
    .join('')
  
  // 5. Generate inline CSS string
  const inlineStyle = toInlineCSS(parsed.css)
  
  // 6. Build element HTML
  let html = `<td style="${inlineStyle}">${childrenHtml}</td>`
  
  // 7. Wrap with margin table if needed (margin emulation)
  if (parsed.margin) {
    html = wrapWithMargin(html, parsed.margin)
  }
  
  return html
}
```

---

## HTML Output Strategy

### HTML Document Structure

The renderer generates a complete HTML document with email-specific markup. Understanding this structure is critical for compatibility.

#### Document Template

```html
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>{{subject}}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset styles for email clients */
    body { margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    /* Responsive styles (progressive enhancement) */
    @media screen and (max-width: 600px) {
      .responsive-grid td { display: block !important; width: 100% !important; }
      .mobile-only { display: block !important; }
      .desktop-only { display: none !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: {{bgColor}};">
  <!-- Preview text (hidden but shows in inbox preview) -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    {{previewText}}
    <!-- Padding to ensure preview text doesn't get truncated -->
    &#847; &#847; &#847; &#847; &#847; &#847; &#847; ...
  </div>
  
  <!-- Outer wrapper table (100% width, centers content) -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: {{bgColor}};">
    <tr>
      <td align="center" valign="top">
        <!-- Content width container (e.g., 600px max) -->
        <table role="presentation" width="{{contentWidth}}" cellpadding="0" cellspacing="0" border="0" style="max-width: {{contentWidth}}px;">
          <tr>
            <td>
              {{content}}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

#### Key Document Elements

| Element | Purpose | Why It Matters |
|---------|---------|----------------|
| XHTML DOCTYPE | Maximum compatibility | Some clients parse as XHTML, need valid syntax |
| VML namespaces | `xmlns:v`, `xmlns:o` | Required for VML shapes in Outlook |
| `<meta charset>` | UTF-8 encoding | Emoji and international characters |
| `<meta viewport>` | Mobile rendering | Proper scaling on mobile devices |
| `x-apple-disable-message-reformatting` | Prevent iOS reflow | Apple Mail reformats emails |
| `X-UA-Compatible` | IE edge mode | Use latest IE rendering |
| `PixelsPerInch` MSO XML | 96 DPI in Outlook | Prevents image sizing issues |
| Reset styles | Normalize rendering | Clear default margins/padding |
| Preview text div | Inbox preview snippet | Hidden text shown in email list |
| Wrapper table | Center content | Reliable centering across clients |

#### MSO Conditional Comments

Microsoft Office (MSO) conditional comments target Outlook Windows:

```html
<!--[if mso]>
  <!-- Only Outlook Windows sees this -->
<![endif]-->

<!--[if !mso]><!-->
  <!-- Everything EXCEPT Outlook sees this -->
<!--<![endif]-->

<!--[if gte mso 9]>
  <!-- Outlook 2000+ sees this -->
<![endif]-->
```

**Common uses:**
- VML fallbacks for rounded corners
- Hiding content from Outlook
- Outlook-specific width fixes

#### Preview Text

The hidden preview text controls what appears in the inbox list after the subject line:

```html
<div style="display: none; max-height: 0; overflow: hidden;">
  This appears in inbox preview...
  &#847; &#847; &#847; &#847; <!-- Invisible padding -->
</div>
```

The `&#847;` characters (zero-width non-joiners) prevent email clients from pulling body content into the preview.

### Table-Based Layout

All layout is rendered as nested tables for maximum compatibility:

```svelte
<Div cols>
  <Div w-[50%]>Left</Div>
  <Div w-[50%]>Right</Div>
</Div>
```

Renders as:

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td width="50%" valign="top" style="...">Left</td>
    <td width="50%" valign="top" style="...">Right</td>
  </tr>
</table>
```

### Inline Styles

All CSS is inlined on elements. No external stylesheets, no `<style>` blocks (except for responsive breakpoints which are progressive enhancement).

### VML Fallbacks (Future)

For Outlook Windows compatibility on features like:
- Rounded corners on buttons
- Background images

We can optionally generate VML conditional comments:

```html
<!--[if mso]>
<v:roundrect ...>
<![endif]-->
<!--[if !mso]><!-->
<a style="border-radius: 4px; ...">Button</a>
<!--<![endif]-->
```

### Node Traversal Strategy

The renderer performs a **depth-first traversal** of the IR tree, maintaining inherited styles as it descends:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  renderTree(root, options)                                                  │
│    │                                                                        │
│    ├─ Initialize RenderContext (vars, footnotes, headers, style)            │
│    ├─ Initialize InheritedStyles from StyleConfig defaults                  │
│    │                                                                        │
│    └─ renderNodeToHtml(node, inherited, context, rootSize)                  │
│         │                                                                   │
│         ├─ Dispatch by node.type                                            │
│         │    ├─ 'email'  → renderEmailNode() (generates document wrapper)   │
│         │    ├─ 'div'    → renderDivNode() (or grid mode if direction set)  │
│         │    ├─ 'text'   → renderTextNode()                                 │
│         │    └─ ...                                                         │
│         │                                                                   │
│         └─ Each node renderer:                                              │
│              1. parseAttrs(node.attrs, inherited, rootSize)                 │
│              2. Extract margin for wrapper emulation                        │
│              3. Compute childInherited = extractInheritable(parsed, inherited)│
│              4. Recursively render children with childInherited             │
│              5. Generate HTML with inline styles                            │
│              6. Wrap with margin table if needed                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Dispatch Pattern

The main `renderNodeToHtml()` uses a type-based dispatch:

```ts
function renderNodeToHtml(
  node: Mail.IRNode,
  inherited: InheritedStyles,
  context: RenderContext,
  rootSize: number
): string {
  switch (node.type) {
    case 'email':       return renderEmailNode(node, inherited, context, rootSize)
    case 'div':         return renderDivNode(node, inherited, context, rootSize)
    // Note: Div handles grid mode internally when node.direction is set
    case 'text':        return renderTextNode(node, inherited, context, rootSize)
    case 'button':      return renderButtonNode(node, inherited, context, rootSize)
    case 'img':         return renderImgNode(node, inherited, context, rootSize)
    case 'spacer':      return renderSpacerNode(node, inherited, context, rootSize)
    case 'divider':     return renderDividerNode(node, inherited, context, rootSize)
    case 'br':          return renderBrNode(node, inherited, context, rootSize)
    case 'link':        return renderLinkNode(node, inherited, context, rootSize)
    case 'unsubscribe': return renderUnsubscribeNode(node, inherited, context, rootSize)
    case 'table':       return renderTableNode(node, inherited, context, rootSize)
    case 'table-row':   return renderTableRowNode(node, inherited, context, rootSize)
    default:
      // Exhaustive check: should never reach here
      const _exhaustive: never = node
      return ''
  }
}
```

#### Rendering Children

Container nodes (div, table, etc.) render their children recursively:

```ts
function renderChildren(
  children: Mail.IRNode[],
  inherited: InheritedStyles,
  context: RenderContext,
  rootSize: number
): string {
  return children
    .map(child => renderNodeToHtml(child, inherited, context, rootSize))
    .join('')
}
```

### Performance Considerations

Email rendering is typically fast, but these optimizations are applied:

#### 1. Single-Pass Traversal

The tree is traversed exactly once. All operations (parsing, inheritance, output) happen during this single pass.

#### 2. Lazy Regex Compilation

Regex patterns in `parseAttrs()` are defined as module-level constants, compiled once at import time rather than per-call.

#### 3. Early Exit for Simple Content

```ts
// Skip expensive markdown parsing if no markdown characters present
function hasMarkdownChars(content: string): boolean {
  return /[*_~`\[\]|^#-]/.test(content)
}

function processContent(content: string, context: RenderContext): string {
  if (!hasMarkdownChars(content)) {
    return interpolateVariables(content, context)
  }
  return parseMarkdown(interpolateVariables(content, context), context)
}
```

#### 4. String Concatenation Strategy

For HTML output, we use direct string concatenation which is efficient for this use case:

```ts
// Efficient: single template literal
return `<td style="${inlineStyle}">${childrenHtml}</td>`

// Avoid: array join for small numbers of elements
// const parts = ['<td style="', inlineStyle, '">', childrenHtml, '</td>']
// return parts.join('')  // Unnecessary overhead
```

#### 5. Memoization Opportunities

For large emails with repeated content, consider memoizing:
- Parsed attributes for identical `attrs` arrays
- Blended colors for repeated color/opacity combinations

```ts
// Future optimization: attribute memoization
const attrCache = new Map<string, ParsedAttrs>()

function parseAttrsWithCache(
  attrs: string[],
  inherited: InheritedStyles,
  rootSize: number
): ParsedAttrs {
  const key = attrs.join('|') + '|' + inherited.backgroundColor + '|' + rootSize
  if (attrCache.has(key)) return attrCache.get(key)!
  const parsed = parseAttrs(attrs, inherited, rootSize)
  attrCache.set(key, parsed)
  return parsed
}
```

#### 6. Output Size Considerations

Gmail clips emails larger than ~102KB. To prevent clipping:
- Avoid unnecessary wrapper tables (only emit margin wrapper when margin attrs exist)
- Use shorthand CSS where possible (`padding: 16px` vs `padding-top: 16px; padding-right: ...`)
- Minify inline styles (strip unnecessary whitespace)

```ts
// Compact inline CSS output
function toInlineCSS(css: Record<string, string>): string {
  return Object.entries(css)
    .filter(([_, v]) => v)
    .map(([k, v]) => `${toKebabCase(k)}:${v}`)  // No spaces around colon
    .join(';')  // No space after semicolon
}
```

#### 7. Plain Text Generation

Plain text is generated separately from HTML to avoid parsing HTML string:

```ts
// Parallel text rendering (not HTML stripping)
function renderNodeToText(node: Mail.IRNode, context: RenderContext): string {
  switch (node.type) {
    case 'text':
      return stripMarkdown(interpolateVariables(node.content, context))
    case 'div':
      return node.children.map(c => renderNodeToText(c, context)).join('\n')
    // ...
  }
}
```

---

## Component Reference

### Core Components

| Component | Purpose | Renders As |
|-----------|---------|------------|
| `<Email>` | Root wrapper, metadata | `<html><body>` with wrapper table |
| `<Div>` | Generic container | `<td>` or wrapper `<table>` |
| `<Div cols>` | Multi-column layout | `<table>` with single `<tr>` containing `<td>` per child |
| `<Div rows>` | Multi-row layout | `<table>` with `<tr><td>` per child |
| `<Table>` | Data tables | `<table>` with `<tr>`/`<th>`/`<td>` |
| `<Table.Row>` | Table row (inside Table) | `<tr>` with `<th>` or `<td>` cells |
| `<Text>` | Text content | `<p>`, `<span>` |
| `<Text.H1-H6>` | Headings | `<h1>`-`<h6>` |
| `<Text.Paragraph>` | Paragraph with line handling | `<p>` |
| `<Text.Small>` | Small text | `<small>` |
| `<Button>` | CTA button | `<a>` styled as button |
| `<Link>` | Inline text link | `<a>` inline anchor |
| `<Img>` | Images | `<img>` with dimensions |
| `<Spacer>` | Vertical spacing | Empty `<td>` with height |
| `<Divider>` | Horizontal rule | `<hr>` or bordered `<td>` |
| `<Br>` | Line break | `<br>` |
| `<Unsubscribe>` | Footer unsubscribe link | `<a>` with special styling |

### Email Component Detail

The `<Email>` component is the root wrapper for all email templates. It supports separate body and content backgrounds:

```svelte
<Email
  subject='Welcome!'
  preview='Your account is ready'
  body-bg-[#f0f4f8]
  bg-[#ffffff]
  max-w-[700px]
>
  ...
</Email>
```

**Email attributes:**

| Attribute | Purpose | Default |
|-----------|---------|--------|
| `subject` | Email subject line | (required) |
| `preview` | Preheader text shown in inbox | `''` |
| `body-bg-[#hex]` | Background color of the outer body | `#ffffff` |
| `bg-[#hex]` | Background color of the content container (max-width constrained) | `#ffffff` |
| `max-w-[Npx]` or `max-w-*` | Maximum width of the content container | `600px` |

**Two-layer background model:**

The Email component renders a two-layer structure:

1. **Outer body** (`body-bg-*`) — Full-width background that fills the email client viewport
2. **Inner content** (`bg-*`) — Centered content container with constrained width

```html
<!-- Simplified rendered structure -->
<body style="background-color: #f0f4f8;">  <!-- body-bg-[#f0f4f8] -->
  <table width="100%">
    <tr>
      <td align="center">
        <table width="700" style="max-width: 700px; background-color: #ffffff;">  <!-- bg-[#ffffff] max-w-[700px] -->
          <!-- Email content -->
        </table>
      </td>
    </tr>
  </table>
</body>
```

**Opacity blending:**

The `body-bg-*` attribute does **not** support opacity modifiers (`body-bg-opacity-*`). This is intentional: the body background serves as the root color for blending all child element opacities. When a child uses `opacity-*` or color opacity (e.g., `bg-[#000]/50`), it blends against the nearest parent's background color, ultimately falling back to the body background.

```svelte
<!-- body-bg is the root for opacity blending -->
<Email body-bg-[#f0f4f8] bg-[#ffffff]>
  <Div bg-[#000000]/50>  <!-- Blends black at 50% against #ffffff content bg -->
    <Div bg-[#ff0000]/30>  <!-- Blends red at 30% against the parent's blended color -->
    </Div>
  </Div>
</Email>
```

### Layout Components Detail

**`<Div>` with Grid Mode**

The `<Div>` component supports grid layout via `cols` and `rows` attributes:

```svelte
<!-- Columns (horizontal) -->
<Div cols>
  <Div w-[50%]>...</Div>
  <Div w-[50%]>...</Div>
</Div>

<!-- Responsive columns (stack on mobile) -->
<Div cols responsive>
  <Div w-[50%]>Left (stacks first on mobile)</Div>
  <Div w-[50%]>Right (stacks second on mobile)</Div>
</Div>

<!-- Rows (vertical) -->
<Div rows>
  <Div>Row 1</Div>
  <Div>Row 2</Div>
</Div>
```

**Grid attributes:**
- `cols` — Arrange children as horizontal columns (single `<tr>` with multiple `<td>`)
- `rows` — Arrange children as vertical rows (multiple `<tr>` with single `<td>` each)
- `responsive` — Collapse columns to single-column on mobile (only applies to `cols`)
- `cols-[40%_30%_30%]` — Define column widths (underscore-separated)
- `rows-[100px_auto_50px]` — Define row heights (underscore-separated)
- `gap-4` or `gap-[20px]` — Add spacing between children

**Gap Implementation:**

The `gap` property creates space between grid children using **spacer cells/rows**. Since CSS gap is not supported in email, we insert empty `<td>` elements (for columns) or `<tr>` elements (for rows) between children:

```svelte
<Div cols gap-4>
  <Div>Column 1</Div>
  <Div>Column 2</Div>
</Div>
```

Renders as:

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td>Column 1</td>
    <td width="16px"></td>  <!-- Gap spacer cell -->
    <td>Column 2</td>
  </tr>
</table>
```

For vertical layouts (`rows`), spacer rows are inserted:

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr><td>Row 1</td></tr>
  <tr><td style="height: 16px;"></td></tr>  <!-- Gap spacer row -->
  <tr><td>Row 2</td></tr>
</table>
```

**Responsive Grid Implementation:**

When `responsive` is set on a column grid, the renderer generates both desktop and mobile versions using CSS media queries:

```html
<style>
  @media screen and (max-width: 600px) {
    .responsive-grid td {
      display: block !important;
      width: 100% !important;
    }
  }
</style>

<table class="responsive-grid">
  <tr>
    <td style="width: 50%;">Column 1</td>
    <td style="width: 50%;">Column 2</td>
  </tr>
</table>
```

| Client | Behavior |
|--------|----------|
| Desktop (>600px) | Side-by-side columns |
| Mobile (≤600px) | Stacked full-width rows |
| Outlook Windows | Always desktop (ignores media queries) |

**`<Div>`**

Generic container. Can have:
- Width: `w-[50%]`, `w-full`, `w-[300px]`
- Padding: `p-4`, `px-2`, `py-6`
- Margins: `m-4`, `mt-2`, `mx-auto` (emulated via wrapper padding)
- Background: `bg-[#f0f0f0]`
- Alignment: `align-middle`, `align-top-left`, `align-bottom-right`
- Typography: `font-bold`, `text-sm`, `italic`, etc. (inherited by children)

**Style inheritance:** Container styles are inherited by child elements:

```svelte
<!-- Children inherit font-bold and text color -->
<Div font-bold text-[#333333]>
  <Text content='Bold dark text' />
  <Text content='Also bold' />
  <Text content='Override' font-normal />  <!-- Override inheritance -->
</Div>
```

**`<Table>`**

Data table component. Unlike `<Div cols>` (for layout), `<Table>` is for displaying tabular data:

```svelte
<Table border striped>
  <!-- Row styles are inherited by child elements -->
  <Table.Row header bg-[#f3f4f6] font-bold>
    <Text content='Name' />
    <Text content='Status' />
    <Text content='Description' />
  </Table.Row>
  <Table.Row>
    <Text content='Deployment' />
    <Text content='🟢 Good' />
    <Text content='All systems operational' />
  </Table.Row>
  <Table.Row>
    <Text content='Errors' />
    <Text content='<0.1%' />
    <Text content='Request error rate' />
  </Table.Row>
</Table>
```

**Table attributes:**
- `border` — Full borders (outer + cell borders)
- `border-outer` — Only outer table border (no cell borders)
- `cell-border` — Only cell borders (no outer border)
- `striped` — Alternating row backgrounds
- `compact` — Reduced cell padding
- `cols-[40%_20%_20%_20%]` — Define column widths (underscore-separated)
- `cell-padding-4` or `cell-padding-[12px]` — Override default cell padding

**Cell padding scale:**
| Attribute | Value |
|-----------|-------|
| `cell-padding-0` | 0 |
| `cell-padding-1` | 4px |
| `cell-padding-2` | 8px |
| `cell-padding-3` | 12px |
| `cell-padding-4` | 16px |
| `cell-padding-6` | 24px |
| `cell-padding-[value]` | Arbitrary value |

**Table.Row attributes:**
- `header` — Marks row as header (renders `<th>` instead of `<td>`)
- `bg-[#...]` — Row background color
- `py-*`, `px-*` — Padding on cells
- `border-y-*` — Horizontal borders between rows
- `border-opacity-*` — Border opacity

**Cell spanning:**

Children in `Table.Row` can span multiple columns or rows:

```svelte
<Table cols-[40%_20%_20%_20%]>
  <Table.Row header>
    <Text content='Item' />
    <Text content='Qty' />
    <Text content='Price' />
    <Text content='Total' />
  </Table.Row>
  <Table.Row>
    <Spacer span-2 />  <!-- Empty space spanning 2 columns -->
    <Div span-2>
      <Text content='Subtotal: $44.00' />
    </Div>
  </Table.Row>
</Table>
```

**Span attributes:**
- `span-2` through `span-12` — Column span
- `span-[n]` — Arbitrary column span
- `row-span-2` through `row-span-12` — Row span
- `row-span-[n]` — Arbitrary row span

**Column width template:**

The `cols-[...]` attribute defines widths for all columns using underscore-separated values:

```svelte
<Table cols-[40%_20%_20%_20%]>...</Table>
<!-- Column 1: 40%, Column 2-4: 20% each -->

<Table cols-[200px_auto_100px]>...</Table>
<!-- Column 1: 200px, Column 2: auto, Column 3: 100px -->
```

Child cells without explicit width inherit from the parent's `cols-[...]` template by index.
When a cell uses `span-*`, its width is taken from the first column in its span.

**Style inheritance:** `Table.Row` styles are inherited by child elements:
- Typography: `font-bold`, `text-sm`, `italic`, `uppercase`, etc.
- Colors: `text-[#...]`, `bg-[#...]`
- Alignment: `align-*`, `justify-*`

Children can override inherited styles by specifying their own attributes (e.g., `<Text font-normal />`).

**Row Padding Handling:**

Since `<tr>` elements don't support CSS padding, padding specified on `Table.Row` is automatically extracted and applied to each cell (`<td>` or `<th>`):

```svelte
<Table.Row p-4>
  <Text content='Cell 1' />
  <Text content='Cell 2' />
</Table.Row>
```

Renders as:

```html
<tr>
  <td style="padding: 16px;">Cell 1</td>
  <td style="padding: 16px;">Cell 2</td>
</tr>
```

This applies to all padding variants (`p-*`, `px-*`, `py-*`, `pt-*`, etc.).

**Auto-Width Calculation:**

When `cols-[...]` is not specified, the renderer automatically calculates column widths:

1. Children with explicit `w-[...]` widths use their specified percentage
2. Remaining width is divided equally among children without explicit widths

```svelte
<Div cols>
  <Div w-[60%]>60% explicit</Div>
  <Div>20% auto</Div>  <!-- (100% - 60%) / 2 = 20% -->
  <Div>20% auto</Div>
</Div>
```

The algorithm:
```
1. Sum all explicit percentage widths
2. Count children without explicit widths
3. Divide remaining percentage: (100% - sumExplicit) / countWithoutWidth
4. Apply calculated width to children missing explicit widths
```

**`<Div>` column templates:**

The same column template syntax works on `<Div cols>`:

```svelte
<Div cols cols-[40%_30%_30%]>
  <Div>40% width</Div>
  <Div>30% width</Div>
  <Div>30% width</Div>
</Div>

<Div cols cols-[25%_25%_25%_25%]>
  <Div span-2>50% (spans 2 columns)</Div>
  <Div span-2>50% (spans 2 columns)</Div>
</Div>
```

For vertical layouts, use `rows-[...]`:

```svelte
<Div rows rows-[100px_auto_50px]>
  <Div>100px height</Div>
  <Div>Auto height</Div>
  <Div>50px height</Div>
</Div>
```

### Spacer Component Detail

The `<Spacer>` component creates empty space between elements. Its behavior adapts based on the **layout context** it's placed in:

**Context-Aware Behavior:**

| Parent Context | Primary Dimension | Secondary Dimension | Default Size |
|----------------|-------------------|---------------------|--------------|
| Standalone / `<Div rows>` | Height | Width = 100% | `2rem` (32px) |
| `<Div cols>` | Width | Height = 1px | `2rem` (32px) |
| `<Table.Row>` | Width | Height = 1px | 0 (empty cell) |

**Why context matters:**

In **vertical layouts** (default, `rows`), spacers create vertical gaps — the height is what matters, and width should fill the container.

In **horizontal layouts** (`cols`, `Table.Row`), spacers create horizontal gaps — the width is what matters, and height should be minimal (1px) to avoid affecting row height.

Inside `<Table.Row>`, a spacer without explicit dimensions acts as an **empty cell placeholder** with no height contribution, perfect for leaving cells blank in data tables.

**Examples:**

```svelte
<!-- Vertical spacing (default behavior) -->
<Div rows>
  <Text content='Section 1' />
  <Spacer h-6 />              <!-- 24px tall, full width -->
  <Text content='Section 2' />
</Div>

<!-- Horizontal spacing in columns -->
<Div cols>
  <Div>Column 1</Div>
  <Spacer w-4 />              <!-- 16px wide, 1px tall -->
  <Div>Column 2</Div>
</Div>

<!-- Empty cell placeholder in tables -->
<Table cols-[50%_25%_25%]>
  <Table.Row>
    <Spacer />                <!-- Empty cell, no height contribution -->
    <Text content='Right-aligned totals' span-2 align-right />
  </Table.Row>
</Table>

<!-- Explicit dimensions override context defaults -->
<Table.Row>
  <Spacer w-[100px] />        <!-- 100px wide cell -->
  <Text content='After spacer' />
</Table.Row>
```

**Spacer attributes:**
- `h-*` — Explicit height (e.g., `h-4`, `h-[20px]`)
- `w-*` — Explicit width (e.g., `w-4`, `w-[100px]`)
- `span-*` — Column span when inside `<Table.Row>`

**Implementation note:**

The spacer's layout context is tracked via the IR node structure. When a `SpacerNode` is rendered, the renderer checks its parent node type:

1. **Parent is `DivNode` with `direction: 'cols'`** → Horizontal spacer mode
2. **Parent is `TableRowNode`** → Table cell mode (horizontal, minimal height)
3. **Otherwise** → Vertical spacer mode (default)

This context-awareness ensures spacers behave intuitively without requiring explicit dimension attributes in most cases.

---

Presets provide sensible defaults that can be customized:

```ts
import { presets, merge } from 'svelte-emails'

const style = merge(presets.minimal, {
  Button: {
    background: '#your-brand-color'
  }
})
```

### Preset Structure

```ts
interface StylePreset {
  root: {
    color: string
    background: string
    size: number         // root font size in px (default: 16)
    lineHeight: string | number
    fontFamily: string
  }
  Text: {
    color: string
    H1: { size, weight, lineHeight, rule?: { color, thickness, spacing } }
    H2: { ... }
    // ... H3-H6, Paragraph, Small
  }
  Link: { color, textDecoration }
  Button: { color, background, padding, borderRadius, fontWeight }
  Spacer: { size }
  Divider: { color, thickness, style }
  Code: { color, background, padding, borderRadius, fontFamily, size }
  Codeblock: { ... }
  Highlight: { color, background }
  Unsubscribe: { color, size }
}
```

---

## SSR & Server Rendering

### Overview

`svelte-emails` is designed for server-side rendering (SSR). The `render()` function uses Svelte's `svelte/server` module to render email components and collect the IR tree.

```ts
import { render } from 'svelte-emails'
import MyEmail from './MyEmail.email.svelte'

// Server-side rendering in +page.server.ts
export async function load() {
	const result = await render(MyEmail, {
		vars: { name: 'Alice' }
	})
	return { html: result.html, text: result.text }
}
```

### How Server Rendering Works

The `render()` function performs these steps:

1. **Create a collector** — An object that captures the root `EmailNode` when components register
2. **Build context Map** — Create a `Map<symbol, unknown>` with the collector
3. **Call Svelte's server render** — Pass the context Map to `render()` from `svelte/server`
4. **Components register** — Each component reads context, creates IR nodes, and adds itself to parent
5. **Extract IR tree** — After render completes, the collector has the full IR tree
6. **Convert to HTML** — Pass IR tree to `renderTree()` for HTML/text output

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  render(MyEmail, { vars })                                                   │
│    │                                                                         │
│    ├─ 1. Create collector: { registerRoot(node) { root = node } }            │
│    │                                                                         │
│    ├─ 2. Create context Map with EMAIL_ROOT_CONTEXT_KEY                      │
│    │      context.set(Symbol.for('svelte-emails:root-collector'), collector) │
│    │                                                                         │
│    ├─ 3. await svelteRender(EmailComponent, { props, context })              │
│    │      │                                                                  │
│    │      ├─ <Email> calls getEmailRoot() → collector                        │
│    │      │          calls collector.registerRoot(emailNode)                 │
│    │      │          sets EMAIL_PARENT_CONTEXT_KEY to emailNode              │
│    │      │                                                                  │
│    │      └─ <Div>, <Text>, etc. each:                                       │
│    │           - getEmailParent() to get parent node                         │
│    │           - addChild(parent, node) to register with parent              │
│    │           - setEmailParent(node) for their children                     │
│    │                                                                         │
│    ├─ 4. root now contains complete IR tree                                  │
│    │                                                                         │
│    └─ 5. return renderTree(root, { vars }) → { html, text, headers }        │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Why Symbol.for() for Context Keys

**The Problem:**

Svelte's `createContext()` is the idiomatic way to create type-safe context, but it generates an internal Symbol key that isn't accessible outside components. For SSR, we need to inject context *from outside* the component tree:

```ts
// In render() function - OUTSIDE component tree
const context = new Map()
context.set(???, collector)  // What key to use?

// createContext() key isn't accessible here
// const [getCtx, setCtx] = createContext<Collector>()  // Key is internal
```

**The Solution:**

Use `Symbol.for()` which creates globally-unique but stable keys:

```ts
// context.ts
export const EMAIL_ROOT_CONTEXT_KEY = Symbol.for('svelte-emails:root-collector')

// In render() - can use the same symbol
const context = new Map([
	[EMAIL_ROOT_CONTEXT_KEY, collector]
])

// In components - same symbol resolves to same key
const collector = getContext<Collector>(EMAIL_ROOT_CONTEXT_KEY)
```

`Symbol.for('key')` returns the same Symbol instance for the same key string across module boundaries and server/client contexts. This ensures the context Map in `render()` uses the exact same key that components look up.

### Critical SSR Caveat: onDestroy Runs During SSR

**The Problem:**

In Svelte, `onDestroy` is the **only lifecycle hook that runs during SSR**. Other hooks like `onMount`, `beforeUpdate`, and `afterUpdate` do not run server-side.

This causes issues when components use `onDestroy` for cleanup:

```svelte
<!-- This pattern BREAKS in SSR -->
<script lang='ts'>
	import { onDestroy } from 'svelte'
	import { getEmailParent, addChild } from '../context'

	const parent = getEmailParent()
	const node = { type: 'div', attrs: [], children: [] }
	
	// addChild returns a cleanup function that removes the child
	const cleanup = addChild(parent, node)
	
	// ❌ PROBLEM: onDestroy runs during SSR, immediately removing the child!
	onDestroy(cleanup)
</script>
```

**Why this happens:**

1. During SSR, Svelte renders the component tree synchronously
2. After rendering, Svelte calls all `onDestroy` callbacks to clean up
3. The cleanup function removes children from their parents
4. Result: IR tree is empty when `render()` completes

**The Solution:**

The `addChild()` function detects SSR mode and returns a no-op cleanup:

```ts
// context.ts
const isSSR = typeof window === 'undefined'

export function addChild(parent: Mail.IRParentNode, child: Mail.IRNode): () => void {
	const children = parent.children as Mail.IRNode[]
	children.push(child)

	// In SSR, return no-op because onDestroy runs during SSR
	// and would remove children we just added
	if (isSSR) {
		return () => {}
	}

	// In browser, return real cleanup for dynamic content support
	return () => {
		const index = children.indexOf(child)
		if (index !== -1) children.splice(index, 1)
	}
}
```

**Component usage pattern:**

```svelte
<script lang='ts'>
	import { onDestroy } from 'svelte'
	import { getEmailParent, addChild, setEmailParent } from '../context'

	const parent = getEmailParent()
	const node: Mail.DivNode = { type: 'div', attrs: [], children: [] }
	
	// addChild handles SSR internally - safe to pass to onDestroy
	onDestroy(addChild(parent, node))
	
	// Set context for children
	setEmailParent(node)
</script>

{@render children?.()}
```

### SSR vs Browser Behavior Summary

| Aspect | Browser (Preview) | Server (render()) |
|--------|-------------------|-------------------|
| Context source | `setEmailRoot()` in `<Email.Render>` | `context` Map passed to `svelteRender()` |
| Context key | `Symbol.for('...')` | `Symbol.for('...')` (same) |
| `onMount` | ✅ Runs | ❌ Does not run |
| `onDestroy` | ✅ Runs on unmount | ⚠️ Runs after SSR render |
| `addChild` cleanup | Returns real cleanup | Returns no-op |
| IR tree lifetime | Lives across re-renders | Single render, then discarded |

### SSR Debugging Tips

**1. "No <Email> component found" error:**

This means `collector.registerRoot()` was never called. Check:
- The component tree includes `<Email>` at the root
- Context is being passed to `svelteRender()` correctly
- `EMAIL_ROOT_CONTEXT_KEY` is the same symbol in both places

**2. IR tree has no children:**

This usually means `onDestroy` cleanup is running during SSR. Check:
- `addChild()` is handling the SSR case correctly
- No other cleanup code is removing children

**3. Context not found:**

Components throw if context is missing:
```ts
export function getEmailParent(): Mail.IRParentNode {
	const parent = getContext<Mail.IRParentNode>(EMAIL_PARENT_CONTEXT_KEY)
	if (!parent) {
		throw new Error('getEmailParent() called outside of Email component tree')
	}
	return parent
}
```

Check that:
- Component is inside an `<Email>` wrapper
- Context is being set correctly by parent components

### Plain Objects for IR Nodes

IR nodes are plain JavaScript objects rather than `$state()` proxies:

```ts
// Plain object (no reactivity needed)
const node: Mail.DivNode = { type: 'div', attrs: [], children: [] }
```

This is a design choice, not a technical requirement. `$state()` works fine in SSR, but since IR nodes are constructed once and passed to `renderTree()`, there's no benefit to reactivity. Plain objects keep the code simple and explicit.

### Async Rendering

The `render()` function is async and must be awaited:

```ts
// ✅ CORRECT
const result = await render(MyEmail, { vars })

// ❌ WRONG - render returns a Promise
const result = render(MyEmail, { vars })  // result is Promise<RenderOutput>
```

This is because Svelte 5's `render()` from `svelte/server` returns a Promise.

---

## Testing & Development

### Dev Server

```bash
bunx svelte-emails
```

Starts a dev server on port `33411` (em-a-il mnemonic) that:
- Watches for `*.email.svelte` files
- Hot-reloads on changes
- Provides preview UI with:
  - Mobile/desktop viewport toggle
  - Variable editor
  - Style customization
  - HTML source view
  - Plain text view

### File Convention

Email templates should be named `*.email.svelte` to:
- Be auto-discovered by the dev server
- Signal intent to other developers
- Enable tooling/linting specific to email templates

---

## Known Limitations & Workarounds

| Limitation | Cause | Workaround |
|------------|-------|------------|
| No rounded corners in Outlook | Word rendering engine | Accept square corners or use VML |
| No shadows | Limited CSS support | Design without shadows |
| No CSS Grid/Flex | Outlook ignores | Use `<Div cols>` or `<Div rows>` (tables) |
| No CSS margins | Outlook.com dropped support | ✅ Emulated via wrapper padding |
| Media queries stripped | ~25% of clients | Fluid single-column fallback |
| Images blocked by default | Security settings | Always include alt text |
| Web fonts not loading | `@font-face` stripped | Use web-safe font stacks |
| Background images in Outlook | Word engine | Use VML or solid color fallback |

---

## Future Considerations

1. **VML generation** — Outlook-specific rounded corners and background images
2. **Dark mode** — `@media (prefers-color-scheme: dark)` with automatic color inversion
3. **AMP for Email** — interactive elements (carousels, forms, live content)
4. **Accessibility** — semantic HTML, ARIA landmarks, screen reader testing
5. **i18n** — RTL layout support (`dir="rtl"`), locale-specific date/number formatting
6. **Performance** — IR tree caching, incremental rendering for large emails