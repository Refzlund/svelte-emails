# Table-Based Layouts

HTML tables remain the foundation of reliable email layout[^1]. Nearly all email clients (desktop, web and mobile) render `<table>`-based layouts correctly, whereas CSS-based layouts (floats, flexbox, divs, etc.) often break in clients like Outlook or Lotus Notes[^2]. For this reason, modern email development still "comes back to those all-encompassing `<table>` tags"[^1]. Expert guides note that many clients simply ignore or mangle CSS positioning (floats, margins, padding), so nesting tables and setting explicit cell widths is the safest approach[^3]. In practice this means structuring an email as a series of tables (often with a wrapper table for width and background color) and defining fixed or percentage widths on each `<td>`. This "old school" approach yields much more consistent rendering across Outlook, Gmail, Yahoo, etc.

- Tables should include `cellpadding="0" border="0"` and specified widths on `<td>` cells for predictable layout[^1].
- Nest tables to simulate margins/padding (rather than relying on CSS margin support)[^1].
- Always set a fallback background color on a container table, since some clients ignore `<body>` backgrounds[^1].

> [!NOTE]
> **Key point:** Use HTML tables for structure. Modern CSS layout techniques are not broadly supported in email, so "you'll want to set up some structural HTML tables to make sure you end up with an email that…holds together well"[^3].

---

## Raster Images (PNG, JPEG, GIF)

Most clients fully support common image formats (PNG, JPEG, GIF) when inserted via an `<img src="...">` tag. However, by default many clients block remote images for security, so images often appear as placeholders until the user allows them. It is essential to include meaningful `alt` text and explicit `width`/`height` attributes on `<img>`s. Also prefer HTTPS image URLs (some clients may block mixed content).

- **Image Blocking:** Gmail, Yahoo, Outlook.com and others typically **block images by default**, showing a blank or placeholder and alt text instead[^4]. For example, embedded images tested with data-URIs were shown only in iOS Mail or legacy Outlook; Gmail and Yahoo Webmail displayed a "blocked image" placeholder and the ALT text[^4]. In practice, assume images will be hidden until the user enables them.

- **Embedding vs Linking:** Embedding images as Base64 data (data URIs) is *not* recommended – support is uneven and file sizes balloon. Tests show Outlook 2007–2016 and Gmail do **not** render base64 `<img>` data (they replace it with "Linked image cannot be displayed"), whereas iOS Mail and older Outlook/Mail clients might[^4]. In short, **linked images** (external URLs) are universally supported, but still require user approval; inline CID embeddings or data URIs are risky and rarely bypass filters[^4].

- **Responsive Images:** To serve high-resolution (retina) images, include width/height and use scalable units (or `srcset`/`<picture>` with PNG fallbacks); note that most email clients do not support `<picture>` or `srcset` fully. Use separate high-DPI images if needed.

- **Summary:** All major clients will display `<img src="…">` after permission. Provide ALT text and allow for the image being hidden. Avoid relying on embedded data URIs or unusual formats (WebP support is emerging but not universal).

---

## Background Images (Inline vs CSS)

Using background images in email is **tricky**. Many clients have limited CSS support for `background-image` and related properties[^5]. A common approach is to use a combination of techniques:

| Client Support     | CSS `background-image` | HTML `background` attr       | VML *bulletproof* method |
|--------------------|------------------------|------------------------------|--------------------------|
| Outlook (Windows)  | ❌ No (Word engine)    | ✔️ Yes (on `<body>`/`<table>`) | ✔️ Required (VML hack)   |
| Most other clients | ✔️ Yes                 | ✔️ Yes (as fallback)         | —                        |

- **CSS vs HTML Attribute:** For clients that support it (Apple Mail, Gmail app, Yahoo Mail, etc.), you can set a CSS background (e.g. on a `<td>` or wrapper table) or use inline CSS on `<body>`. However, older Outlook (2007–2019) **ignores CSS backgrounds entirely**. Campaign Monitor's guide notes that clients "have limited support for CSS background images" and suggests using the HTML `<table background="…">` (or `<body background="…">`) attribute as a basic fallback[^5].

