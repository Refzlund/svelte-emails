# Email Design Pitfalls

Common design mistakes when building emails and their solutions.

---

## 1. Data Tables Not Responsive on Mobile

### The Problem

Using `<Table>` with percentage columns (e.g., `cols-[50%_20%_15%_15%]`) doesn't stack on mobile. The table maintains its column structure, causing cramped cells on narrow screens.

```svelte
<!-- ❌ Problem: Table columns don't stack on mobile -->
<Table cols-[50%_20%_15%_15%]>
  <Table.Row header>
    <Text content="Item" />
    <Text content="Qty" />
    <Text content="Price" />
    <Text content="Total" />
  </Table.Row>
  <Table.Row>
    <Text content="Product Name" />
    <Text content="2" />
    <Text content="$34.00" />
    <Text content="$68.00" />
  </Table.Row>
</Table>
```

### Why This Happens

`<Table>` is designed for **data tables** and intentionally does NOT support the `responsive` attribute. Data tables shouldn't have their columns stack vertically—it would make the data relationship confusing.

### Solutions

#### Option A: Use `<Div cols responsive>` for Layout

If the content should stack on mobile, use layout components instead:

```svelte
<!-- ✅ Solution: Div cols with responsive -->
<Div cols responsive>
  <Div>Item details...</Div>
  <Div>Quantity...</Div>
  <Div>Price...</Div>
  <Div>Total...</Div>
</Div>
```

#### Option B: Show/Hide Different Views

Create separate desktop and mobile layouts:

```svelte
<!-- ✅ Solution: Different layouts for desktop/mobile -->

<!-- Desktop: Full table -->
<Div desktop-only>
  <Table cols-[50%_20%_15%_15%]>
    <Table.Row header>
      <Text content="Item" />
      <Text content="Qty" />
      <Text content="Price" />
      <Text content="Total" />
    </Table.Row>
    <Table.Row>
      <Text content="Bamboo Lounge Tee" />
      <Text content="2" />
      <Text content="$34.00" />
      <Text content="$68.00" />
    </Table.Row>
  </Table>
</Div>

<!-- Mobile: Stacked card layout -->
<Div mobile-only>
  <Div rows p-4 border-b>
    <Text content="**Bamboo Lounge Tee**" />
    <Text.Small content="Qty: 2 × $34.00" />
    <Text content="**$68.00**" align-right />
  </Div>
</Div>
```

#### Option C: Simplify Table Structure

Design tables that work on narrow screens:

```svelte
<!-- ✅ Solution: Two-column table that works at any width -->
<Table cols-[60%_40%]>
  <Table.Row>
    <Text content="Item" />
    <Text content="Bamboo Lounge Tee" align-right />
  </Table.Row>
  <Table.Row>
    <Text content="Quantity" />
    <Text content="2" align-right />
  </Table.Row>
  <Table.Row>
    <Text content="Total" />
    <Text content="$68.00" align-right />
  </Table.Row>
</Table>
```

---

## 2. Using CSS Properties Not Supported in Email

### The Problem

Many modern CSS properties don't work in email clients, especially Outlook.

```svelte
<!-- ❌ These won't work reliably -->
<Div style="display: flex; gap: 16px;">        <!-- Flexbox: Outlook ignores -->
<Div style="display: grid;">                    <!-- Grid: Outlook ignores -->
<Div style="border-radius: 8px;">               <!-- Rounded: Outlook Windows ignores -->
<Div style="box-shadow: 0 2px 4px rgba(0,0,0,0.1);"> <!-- Shadow: ~63% support -->
```

### Solutions

| Avoid | Use Instead |
|-------|-------------|
| `display: flex` | `<Div cols>` or `<Div rows>` |
| `display: grid` | `<Div cols>` with `cols-[...]` |
| `margin` | `<Spacer>` or padding |
| `border-radius` on buttons | Accept square fallback or use VML |
| `box-shadow` | Design without shadows |
| `max-height` | Let content dictate height |

---

## 3. Images Without Dimensions

### The Problem

Images without explicit dimensions cause layout shifts and may display incorrectly.

```svelte
<!-- ❌ Problem: No dimensions -->
<Img src="https://example.com/product.jpg" alt="Product" />
```

