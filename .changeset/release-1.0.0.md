---
"svelte-emails": major
---

feat: svelte-emails 1.0.0 - The Modern Email Stack 🚀

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
