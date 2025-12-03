# svelte-emails LLM Guide

Compact reference for building email templates with svelte-emails.

---

## Critical Constraints

1. **Components only** — No raw HTML elements (`<div>`, `<p>`, `<span>`). Use only provided components (`Div`, `Text`, `Button`, etc.)
2. **No raw text children** — All text must use the `content="..."` attribute on Text components
3. **Attributes for styling** — No `style` attributes or CSS classes. Use Tailwind-like attributes (`p-4`, `bg-[#fff]`)

```svelte
<!-- ❌ WRONG -->
<div style="padding: 16px">
  <p>Hello world</p>
</div>

<!-- ❌ WRONG -->
<Div>
  Hello world
</Div>

<!-- ✅ CORRECT -->
<Div p-4>
  <Text content='Hello world' />
</Div>
```

---

## File Convention

Email templates use `*.email.svelte` naming:

```svelte
<!-- MyEmail.email.svelte -->
<script lang='ts'>
  import { Email, Div, Text, Button, Spacer } from 'svelte-emails'
  
  // ✅ Good pattern: Define colors/spacing as variables
  const colors = {
    brand: '#2563eb',
    muted: '#6b7280',
    bg: '#f8fafc'
  }
  const spacing = { section: '2rem', content: '1rem' }
</script>

<Email preview='Your account is ready'>
  <Div p={spacing.section} bg={colors.bg}>
    <Text.H1 content='Welcome!' />
    <Text.Paragraph content='Thanks for signing up, [[first_name]]!' />
    <Button href='https://example.com' bg={colors.brand}>Get Started</Button>
  </Div>
</Email>
```

---

## Props vs Placeholders

| Concept | Purpose | Syntax | When Resolved |
|---------|---------|--------|---------------|
| **Props** | Developer data (arrays, objects, logic) | `{#each items}`, `{data.value}` | Build time |
| **Placeholders** | End-user personalization | `[[first_name]]` in content | Render time |

```svelte
<!-- Props: Developer controls structure -->
<script>
  let { orderItems } = $props()  // Array from developer
</script>

{#each orderItems as item}
  <Text content={item.name} />
{/each}

<!-- Placeholders: ESP/mail service fills in -->
<Text content='Hi [[first_name]], your order [[order_id]] is ready!' />
```

Provide placeholder values when rendering:
```ts
render(MyEmail, {
  placeholders: { first_name: 'Alice', order_id: '12345' },
  props: { orderItems: [...] }
})
```

---

## Components

### Email (Root - Required)

```svelte
<Email
  preview='Inbox preview text'
  body-bg-[#f5f5f5]
  bg-[#ffffff]
  max-w-[600px]
>
  ...content...
</Email>
```

| Prop/Attr | Purpose | Default |
|-----------|---------|---------|
| `preview` | Preheader text (shown in inbox list) | `''` |
| `body-bg` / `body-bg-[#hex]` | Full-width background | `#ffffff` |
| `bg` / `bg-[#hex]` | Content container background | `#ffffff` |
| `max-w` / `max-w-[Npx]` | Content max-width | `600px` |

### Div (Container/Grid)

**Attributes:** All sizing, spacing, colors, typography, borders, alignment, effects, responsive

```svelte
<!-- Container -->
<Div p-4 bg-[#f0f0f0]>Content</Div>

<!-- Grid: cols (horizontal) or rows (vertical) -->
<Div cols gap-4>
  <Div w-[50%]>Left</Div>
  <Div w-[50%]>Right</Div>
</Div>

<Div rows gap-4>
  <Div>Row 1</Div>
  <Div>Row 2</Div>
</Div>

<!-- Column template -->
<Div cols cols="40% 30% 30%">  <!-- or cols-[40%_30%_30%] -->
  <Div>40%</Div>
  <Div>30%</Div>
  <Div>30%</Div>
</Div>

<!-- Responsive: stack on mobile -->
<Div cols responsive>
  <Div>Col 1</Div>
  <Div>Col 2</Div>
</Div>

<!-- Spanning -->
<Div cols cols="25% 25% 25% 25%">
  <Div span-2>Spans 2</Div>
  <Div span-2>Spans 2</Div>
</Div>
```

| Attr | Purpose |
|------|---------|
| `cols` | Horizontal layout |
| `rows` | Vertical layout |
| `responsive` | Stack columns on mobile (with `cols`) |
| `cols="..."` / `cols-[...]` | Column widths (space or underscore separated) |
| `rows="..."` / `rows-[...]` | Row heights |
| `gap-N` / `gap-[Npx]` | Gap between children |
| `span-N` | Span N columns (2-12) |
| `row-span-N` | Span N rows (2-12) |