### Solution

Always specify width and height:

```svelte
<!-- ✅ Solution: Explicit dimensions -->
<Img
  src="https://example.com/product.jpg"
  alt="Product"
  w-[200px]
  h-[200px]
/>
```

---

## 4. Inline SVG

### The Problem

Inline `<svg>` elements are stripped by Gmail and have only ~40% support.

```svelte
<!-- ❌ Problem: Inline SVG stripped by Gmail -->
<svg viewBox="0 0 24 24">
  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
</svg>
```

### Solution

Use SVG as an image source (93% support):

```svelte
<!-- ✅ Solution: SVG as image -->
<Img src="https://example.com/icon.svg" alt="Icon" w-[24px] h-[24px] />
```

---

## 5. Relying on Web Fonts

### The Problem

Custom web fonts have limited support in email clients.

### Solution

Always provide fallback font stacks:

```svelte
<!-- ✅ Solution: Font stack with fallbacks -->
<Text
  content="Hello"
  font-['Helvetica_Neue',Helvetica,Arial,sans-serif]
/>
```

---

## 6. Content Wider Than Container

### The Problem

Fixed-width content can cause horizontal scrolling on mobile.

```svelte
<!-- ❌ Problem: Fixed width wider than mobile viewport -->
<Div w-[500px]>
  <Text content="This won't fit on mobile" />
</Div>
```

### Solution

Use percentage widths or max-width:

```svelte
<!-- ✅ Solution: Responsive width -->
<Div w-full max-w-[500px]>
  <Text content="This adapts to viewport" />
</Div>
```

---

## 7. Forgetting Outlook Conditional Comments

### The Problem

Outlook Windows ignores `max-width` and needs special handling for centered layouts.

### Solution

The `<Email>` component automatically handles this with MSO conditional comments. But if you need custom Outlook-specific code:

```svelte
<!-- Outlook-specific width constraint (handled automatically by Email component) -->
<!--[if mso]>
<table align="center" width="600"><tr><td>
<![endif]-->
  <!-- Your content -->
<!--[if mso]>
</td></tr></table>
<![endif]-->
```

---

## 8. Large Email Size

### The Problem

Gmail clips emails larger than 102KB.

### Solutions

1. **Optimize images** - Use compressed formats, appropriate dimensions
2. **Minimize HTML** - The renderer already minifies output
3. **Avoid repetition** - Use loops instead of copy-pasting content
4. **External images** - Don't embed base64 images

---

## 9. Missing Alt Text

### The Problem

Many email clients block images by default. Without alt text, users see nothing.

```svelte
<!-- ❌ Problem: No alt text -->
<Img src="https://example.com/logo.png" />
```

### Solution

Always provide meaningful alt text:

```svelte
<!-- ✅ Solution: Descriptive alt text -->
<Img src="https://example.com/logo.png" alt="CozyThreads Logo" />
```

---

## 10. Using Only Dark Colors

### The Problem

Some email clients support dark mode and may invert colors, making dark-on-dark unreadable.

### Solution

1. Test in both light and dark modes
2. Use sufficient contrast ratios
3. Consider that backgrounds may be inverted

---

## Quick Reference: Safe vs Unsafe

### ✅ Safe to Use

- `<Table>` for data, `<Div cols/rows>` for layout
- Inline styles (automatic)
- `padding` on any element
- `margin` (emulated via wrapper tables)
- `background-color` (solid colors)
- `border` (solid borders)
- `width` / `height` (percentages or pixels)
- `text-align`, `vertical-align`
- `font-family`, `font-size`, `font-weight`
- `color`
- `line-height`
- `opacity-*` (emulated via color blending)

### ⚠️ Use with Caution

- `border-radius` - Outlook Windows shows square
- `background-image` - Needs VML fallback for Outlook
- Web fonts - Always provide fallbacks
- `min-width` / `max-width` - Outlook ignores

### ❌ Avoid

- `display: flex` / `display: grid`
- `box-shadow`
- `transform` / `filter`
- `transition` / `animation`
- Inline `<svg>`
- `position: absolute` / `position: fixed`
- `overflow: hidden` with `max-height`
- `object-fit`
