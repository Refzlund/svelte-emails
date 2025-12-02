# Email CSS Support: What Works vs What Doesn't (Tailwind-style Utilities)

Email clients have very limited and inconsistent CSS support. In practice **all styles must be inline** on elements – external stylesheets or non-element selectors often get stripped[^1]. The advice from email design experts is to *"utilize inline styles"* and stick to **fundamental CSS properties** (font sizes, colors, backgrounds) while **avoiding complex effects** like gradients, shadows or animations[^2]. Use HTML tables for overall layout (since CSS flex/grid have poor support) and rely on simple block/float positioning[^3]. Testing is essential because different clients (Gmail, Outlook, Apple Mail, etc.) vary widely.

> [!IMPORTANT]
> - **Inline styles are required.** Most email clients strip out `<link>` or `<style>` tags, so every utility class must generate inline CSS[^1].
> - **Basic CSS only.** Stick to simple properties: `font-size`, `color`, `background-color`, etc. Complex features (CSS variables, shadows, gradients, animations) are not supported in many clients[^4].

---

## Layout & Display

- **Tables and floats over flex/grid.** Emails typically use HTML tables for grid layouts. Tailwind's `block`, `inline-block`, `float-left/right`, and `clear-*` classes map to inline CSS (`display:block/inline-block`, `float: left/right`) which are well supported in email (especially for side-by-side elements). CSS Grid and Flexbox are **not reliably supported** (Outlook's Word engine ignores them). The designmodo guide explicitly says: *"use tables rather than floats, flexbox, or grid"*[^3].