> Gaps might be important to achieve correct look. No gap, no padding, no margin = no spacing = might look bad.

### Text (& Variants)

**Attributes:** Spacing, typography, colors, alignment, effects

```svelte
<Text content='Plain text' />
<Text.Paragraph content='Paragraph text' />
<Text.H1 content='Heading 1' />  <!-- H1-H6 available -->
<Text.Small content='Small text' />
```

**Markdown in content:**
| Syntax | Output |
|--------|--------|
| `**bold**` | Bold |
| `*italic*` | Italic |
| `~~strike~~` | Strikethrough |
| `__underline__` | Underline |
| `[text](url)` | Link |
| `(#hex)text(/)` | Colored text |
| `[#hex]text[/]` | Highlighted |
| `[[var]]` | Placeholder |
| `\n` | Line break |
| `-` / `1.` | Lists |

### Table

**Attributes:** Sizing, spacing, borders, alignment, typography, effects, `cols`, `striped`, `border`, `compact`, `cell-padding`

```svelte
<Table cols="40% 30% 30%" border striped>
  <Table.Row header bg-[#f3f4f6] font-bold>
    <Text content='Name' />
    <Text content='Qty' />
    <Text content='Price' />
  </Table.Row>
  <Table.Row>
    <Text content='Item' />
    <Text content='1' />
    <Text content='$10' />
  </Table.Row>
</Table>
```

| Attr | Purpose |
|------|---------|
| `cols` | Column widths |
| `border` | All borders |
| `border-outer` | Outer border only |
| `cell-border` | Cell borders only |
| `striped` | Alternating backgrounds |
| `compact` | Less padding |
| `cell-padding-N` | Override cell padding |

### Table.Row

**Attributes:** Spacing, borders, alignment, typography, colors, effects

```svelte
<Table.Row header>...</Table.Row>  <!-- Header row -->
<Table.Row bg-[#fff] font-bold>...</Table.Row>  <!-- Styles inherit to children -->
```

### Button

**Attributes:** Spacing, borders, border-radius, typography, colors

```svelte
<Button href='https://...' bg-[#2563eb] text-[#fff] rounded-lg>
  Click Me
</Button>
```

**Note:** Button is the only component that accepts text as children (for the button label).

### Link

**Attributes:** Typography, colors, padding

```svelte
<Link href='https://...'>website</Link>
```

**Note:** Link accepts text as children (for the link label). For inline links within text, use markdown: `<Text content='Visit [our website](https://...)' />`

### Img

**Attributes:** Sizing (w, h, min-w, max-w, min-h), spacing, borders, border-radius

```svelte
<Img src='https://...' width={600} height={400} alt='Description' />
<Img src='https://...' href='https://...' />  <!-- Clickable image -->
```

⚠️ Always include `width`, `height`, `alt`. Use absolute HTTPS URLs.

### Spacer

**Attributes:** Height (`h-N`), width (`w-N`), span, responsive

```svelte
<Spacer />        <!-- Default: 2rem -->
<Spacer h-8 />    <!-- Vertical: 2rem height -->
<Spacer w-4 />    <!-- Horizontal (in cols): 1rem width -->
```

Context-aware: Height in rows/standalone, width in cols.

### Divider

**Attributes:** Border color, width, style

```svelte
<Divider />
<Divider border-[#e5e7eb] border-2 border-dashed />
```

### Br

```svelte
<Br />  <!-- Line break -->
```

### Unsubscribe

```svelte
<Unsubscribe href='https://...'>Unsubscribe</Unsubscribe>
```

**Note:** Unsubscribe accepts text as children (for the link label).

---

## Attribute Syntax

Two equivalent syntaxes:

```svelte
<!-- Boolean (Tailwind-like) -->
<Div bg-[#f3f4f6] p-[1rem] w-[500px] />

<!-- Value (for variables) -->
<Div bg="#f3f4f6" p="1rem" w="500px" />
<Div bg={colors.bg} p={spacing.md} w={width} />
```

**Note:** `cols` and `rows` use spaces in value syntax, underscores in bracket syntax:
```svelte
<Div cols cols="40% 30% 30%">   <!-- Value: spaces -->
<Div cols cols-[40%_30%_30%]>   <!-- Bracket: underscores -->
```

---

## Attribute Reference

