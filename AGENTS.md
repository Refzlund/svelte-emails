# Agent Instructions for svelte-emails

This document guides AI agents working on the `svelte-emails` library.

1. Make a todo-list
2. Validate them with the developer
3. Execute
4. Document [ARCHITECTURE.md](ARCHITECTURE.md)

- Do not run `bun dev` etc. instead ask the developer to verify

---

## Documentation Files

### [README.md](README.md)

Quick usage examples and API overview.

### [ARCHITECTURE.md](ARCHITECTURE.md)

**The single source of truth.** Contains everything about the library:

- **Architecture:** IR tree, component registration, rendering pipeline, SSR
- **Components:** Email, Div, Table, Text, Button, Img, Spacer, etc.
- **Styling:** Tailwind-like attributes, inheritance, emulation strategies
- **Content Parsing:** Markdown syntax, variable interpolation
- **Email Client Compatibility:** CSS support matrix, Outlook quirks, VML, images/SVG
- **Style Presets:** Available presets and customization
- **Development:** Dev server, testing tools, pre-send checklist

---

## Critical Constraints (TL;DR)

Before writing any code, internalize these rules:

1. **All styles must be inline** — No external CSS, no `<style>` blocks (except for responsive media queries as progressive enhancement)

2. **NO NESTED TEXT NODES** — Text must ALWAYS be rendered via the `content="..."` attribute. Never write `<Text>Hello</Text>` or `<Button>Click</Button>`. This is required for the rendering engine to work correctly.

3. **Tables are the only reliable layout** — Never use CSS flexbox or grid. Use `<Grid>` components which render as `<table>`

3. **Use padding, not margins** — Outlook.com dropped margin support. Use `<Spacer>` or padding instead

4. **Emulated properties (safe to use):**
   - `margin` → Emulated via wrapper table padding (100% support)
   - `opacity-*` → Emulated via color blending (100% support)
   - Color `/opacity` modifiers (e.g., `bg-[#000]/50`) → Blended to solid hex

5. **Avoid these CSS properties (no emulation):**
   - `flex`, `grid` (Outlook ignores) → Use `<Grid>` component
   - `border-radius` (Outlook Windows ignores) → Accept square fallback or VML
   - `box-shadow` (~63% support) → Design without shadows
   - `overflow` (unreliable) → Let content expand naturally
   - `max-height` (requires overflow) → Let content dictate height
   - `object-fit` (~66% support) → Use explicit width/height
   - `transform`, `filter`, `transition`, `animation` (not supported)
   - `min-width`, `max-width` (Outlook ignores, but useful for modern clients)
   - Actual viewport units (`100vw`, `100vh`) → Use `w-screen`/`h-screen` (aliased to 100%)

6. **Images:** Always include `width`, `height`, and `alt` attributes. Use absolute HTTPS URLs. Assume images may be blocked

7. **SVG:** Use `<img src="file.svg">` (93% support), never inline `<svg>` (40% support, Gmail strips it)

8. **Outlook Windows requires VML** for rounded corners and background images

9. **Test in multiple clients** — Apple Mail is permissive, Outlook Windows is restrictive, Gmail strips many features

---

## When Implementing New Features

1. **Check support first** — Consult the CSS property support matrix in ARCHITECTURE.md
2. **Design for degradation** — The feature should fail gracefully in unsupported clients
3. **Provide fallbacks** — Solid colors for gradients, square corners for rounded, etc.
4. **Consider Outlook** — If it needs to work in Outlook Windows, you likely need VML
5. **Keep HTML < 100KB** — Gmail clips larger emails

---

## Documentation Requirements

**Always document your work.** This project relies heavily on documentation for maintainability and future AI agents.

1. **Read before coding** — Consult `README.md` and `ARCHITECTURE.md` to fully understand the project
2. **Update `ARCHITECTURE.md`** — When modifying rendering pipeline, IR structure, style parsing, or component behavior
3. **Document decisions** — Explain *why* a particular approach was chosen, especially for email compatibility trade-offs
4. **Keep docs in sync** — Ensure `style-attributes.ts` comments, `ARCHITECTURE.md`, and component docs all match
5. **Add examples** — Include code examples for new features or changed behavior

When making significant changes, ask yourself:
- Does `ARCHITECTURE.md` reflect this change?
- Will the next developer (or AI agent) understand why this works this way?
- Are there email client compatibility implications that should be documented?
