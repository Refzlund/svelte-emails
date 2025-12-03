# Email Templates

Example email templates demonstrating the `svelte-emails` library features.

## Templates

### Production-Quality Examples

| Template | Description | Features Demonstrated |
|----------|-------------|----------------------|
| [MyEmail.email.svelte](src/MyEmail.email.svelte) | Order confirmation (CozyThreads) | Tables, responsive columns, buttons, color blocks |
| [PaypalReceipt.email.svelte](src/PaypalReceipt.email.svelte) | Transaction receipt (PayPal style) | Data tables, transaction info boxes, footer links |
| [WebflowConf.email.svelte](src/WebflowConf.email.svelte) | Conference marketing (Webflow style) | Testimonials, image-text layouts, CTAs, social links |
| [GoogleFlights.email.svelte](src/GoogleFlights.email.svelte) | Flight deals notification | Price badges, structured data, price visualization |
| [GozneyGameDay.email.svelte](src/GozneyGameDay.email.svelte) | Recipe showcase (Gozney style) | 2-column responsive grid, product cards, image gallery |

### Testing & Reference

| Template | Description |
|----------|-------------|
| [ComponentShowcase.email.svelte](src/ComponentShowcase.email.svelte) | **Comprehensive test** of ALL library components and style attributes |

## Components Coverage

The `ComponentShowcase.email.svelte` demonstrates:

### All Components
- `Email` — Root container with body-bg, bg, max-w
- `Div` — Container with cols/rows grid layouts
- `Text` — All variants (H1-H6, Paragraph, Small, default)
- `Table` — Data tables with Table.Row
- `Button` — CTA buttons with various styles
- `Link` — Inline links
- `Img` — Images with optional href
- `Spacer` — Context-aware spacing
- `Divider` — Horizontal rules
- `Br` — Line breaks
- `Unsubscribe` — Footer unsubscribe with email headers

### All Style Attributes

| Category | Attributes |
|----------|------------|
| **Spacing** | `p-*`, `pt/pr/pb/pl-*`, `px/py-*`, `m-*` (emulated) |
| **Sizing** | `w-*`, `h-*`, `min-w-*`, `max-w-*`, `w-full`, `h-auto` |
| **Colors** | `text-[#hex]`, `bg-[#hex]`, `*-opacity-*` (emulated) |
| **Typography** | `text-xs/sm/base/lg/xl/*`, `font-*`, `leading-*`, `tracking-*`, `italic`, `underline`, `uppercase` |
| **Borders** | `border-*`, `border-t/r/b/l-*`, `border-solid/dashed/dotted`, `rounded-*` |
| **Alignment** | `align-*` (9 positions), `justify-left/center/right/full` |
| **Effects** | `opacity-*` (emulated via color blending) |
| **Layout** | `cols`, `rows`, `responsive`, `cols-[...]`, `gap-*`, `span-*` |
| **Responsive** | `mobile-only`, `desktop-only` |

### Content Parsing
- Markdown: `**bold**`, `*italic*`, `~~strike~~`, `__underline__`, `[link](url)`, `` `code` ``
- Colors: `(#hex)text(/)`, `[#hex]highlight[/]`
- Variables: `[[variable_name]]` interpolation
- Lists: Bullet and numbered
- Tables: Pipe-separated markdown tables

## Running the Dev Server

```bash
# From the repository root
bunx svelte-emails

# Or from this directory
cd emails
bun run dev
```

The dev server will auto-discover all `*.email.svelte` files and provide:
- Live preview (desktop/mobile toggle)
- Variable editor for `[[placeholders]]`
- HTML/Text output view

## Using in Production

```ts
import { render, presets, merge } from 'svelte-emails'
import MyEmail from './MyEmail.email.svelte'

const result = await render(MyEmail, {
  placeholders: { first_name: 'Alice' },
  style: merge(presets.base, { 
    Button: { background: '#2563eb' } 
  }),
  props: { orderNumber: '12345' }
})

// result.html — Full HTML document
// result.text — Plain text version
// result.headers — Email headers (List-Unsubscribe, etc.)
```