- **Bulletproof Background (VML):** To support Outlook Windows, use VML. The industry-standard "bulletproof background" technique wraps content in a conditional VML `<v:rect>` with `<v:fill src="…">` for the image, falling back to a solid color. In essence, you code both a CSS background and a VML background so that all clients show something. (See resources like [Campaign Monitor's Bulletproof Background Images](https://backgrounds.cm) for templates.) For example:

```html
<!--[if gte mso 9]>
<v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;">
  <v:fill src="bg.jpg" color="#cccccc" />
  <v:textbox inset="0,0,0,0">
<![endif]-->
  <div style="background:url('bg.jpg') no-repeat center/cover; background-color:#cccccc;">
    <!-- email content here -->
  </div>
<!--[if gte mso 9]>
  </v:textbox>
</v:rect>
<![endif]-->
```

- **Fallback Color:** Always specify a background-color fallback. If the image fails or is stripped, the color will show.

> [!TIP]
> CSS background images *do* work in Gmail, Apple Mail, Yahoo, iOS/Android apps, etc., but Outlook on Windows requires the HTML `background` attribute or VML workarounds[^5][^6]. Plan for a solid-color fallback for all cases.

---

## CSS Shapes & Visual Effects

Many modern CSS visual properties are only partially supported in email. Key examples include **rounded corners** and **shadows**.

- **Border-Radius (Rounded Corners):** Widely supported in most clients (Apple Mail, Gmail, Outlook.com, iOS/Android Mail, Thunderbird, etc.), **except** classic Outlook on Windows and most old webmail (Yahoo/AOL)[^7]. In Outlook desktop, you can simulate rounded corners using VML's `<v:roundrect>` (Campaign Monitor's guide notes this VML approach for Outlook)[^7]. For example, a button with `border-radius` in CSS will look normal everywhere *except* Outlook Win; in that case you can code a `<v:roundrect>` shape. Overall support is high (≈83%)[^7].

- **Box-Shadow (Drop Shadows):** Partially supported. Apple Mail, Gmail (modern), and many mobile clients handle `box-shadow`, but Outlook desktop does not, and Gmail's support is limited. (For instance, Gmail's mobile app only applies shadows on non-Google accounts[^8].) As of late 2023, about 63% of clients support CSS shadows in email[^8]. In practice, shadows are a "nice if they show up" effect; Outlook will ignore them.

- **Other Effects:** CSS gradients, filters, transforms, etc., have even poorer support. For example, linear-gradient backgrounds are only supported in Apple Mail and very recent Gmail (2021+)[^9]. In general, complex CSS visuals tend to fail in a subset of clients. Campaign Monitor's guide remarks "limited support for CSS3 properties" like these[^5]. Fallbacks (flat background color, PNG images) are safer.

> [!IMPORTANT]
> Stick to basic CSS: border colors, solid backgrounds, and use tables/padding for spacing. Use `border-radius` and `box-shadow` only for progressive enhancement (with the knowledge that Outlook will ignore them). Where rounded corners are critical, implement them via VML for Outlook[^7].

---

## SVG (Scalable Vector Graphics)

SVG usage in email is highly constrained. There are two main ways to include SVG: as an external linked image (`<img src="graphic.svg">`) or as inline markup (`<svg>…</svg>` in the HTML). Support differs dramatically between them.