### Sizing
```svelte
w-full  w-auto  w-[500px]  w="500px"  w={width}
h-auto  h-[200px]  h="200px"
max-w-sm/md/lg/xl/2xl  max-w-[700px]
min-w-[100px]  min-h-[50px]
```

### Spacing
```svelte
p-4  p-[1rem]  p="1rem"    <!-- padding (all sides) -->
px-4 py-2                   <!-- horizontal/vertical -->
pt-2 pr-4 pb-2 pl-4        <!-- individual sides -->
m-4  mx-auto               <!-- margin (emulated via wrapper) -->
```

Scale: 0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 96

### Colors
```svelte
bg-[#f3f4f6]  bg="#f3f4f6"  bg={color}
text-[#333]   text="#333"   text={color}
bg-[#000]/50              <!-- 50% opacity (blended to solid) -->
bg-opacity-50 bg-[#000]   <!-- Same result -->
text-inherit              <!-- Inherit from parent -->
```

### Typography
```svelte
text-xs/sm/base/lg/xl/2xl/3xl/4xl/5xl/6xl/7xl/8xl/9xl
text-[18px]
font-thin/light/normal/medium/semibold/bold/extrabold/black
italic  uppercase  lowercase  capitalize
leading-none/tight/snug/normal/relaxed/loose  leading-[1.8]
tracking-tighter/tight/normal/wide/wider/widest
```

### Alignment
```svelte
align-center        <!-- center both axes -->
align-top-left  align-top  align-top-right
align-left  align-middle  align-right
align-bottom-left  align-bottom  align-bottom-right
justify-left/center/right  <!-- text-align -->
```

### Borders
```svelte
border  border-2  border-[3px]  border="2px"
border-t/r/b/l/x/y          <!-- individual sides -->
border-[#e5e7eb]  border="#e5e7eb"
border-solid/dashed/dotted/double
border-opacity-50
rounded  rounded-sm/md/lg/xl/2xl/3xl/full  rounded-[10px]
rounded-t/r/b/l  rounded-tl/tr/br/bl
```

⚠️ `rounded-*` ignored by Outlook Windows

### Effects
```svelte
opacity-75  opacity="0.75"  opacity={op}
hidden
```

### Responsive
```svelte
mobile-only   <!-- Hidden on desktop -->
desktop-only  <!-- Hidden on mobile -->
responsive    <!-- On Div cols: stack on mobile -->
```

---

## Responsiveness

**Mobile-first with fallbacks:**

```svelte
<!-- Show different content per device -->
<Div mobile-only>
  <Text content='Mobile version' />
</Div>
<Div desktop-only>
  <Text content='Desktop version' />
</Div>

<!-- Responsive columns: stack on mobile -->
<Div cols responsive>
  <Div w-[50%]>Left on desktop, full width on mobile</Div>
  <Div w-[50%]>Right on desktop, full width on mobile</Div>
</Div>
```

| Client | `mobile-only` | `desktop-only` | Media queries |
|--------|---------------|----------------|---------------|
| Mobile (<425px) | ✅ Visible | ❌ Hidden | ✅ |
| Desktop (≥425px) | ❌ Hidden | ✅ Visible | ✅ |
| Outlook Windows | ❌ Hidden | ✅ Visible | ❌ Ignored |

**~75% of clients support media queries.** Outlook Windows ignores them—desktop version shown.

---

## Best Patterns

### ✅ Use Variables for Repeated Values

```svelte
<script>
  const colors = {
    brand: '#2563eb',
    text: '#1f2937',
    muted: '#6b7280',
    bg: '#f8fafc',
    border: '#e5e7eb'
  }
  const spacing = { sm: '0.5rem', md: '1rem', lg: '2rem' }
</script>

<Div bg={colors.bg} p={spacing.lg}>
  <Text text={colors.text} content='...' />
  <Button bg={colors.brand}>Action</Button>
</Div>
```

### ✅ Style Inheritance

```svelte
<!-- Parent styles cascade to children -->
<Div font-bold text-[#333]>
  <Text content='Inherits bold and color' />
  <Text content='Override' font-normal text-[#666] />
</Div>

<Table.Row bg-[#f3f4f6] font-bold>
  <Text content='All cells inherit these styles' />
</Table.Row>
```

### ✅ Semantic Structure