- **Display none ("hidden").** Setting `display: none` inline (Tailwind's `hidden`) is broadly supported today (Gmail and most modern clients respect it). Older hacks were needed in the past, but as of recent updates even Gmail supports inline `display:none`[^5]. Still, always test – some versions of Yahoo or Outlook.com might ignore it.

- **Overflow & other layout.** Tailwind's `overflow-*` classes exist but are rarely useful in email. Many clients ignore overflow on container elements, so these can generally be omitted.

- **Vertical alignment.** CSS `vertical-align` (Tailwind's `align-*`) is supported and useful for inline/table-cell content. For example, `align-top`, `align-middle`, etc., will work in most email clients on `<td>` or inline elements.

---

## Sizing (Width/Height)

- **Width/height (px or %).** Inline `width` and `height` are mostly safe. Tailwind classes like `w-4`, `w-full` (`width: 100%`), or fixed pixel widths (`w-[200px]`) will generally render correctly. Use pixel or percentage units rather than viewport units.

- **Min/max width:** Support is partial. Most clients (Apple Mail, Gmail, Yahoo, etc.) handle `min-width` and `max-width` in inline styles, but Outlook on Windows **ignores** them[^6][^7]. In practice, it's common to use a fixed table width (e.g. a 600px container table) and use `width:100%` for fluid layouts rather than relying on `max-width`.

- **Viewport units:** `vw`/`vh` units are not supported in Outlook.
    - **`w-screen` / `h-screen`:** These are supported as **aliases for 100%** (`w-full` / `h-full`). This allows you to use the semantic name "screen" on root elements, but it renders as `width: 100%` / `height: 100%` to ensure compatibility.

---

## Spacing (Padding vs. Margin)

- **Padding (`p-*`).** Inline padding is **safe** across virtually all clients[^9]. Using Tailwind's `p-`, `px-`, `py-`, etc. will translate to `padding` styles that work even in Outlook. Table cell padding is especially reliable (you can also use the `cellpadding` attribute for older clients).

- **Margin (`m-*`).** Inline margins are *unreliable*. For example, Outlook.com/Hotmail explicitly **dropped support** for CSS margins (margin-top, margin-right, etc.)[^10]. Gmail and Apple Mail generally handle margins, but because of Outlook's behavior, it's safer to avoid margins for spacing. Instead, use padding inside cells or extra spacer elements. Tailwind's `m-auto` (for centering) also may not work consistently; center tables using `align="center"` or `text-align:center` on a container instead.

> [!NOTE]
> In `svelte-emails`, margins are **emulated via wrapper table padding**, making them safe to use. The warning above applies to raw HTML emails without this emulation.

---

## Typography

| Property | Support | Tailwind Classes | Notes |
|----------|---------|------------------|-------|
| Font sizes | ✔️ Supported | `text-sm` through `text-9xl` | Use pixel-based sizes for predictability |
| Font weights | ✔️ Supported | `font-bold`, `font-normal`, etc. | Works via inline CSS |
| Font styles | ✔️ Supported | `italic`, `not-italic` | Both work |
| Text alignment | ✔️ Supported | `text-left/center/right/justify` | Works on block elements (e.g. `<td>`) |
| Text decoration | ✔️ Supported | `underline`, `line-through`, etc. | Will inline as expected |
| Text transform | ✔️ Supported | `uppercase`, `lowercase`, `capitalize` | Works in all clients |
| Line-height | ✔️ Supported | `leading-*` | Most clients honor this |
| Letter-spacing | ✔️ Supported | `tracking-*` | 100% support according to [Can I Email](https://www.caniemail.com/features/css-letter-spacing/)[^11] |
| Word-break/whitespace | ⚠️ Inconsistent | `break-words`, `whitespace-nowrap` | Often unnecessary; clients do their own line-breaking |

---

## Colors and Backgrounds

- **Text color:** Inline `color` is fully supported. Tailwind's `text-[#hex]` classes (or named colors) will set `color: #...` and work in all major clients.

- **Background color:** Supported. Use `bg-[#hex]` or standard color names; it inlines as `background-color`.

- **Transparent/inherit/current:** Using `transparent` simply yields no fill, which is fine. `inherit` and `currentColor` aren't very useful in an inline context (no parent CSS inheritance), but if used, they usually default correctly.

- **Background images/gradients:** Not supported by Tailwind's listed classes (none provided) – good, because most email clients do **not** support CSS `background-image` (except limited cases) and no one has classes for gradients. Stick to solid backgrounds.

---

## Borders and Corners

- **Border width/style/color:** All basic borders work. Tailwind's `border`, `border-2`, `border-t`, `border-dashed`, `border-[#hex]`, etc., will inline as `border: 1px solid #...` or similar and are widely supported. Outlook will display simple borders (it has an older rendering engine, but basic borders and colors are fine).

- **Border radius (rounded corners):** This is **not supported** by Outlook on Windows (it uses Word's renderer). As a StackOverflow answer notes: *"style='border-radius:15px' does **not** create rounded corners in Outlook."*[^12]. In practice, about 80% of email clients support `border-radius`[^13]. You can keep Tailwind's `rounded-*` classes for modern clients, but expect square corners in Windows Outlook.

- **Partial border radius (`rounded-tl`, etc):** Same issue – Outlook will ignore them. If Outlook must match, you'd need VML hacks (beyond Tailwind scope).

- **Border none/hidden:** Tailwind's `border-none` (no border) works. `outline-*` classes exist but outlines are rarely used in email (and Outlook may ignore CSS outlines).

> [!NOTE]
> Border radius works in ~80% of email clients but **not** in Outlook for Windows. Use VML hacks if rounded corners are critical for Outlook compatibility.

---

## Images (`<img>`) and Media

- **Width/height:** Set these on `<img>` for consistent sizing. Tailwind's sizing classes apply inline and work on images.

- **Object-fit:** Tailwind's `object-contain`, `object-cover`, etc. (CSS `object-fit`) have very low support (~66% overall[^14]) and should be avoided. Instead, size your image via width/height attributes or CSS and let it scale normally. Email clients don't reliably crop/cover images via CSS.

- **Alt text:** (Not CSS, but important) Always include `alt` on `<img>` for clients that block images.

- **Media (video/SVG):** Generally not supported inline.

---

## Responsive & Mobile Tricks

- **Media queries:** Responsive utilities (like `mobile-only` or `desktop-only`) rely on CSS media queries in a `<style>` block. They **cannot be inlined**.
    - **Support:** Supported in Gmail, Apple Mail, Yahoo, and most mobile apps (~85% coverage).
    - **Outlook Windows:** Ignores media queries completely. It will always display the "desktop" view (ignoring styles inside `@media`).
    - **Strategy:** Use `mobile-only` (hidden by default, shown via media query) and `desktop-only` (shown by default, hidden via media query). Outlook Windows will see the desktop version, which is the desired fallback.

- **Mobile/desktop classes:** These require the renderer to inject a `<style>` block in the `<head>`. If your email system only supports inline styles, these will not work.

> [!NOTE]
> Media queries work in most clients **except Outlook Windows**. Design your desktop view to be the default fallback.

---

## Effects and Other Utilities

| Property | Support | Notes |
|----------|---------|-------|
| **Opacity** | ✅ Emulated | `opacity-*` is emulated via color blending. Safe to use. |
| **Overflow** | ❌ Unreliable | `overflow-*` is removed. Outlook ignores it. |
| **Transitions/animations** | ❌ Not supported | Skip these entirely |
| **Transforms/filters** | ❌ Not supported | Tailwind's `transform` and filter classes won't work |
| **Z-index** | ⚠️ Tricky | Outlook/Word often flattens z-order. Ignore layering |
| **Float and clear** | ✔️ Supported | Use `float-left/right` and `clear-left/right/both/none` inline |

---

## Summary of Tailwind Considerations

In summary, **keep only the Tailwind utilities that map to simple, well-supported CSS properties**: widths/heights, padding, font sizes/weights, colors, text align/decoration, basic borders. Mark classes that rely on margin, object-fit, opacity, media queries, or CSS Grid/Flex as "do not use in email."

### ✔️ Good for Email

```
w-... (px/%)    h-...           p-...           text-*
font-*          text-center     bg-[#]          border-...
rounded (non-Outlook)           float-left/right
align-top       align-middle    leading-*       tracking-*
underline       uppercase       italic          opacity-*
mobile-only     desktop-only
```

### ⚠️ Problematic (Avoid)

```
m-... (margins)         object-cover/contain
flex                    grid
sm:/md:/lg: prefixes    hover: states
transform               filter                  transition
```

> [!TIP]
> Always inline the styles and test in multiple clients ([Litmus](https://www.litmus.com/), [Email on Acid](https://www.emailonacid.com/), etc.).

---

## Quick Reference: CSS Property Support

| CSS Property | Support Level | Outlook (Win) | Gmail | Apple Mail |
|--------------|---------------|---------------|-------|------------|
| `display: block/inline-block` | ✔️ High | ✔️ | ✔️ | ✔️ |
| `display: none` | ✔️ High | ✔️ | ✔️ | ✔️ |
| `display: flex/grid` | ❌ Low | ❌ | ⚠️ | ✔️ |
| `width/height` (px/%) | ✔️ High | ✔️ | ✔️ | ✔️ |
| `min-width/max-width` | ⚠️ Partial | ❌ | ✔️ | ✔️ |
| `padding` | ✔️ High | ✔️ | ✔️ | ✔️ |
| `margin` | ⚠️ Partial | ❌ | ✔️ | ✔️ |
| `font-size/color` | ✔️ High | ✔️ | ✔️ | ✔️ |
| `background-color` | ✔️ High | ✔️ | ✔️ | ✔️ |
| `border` | ✔️ High | ✔️ | ✔️ | ✔️ |
| `border-radius` | ⚠️ ~80% | ❌ | ✔️ | ✔️ |
| `opacity` | ⚠️ ~70% | ❌ | ⚠️ | ✔️ |
| `object-fit` | ⚠️ ~66% | ❌ | ⚠️ | ✔️ |

---

## Sources

Email developer guides and support charts ([Litmus](https://www.litmus.com/blog/do-email-marketers-and-designers-still-need-to-inline-css), [Designmodo](https://designmodo.com/html-css-emails/), [Can I Email](https://www.caniemail.com/)) were used to verify support for key CSS properties[^1][^2][^9][^10][^12][^14][^16]. These emphasize inline styles, basic CSS only, table layouts, and note where support breaks down (e.g. Outlook not honoring margins or border-radius).

---

## Footnotes

[^1]: [Litmus - Do email marketers and designers still need to inline CSS?](https://www.litmus.com/blog/do-email-marketers-and-designers-still-need-to-inline-css) - "Since some email clients strip out `<style>` tags, inlining ensures styles reach the widest range of email clients"

[^2]: [Designmodo - HTML and CSS in Emails: What Works in 2025?](https://designmodo.com/html-css-emails/) - Stick to fundamental CSS properties and avoid complex effects

[^3]: [Designmodo - HTML and CSS in Emails](https://designmodo.com/html-css-emails/) - "Use tables rather than floats, flexbox, or grid" for layouts

[^4]: [Designmodo - HTML and CSS in Emails](https://designmodo.com/html-css-emails/) - "CSS variables, shadows, gradients, and animations should be avoided"

[^5]: [Email on Acid - Gmail Now Supports Display: None](https://www.emailonacid.com/blog/article/email-development/gmail-now-supports-display-none/) - Gmail now supports inline `display:none`

[^6]: [Can I Email - min-width property](https://www.caniemail.com/features/css-min-width/) - Limited support, Outlook ignores min-width

[^7]: [Can I Email - max-width](https://www.caniemail.com/features/css-max-width/) - ~95% support but Outlook on Windows ignores it

[^8]: [Can I Email - vw unit](https://www.caniemail.com/features/css-unit-vw/) - ~80% support for viewport units

[^9]: [Can I Email - padding](https://www.caniemail.com/features/css-padding/) - Padding is safe across virtually all clients

[^10]: [Stack Overflow - Email client support negative margin value?](https://stackoverflow.com/questions/21882361/email-client-support-negative-margin-value) - "Hotmail and Outlook.com dropped support for CSS margins"

[^11]: [Can I Email - letter-spacing](https://www.caniemail.com/features/css-letter-spacing/) - 100% support for letter-spacing

[^12]: [Stack Overflow - Rounded corners in Outlook without images](https://stackoverflow.com/questions/7405493/rounded-corners-in-outlook-without-images) - "style='border-radius:15px' does not create rounded corners in Outlook"

[^13]: [Can I Email - border-radius](https://www.caniemail.com/features/css-border-radius/) - ~80% support for border-radius

[^14]: [Can I Email - object-fit](https://www.caniemail.com/features/css-object-fit/) - ~66% support for object-fit

[^15]: [Designmodo - HTML and CSS in Emails](https://designmodo.com/html-css-emails/) - "Media queries only work in about 75% of email clients"

[^16]: [Can I Email - opacity](https://www.caniemail.com/features/css-opacity/) - ~70% support for CSS opacity
