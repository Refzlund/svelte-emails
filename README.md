# svelte-emails

Think Tailwind for emails. `svelte-emails` builds on a "Virtual level" handling all rendering of the actual email up to us. That means we can emulate behaviour such as margin (padding+wrappers) and opacity (color blending based on backgrounds) — and use modern terms such as "Grids". We take care of responsibility features and fallbacks, ensuring you get the look you want across platforms, with `mobile-only`, `desktop-only` and `responsive` (collapse columns to one column on mobile) attributes. But we don't stop there! We support placeholders `[[first_name]]` so your end users can customize their emails with custom variables at render time. We support extended markdown features, so you and your end users can format to your hearts desires. Icing of the cake? View and develop e-mails using `bunx svelte-emails` / `npx svelte-emails` with a beautiful UI that scans the CWD for the `*.email.svelte` syntax, and re-renders when files changes, are adeded or removed. The `Output` includes `html`, `text` and `headers` (for e-mail header such as `Unsubscribe`).

Build email templates using Svelte components with Tailwind-like styling attributes.

## Quick Example

```svelte
<script lang='ts'>
    import { Email, Div, Text, Table, Spacer, Unsubscribe } from 'svelte-emails'
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
    <Unsubscribe href='...' content='Unsubscribe' />
</Email>
```

---

## Text Formatting

All `content='...'` props support extended markdown:

| Syntax | Result |
|--------|--------|
| `**bold**` | Bold |
| `*italic*` | Italic |
| `~~strikethrough~~` | Strikethrough |
| `__underlined__` | Underlined |
| `--small--` | Small text |
| `^superscript^` | Superscript |
| `_subscript_` | Subscript |
| `[text](url)` | Link |
| `` `code` `` | Inline code |
| ` ``` ` | Code block |
| `(#hex)text(/)` | Colored text |
| `[#hex]text[/]` | Highlighted text |
| `\n` | Line break |
| `-` | Bullet list |
| `1.` `a.` `A.` `I.` | Ordered list |
| `\| col \|` | Tables |

---

## Grid Layout (Div)

Use `cols` or `rows` on `<Div>` to arrange children in a grid:

```svelte
<!-- Horizontal columns -->
<Div cols>
    <Div w-[50%]><Text content='Left' /></Div>
    <Div w-[50%]><Text content='Right' /></Div>
</Div>

<!-- Responsive (stacks on mobile) -->
<Div cols responsive>
    <Div><Text content='Column 1' /></Div>
    <Div><Text content='Column 2' /></Div>
</Div>

<!-- Vertical rows -->
<Div rows gap-4>
    <Div><Text content='Row 1' /></Div>
    <Div><Text content='Row 2' /></Div>
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
<Div rows gap-[20px]>...</Div>

<!-- Span multiple columns -->
<Div cols cols-[25%_25%_25%_25%]>
    <Div span-2><Text content='Spans 2 cols' /></Div>
    <Div span-2><Text content='Spans 2 cols' /></Div>
</Div>
```

---

## Table Component

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

**Table Attributes:**
- `cols-[...]` or `cols="..."` — Column widths (e.g., `cols-[40%_30%_30%]` or `cols="40% 30% 30%"`)
- `border` — Full borders (outer + cells)
- `border-outer` — Outer border only
- `cell-border` — Cell borders only
- `striped` — Alternating row backgrounds
- `cell-padding-*` — Cell padding (`cell-padding-4`, `cell-padding-[12px]`)
- `compact` — Reduced cell padding

**Table.Row Attributes:**
- `header` — Marks as header row
- Styles are inherited by children (`font-bold`, `bg-[#...]`, etc.)

**Cell Spanning:**
```svelte
<Table.Row>
    <Div span-2><Text content='Spans 2 columns' /></Div>
    <Div><Text content='Normal cell' /></Div>
</Table.Row>
```

**Markdown Tables** are also supported in Text content:
```svelte
<Text content={`
| Status | Service |
|--------|---------|
| 🟢 | API |
| 🟢 | Dashboard |
`} />
```

---

## Email Component

The root `<Email>` component supports separate body and content backgrounds:

```svelte
<Email
  preview='Your account is ready'
  body-bg-[#f0f4f8]
  bg-[#ffffff]
  max-w-[700px]
>
  ...
</Email>

<!-- Or with value syntax for variables -->
<script>
    let bodyBg = '#f0f4f8'
</script>
<Email preview='Your account is ready' body-bg={bodyBg} bg="#ffffff">
  ...
</Email>
```

| Attribute | Purpose | Default |
|-----------|---------|---------|
| `preview` | Preheader text (shown in inbox list) | `''` |
| `body-bg-[#hex]` or `body-bg="#hex"` | Outer body background (full width) | `#ffffff` |
| `bg-[#hex]` or `bg="#hex"` | Content container background | `#ffffff` |
| `max-w-[Npx]` or `max-w="Npx"` | Content container max-width | `600px` |

The body background (`body-bg-*`) is the root color for opacity blending throughout the email.

---

## Styling Attributes

Tailwind-like attributes on any component.

### Two Syntax Options

All bracket-style attributes support two syntax options:

```svelte
<!-- Boolean syntax (Tailwind-like) -->
<Div bg-[#f3f4f6] p-[1rem] />

<!-- Value syntax (for Svelte variables) -->
<Div bg="#f3f4f6" p="1rem" />
```

The value syntax enables using Svelte variables:

```svelte
<script>
    let brandColor = '#ff6600'
    let spacing = '2rem'
</script>

<Div bg={brandColor} p={spacing}>
    <Text content='Dynamic styling!' />
</Div>
```

Both syntaxes work identically — use whichever fits your needs.

**Note for `cols` and `rows`:** The value syntax uses spaces instead of underscores:

```svelte
<!-- Bracket syntax uses underscores -->
<Div cols cols-[40%_30%_30%]>...</Div>

<!-- Value syntax uses spaces -->
<Div cols cols="40% 30% 30%">...</Div>
```

### Sizing
```svelte
<Div w-full h-auto />
<Div w-[500px] h-[200px] />
<Div w="500px" h="200px" />   <!-- value syntax -->
<Div max-w-xl min-h-[100px] />
```

### Spacing
```svelte
<Div p-4 px-8 />           <!-- padding -->
<Div m-4 mx-auto />        <!-- margin (emulated via wrapper) -->
<Div p="1rem" m="16px" />  <!-- value syntax -->
```

### Colors
```svelte
<Div bg-[#f3f4f6] text-[#333333] />
<Div bg="#f3f4f6" text="#333333" />  <!-- value syntax -->
<Div bg-opacity-50 bg-[#000000] />   <!-- 50% opacity -->
```

### Typography
```svelte
<Text font-bold text-lg italic />
<Text uppercase tracking-wide leading-relaxed />
```

### Alignment
```svelte
<Div align-center />       <!-- center both axes -->
<Div align-top-left />
<Text justify-center />    <!-- text alignment -->
```

### Borders
```svelte
<Div border border-[#e5e7eb] />
<Div border-2 border-dashed rounded-lg />
<Div border="2px" rounded="8px" />  <!-- value syntax -->
```

### Responsive
```svelte
<Div mobile-only><Text content='Shown only on mobile' /></Div>
<Div desktop-only><Text content='Shown only on desktop' /></Div>
<Div cols responsive>
    <Div><Text content='2 columns on Desktop' /></Div>
    <Div><Text content='1 column on Mobile' /></Div>
</Div>

<!-- Customize breakpoint (default: 480px) -->
<Email mobile-threshold-[425px]>
    <Div cols responsive>...</Div>  <!-- Stacks at 425px instead -->
</Email>
```

### Opacity
```svelte
<Div opacity-75><Text content='75% opacity (all colors blended)' /></Div>
<Div opacity="0.75"><Text content='Same result with value syntax' /></Div>
```

---

## Previewing Emails

```svelte
<script lang='ts'>
    import { Email, merge, presets } from 'svelte-emails'
    import MyEmail from './MyEmail.email.svelte'
</script>

<Email.Preview
    placeholders={{ 'first_name': 'John' }}
    style={merge(presets.base, {
        Button: {
            background: '#2563eb',
            borderRadius: '6px'
        }
    })}
>
    <MyEmail />
</Email.Preview>
```

`placeholders` replace `[[variable]]` placeholders in text content.

### Available Presets

| Preset | Description | Example |
|--------|-------------|---------|
| `presets.base` | Default preset with sensible defaults | System UI fonts |
| `presets.dark` | Dark mode styling | Dark background, light text |
| `presets.sansSerif` | Sans-serif font stack | Arial, Helvetica |
| `presets.serif` | Serif font stack | Georgia, Times New Roman |
| `presets.monospace` | Monospace font stack | Consolas, Courier New |
| `presets.rounded` | Friendly rounded fonts | Verdana, Trebuchet MS |
| `presets.humanist` | Warm humanist fonts | Segoe UI, Lucida Grande |
| `presets.geometric` | Modern geometric fonts | Century Gothic, Futura |

Use `merge()` to combine presets or override specific values.

---

## Rendering Server-Side

```ts
import { render, merge, presets } from 'svelte-emails'
import MyEmail from './MyEmail.email.svelte'

const result = await render(MyEmail, {
    placeholders: { first_name: 'John' }, // replaces [[first_name]] in content
    style: merge(presets.dark, presets.serif, { ... }),
    props: {...} // props passed onto the component
})

if (result.ok) {
    result.value.html  // HTML output
    result.value.text  // Plain text output
}
```

---

## Development Server

Name components `*.email.svelte`, then run:

```bash
bunx svelte-emails
```

Starts a dev server on port `33411` that discovers all `*.email.svelte` files from CWD. It ignores patterns based on `.gitignore` and ignores `node_modules` as well.
