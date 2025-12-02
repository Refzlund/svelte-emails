# Agent Instructions for svelte-emails

This document guides AI agents working on the `svelte-emails` library. The documentation files below contain critical context about email client compatibility constraints that **must** be consulted before making code changes.

1. Make a todo-list
2. Validate them with the developer
3. Execute
4. Document [ARCHITECTURE.md](ARCHITECTURE.md)

- Do not run `bun dev` etc. instead ask the developer to verify

---

## Documentation Files

### [README.md](README.md)

Contains usage of the library.

### [ARCHITECTURE.md](ARCHITECTURE.md)
**When to use:** Before implementing new components, understanding the rendering pipeline, or modifying the virtual layout tree system.

Contains:
- How the virtual layout tree (IR) works
- Component registration flow via Svelte context
- The rendering pipeline (Preview mode vs Server render)
- Style system with Tailwind-like attributes
- Content parsing (markdown syntax, variable interpolation)
- HTML output strategy (table-based layout, inline styles)
- Component reference and style presets

### [EMAIL_DEVELOPMENT_GUIDE.md](EMAIL_DEVELOPMENT_GUIDE.md)
**When to use:** Before implementing any styling, layout, or visual feature. This is your **primary reference** for what CSS/HTML actually works in email clients.

Contains:
- The Golden Rules (inline styles, table layouts, design for degradation)
- Layout & structure (what works vs what doesn't)
- Sizing & spacing (padding vs margin, units to avoid)
- Typography support
- Colors & backgrounds (including VML for Outlook)
- Borders & visual effects (border-radius, box-shadow limitations)
- Image handling best practices
- Responsive design constraints
- Client-specific quirks (Outlook, Gmail, Apple Mail, Yahoo)
- CSS property support matrix
- Pre-send checklist

### [CSS_UTILITIES_REFERENCE.md](CSS_UTILITIES_REFERENCE.md)
**When to use:** When implementing or modifying Tailwind-style utility parsing, or when deciding which utilities to support.

Contains:
- Detailed CSS property support by email client
- Layout & display utilities (tables over flex/grid)
- Sizing utilities (width/height, min/max constraints)
- Spacing utilities (padding safe, margin problematic)
- Typography utilities
- Color and background utilities
- Border and corner utilities
- Effects to avoid (opacity, transforms, animations)
- Quick reference tables for safe vs unsafe utilities

### [EMAIL_CLIENT_SUPPORT.md](EMAIL_CLIENT_SUPPORT.md)
**When to use:** When implementing features involving images, backgrounds, SVG, or advanced visual effects. Deep-dive reference for specific client behaviors.

Contains:
- Table-based layout rationale
- Image format support (PNG, JPEG, GIF, SVG)
- Background images (CSS vs HTML attribute vs VML)
- CSS shapes & visual effects (border-radius, box-shadow)
- SVG support (linked vs inline, Gmail stripping behavior)
- Client support summary matrix
- VML code examples for Outlook compatibility

---

## Decision Flowchart

```
┌─────────────────────────────────────────────────────────────┐
│  What are you trying to do?                                 │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐   ┌─────────────────┐   ┌─────────────────┐
│ Add/modify    │   │ Add styling or  │   │ Work with       │
│ a component   │   │ CSS utility     │   │ images/SVG/     │
│               │   │                 │   │ backgrounds     │
└───────────────┘   └─────────────────┘   └─────────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌─────────────────┐   ┌─────────────────┐
│ Read          │   │ Read            │   │ Read            │
│ ARCHITECTURE  │   │ EMAIL_          │   │ EMAIL_CLIENT_   │
│ .md           │   │ DEVELOPMENT_    │   │ SUPPORT.md      │
│               │   │ GUIDE.md        │   │                 │
│ Then check    │   │                 │   │ Then check      │
│ EMAIL_        │   │ Then check      │   │ EMAIL_          │
│ DEVELOPMENT_  │   │ CSS_UTILITIES_  │   │ DEVELOPMENT_    │
│ GUIDE.md      │   │ REFERENCE.md    │   │ GUIDE.md        │
└───────────────┘   └─────────────────┘   └─────────────────┘
```

---

## Critical Constraints (TL;DR)

Before writing any code, internalize these rules:

1. **All styles must be inline** — No external CSS, no `<style>` blocks (except for responsive media queries as progressive enhancement)

2. **Tables are the only reliable layout** — Never use CSS flexbox or grid. Use `<Grid>` components which render as `<table>`

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

1. **Check support first** — Consult the CSS property support matrices in EMAIL_DEVELOPMENT_GUIDE.md
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