```svelte
<Email preview='Order #12345 confirmed'>
  <!-- Header -->
  <Div bg={colors.brand} p-6 align-center>
    <Img src={logo} width={150} height={50} alt='Company' />
  </Div>
  
  <!-- Content -->
  <Div p-6>
    <Text.H1 content='Order Confirmed' />
    <Text.Paragraph content='Hi [[first_name]],...' />
    
    <!-- Order details table -->
    <Table cols="50% 25% 25%" border>...</Table>
  </Div>
  
  <!-- Footer -->
  <Div p-4 bg-[#f5f5f5] text-[#666] text-sm align-center>
    <Unsubscribe href='...'>Unsubscribe</Unsubscribe>
  </Div>
</Email>
```

### ❌ Anti-patterns

```svelte
<!-- ❌ Raw HTML elements (not supported) -->
<div style="padding: 16px">
  <p>Text here</p>
</div>

<!-- ❌ Raw text children (not supported) -->
<Div p-4>
  Some text here
</Div>

<!-- ❌ Style attributes (not supported) -->
<Div style="background: red">...</Div>

<!-- ❌ Repeating hex codes (hard to maintain) -->
<Div bg-[#2563eb]>
  <Button bg-[#2563eb]>Click</Button>
  <Text text-[#2563eb] content='...' />
</Div>

<!-- ✅ Use content="..." attribute -->
<Button content="Press me" href="..." />
<Text content="This is some text" />

<!-- ✅ Use components + content attribute + variables -->
<script>
  const colors = {
    brand: '#2563eb',
    ...
  }
</script>
<Div bg={colors.brand} p-4>
  <Text content='Some text here' />
  <Button bg={colors.brand}>Click</Button>
</Div>

<!-- ✅ Use Div cols/rows -->
<Div cols gap-4>...</Div>

<!-- ❌ Text touch/colliding horizontally (`cols`) -->
<Div cols>
    <Text content='This text is touc'/>
    <Text content='hing each other.'/>
</Div>

<!-- ✅ Text separation horizontally (`cols`) / vertically (`rows`) -->
<Div cols gap-2>
    <Text content='This text'/>
    <Text content='is separated with a gap.'/>
</Div>
<Div rows>
    <Text content='This text'/>
    <Text content='is on two lines.'/>
</Div>
<Div cols gap-2>
    <Text.Paragrapjh content='This text'/>
</Div>
```

---

## Rendering

### Server-Side

```ts
import { render, merge, presets } from 'svelte-emails'
import MyEmail from './MyEmail.email.svelte'

const result = await render(MyEmail, {
  placeholders: { first_name: 'Alice' },
  style: merge(presets.base, { Button: { background: '#2563eb' } }),
  props: { items: [...] }
})

if (result.ok) {
  result.value.html    // HTML output
  result.value.text    // Plain text version
  result.value.headers // Email headers
}
```

### Preview (Client-Side)

```svelte
<script>
  import { Email, merge, presets } from 'svelte-emails'
  import MyEmail from './MyEmail.email.svelte'
</script>

<Email.Preview
  placeholders={{ first_name: 'Alice' }}
  style={merge(presets.base, { Button: { background: '#2563eb' } })}
>
  <MyEmail items={[...]} />
</Email.Preview>
```

### Dev Server

```bash
bunx svelte-emails  # Starts on port 33411
```

Discovers all `*.email.svelte` files and provides live preview.

---

## Email Client Limitations

| Feature | Outlook Win | Gmail | Apple Mail |
|---------|-------------|-------|------------|
| `border-radius` | ❌ | ✅ | ✅ |
| `box-shadow` | ❌ | ⚠️ | ✅ |
| Emulated `opacity` | ✅ | ✅ | ✅ |
| Media queries | ❌ | ❌ | ✅ |
| `max-width` | ❌ | ✅ | ✅ |
| Emulated `margin` | ✅ | ✅ | ✅ |

`opacity` is supported, since we handle blending colors during rendering.
`margin` is supported, since we smartly use padding to achieve same functionality as margin.

> Note: Media queries only needs support on mobile devices.
> Fallback is that desktop-viewable content is shown — so it can be used quite safely.
> So responsiveness via `responsive`, `desktop-only`, `mobile-only` is a recommended pattern.

**svelte-emails handles:**
- ✅ Margins → emulated via wrapper tables
- ✅ Opacity → blended to solid colors at render time
- ✅ Layout → tables (not flex/grid)

**You should:**
- Always include `alt`, `width`, `height` on images
- Use HTTPS absolute URLs
- Keep HTML < 100KB (Gmail clips larger)
- Test in multiple clients
- Design for graceful degradation
