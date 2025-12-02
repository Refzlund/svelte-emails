# Email Development Considerations

This document outlines critical considerations, limitations, and best practices for developing email templates with `svelte-emails`. Email clients have notoriously inconsistent rendering engines, and understanding these constraints is essential for creating reliable emails.

---

## Table of Contents

1. [The Golden Rules](#the-golden-rules)
2. [Layout & Structure](#layout--structure)
3. [Sizing & Spacing](#sizing--spacing)
4. [Typography](#typography)
5. [Colors & Backgrounds](#colors--backgrounds)
6. [Borders & Visual Effects](#borders--visual-effects)
7. [Images](#images)
8. [Responsive Design](#responsive-design)
9. [Client-Specific Quirks](#client-specific-quirks)
10. [Testing](#testing)
11. [Quick Reference Tables](#quick-reference-tables)

---

## The Golden Rules

### 1. All Styles Must Be Inline

Most email clients strip `<link>` and `<style>` tags. Every CSS property must be applied directly as an inline `style` attribute on elements. The `render()` function handles this automatically, but be aware that any external CSS will be lost.

### 2. Tables Are Your Layout Engine

CSS Flexbox and Grid have virtually **zero support** in email clients. Outlook uses Microsoft Word's rendering engine, which only understands tables. Always use `<Grid>` components (which render as `<table>`) for any multi-column or structured layouts.

### 3. Design for Degradation

Not all features work everywhere. Design with the assumption that advanced features (rounded corners, shadows, responsive breakpoints) will fail in some clients. The email should remain readable and functional without them.

### 4. Test Everywhere

There is no substitute for testing in real email clients. Use services like [Litmus](https://www.litmus.com/) or [Email on Acid](https://www.emailonacid.com/) to verify rendering across platforms.

---

## Layout & Structure

### ✅ What Works

| Approach | Support | Notes |
|----------|---------|-------|
| HTML `<table>` layouts | ~100% | The only reliable layout method |
| `display: block` | ~100% | Safe for block elements |
| `display: inline-block` | ~95% | Generally safe |
| `display: none` | ~95% | Use for hiding elements |
| `float: left/right` | ~90% | Works but tables are preferred |
| `vertical-align` | ~100% | Essential for table cell alignment |

### ❌ What Doesn't Work

| Approach | Support | Notes |
|----------|---------|-------|
| CSS Flexbox | ~30% | **Do not use** — Outlook ignores entirely |
| CSS Grid | ~25% | **Do not use** — Outlook ignores entirely |
| `position: absolute/relative` | ~60% | Unreliable positioning |
| `float` for complex layouts | Varies | Use tables instead |

### Recommended Structure

```
┌─────────────────────────────────────────────────────┐
│  Wrapper Table (width: 100%, background color)      │
│  ┌───────────────────────────────────────────────┐  │
│  │  Container Table (max-width: 600px, centered) │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │  Content rows as table rows             │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**Key points:**
- Use a **600px maximum width** for the main content area (industry standard)
- Center the container using `align="center"` on the table or `margin: 0 auto`
- Nest tables for complex layouts rather than relying on CSS

---

## Sizing & Spacing

### Width & Height

| Property | Support | Notes |
|----------|---------|-------|
| `width` (px) | ~100% | Always safe |
| `width` (%) | ~100% | Safe, use for fluid layouts |
| `height` (px) | ~95% | Generally safe |
| `min-width` | ~85% | **Outlook ignores** |
| `max-width` | ~85% | **Outlook ignores** |
| `min-height` | ~80% | **Outlook ignores** |
| `max-height` | ~80% | **Outlook ignores** |
| Viewport units (`vw`, `vh`) | ~80% | **Avoid** — Outlook fails |
| `fr` units | ~25% | **Do not use** — CSS Grid only |

### ⚠️ Important: Avoid `fr` Units

The `w-[1fr]` syntax in Tailwind is CSS Grid-specific. In email templates, always use:
- **Percentages**: `w-[50%]`, `w-[33.33%]`
- **Fixed pixels**: `w-[300px]`, `w-[200px]`

### Padding vs Margin

| Property | Native Support | `svelte-emails` Support |
|----------|----------------|-------------------------|
| `padding` | ~100% | ✅ **Use freely** — universally supported |
| `margin` | ~70% | ✅ **Emulated** — wrapper table with padding |

**How margin emulation works:**

In `svelte-emails`, margins are emulated by wrapping elements in a table cell with padding. This provides 100% email client compatibility while preserving the familiar margin API.

```svelte
<!-- Both are safe to use in svelte-emails -->
<Div m-4>Content with margin</Div>
<Div p-4>Content with padding</Div>
```

**For raw HTML emails (without emulation):** Use padding or `<Spacer>` components instead of margins.

---

## Typography

### ✅ Fully Supported Properties

| Property | Tailwind Example | CSS Property |
|----------|------------------|--------------|
| Font size | `text-sm`, `text-lg` | `font-size` |
| Font weight | `font-bold`, `font-normal` | `font-weight` |
| Font style | `italic` | `font-style` |
| Text color | `text-[#333]` | `color` |
| Text alignment | `text-center` | `text-align` |
| Line height | `leading-6` | `line-height` |
| Letter spacing | `tracking-wide` | `letter-spacing` |
| Text decoration | `underline`, `line-through` | `text-decoration` |
| Text transform | `uppercase`, `lowercase` | `text-transform` |

### Font Families

Always use **web-safe font stacks** with fallbacks:

```ts
fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
```

**Web-safe fonts:**
- `Arial`, `Helvetica` — Sans-serif
- `Georgia`, `Times New Roman` — Serif
- `Courier New`, `monospace` — Monospace
- `Verdana`, `Tahoma` — Sans-serif

**Note:** Web fonts (`@font-face`) have limited support (~60%) and require `<style>` blocks which many clients strip.

### Markdown-Style Syntax Support

The content parsing supports these inline styles:

| Syntax | Output | Support |
|--------|--------|---------|
| `**bold**` | `<strong>` | ~100% |
| `*italic*` | `<em>` | ~100% |
| `~~strikethrough~~` | `<s>` | ~100% |
| `__underline__` | `<u>` | ~100% |
| `[link](url)` | `<a href>` | ~100% |
| `^superscript^` | `<sup>` | ~100% |
| `_subscript_` | `<sub>` | ~100% |
| `` `code` `` | `<code>` | ~95% |
| `(#color)text(/)` | Inline color | ~100% |
| `[#color]text[/]` | Background color | ~95% |

---

## Colors & Backgrounds

### ✅ Safe to Use

| Property | Support | Notes |
|----------|---------|-------|
| `color` | ~100% | Text color always works |
| `background-color` | ~100% | Solid backgrounds work everywhere |
| Hex colors (`#ffffff`) | ~100% | Preferred format |
| RGB (`rgb(255,255,255)`) | ~95% | Safe |
| Named colors (`red`, `blue`) | ~100% | Safe but less precise |

### ⚠️ Limited Support

| Property | Support | Notes |
|----------|---------|-------|
| `rgba()` with alpha | ~85% | Some clients ignore alpha |
| `background-image` (CSS) | ~70% | **Outlook ignores** |
| CSS Gradients | ~50% | **Do not rely on** |
| `opacity` | ✅ Emulated | Supported via color blending |

### Background Images

For background images to work in Outlook, you need **VML (Vector Markup Language)** fallbacks:

```html
<!--[if gte mso 9]>
<v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;height:400px;">
  <v:fill type="tile" src="image.jpg" color="#cccccc" />
  <v:textbox inset="0,0,0,0">
<![endif]-->
<div style="background-image: url('image.jpg'); background-color: #cccccc;">
  <!-- Content -->
</div>
<!--[if gte mso 9]>
  </v:textbox>
</v:rect>
<![endif]-->
```

**Always provide a solid `background-color` fallback.**

---

## Borders & Visual Effects

### Borders

| Property | Support | Notes |
|----------|---------|-------|
| `border` | ~100% | Fully supported |
| `border-width` | ~100% | Safe |
| `border-style` | ~100% | `solid`, `dashed`, `dotted` all work |
| `border-color` | ~100% | Safe |
| Individual borders (`border-top`, etc.) | ~95% | Generally safe |

### Border Radius (Rounded Corners)

| Client | Support |
|--------|---------|
| Apple Mail | ✅ Yes |
| Gmail (Web & App) | ✅ Yes |
| Outlook.com | ✅ Yes |
| Yahoo Mail | ❌ No |
| AOL Mail | ❌ No |
| **Outlook Windows** | ❌ **No** |
| Outlook Mac | ✅ Yes |

**Overall support: ~80%**

For rounded buttons in Outlook Windows, use VML:

```html
<!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" 
  href="https://example.com" style="height:40px;v-text-anchor:middle;width:200px;" 
  arcsize="10%" strokecolor="#2563eb" fillcolor="#2563eb">
  <w:anchorlock/>
  <center style="color:#ffffff;font-family:sans-serif;font-size:14px;font-weight:bold;">
    Button Text
  </center>
</v:roundrect>
<![endif]-->
<!--[if !mso]><!-->
<a href="https://example.com" style="background-color:#2563eb;border-radius:4px;color:#ffffff;display:inline-block;padding:12px 24px;">
  Button Text
</a>
<!--<![endif]-->
```

### Box Shadow

| Client | Support |
|--------|---------|
| Apple Mail | ✅ Yes |
| Gmail | ⚠️ Partial |
| **Outlook Windows** | ❌ **No** |
| Yahoo/AOL | ❌ No |

**Overall support: ~63%**

Treat shadows as **progressive enhancement only**. The email must look good without them.

### Other Effects

| Property | Support | Recommendation |
|----------|---------|----------------|
| `box-shadow` | ~63% | Progressive enhancement only |
| `text-shadow` | ~50% | Avoid |
| `transform` | ~30% | **Do not use** |
| `filter` | ~25% | **Do not use** |
| `transition` / `animation` | ~20% | **Do not use** |

---

## Images

### Format Support

| Format | Support | Notes |
|--------|---------|-------|
| JPEG | ~100% | Best for photos |
| PNG | ~100% | Best for graphics with transparency |
| GIF | ~100% | Animations play in most clients |
| SVG (via `<img src>`) | ~93% | Generally safe as external file |
| SVG (inline `<svg>`) | ~40% | **Avoid** — Gmail strips inline SVG |
| WebP | ~70% | Growing support, provide fallback |

### Image Best Practices

1. **Always include dimensions**
   ```svelte
   <Img src="..." width={600} height={400} alt="Description" />
   ```

2. **Always include `alt` text** — Images are blocked by default in many clients

3. **Use absolute URLs** — Relative paths won't work when the email is opened

4. **Host images on HTTPS** — Mixed content may be blocked

5. **Optimize file sizes** — Large images slow loading and may be clipped

6. **Assume images will be blocked** — The email should make sense even with images hidden

### Retina/HiDPI Images

For sharp images on high-density displays:
- Create images at 2x the display size
- Set explicit `width` and `height` attributes to the 1x size
- The image will display at the smaller size but remain crisp

```svelte
<!-- 600px wide image, created at 1200px for retina -->
<Img src="hero@2x.jpg" width={600} height={300} alt="Hero image" />
```

---

## Responsive Design

### The Hard Truth

**Media queries cannot be inlined** and only ~75% of email clients support them even when included in a `<style>` block.

| Client | Media Query Support |
|--------|---------------------|
| Apple Mail | ✅ Yes |
| iOS Mail | ✅ Yes |
| Gmail App | ❌ No |
| Gmail Web | ❌ No |
| Outlook Windows | ❌ No |
| Outlook.com | ✅ Yes |
| Yahoo Mail | ✅ Yes |

### `mobile-only` / `desktop-only` Utilities

These utilities rely on media queries.

**Support:**
- ✅ **Supported:** Gmail (Web & App), Apple Mail, Yahoo, AOL, Samsung Mail
- ❌ **Not Supported:** Outlook Windows (ignores media queries)

**Behavior in Outlook Windows:**
- `mobile-only`: Hidden (via `display: none`)
- `desktop-only`: Visible (ignores the hide rule)
- **Result:** Outlook Windows always displays the desktop version.

**Recommendation:** Use these freely, but ensure the desktop version is the default fallback.

### Fluid Design Alternative

Instead of breakpoint-based responsive design, use **fluid single-column layouts**:

```svelte
<Email>
  <!-- Single column, max 600px, centers on desktop, fills on mobile -->
  <Grid cols>
    <Div w-[100%] style="max-width: 600px;">
      <!-- Content stacks naturally -->
    </Div>
  </Grid>
</Email>
```

### Mobile-First Considerations

- **Touch targets:** Buttons should be at least 44x44px
- **Font sizes:** Minimum 14px for body text on mobile
- **Single column:** Easiest to read on small screens
- **Stacked layout:** Consider `<Grid rows>` for content that's side-by-side on desktop

---

## Client-Specific Quirks

### Outlook (Windows) — The Problem Child

Outlook 2007-2019 uses **Microsoft Word's rendering engine**, not a browser engine. This causes:

| Feature | Outlook Behavior |
|---------|------------------|
| `max-width` / `min-width` | Ignored |
| `margin` | Partially supported |
| `border-radius` | Ignored |
| `box-shadow` | Ignored |
| CSS backgrounds | Ignored (use VML) |
| Flexbox/Grid | Ignored |
| Line-height on images | Adds extra space |
| Animated GIFs | Shows first frame only |

**Workaround patterns:**
- Use `<!--[if mso]>` conditional comments for Outlook-specific code
- Use VML for rounded corners and background images
- Use tables for all layouts
- Add `line-height: 0` on cells containing only images

### Gmail

| Behavior | Notes |
|----------|-------|
| Strips `<style>` tags | Only in non-Google accounts via IMAP |
| Strips inline SVG | Use `<img src="file.svg">` instead |
| Clips emails > 102KB | Keep HTML under 100KB |
| Blocks images by default | User must enable |
| Removes `class` attributes | Classes are stripped |

### Apple Mail / iOS Mail

Generally the **most permissive** email client:
- Supports most CSS3 properties
- Renders media queries
- Displays images by default
- Supports dark mode CSS

### Yahoo / AOL Mail

- No `border-radius` support
- No `box-shadow` support
- Limited responsive support
- Generally more restrictive than Gmail

---

## Testing

### Pre-Send Checklist

- [ ] HTML is under 100KB (Gmail clips larger emails)
- [ ] All images have `alt` text
- [ ] All images have explicit `width` and `height`
- [ ] All links use `https://`
- [ ] Email is readable with images disabled
- [ ] Email is readable without CSS (plain HTML structure)
- [ ] Subject line and preview text are set
- [ ] Unsubscribe link is present (required by law in many jurisdictions)

### Testing Tools

| Tool | Purpose |
|------|---------|
| [Litmus](https://www.litmus.com/) | Cross-client rendering previews |
| [Email on Acid](https://www.emailonacid.com/) | Cross-client testing |
| [Mail-Tester](https://www.mail-tester.com/) | Spam score checking |
| [HTML Email Check](https://www.htmlemailcheck.com/) | HTML validation |
| [Can I Email](https://www.caniemail.com/) | CSS property support database |

### Key Clients to Test

**Desktop:**
- Outlook 2019/2021 (Windows)
- Outlook (Mac)
- Apple Mail
- Thunderbird

**Webmail:**
- Gmail
- Outlook.com
- Yahoo Mail
- AOL Mail

**Mobile:**
- iOS Mail
- Gmail App (iOS & Android)
- Outlook App (iOS & Android)

---

## Quick Reference Tables

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
| `background-image` | ❌ | ✅ | ✅ | ✅ |
| `font-*` properties | ✅ | ✅ | ✅ | ✅ |
| `text-align` | ✅ | ✅ | ✅ | ✅ |
| `opacity` | ❌ | ⚠️ | ✅ | ❌ |
| Media queries | ❌ | ❌ | ✅ | ✅ |

### Utility Class Recommendations

| Category | ✅ Safe to Use | ⚠️ Use with Caution | ❌ Avoid |
|----------|----------------|---------------------|----------|
| **Width** | `w-[px]`, `w-[%]`, `w-full`, `w-screen`* | `max-w-*`, `min-w-*` | `w-[fr]` |
| **Height** | `h-[px]`, `h-auto`, `h-full`, `h-screen`* | `min-h-*` | `max-h-*`, `h-[vh]` |
| **Spacing** | `p-*`, `px-*`, `py-*`, `m-*`** | — | — |
| **Typography** | All `text-*`, `font-*`, `leading-*` | — | — |
| **Colors** | `text-[#]`, `bg-[#]`, `/opacity`*** | — | — |
| **Borders** | `border-*` | `rounded-*` | `shadow-*` |
| **Layout** | `text-center`, `align-*` | `float-*` | `flex`, `grid` |
| **Effects** | `opacity-*`*** | — | `transform`, `filter` |
| **Responsive** | — | `mobile-only`, `desktop-only` | `sm:`, `md:`, `lg:` |

*`w-screen`/`h-screen` are aliases for 100% (viewport units not supported)  
**Margins are emulated via wrapper table padding (100% support)  
***Opacity is emulated via color blending to solid hex (100% support)

---

## Summary

Building emails requires a mindset shift from modern web development:

1. **Tables, not divs** — Use `<Grid>` for all layouts
2. **Inline, not classes** — All styles become inline CSS
3. **Padding, not margins** — Margins are unreliable
4. **Pixels and percents** — Avoid modern CSS units
5. **Progressive enhancement** — Advanced features are bonuses, not requirements
6. **Test, test, test** — Email clients are unpredictable

The `svelte-emails` library abstracts much of this complexity, but understanding the underlying constraints helps you make better design decisions and debug issues when they arise.