- **Linked SVG Files:** Including an SVG by URL (e.g. `<img src="logo.svg">`) is supported by most email clients. [CanIEmail](https://www.caniemail.com/features/image-svg/) reports ~93% overall support for linked SVGs[^10]. Specifically, modern Gmail, Yahoo, AOL, Apple Mail, Outlook (all versions), and many mobile clients will render an SVG file just like a PNG. However, a few legacy clients (very old Lotus Notes, Gmail mobile before 2020) did not. In practice, using an `<img>` tag pointing to an `.svg` is safe for most clients. Ensure the SVG has no external scripts or animations (clients strip those) and keep it simple.

- **Inline SVG Markup:** Putting the SVG code directly into the email HTML (`<svg xmlns=...>...</svg>`) is far less supported. Overall support is only ~40%[^11]. Some clients (Apple Mail, Outlook iOS/Android, some webmail) will render inline SVG, but **many block it entirely**. Notably, Gmail (Web and Mobile) will strip out any inline `<svg>` elements, resulting in no graphic[^12]. (A recent report confirms "Gmail blocks inline `<svg>` images, leaving broken icons"[^12].) Outlook (classic desktop) already ignores inline SVG (shows blank), and even Outlook Web/New Windows will drop inline SVG starting Sep 2025[^13]. In short, **don't rely on inline SVG** for production email.

- **Client Limitations:**
  - *Gmail:* Strips inline `<svg>` content. However, Gmail **will render an SVG if used as an image source** (see next point).
  - *Outlook Desktop (Win):* Will soon drop inline support (sending Sept 2025)[^13]. Currently shows inline SVG in Outlook.com or new Outlook but not in classic Outlook.
  - *Mobile Apps:* iOS Mail and many Android clients do render inline SVG today.
  - *Others:* Most webmail (Yahoo, AOL) added SVG support around 2020.

- **Best Practices & Fallbacks:** Because support is so spotty, the safest approach is to **use raster fallbacks** for any SVG graphics. Some strategies:

  - **Use `<img src>` with a PNG fallback:** For example, wrap SVG in a `<picture>` tag or use conditional comments (though `<picture>` isn't widely supported). At minimum, include a PNG version in a `srcset` or as the `src` and the SVG as a `type`=fallback. However, *picture/srcset support in email is very limited*, so the reliable approach is to use multiple `<img>` tags hidden/shown via CSS (complicated and brittle).

  - **Base64 Data URI in `<img>`:** Gmail does accept a data-URI SVG inside an `<img>` tag. One workaround is to embed the raw SVG in Base64 and set it as `<img src="data:image/svg+xml;base64,…">`. Medium reports "Gmail does support SVGs embedded as base64 strings inside `<img>` tags"[^14]. (This trick ensures Gmail displays it, but note Gmail still blocks external images by default unless allowed.) This approach also works around Outlook's upcoming removal of inline SVG, since it treats it like a regular image.

  - **PNG Fallback (Recommended):** The simplest strategy is often to avoid SVG in email templates altogether. Designmodo's survey warns "SVG has terrible support… I would avoid SVG for now and stick with PNG/JPG images"[^15]. You can generate a high-res PNG or GIF version of the vector and use that in emails. The file size trade-off is usually acceptable, and then no clients will break.

  - **Alt Text:** As always, include `alt` text so that if the graphic (SVG or not) is blocked or fails, the reader sees a description.

> [!WARNING]
> Linked SVG files work in most clients (around 90+% coverage)[^10], but inline SVG code is unreliable (only ~40% coverage[^11] and often stripped by Gmail[^12]). For full compatibility, either use `<img>` referencing an SVG (with the above caveats) or just use PNG/JPEG images instead. Inline SVG should only be used when targeting environments known to support it, and always provide a bitmap fallback.

---

## Support Summary

The table below summarizes support for key graphical features in representative email clients: a checkmark (✔️) indicates general support, "❌" indicates the feature is not natively supported (often requiring a workaround), and notes highlight important caveats.

| Feature / Client              | Outlook (Windows)   | Gmail (Web)        | Yahoo/AOL (Web) | Apple Mail (mac/iOS)  |
|-------------------------------|---------------------|--------------------|-----------------|-----------------------|
| **Table Layout (HTML)**       | ✔️ (universal)      | ✔️                 | ✔️              | ✔️                    |
| **Raster Images (PNG/JPEG)**  | ✔️ (blocked by default) | ✔️ (blocked by default) | ✔️ (blocked by default) | ✔️ (auto-display) |
| **CSS Background Image**      | ❌ (use VML)        | ✔️ (native CSS)    | ✔️ (native CSS) | ✔️ (native CSS)       |
| **Border-Radius (CSS)**       | ❌ (VML RoundRect)  | ✔️                 | ❌              | ✔️                    |
| **Box-Shadow (CSS)**          | ❌                  | ✔️ (yes, limited)  | ❌              | ✔️                    |
| **Media Queries**             | ❌ (Ignored)        | ✔️                 | ✔️              | ✔️                    |
| **SVG (linked via `<img>`)**  | ✔️                  | ✔️                 | ✔️              | ✔️                    |
| **SVG (inline `<svg>`)**      | ❌ (dropping soon)  | ❌ (stripped out)  | ✔️              | ✔️ (background req.)  |

> [!CAUTION]
> Always test your emails in all target clients. Use tools like [Litmus](https://www.litmus.com/) or [Email on Acid](https://www.emailonacid.com/) to confirm that your tables, images, backgrounds and any VML are rendering correctly. When in doubt, opt for the most "bulletproof" solution: table-based structure, external `<img>` PNGs, solid background colors and fallback mechanisms, and minimal use of advanced CSS.

---

## Sources

HTML/CSS email guides and support charts ([Campaign Monitor](https://www.campaignmonitor.com/dev-resources/guides/coding-html-emails/), [Litmus](https://www.litmus.com/), [Email on Acid](https://www.emailonacid.com/)) were referenced. For example, Campaign Monitor's developer guide emphasizes reverting to table layouts and using VML fallbacks[^1][^5]. [CanIEmail](https://www.caniemail.com/)'s charts (based on Campaign Monitor data) show high support for table layouts and images, limited support for CSS backgrounds/shapes and very limited support for inline SVG[^10][^11]. Industry write-ups also note that Gmail strips inline SVG[^12] and recommend using PNG/JPG instead[^15].

---

## Footnotes

[^1]: [Campaign Monitor - Coding HTML Emails](https://www.campaignmonitor.com/dev-resources/guides/coding-html-emails/) - "Lean on tables—and not just for data"

[^2]: [Campaign Monitor - Tables or Divs for Email](https://www.campaignmonitor.com/blog/email-marketing/ask-a-designer-tables-or-divs-for-email/) - "Additionally, tables are currently the only reliable way to achieve consistent layouts across email clients"

[^3]: [Campaign Monitor - HTML Email Guide](https://www.campaignmonitor.com/dev-resources/guides/coding-html-emails/) - "Gmail, Outlook, Lotus Notes, and other clients ignore or mangle CSS positioning, so you'll want to set up structural HTML tables"

[^4]: [Campaign Monitor - Embedded Images in HTML Email](https://www.campaignmonitor.com/blog/email-marketing/embedded-images-in-html-email/) - Email client image blocking behavior and data URI support

[^5]: [Campaign Monitor - CSS Background Image Support](https://www.campaignmonitor.com/css/color-background/background-image/) - "Working with background images in email clients is tricky due to limited support—especially CSS3 properties"

[^6]: [Campaign Monitor - Background Image Outlook Support](https://www.campaignmonitor.com/css/color-background/background-image/) - "For Outlook support, the background attribute or VML is required"

[^7]: [CanIEmail - CSS Border Radius](https://www.caniemail.com/features/css-border-radius/) - Approximately 83% support; VML `<v:roundrect>` required for Outlook

[^8]: [CanIEmail - CSS Box Shadow](https://www.caniemail.com/features/css-box-shadow/) - Approximately 63% support; Gmail mobile only applies shadows on non-Google accounts

[^9]: [CanIEmail - CSS Linear Gradient](https://www.caniemail.com/features/css-linear-gradient/) - Limited support primarily in Apple Mail and recent Gmail versions

[^10]: [CanIEmail - SVG Image Format](https://www.caniemail.com/features/image-svg/) - ~93% support for SVG via `<img>` tag

[^11]: [CanIEmail - Inline SVG Support](https://www.caniemail.com/features/html-svg/) - Only ~40% support for inline `<svg>` markup

[^12]: [Medium - Why Your SVG Icons Break in Gmail](https://medium.com/@muhammadabdullahkhalil/why-your-svg-icons-break-in-gmail-and-how-to-fix-it-in-rails-with-one-line-of-code-eb4f62fdb073) - "Gmail blocks inline `<svg>` images, leaving broken icons"

[^13]: [Topedia - Microsoft Retiring Inline SVG Support](https://blog-en.topedia.com/2025/08/microsoft-is-retiring-support-for-inline-svg-images-in-outlook/) - "Microsoft is retiring support for inline SVG images in Outlook starting September 2025"

[^14]: [Medium - SVG Fix for Gmail](https://medium.com/@muhammadabdullahkhalil/why-your-svg-icons-break-in-gmail-and-how-to-fix-it-in-rails-with-one-line-of-code-eb4f62fdb073) - "Gmail does support SVGs embedded as base64 strings inside `<img>` tags"

[^15]: [Designmodo - HTML CSS Emails](https://designmodo.com/html-css-emails/) - "SVGs typically have lower file sizes but support is even worse. I would avoid SVG for now and stick with PNG/JPG images"
