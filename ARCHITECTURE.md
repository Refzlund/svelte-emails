# svelte-emails Architecture

Build email templates using Svelte components with Tailwind-like styling attributes. This document covers the complete architecture, API reference, and email client compatibility guide.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [Components](#components)
4. [Styling System](#styling-system)
5. [Content Parsing](#content-parsing)
6. [Rendering Pipeline](#rendering-pipeline)
7. [Email Client Compatibility](#email-client-compatibility)
8. [Style Presets](#style-presets)
9. [SSR & Server Rendering](#ssr--server-rendering)
10. [Development](#development)

---

## Quick Start

```svelte
<script lang='ts'>
  import { Email, Div, Text, Table, Spacer, Button } from 'svelte-emails'
</script>

<Email preview='Email preview text'>
  <Text.Paragraph content='Hi [[first_name]], check out our updates!' />
  
  <Div cols gap-4 responsive>
    <Div w-[50%]>
      <Text.H5 content='Order ID' />
      <Text content='1234' />
    </Div>
    <Div w-[50%]>
      <Text.H5 content='Date' />
      <Text content='Jul 24, 2025' />
    </Div>
  </Div>

  <Table cols-[50%_25%_25%] border striped>
    <Table.Row header bg-[#f3f4f6] font-bold>
      <Text content='Item' />
      <Text content='Qty' />
      <Text content='Price' />
    </Table.Row>
    <Table.Row>
      <Text content='Pro Plan' />
      <Text content='1' />
      <Text content='$29.00' />
    </Table.Row>
  </Table>

  <Spacer />
  <Button href='https://example.com' content='Get Started' />
</Email>
```

### Server-Side Rendering

```ts
import { render, merge, presets } from 'svelte-emails'
import MyEmail from './MyEmail.email.svelte'

const result = await render(MyEmail, {
  placeholders: { first_name: 'John' },
  style: merge(presets.serif, { Button: { background: '#2563eb' } }),
  props: { /* component props */ }
})

if (result.ok) {
  result.value.html   // HTML output
  result.value.text   // Plain text (markdown-formatted)
  result.value.headers // Email headers (e.g., List-Unsubscribe)
}
```

### Preview Component

```svelte
<script lang='ts'>
  import { Email, merge, presets } from 'svelte-emails'
  import MyEmail from './MyEmail.email.svelte'
</script>

<Email.Preview
  placeholders={{ first_name: 'John' }}
  style={merge(presets.base, { Button: { background: '#2563eb' } })}
>
  <MyEmail />
</Email.Preview>
```

---

## Architecture Overview

### Virtual Layout Tree (IR)

Components don't render HTML directly — they build an intermediate representation (IR) that gets transformed into email-safe HTML. This decouples authoring from output, enabling optimization and ensuring both Preview and `render()` use the same tree.

```svelte
<Email>
  <Div cols>
    <Text content='Hello' />
  </Div>
</Email>
```

Produces this IR:

```ts
{
  type: 'email',
  preview: '...',
  bodyBackground: '#f8fafc',
  maxWidth: 600,
  attrs: [],
  children: [{
    type: 'div',
    direction: 'cols',
    attrs: [],
    children: [{
      type: 'text',
      content: 'Hello',
      variant: 'default',
      attrs: []
    }]
  }]
}
```

**Key insight:** Raw attribute strings are stored in the IR (e.g., `['p-4', 'bg-[#fff]']`). Conversion to CSS happens entirely at render time, allowing the renderer to handle inheritance, opacity blending, and margin emulation in one pass.

### Source Files

| File | Purpose |
|------|---------|
| `context.ts` | IR node types (`Mail` namespace), Svelte context |
| `renderer.ts` | IR tree → HTML/text conversion |
| `styles.ts` | `StyleConfig` types, presets, `merge()` |
| `style-attributes.ts` | TypeScript types for utility attributes |
| `rendering/parse-attrs.ts` | Attribute parsing, rem→px conversion |
| `rendering/colors.ts` | Color blending for opacity emulation |
| `rendering/html-helpers.ts` | Inline CSS generation, margin wrapping |
| `rendering/content.ts` | Markdown parsing, placeholder interpolation |
| `rendering/CONSTANTS.ts` | Spacing/font scales |

### Core Types

```ts
/** Inherited styles passed down during tree traversal */
interface InheritedStyles {
  backgroundColor: string  // For opacity blending (default: #ffffff)
  color?: string           // Text color
  borderColor?: string     // Border color (defaults to text color)
  fontFamily?: string      // Font stack
  fontSize?: string        // e.g., '16px'
  lineHeight?: string      // e.g., '1.5'
  textAlign?: string       // left, center, right, justify
  opacity: number          // Opacity multiplier (compounds with color opacities)
  // ... plus all CSS-inheritable properties
}

/** Result of parsing Tailwind-like attributes */
interface ParsedAttrs {
  css: Record<string, string>  // CSS properties (e.g., { padding: '16px' })
  margin?: { top?, right?, bottom?, left? }  // Extracted for wrapper emulation
  backgroundColor?: string     // Extracted for inheritance tracking
  opacity?: number             // Element opacity (compounds with colors)
  textOpacity?: number         // From text-opacity-*
  bgOpacity?: number           // From bg-opacity-*
  borderOpacity?: number       // From border-opacity-*
  responsive?: 'mobile-only' | 'desktop-only'
}

/** Context maintained during rendering traversal */
interface RenderContext {
  placeholders: Record<string, string>  // [[variable]] values
  footnotes: Array<{ label, url }>      // Links for plain text output
  headers: Record<string, string>       // Email headers (List-Unsubscribe, etc.)
  style: StyleConfig                    // Component theming config
}

/** Options passed to render() */
interface RenderOptions {
  placeholders?: Record<string, string>  // Variable interpolation
  style?: StyleConfig                    // Theming (merged with base preset)
}
```

### Programming Patterns

#### 1. Text Variant Lookup Map

Instead of switch statements, text rendering uses a lookup map:

```ts
interface TextVariantInfo {
  tag: string              // HTML tag (h1, p, span, etc.)
  configKey: string | null // StyleConfig.Text.H1, .Paragraph, etc.
  markdownPrefix: string   // Plain text prefix (# for h1, etc.)
  browserResets: Record<string, string>  // Reset browser defaults
}

const TEXT_VARIANTS: Record<TextVariant, TextVariantInfo> = {
  h1: { tag: 'h1', configKey: 'H1', markdownPrefix: '# ', browserResets: {...} },
  paragraph: { tag: 'p', configKey: 'Paragraph', markdownPrefix: '', browserResets: {...} },
  // ...
}
```

#### 2. Parser Chain Pattern

Attribute parsing tries parsers in frequency order, returning early on match:

```ts
function parseAttr(attr, result, inherited, rootSize) {
  if (parsePadding(attr, result, rootSize)) return
  if (parseMargin(attr, result, rootSize)) return
  if (parseWidth(attr, result, rootSize)) return
  if (parseColor(attr, result, inherited)) return
  // ... each parser returns boolean (true = handled)
}
```

#### 3. Type-Based Dispatch

Node rendering uses exhaustive switch for type safety:

```ts
function renderNodeToHtml(node: IRNode, inherited, context, rootSize): string {
  switch (node.type) {
    case 'email': return renderEmailNode(node, inherited, context, rootSize)
    case 'div':   return renderDivNode(node, inherited, context, rootSize)
    case 'text':  return renderTextNode(node, inherited, context, rootSize)
    // ... exhaustive handling
    default: const _exhaustive: never = node  // TypeScript catches missing cases
  }
}
```

#### 4. Standard Renderer Flow

Most node renderers follow this pattern:

```ts
function renderXxxNode(node, inherited, context, rootSize): string {
  // 1. Parse Tailwind attrs → CSS
  const parsed = parseAttrs(node.attrs, inherited, rootSize)
  
  // 2. Extract inheritable styles for children
  const childInherited = extractInheritable(parsed, inherited)
  
  // 3. Render children recursively
  const childrenHtml = renderChildren(node.children, childInherited, context, rootSize)
  
  // 4. Generate inline CSS string
  const inlineStyle = toInlineCSS(parsed.css, inherited)
  
  // 5. Build HTML
  let html = `<tag style="${inlineStyle}">${childrenHtml}</tag>`
  
  // 6. Wrap with margin emulation table if needed
  if (parsed.margin) html = wrapWithMargin(html, parsed.margin)
  
  // 7. Wrap with responsive class if needed
  if (parsed.responsive) html = wrapWithResponsive(html, parsed.responsive)
  
  return html
}
```

#### 5. Cell Attribute Extraction

For grid/table layouts, cell-specific attributes are extracted in a single pass:

```ts
interface CellAttrs {
  valign?: string      // vertical-align
  align?: string       // text-align
  width?: string       // Cell width
  height?: string      // Cell height
  backgroundColor?: string
  padding?: string     // Extracted padding values
  // ... other cell-relevant properties
}

const cellAttrs = extractCellAttrs(parsed)  // Single extraction point
```

### Component Registration Flow

Components register via Svelte context using stable `Symbol.for()` keys (required for SSR):

```
<Email.Preview> or render()
  ├─ setEmailRoot(collector)
  └─ <Email>
       ├─ getEmailRoot() → registers self
       ├─ setEmailParent(self)
       └─ <Div cols>
            ├─ getEmailParent() → registers with parent
            ├─ setEmailParent(self)
            └─ <Text content='...'>
                 └─ getEmailParent() → registers with parent
```

---

## Components

### Email (Root)

```svelte
<Email
  preview='Your account is ready'
  body-bg-[#f0f4f8]
  bg-[#ffffff]
  max-w-[700px]
  mobile-threshold-[425px]
  style={{ Codeblock: { border: { radius: '8px' } } }}
>
  ...
</Email>
```

| Attribute | Purpose | Default |
|-----------|---------|---------|
| `preview` | Preheader text (shown in inbox list) | `''` |
| `category` | Folder grouping in CLI navigation (CLI-only) | `''` |
| `order` | Sort order in CLI navigation (CLI-only) | `undefined` |
| `body-bg-[#hex]` | Outer body background (full width) | `#ffffff` |
| `bg-[#hex]` | Content container background | `#ffffff` |
| `max-w-[Npx]` | Content container max-width | `600px` |
| `mobile-threshold-[Npx]` | Breakpoint for responsive styles | `480px` |
| `style` | StyleConfig overrides for this email | `{}` |

The `body-bg-*` is the root color for opacity blending throughout the email.

The `order` attribute controls positioning in the CLI navigation sidebar. Emails with `order` are sorted ascending by their value and appear before emails without `order`. Emails without `order` are sorted alphabetically. Folders remain alphabetically sorted.

The `mobile-threshold` controls when `responsive` columns stack, and when `mobile-only`/`desktop-only` toggle visibility. Use lower values for tighter responsiveness (stacks later), higher for looser (stacks earlier).

The `style` prop allows setting component-level defaults for this email. Styles are merged in order: `presets.base` → `Email.style` → `render().style`, so email-level styles override presets but can be further overridden at render time.

### Div (Container / Grid)

Generic container supporting grid layouts via `cols` or `rows`:

```svelte
<!-- Simple container -->
<Div p-4 bg-[#f0f0f0]><Text content='Content' /></Div>

<!-- Horizontal columns -->
<Div cols>
  <Div w-[50%]><Text content='Left' /></Div>
  <Div w-[50%]><Text content='Right' /></Div>
</Div>

<!-- Responsive columns (stack on mobile) -->
<Div cols responsive>
  <Div><Text content='Column 1' /></Div>
  <Div><Text content='Column 2' /></Div>
</Div>

<!-- Column template (define widths once) -->
<Div cols cols-[40%_30%_30%]>
  <Div><Text content='40%' /></Div>
  <Div><Text content='30%' /></Div>
  <Div><Text content='30%' /></Div>
</Div>

<!-- Value syntax with spaces (equivalent to above) -->
<Div cols cols="40% 30% 30%">
  <Div><Text content='40%' /></Div>
  <Div><Text content='30%' /></Div>
  <Div><Text content='30%' /></Div>
</Div>

<!-- Gap between children -->
<Div cols gap-4>...</Div>

<!-- Span multiple columns -->
<Div cols cols-[25%_25%_25%_25%]>
  <Div span-2><Text content='Spans 2 cols' /></Div>
  <Div span-2><Text content='Spans 2 cols' /></Div>
</Div>

<!-- Vertical rows -->
<Div rows gap-4>
  <Div><Text content='Row 1' /></Div>
  <Div><Text content='Row 2' /></Div>
</Div>
```

| Attribute | Purpose |
|-----------|---------|
| `cols` | Horizontal layout (single `<tr>` with multiple `<td>`) |
| `rows` | Vertical layout (multiple `<tr>`) |
| `responsive` | Stack columns on mobile (only with `cols`) |
| `cols-[40%_30%_30%]` or `cols="40% 30% 30%"` | Column widths (underscore-separated in bracket syntax, space-separated in value syntax) |
| `rows-[100px_auto]` or `rows="100px auto"` | Row heights (underscore-separated in bracket syntax, space-separated in value syntax) |
| `gap-4` / `gap-[20px]` | Space between children |
| `span-2` through `span-12` | Column span |
| `row-span-2` through `row-span-12` | Row span |

#### Equal-Height Columns with `h-full`

Use `h-full` on child Divs to make all columns in a row the same height:

```svelte
<Div cols responsive gap-4>
  <Div h-full bg-[#f5f5f5] p-4 rounded>
    <Text content='Short content' />
  </Div>
  <Div h-full bg-[#f5f5f5] p-4 rounded>
    <Text content='Much longer content that makes this column taller...' />
    <Text content='More text here...' />
  </Div>
</Div>
```

**How it works (implementation insight):**

HTML table cells (`<td>`) in the same `<tr>` naturally have equal heights. However, this doesn't cascade to nested elements—a nested table inside a `<td>` won't expand with `height: 100%` in most email clients.

The solution is **unwrapping**: when a child Div has `h-full`, the renderer applies its visual styles (background, border, padding) directly to the parent grid's `<td>` cell, and renders the child's content directly inside that cell. This allows the visual container to naturally match the row height.

```
Before (nested tables, height doesn't cascade):
┌─ <td> ─────────────────┐
│  ┌─ <table> ──────┐    │  ← Nested table doesn't expand
│  │  Content       │    │
│  └────────────────┘    │
│        [gap]           │  ← Empty space at bottom
└────────────────────────┘

After (unwrapped, styles on <td>):
┌─ <td bg, padding> ─────┐
│  Content               │  ← Direct content, <td> fills row height
│                        │
│                        │
└────────────────────────┘
```

**When unwrapping occurs:**
- The child Div has `h-full` or `h-screen` (100% height)
- The parent is a `cols` or `rows` grid layout

**What gets applied to the `<td>`:**
- Visual styles: `background`, `border`, `padding`, `border-radius`
- Layout styles: `valign` (from child's vertical alignment)
- The child's children are rendered directly into the cell

#### Responsive Gap Handling

When `responsive` is set, columns stack vertically on mobile. The gap behavior adapts:

**Desktop:** Gap cells (`<td class="gap-spacer">`) create horizontal spacing between columns.

**Mobile:** Gap cells are hidden via CSS, and `margin-top` creates vertical spacing between stacked rows.

```css
/* Desktop: gap cells create horizontal spacing */
<td class="content-cell">...</td>
<td class="gap-spacer" width="16px">&nbsp;</td>
<td class="content-cell has-gap">...</td>

/* Mobile media query: */
.responsive-grid td.gap-spacer { display: none !important; }
.responsive-grid td.content-cell.has-gap { margin-top: var(--gap) !important; }
.responsive-grid td.content-cell { display: block !important; width: auto !important; }
```

**CSS classes used:**
| Class | Purpose |
|-------|---------|
| `content-cell` | Marks actual content cells (not gap spacers) |
| `gap-spacer` | Marks gap cells, hidden on mobile |
| `has-gap` | Applied to content cells after the first, receives vertical margin on mobile |

**Why `width: auto` instead of `width: 100%`:**
Using `width: 100%` on stacked cells causes them to stretch beyond parent padding. `width: auto` respects the parent container's padding.

### Table (Data Tables)

For tabular data with proper semantics:

```svelte
<Table cols-[40%_20%_20%_20%] border striped>
  <Table.Row header bg-[#f3f4f6] font-bold>
    <Text content='Item' />
    <Text content='Qty' />
    <Text content='Price' />
    <Text content='Total' />
  </Table.Row>
  <Table.Row>
    <Text content='Pro Plan' />
    <Text content='1' />
    <Text content='$29' />
    <Text content='$29' />
  </Table.Row>
</Table>
```

**Table attributes:**
| Attribute | Purpose |
|-----------|---------|
| `border` | Full borders (outer + cells) |
| `border-outer` | Outer border only |
| `cell-border` | Cell borders only |
| `striped` | Alternating row backgrounds |
| `compact` | Reduced cell padding |
| `cols-[...]` or `cols="..."` | Column widths (e.g., `cols-[40%_20%_20%_20%]` or `cols="40% 20% 20% 20%"`) |
| `cell-padding-4` | Override cell padding |

**Table.Row attributes:**
| Attribute | Purpose |
|-----------|---------|
| `header` | Render cells as `<th>` |
| Row styles (`font-bold`, `bg-[#...]`) | Inherited by children |

### Text Components

```svelte
<Text content='Plain text' />
<Text.Paragraph content='Paragraph with line handling' />
<Text.H1 content='Heading 1' />  <!-- H1 through H6 -->
<Text.Small content='Small text' />
<Text.Code content='inline code' />
<Text.Codeblock content={`
function example() {
  return 'multiline code block';
}
`} />
```

All text components support the `content` prop with markdown syntax (see [Content Parsing](#content-parsing)), except `Text.Code` and `Text.Codeblock` which HTML-escape their content for displaying code.

### Other Components

| Component | Purpose | Example |
|-----------|---------|---------|
| `<Button>` | CTA button | `<Button href='...' content='Click' />` |
| `<Link>` | Inline link | `<Link href='...' content='Link text' />` |
| `<Img>` | Images | `<Img src='...' width={600} height={400} alt='...' />` |
| `<Spacer>` | Vertical/horizontal space | `<Spacer h-6 />` |
| `<Divider>` | Horizontal rule | `<Divider />` |
| `<Br>` | Line break | `<Br />` |
| `<Unsubscribe>` | Footer unsubscribe | `<Unsubscribe href='...' content='Unsubscribe' />` |

**Spacer context-aware behavior:**
| Parent Context | Primary Dimension | Default Size |
|----------------|-------------------|--------------|
| Standalone / `<Div rows>` | Height | `2rem` (32px) |
| `<Div cols>` | Width | `2rem` (32px) |
| `<Table.Row>` | Width (empty cell) | 0 |

---

## Styling System

### Tailwind-like Attributes

```svelte
<Div p-4 bg-[#f3f4f6] align-middle max-w-[600px]>
```

Parsed at render time to:
```ts
{
  padding: '16px',
  backgroundColor: '#f3f4f6',
  textAlign: 'center',
  verticalAlign: 'middle',
  maxWidth: '600px'
}
```

### Two Syntax Options

All bracket-style attributes support two equivalent syntaxes:

| Syntax | Example | Use Case |
|--------|---------|----------|
| **Boolean (Tailwind-like)** | `bg-[#f3f4f6]` | Static values |
| **Value (for variables)** | `bg="#f3f4f6"` or `bg={color}` | Dynamic values from Svelte |

```svelte
<!-- Boolean syntax -->
<Div bg-[#f3f4f6] p-[1rem] w-[500px] />

<!-- Value syntax (identical result) -->
<Div bg="#f3f4f6" p="1rem" w="500px" />

<!-- Value syntax with Svelte variables -->
<script>
  let brandColor = '#ff6600'
  let spacing = '2rem'
  let columnWidth = '50%'
</script>
<Div bg={brandColor} p={spacing} w={columnWidth}>
  Dynamic styling!
</Div>
```

**Supported value attributes:**
- **Sizing:** `w`, `h`, `min-w`, `max-w`, `min-h`
- **Spacing:** `p`, `pt`, `pr`, `pb`, `pl`, `px`, `py`, `m`, `mt`, `mr`, `mb`, `ml`, `mx`, `my`
- **Colors:** `text`, `bg`, `text-opacity`, `bg-opacity`, `border-opacity`
- **Typography:** `leading`, `tracking`
- **Borders:** `border`, `border-t`, `border-r`, `border-b`, `border-l`, `border-x`, `border-y`, `rounded`, `rounded-*`
- **Layout:** `cols`, `rows`, `gap`, `span`, `row-span`, `cell-padding`
- **Effects:** `opacity`
- **Email:** `body-bg`

**Note for `cols` and `rows`:** The value syntax uses **spaces** instead of underscores to separate widths/heights:

```svelte
<!-- Bracket syntax uses underscores -->
<Div cols cols-[40%_30%_30%]>...</Div>
<Table cols-[40%_20%_20%_20%]>...</Table>

<!-- Value syntax uses spaces -->
<Div cols cols="40% 30% 30%">...</Div>
<Table cols="40% 20% 20% 20%">...</Table>
```

**Implementation:** The `normalizeAttrs()` helper in `context.ts` converts value attributes to bracket syntax before parsing (converting spaces to underscores for `cols`/`rows`). Both syntaxes are normalized to the same internal representation.

### Attribute Reference

#### Spacing

```svelte
<Div p-4 px-8 py-2 />           <!-- padding -->
<Div m-4 mx-auto mt-2 />        <!-- margin (emulated via wrapper) -->
<Div p="1rem" m="16px" />       <!-- value syntax -->
```

Scale: `0`, `0.5`, `1`, `1.5`, `2`, `2.5`, `3`, `3.5`, `4`, `5`, `6`, `7`, `8`, `9`, `10`, `11`, `12`, `14`, `16`, `20`, `24`, `28`, `32`, `36`, `40`, `44`, `48`, `52`, `56`, `60`, `64`, `72`, `80`, `96`

| Scale | rem | px (default root.size=16) |
|-------|-----|---------------------------|
| `4` | 1rem | 16px |
| `8` | 2rem | 32px |
| `12` | 3rem | 48px |

All spacing utilities (`p-*`, `m-*`, `gap-*`, `cell-padding-*`) use rem values internally and are converted to px at render time using `StyleConfig.root.size`. Customize `root.size` to scale all spacing proportionally.

#### Sizing

```svelte
<Div w-full h-auto />
<Div w-[500px] h-[200px] />
<Div w="500px" h="200px" />     <!-- value syntax -->
<Div w-screen h-screen />       <!-- Alias for 100% -->
<Div max-w-xl min-h-[100px] />
```

Max-width presets: `sm` (384px), `md` (448px), `lg` (512px), `xl` (576px), `2xl` (672px)

#### Colors

```svelte
<Div bg-[#f3f4f6] text-[#333333] />
<Div bg="#f3f4f6" text="#333333" />  <!-- value syntax -->
<Div bg-[#000000]/50 />         <!-- 50% opacity (blended) -->
<Div bg-opacity-50 bg-[#000000] />  <!-- Same result -->
<Div text-inherit />            <!-- Use inherited color -->
```

#### Typography

```svelte
<Text font-bold text-lg italic />
<Text uppercase tracking-wide leading-relaxed />
```

| Attribute | Values |
|-----------|--------|
| `text-*` | `xs`, `sm`, `base`, `lg`, `xl`, `2xl`-`9xl`, `[18px]` |
| `font-*` | `thin`, `light`, `normal`, `medium`, `semibold`, `bold`, `extrabold`, `black` |
| `leading-*` | `none`, `tight`, `snug`, `normal`, `relaxed`, `loose`, `[1.8]` |
| `tracking-*` | `tighter`, `tight`, `normal`, `wide`, `wider`, `widest` |

#### Alignment

```svelte
<Div align-center />           <!-- center both axes -->
<Div align-top-left />
<Text justify-center />        <!-- text alignment -->
```

| `align-*` | Horizontal | Vertical |
|-----------|------------|----------|
| `top-left` | left | top |
| `top` | center | top |
| `top-right` | right | top |
| `left` | left | middle |
| `middle` / `center` | center | middle |
| `right` | right | middle |
| `bottom-left` | left | bottom |
| `bottom` | center | bottom |
| `bottom-right` | right | bottom |

#### Borders

```svelte
<Div border border-[#e5e7eb] />
<Div border-2 border-dashed rounded-lg />
<Div border="2px" rounded="8px" />  <!-- value syntax -->
<Div border-opacity-50 />       <!-- Border color opacity -->

<!-- Directional borders (colors control which sides get the border) -->
<Div border-l={color} border-4 />       <!-- Left border only -->
<Div border-x={color} border-2 />       <!-- Left + right borders -->
<Div border-t={color} border-b="#ccc" border-1 />  <!-- Top + bottom -->
```

**Directional border behavior:** When using directional color attributes (`border-l`, `border-t`, etc.), the `border-N` width is applied **only to sides with colors set**. This allows creating partial borders without extra CSS.

Rounded: `none`, `sm`, `(default)`, `md`, `lg`, `xl`, `2xl`, `3xl`, `full`, `[10px]`

⚠️ `rounded-*` ignored by Outlook Windows (~80% support)

#### Display & Responsive

```svelte
<Div hidden />                  <!-- display: none -->
<Div mobile-only><Text content='Mobile content' /></Div>
<Div desktop-only><Text content='Desktop content' /></Div>
```

### Style Inheritance

Typography, colors, and border color are inherited by children:

```svelte
<Div font-bold text-[#333333]>
  <Text content='Bold dark text' />           <!-- Inherits -->
  <Text content='Override' font-normal />     <!-- Overrides -->
</Div>
```

Border color inherits from text color if not explicitly set.

### Emulation Strategies

#### Margin Emulation

CSS margins are unreliable (Outlook.com dropped support), so margins are **emulated via wrapper table padding**:

```svelte
<Div m-4 p-2 bg-[#fff]><Text content='Content' /></Div>
```

Renders as:
```html
<table><tr>
  <td style="padding: 16px;">  <!-- m-4 becomes wrapper padding -->
    <table><tr>
      <td style="padding: 8px; background-color: #fff;">Content</td>
    </tr></table>
  </td>
</tr></table>
```

#### Opacity Emulation

CSS `opacity` and `rgba()` have poor email support. Colors are **blended at render time** against the inherited background:

```svelte
<Div bg-[#ffffff]>
  <Text text-[#000000]/50>Renders as #808080</Text>
  <Div bg-[#ff0000]/25><Text content='Renders as #ffbfbf' /></Div>
</Div>
```

The `opacity-*` attribute acts as a multiplier on all color opacities within that element:

```svelte
<Div opacity-50>
  <Text text-[#000000]/50>25% black (50% × 50%)</Text>
</Div>
```

### Utilities Summary

All bracket attributes (`*-[value]`) also support value syntax (`*="value"` or `*={variable}`).

| Category | ✅ Safe | ⚠️ Caution | ❌ Avoid |
|----------|---------|------------|----------|
| **Width** | `w-[px/%]`, `w="..."`, `w-full` | `max-w-*`, `min-w-*` | `w-[fr]`, `w-[vw]` |
| **Height** | `h-[px]`, `h="..."`, `h-auto` | `min-h-*` | `max-h-*`, `h-[vh]` |
| **Spacing** | `p-*`, `p="..."`, `m-*` (emulated) | — | — |
| **Typography** | All `text-*`, `font-*` | — | — |
| **Colors** | `text-[#]`, `bg-[#]`, `bg="..."` | — | — |
| **Borders** | `border-*`, `border="..."` | `rounded-*` (Outlook) | `shadow-*` |
| **Layout** | `align-*`, `justify-*` | — | `flex`, `grid` |
| **Effects** | `opacity-*`, `opacity="..."` | — | `transform`, `filter`, `transition` |
| **Responsive** | `mobile-only`, `desktop-only` | — | `sm:`, `md:`, `lg:` |

---

## Content Parsing

### Extended Markdown Syntax

All `content='...'` props support inline formatting:

| Syntax | Result | HTML |
|--------|--------|------|
| `**bold**` | **bold** | `<strong>` |
| `*italic*` | *italic* | `<em>` |
| `~~strike~~` | ~~strike~~ | `<s>` |
| `__underline__` | underline | `<u>` |
| `[text](url)` | link | `<a href>` |
| `^super^` | superscript | `<sup>` |
| `_sub_` | subscript | `<sub>` |
| `` `code` `` | `code` | `<code>` |
| ` ``` ` | codeblock | `<pre><code>` |
| `(#hex)text(/)` | colored | `<span style="color:...">` |
| `[#hex]text[/]` | highlighted | `<span style="background:...">` |
| `--small--` | small | `<small>` |
| `\n` | line break | `<br>` |
| `\\` | escape | literal character |

### Lists

Lists are rendered as tables for maximum email client compatibility. A list requires at least 2 consecutive items.

**Unordered lists** use `-` or `*`:
```svelte
<Text content='
- First item
- Second item
- Third item
' />
```

**Ordered lists** use `1.`, `a.`, `A.`, `i.`, or `I.`:
```svelte
<Text content='
1. Numbered
2. Items
' />
```

**Nested lists** use indentation (2 spaces or tab):
```svelte
<Text content='
- Parent item
  - Child item
    - Grandchild
- Another parent
' />
```

Bullet styles progress by depth: ● → ○ → ■

Ordered lists progress by depth: 1, 2, 3 → a, b, c → i, ii, iii

**Checkboxes** use `- [ ]` (unchecked) or `- [x]` (checked):
```svelte
<Text content='
- [ ] Todo item
- [x] Completed item
- Tasks
  - [ ] Subtask pending
  - [x] Subtask done
' />
```

Checkboxes render as styled inline boxes (green checkmark for checked).

### Tables (in content)

```svelte
<Text content={`
| Name | Status |
|------|--------|
| API | 🟢 Good |
| DB | 🟢 Good |
`} />
```

Column alignment via separator: `|:---|` left, `|:---:|` center, `|---:|` right

### Variable Interpolation

Use `[[variable_name]]` syntax:

```svelte
<Text content='Hello [[first_name]]!' />
<Button href='https://example.com/u/[[user_id]]' content='Profile' />
```

Provide values via `placeholders` option:

```ts
render(MyEmail, {
  placeholders: { first_name: 'Alice', user_id: '123' }
})
```

Variables are HTML-escaped automatically. Missing variables remain as `[[var]]` in output.

**Escaping:** To output literal `[[` or `]]` characters, escape with backslash:

```svelte
<Text content='Use \[[variable]] syntax for placeholders' />
<!-- Renders: Use [[variable]] syntax for placeholders -->
```

### Syntax Highlighting (Code Blocks)

Code blocks (`Text.Codeblock`) and inline code (`Text.Code`) support optional syntax highlighting via [Shiki](https://shiki.style/).

**Installation (optional):**
```bash
npm install shiki
# or
bun add shiki
```

**Usage:**
```svelte
<!-- Highlighted code block -->
<Text.Codeblock
  highlight="typescript"
  content={`const greeting: string = "Hello, World!"`}
/>

<!-- Highlighted inline code -->
<Text.Code highlight="bash" content="npm install svelte-emails" />

<!-- With custom theme (defaults to github-light) -->
<Text.Codeblock
  highlight="javascript"
  theme="nord"
  content={`function greet(name) { return "Hi " + name }`}
/>

<!-- Theme can also be set in StyleConfig for all codeblocks -->
<Email
  style={{
    Codeblock: {
      theme: 'github-dark',
      background: '#1f2937',
      color: '#f9fafb'
    }
  }}
>
  <!-- All Codeblocks will use github-dark unless overridden -->
  <Text.Codeblock highlight="typescript" content={code} />
</Email>
```

**Features:**
- **Lazy loading:** Shiki is loaded on-demand when `highlight` is used
- **Optional dependency:** Works without Shiki (falls back to plain code)
- **Email-safe output:** Produces inline CSS styles, no external dependencies
- **Multiple themes:** Any [Shiki theme](https://shiki.style/themes) is supported

**How it works:**
1. Components set `highlight` and `theme` props on the IR node
2. `renderTree()` pre-processes the tree to find highlighted code nodes
3. Shiki's `codeToHtml()` highlights code in parallel (async)
4. Results are cached and used during synchronous HTML rendering
5. For inline code, wrapper elements are stripped to preserve inline flow

**Fallback behavior:**
- If Shiki is not installed, code is HTML-escaped (no highlighting)
- If a language is not recognized, Shiki falls back gracefully
- Console warning is shown when highlight is used without Shiki installed

**Email client compatibility:**
Shiki outputs HTML with inline `style` attributes on `<span>` elements, which has excellent email client support (~98%). The output contains only:
- `<span>` elements with inline `color` styles
- Standard `<pre>` and `<code>` wrappers (for codeblock)

---

## Rendering Pipeline

### HTML Output

The renderer produces a complete HTML document with:
- XHTML DOCTYPE for maximum compatibility
- VML namespaces for Outlook
- Meta tags (charset, viewport, Apple Mail fixes)
- Reset styles and responsive media queries
- Preview text (hidden div for inbox preview)
- Nested wrapper tables for centering

### Plain Text Output

A markdown-formatted plain text version is generated for:
- Email clients preferring plain text
- Accessibility (screen readers)
- Non-HTML preview contexts

**Conversion rules:**
| Element | Text Output |
|---------|-------------|
| Links | `[text](url)[^1]` with footnotes |
| Images | `![alt](url)` |
| Bold/Italic | `**text**`, `*text*` |
| Tables | Pretty markdown tables |
| Headings | `# H1`, `## H2`, etc. |

Grid layouts read **column by column**, then row by row for logical flow.

### Performance

- **Single-pass traversal** — All operations happen in one tree walk
- **Lazy regex compilation** — Patterns compiled once at import
- **Early exit** — Skip markdown parsing if no markdown chars present
- **Output < 100KB** — Gmail clips larger emails

### Implementation Patterns for Email Constraints

This section documents reusable patterns for working around HTML email limitations.

#### Pattern: Style Promotion (Unwrapping)

**Problem:** CSS properties don't cascade through nested tables in email clients.

**Solution:** Move visual styles from nested elements to their parent table cells.

**When to use:**
- A feature requires the container to match its parent's dimensions (like equal-height columns)
- The nested element's visual appearance (bg, border, padding) needs to fill the available space

**Implementation steps:**
1. In `parse-attrs.ts`: Add the triggering attribute to `CellAttrs` interface and extraction logic
2. In `renderer.ts`: Detect the attribute and apply visual styles to the parent `<td>` instead of creating a nested element
3. Render the element's children directly into the parent cell

**Example:** The `h-full` handling in `renderDivAsGrid()` promotes background/border/padding to the grid's `<td>` cells so they naturally match row height.

#### Pattern: Dual Gap Strategies

**Problem:** Gap between grid children needs different implementations based on context.

**Solutions:**
1. **Gap-as-spacer-cells:** Insert empty `<td>` cells with fixed width between content cells. Best for equal-height layouts where cells are unwrapped.
2. **Gap-as-padding:** Use padding-right on content cells. Best for percentage-width columns where spacer cells would break width calculations.

**Responsive adaptation:**
- Desktop: Horizontal gap via spacer cells or padding
- Mobile: Hide spacer cells via CSS, use `margin-top` for vertical gap (margins work when cells become `display: block`)

#### Pattern: Targeted Responsive CSS

**Problem:** Responsive media queries can inadvertently affect non-content elements (gap spacers, wrapper tables).

**Solution:** Use specific CSS classes to target only the elements that should respond:
- `content-cell` — Actual content cells that should stack
- `gap-spacer` — Gap cells that should hide on mobile
- `has-gap` — Content cells needing vertical margin on mobile

**Implementation:**
```css
/* Target content cells specifically, not all <td> elements */
.responsive-grid td.content-cell { display: block; width: auto; }
.responsive-grid td.gap-spacer { display: none; }
.responsive-grid td.content-cell.has-gap { margin-top: var(--gap); }
```

#### Pattern: CSS Variables for Runtime Values

**Problem:** Gap values are dynamic per-component but CSS is generated once.

**Solution:** Use CSS custom properties (`var(--gap)`) in the media query CSS, and set inline styles on individual elements:
```html
<table class="responsive-grid" style="--gap: 16px;">...</table>
```

This keeps the media query CSS static while allowing per-element configuration.

#### Pattern: Defensive Child Handling

**Problem:** When using Svelte's conditional rendering (`{#if}`, `{#each}`), the children array may contain `undefined` or `null` entries. This causes runtime errors like "Cannot read properties of undefined (reading 'type')" when the renderer tries to access `node.type`.

**Solution:** Filter out `undefined`/`null` children before processing:

```ts
// In all functions that iterate over children
const validChildren = node.children.filter((child) => child != null)

// Then use validChildren instead of node.children
const childrenHtml = validChildren.map((child) => renderNodeToHtml(child, ...))
```

**Affected functions:**
- `renderChildren()` — Base helper used by most container nodes
- `renderDivNode()` / `renderDivAsGrid()` — Grid layouts with conditional items
- `renderTableNode()` / `renderTableRowNode()` — Tables with conditional rows/cells
- All plain text renderers (`renderEmailNodeToText`, `renderContainerToText`, etc.)
- `interpolatePlaceholders()` — Content processing (returns empty string for `null`/`undefined`)

**Note:** Components use `normalizeContent()` (required content) or `normalizeOptionalContent()` (optional) from `context.ts` to handle `null`/`undefined` props gracefully with appropriate warnings.

#### Pattern: DOM-Based Ordering for Conditional Content

**Problem:** When using Svelte's `{#if}` or `{#each}` blocks, components register to the IR tree as they mount. Conditional content mounts *after* unconditional content, causing incorrect ordering:

```svelte
<Email>
  <Div><Text content='Header' /></Div>
  
  {#if showItems}
    <Div><Text content='Items' /></Div>  <!-- Mounts late! -->
  {/if}
  
  <Div><Text content='Footer' /></Div>  <!-- Registered before "Items" -->
</Email>
```

**Solution:** Use DOM markers to determine source order. Each component emits a hidden `<svelte-email-marker>` element with a unique ID. Before rendering, we read the DOM order of markers and reorder the IR tree accordingly.

```svelte
<!-- Component pattern -->
<script>
  const markerId = generateMarkerId()
  onDestroy(addChild(parent, node, markerId))
</script>

<svelte-email-marker id={markerId}></svelte-email-marker>
{@render children?.()}
```

The `reorderChildrenByDom()` function in `context.ts`:
1. Queries all `<svelte-email-marker>` elements in DOM order
2. Builds a position map from marker IDs
3. Sorts IR node children to match DOM order

**Note:** This only affects client-side preview. SSR renders synchronously, so components register in source order naturally.

---

## Email Client Compatibility

### The Golden Rules

1. **All styles must be inline** — `<link>` and `<style>` tags are stripped by most clients
2. **Tables are the only reliable layout** — CSS Flexbox/Grid have ~25-30% support
3. **Design for degradation** — Advanced features (rounded corners, shadows) fail gracefully
4. **Test everywhere** — Use [Litmus](https://www.litmus.com/) or [Email on Acid](https://www.emailonacid.com/)

### CSS Property Support Matrix

| Property | Outlook Win | Gmail | Apple Mail | Yahoo |
|----------|-------------|-------|------------|-------|
| `display: block/inline-block` | ✅ | ✅ | ✅ | ✅ |
| `display: flex/grid` | ❌ | ⚠️ | ✅ | ❌ |
| `width/height` (px/%) | ✅ | ✅ | ✅ | ✅ |
| `min/max-width` | ❌ | ✅ | ✅ | ✅ |
| `padding` | ✅ | ✅ | ✅ | ✅ |
| `margin` | ⚠️ | ✅ | ✅ | ⚠️ |
| `border` | ✅ | ✅ | ✅ | ✅ |
| `border-radius` | ❌ | ✅ | ✅ | ❌ |
| `box-shadow` | ❌ | ⚠️ | ✅ | ❌ |
| `background-color` | ✅ | ✅ | ✅ | ✅ |
| `background-image` | ❌ (VML) | ✅ | ✅ | ✅ |
| `opacity` | ❌ | ⚠️ | ✅ | ❌ |
| `object-fit` | ❌ | ⚠️ | ✅ | ✅ |
| Media queries | ❌ | ❌ | ✅ | ✅ |

### Outlook Windows (The Problem Child)

Outlook 2007-2019 uses **Microsoft Word's rendering engine**:

- Ignores: `max-width`, `min-width`, `border-radius`, `box-shadow`, CSS backgrounds, Flexbox/Grid, media queries
- Animated GIFs: Shows first frame only
- Line-height on images: Adds extra space (fix with `line-height: 0` on cells)

**Workarounds:**
- Use `<!--[if mso]>` conditional comments for Outlook-specific code
- Use VML for rounded corners and background images

### Gmail

- Strips `<style>` tags in non-Google IMAP accounts
- Strips inline `<svg>` (use `<img src="file.svg">` instead)
- Clips emails > 102KB
- Blocks images by default

### Media Queries / Responsive

~75% of clients support media queries. Outlook Windows ignores them entirely.

The default breakpoint is **480px**. Customize with `mobile-threshold-[Npx]` on the `<Email>` component.

**`mobile-only` / `desktop-only` behavior:**
| Client | `mobile-only` | `desktop-only` |
|--------|---------------|----------------|
| Mobile (≤480px) | ✅ Visible | ❌ Hidden |
| Desktop (>480px) | ❌ Hidden | ✅ Visible |
| Outlook Windows | ❌ Hidden | ✅ Visible (fallback) |

### Images

| Format | Support | Notes |
|--------|---------|-------|
| JPEG | ~100% | Best for photos |
| PNG | ~100% | Best for graphics with transparency |
| GIF | ~100% | Animations play in most clients |
| SVG (via `<img>`) | ~93% | Safe as external file |
| SVG (inline) | ~40% | **Avoid** — Gmail strips it |
| WebP | ~70% | Provide fallback |

**Best practices:**
- Always include `width`, `height`, and `alt` attributes
- Use absolute HTTPS URLs
- Assume images will be blocked — email should make sense without them
- For retina: use 2x images with 1x `width`/`height`

### Background Images

| Client | CSS `background-image` | HTML `background` attr | VML |
|--------|------------------------|------------------------|-----|
| Outlook Windows | ❌ | ✅ | ✅ Required |
| Others | ✅ | ✅ | — |

Always provide a solid `background-color` fallback.

### VML for Outlook

For rounded buttons or background images in Outlook Windows:

```html
<!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" 
  href="https://example.com" style="height:40px;width:200px;" 
  arcsize="10%" fillcolor="#2563eb">
  <center style="color:#ffffff;font-family:sans-serif;">Button</center>
</v:roundrect>
<![endif]-->
<!--[if !mso]><!-->
<a href="https://example.com" style="background:#2563eb;border-radius:4px;color:#fff;padding:12px 24px;">
  Button
</a>
<!--<![endif]-->
```

### Known Limitations

| Limitation | Workaround |
|------------|------------|
| No rounded corners in Outlook | Accept square or use VML |
| No shadows | Design without shadows |
| No CSS Grid/Flex | Use `<Div cols>` / `<Div rows>` |
| No CSS margins | ✅ Emulated via wrapper padding |
| Media queries stripped (~25%) | Fluid single-column fallback |
| Images blocked by default | Always include alt text |
| Web fonts | Use web-safe font stacks |
| Background images in Outlook | VML or solid color fallback |

---

## Style Presets

```ts
import { presets, merge } from 'svelte-emails'

const style = merge(presets.base, {
  Button: { background: '#2563eb', borderRadius: '6px' }
})
```

### Available Presets

| Preset | Description |
|--------|-------------|
| `presets.base` | Default with sensible defaults |
| `presets.dark` | Dark mode styling |
| `presets.sansSerif` | Arial, Helvetica |
| `presets.serif` | Georgia, Times New Roman |
| `presets.monospace` | Consolas, Courier New |
| `presets.rounded` | Verdana, Trebuchet MS |
| `presets.humanist` | Segoe UI, Lucida Grande |
| `presets.geometric` | Century Gothic, Futura |

### Preset Structure

```ts
// Reusable border configuration
interface BorderStyle {
  color?: string
  width?: string | { top?: string; right?: string; bottom?: string; left?: string }
  style?: 'solid' | 'dashed' | 'dotted'
  radius?: string
}

interface StyleConfig {
  root: {
    color: string
    background: string
    size: number         // Root font size in px (default: 16)
    lineHeight: string | number
    fontFamily: string
    monoFontFamily: string
  }
  Text: {
    color: string
    H1: { size, weight, lineHeight, rule?: { color, thickness, spacing } }
    // H2-H6, Paragraph, Small, Span
  }
  Link: { color, textDecoration }
  Button: { color, background, padding, borderRadius, fontWeight }
  Spacer: { size }
  Divider: { color, thickness, style }
  Code: { color, background, padding, fontFamily, size, border?: BorderStyle }
  Codeblock: { color, background, padding, fontFamily, size, lineHeight, border?: BorderStyle }
  Highlight: { color, background }
  Unsubscribe: { color, size }
  Table: { borderColor, borderWidth, headerBackground, ... }
}
```

---

## SSR & Server Rendering

### How It Works

1. Create collector object to capture root `EmailNode`
2. Build context Map with `Symbol.for()` keys
3. Call Svelte's server render with context
4. Components register themselves, building IR tree
5. Extract IR tree from collector
6. Pass to `renderTree()` for HTML/text output

### Critical Caveat: onDestroy Runs During SSR

`onDestroy` is the **only lifecycle hook that runs during SSR**. The `addChild()` function returns a no-op cleanup in SSR mode to prevent children from being removed after they're added.

### Symbol.for() for Context Keys

`Symbol.for()` creates stable, globally-unique keys that work both when injecting context (in `render()`) and reading context (in components). This is critical for SSR where modules may be loaded multiple times by Vite's module runner.

```typescript
// In context.ts - defined once
export const EMAIL_ROOT_CONTEXT_KEY = Symbol.for('svelte-emails:root-collector')

// In render() - sets context
const context = new Map([[EMAIL_ROOT_CONTEXT_KEY, collector]])
await svelteRender(EmailComponent, { props, context })

// In Email.svelte - reads context
const collector = getContext<Collector>(EMAIL_ROOT_CONTEXT_KEY)
```

Using the same `Symbol.for()` key guarantees the symbol instance is identical across all module instances, even when Vite's SSR runner loads the same module multiple times.

---

## Development

### Dev Server

```bash
bunx svelte-emails
```

Starts dev server on port `33411` that:
- Watches for `*.email.svelte` files
- Hot-reloads on changes
- Provides preview UI (mobile/desktop toggle, variable editor, HTML/text view)

### File Convention

Name email templates `*.email.svelte` for auto-discovery.

### Pre-Send Checklist

- [ ] HTML under 100KB (Gmail clips larger)
- [ ] All images have `alt`, `width`, `height`
- [ ] All links use `https://`
- [ ] Readable with images disabled
- [ ] Preview text set
- [ ] Unsubscribe link present

### Testing Tools

| Tool | Purpose |
|------|---------|
| [Litmus](https://www.litmus.com/) | Cross-client rendering |
| [Email on Acid](https://www.emailonacid.com/) | Cross-client testing |
| [Mail-Tester](https://www.mail-tester.com/) | Spam score |
| [Can I Email](https://www.caniemail.com/) | CSS support database |

### Key Clients to Test

**Desktop:** Outlook 2019/2021 (Windows), Outlook (Mac), Apple Mail, Thunderbird  
**Webmail:** Gmail, Outlook.com, Yahoo Mail, AOL Mail  
**Mobile:** iOS Mail, Gmail App, Outlook App
