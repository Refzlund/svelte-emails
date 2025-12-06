# svelte-emails CLI Architecture

This document covers the architecture, design decisions, and implementation details of the `svelte-emails` CLI development server.

---

## Overview

The CLI provides a development server for previewing `*.email.svelte` templates with:

- **Responsive layout** — Desktop sidebar + mobile bottom nav with slide-in sidebar
- **Sidebar** listing all discovered email files
- **Tabbed viewer** with Preview, Source, HTML, Raw, and Text views
- **Resizable preview** — drag edges to resize (desktop), persisted to localStorage
- **Live reload** when files are added, removed, or modified
- **SSR rendering** using the `svelte-emails` render function
- **Syntax highlighting** via Shiki (optional, off-thread worker)
- **Keyboard shortcuts** for quick navigation

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt+E` | Toggle Examples view |
| `Alt+D` | Toggle Documentation view |
| `Alt+1` | Switch to Preview tab |
| `Alt+2` | Switch to Source tab |
| `Alt+3` | Switch to HTML tab |
| `Alt+4` | Switch to Text tab |

Shortcuts are displayed in tooltips (hover for 400ms) and as labels on navigation buttons.

---

## Optional Dependencies

### Shiki (Syntax Highlighting)

Shiki provides syntax highlighting in the Source, HTML, and Text tabs. **It is optional** — the CLI works without it, displaying plain code instead.

**Installation:**
```bash
npm install shiki @shikijs/langs @shikijs/themes
# or
bun add shiki @shikijs/langs @shikijs/themes
```

**How it works:**
1. On first use, `highlight.svelte.ts` checks if Shiki is available via dynamic import
2. If available, Web Workers are created for parallel highlighting
3. If not available, code is displayed without syntax highlighting (plain text with HTML escaping)

**Behavior without Shiki:**
- Source tab shows plain Svelte code (no colors)
- HTML tab shows plain HTML (no colors)
- Text tab shows plain markdown (no colors)
- Console displays: `[svelte-emails] Shiki is not installed. Syntax highlighting is disabled.`

**Files involved:**
- `highlight.svelte.ts` — Checks Shiki availability, manages worker pool
- `highlight-worker.ts` — Web Worker that performs highlighting (graceful fallback)
- `CodeView.svelte` — Renders either highlighted HTML or plain `<pre><code>`

---

## Package Structure

```
packages/cli/
├── src/
│   ├── cli.ts                 # CLI entry point
│   ├── app.html               # SvelteKit HTML template
│   ├── app.d.ts               # Type declarations
│   ├── hooks.client.ts        # Client-side hooks (console warning suppression)
│   ├── documentation/         # Bundled documentation pages
│   │   └── 1. Getting Started/
│   │       └── Introduction.svelte
│   ├── examples/              # Bundled example emails
│   │   └── Newsletter.svelte
│   ├── lib/
│   │   ├── email-store.ts     # Client-side SSE state management
│   │   ├── page-cache.ts      # Client-side cache for instant navigation
│   │   ├── image-cache.svelte.ts # Image caching with CORS proxy
│   │   ├── highlight.svelte.ts # Off-thread syntax highlighting with caching
│   │   ├── Icons.svelte       # SVG icons as Svelte snippets
│   │   ├── components/
│   │   │   ├── ResponsiveLayout.svelte  # Layout wrapper (desktop/mobile)
│   │   │   ├── Sidebar.svelte           # Desktop navigation sidebar
│   │   │   ├── sidebar.svelte.ts        # Sidebar state & navigation logic
│   │   │   ├── EmailViewer.svelte       # Desktop viewer for all modes
│   │   │   ├── email-viewer.svelte.ts   # Viewer state & data fetching
│   │   │   ├── EmailPreview.svelte      # Resizable iframe preview (desktop)
│   │   │   ├── email-preview.svelte.ts  # Shared preview state (image cache, scroll, glow)
│   │   │   ├── CodeView.svelte          # Syntax-highlighted code panel
│   │   │   ├── LoadingBar.svelte        # Animated loading indicator
│   │   │   ├── Tooltip.svelte           # Delayed tooltip with shortcut display
│   │   │   ├── shared/
│   │   │   │   ├── SidebarContent.svelte  # Shared sidebar content (desktop/mobile)
│   │   │   │   └── TabButton.svelte       # Shared tab button component
│   │   │   └── mobile/
│   │   │       ├── MobileBottomNav.svelte   # Mobile bottom navigation bar
│   │   │       ├── MobileSidebar.svelte     # Slide-in sidebar overlay
│   │   │       ├── MobileTabDropdown.svelte # Tab selection dropdown
│   │   │       └── MobileEmailPreview.svelte # Full-width iframe preview
│   │   ├── utils/
│   │   │   ├── view-mode.svelte.ts  # URL-synced view mode state + tab config
│   │   │   ├── responsive.svelte.ts # Mobile detection via matchMedia
│   │   │   ├── preview-width.svelte.ts # Persisted preview width
│   │   │   ├── scroll-positions.svelte.ts # Global scroll position cache
│   │   │   └── keyboard-shortcuts.ts # Global keyboard shortcut manager
│   │   └── cli/
│   │       ├── discovery.ts   # Email file discovery
│   │       ├── types.ts       # Type definitions (EmailFile, SafeEmail, ViewMode)
│   │       ├── utils.ts       # Utility functions (path normalization, debounce)
│   │       └── vite-plugin.ts # Core Vite plugin
│   └── routes/
│       ├── +layout.svelte     # Root layout (keyboard shortcuts, ResponsiveLayout)
│       └── [...params]/       # Unified catch-all route for all views
│           ├── +page.svelte   # Route entry point (rendering in ResponsiveLayout)
│           └── +page.ts       # Route parameter parsing
├── static/
│   └── theme.css              # CSS variables and theme
├── vite.config.ts             # Vite configuration
└── package.json
```

---

## Routing

The CLI uses a single unified catch-all route (`[...params]`) to handle all views:

| URL Pattern | Mode | Item ID |
|-------------|------|---------|
| `/my-email` | `emails` | `my-email` |
| `/examples/newsletter` | `examples` | `newsletter` |
| `/documentation/intro` | `documentation` | `intro` |
| `/` | `emails` | (redirects to first email) |
| `/examples` | `examples` | (redirects to first example) |
| `/documentation` | `documentation` | (redirects to first doc) |

**Benefits of unified routing:**
- Single source of truth for page rendering
- Consistent state management across mode transitions
- Image caching persists across mode changes (same component instance)
- Simplified shallow routing - just push state with `{ emailId, mode }`

---

## Core Components

### 1. File Discovery (`discovery.ts`)

Discovers all `*.email.svelte` files in the target directory using `fast-glob`.

```typescript
interface EmailFile {
  id: string          // URL-safe slug (e.g., "my-email")
  name: string        // Display name (e.g., "My Email")
  path: string        // Absolute file path
  relativePath: string // Path relative to CWD
  previewText: string  // Extracted from <Email preview="...">
  category: string     // Extracted from <Email category="..."> (for folder grouping)
  mode: ViewMode       // 'emails' | 'examples' | 'documentation'
}
```

**Key behaviors:**
- Respects `.gitignore` patterns
- Ignores `node_modules`, `.svelte-kit`, `dist`, `build`
- Extracts preview text from `<Email preview="...">` attribute
- Extracts category from `<Email category="...">` for sidebar folder grouping
- Converts filenames to human-readable display names (CamelCase → spaces)

#### Folder Grouping via Category

Emails can be grouped into collapsible folders in the sidebar using the `category` attribute:

```svelte
<Email category="Receipts" preview="Your order confirmation">
  <!-- Email content -->
</Email>
```

- Emails with the same `category` value appear in a collapsible folder
- Folders and their contents are sorted alphabetically
- Emails without a category appear at the top level (uncategorized)
- Category changes are detected on file save without server restart

#### Folder-Based Categories for Bundled Files

For bundled documentation and examples (in `src/documentation/` and `src/examples/`), 
categories are automatically inferred from the folder structure:

```
src/documentation/
├── 1. Getting Started/
│   └── Introduction.svelte     # category: "1. Getting Started"
└── ComponentShowcase.svelte    # category: "" (uncategorized)
```

This allows organizing bundled content without requiring a `category` attribute in each file.
The explicit `<Email category="...">` attribute takes precedence if specified.

### 2. Vite Plugin (`vite-plugin.ts`)

The core of the dev server, providing:

#### Virtual Module (`virtual:email-list`)

Provides the initial email list at build time:

```typescript
import emails from 'virtual:email-list'
// emails: Array<{ id, name, relativePath, previewText }>
```

#### API Endpoints

All endpoints are prefixed with `/__svelte-emails/`:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/events` | GET (SSE) | Server-Sent Events stream for live updates |
| `/list` | GET | JSON array of all email files |
| `/render?id=...` | GET | Render an email by ID, returns HTML/text/source |

#### SSR Rendering

Uses Vite's `ssrLoadModule` to dynamically import and render Svelte components:

```typescript
const mod = await server.ssrLoadModule(email.path)
const EmailComponent = mod.default
const { render } = await server.ssrLoadModule('svelte-emails')
const rendered = await render(EmailComponent, { placeholders: {} })
```

**Why `ssrLoadModule`?**
- Handles Svelte component compilation transparently
- Supports HMR and module invalidation
- Properly resolves `svelte-emails` package imports

### 3. File Watcher (Chokidar)

Monitors the directory for changes to `*.email.svelte` files.

#### The Hybrid Approach

**Problem:** We need to detect:
1. Changes to existing files
2. New files being created
3. Files being deleted

**Failed approaches:**

| Approach | Issue |
|----------|-------|
| Watch specific file paths | Can't detect new files |
| Watch glob pattern (`**/*.email.svelte`) | Chokidar doesn't detect new files matching globs with native FS events |
| Poll the entire directory | Works but uses 35%+ CPU |

**Solution:** Watch the directory with native FS events, filter in the handler:

```typescript
watcher = watch(watchDir, {
  ignored: ['**/node_modules/**', '**/.svelte-kit/**', ...],
  ignoreInitial: true,
  usePolling: false,  // Native FS events = low CPU
  awaitWriteFinish: { stabilityThreshold: 50, pollInterval: 20 }
})

watcher.on('all', async (event, filePath) => {
  // Filter for email files
  if (!filePath.endsWith('.email.svelte')) return
  
  // Handle event...
})
```

**Benefits:**
- Low CPU usage (~0% idle)
- Detects new files
- Fast response time (~50ms)

### 4. Server-Sent Events (SSE)

Real-time updates from server to client without polling.

#### Event Types

| Event | Payload | Trigger |
|-------|---------|---------|
| `emails` | `{ emails: [], event: string, path: string }` | Any file change |
| `content-change` | `{ id: string, path: string }` | File content modified |
| `file-added` | `{ id: string, path: string }` | New file created |
| `file-removed` | `{ id: string, path: string }` | File deleted |

#### Connection Flow

```
Client                          Server
  |                               |
  |------ EventSource ----------->|  Connect to /__svelte-emails/events
  |<----- emails (init) ----------|  Receive initial list
  |                               |
  |      [file change occurs]     |
  |                               |
  |<----- emails ----------------|  Updated list
  |<----- content-change --------|  If same file modified
  |                               |
```

### 5. Client Store (`email-store.ts`)

Singleton state management for SSE connection and email list.

```typescript
export const emailStore = {
  get emails(): EmailListItem[]
  get lastContentChangeId(): string | null
  get lastContentChangeTime(): number
  get lastListUpdateTime(): number
  subscribe(listener: () => void): () => void
}
```

**Key design decisions:**
- Auto-connects on browser load
- Singleton pattern prevents multiple SSE connections
- Timestamp-based change detection for precise updates

### 6. Page Cache (`page-cache.ts`)

Client-side cache for instant email navigation.

```typescript
export interface EmailRenderData {
  email: { id, name, relativePath, previewText }
  source: string
  rendered: { html, htmlRaw, text } | null
  formattedHtml: string | null  // Computed client-side
  renderError: string | null
}

export function getCached(emailId: string, mode?: ViewMode): CachedData | undefined
export function setCache(emailId: string, data: EmailRenderData, mode?: ViewMode): void
export function setCacheFormattedHtml(emailId: string, html: string, mode?: ViewMode): void
export function invalidateCache(emailId?: string, mode?: ViewMode): void
export function prefetchAdjacentEmails(currentId: string, emailIds: string[], count?: number, mode?: ViewMode): void
```

**Key features:**
- 5-minute TTL for cached data
- Prefetches adjacent emails for instant navigation
- Caches formatted HTML separately (computed client-side)
- Invalidated on file changes via SSE events

### 7. Highlight Manager (`highlight.svelte.ts`)

Off-thread syntax highlighting using Web Workers.

```typescript
export interface HighlightState {
  source: string | null
  html: string | null
  text: string | null
}

export interface LoadingState {
  source: boolean
  html: boolean
  text: boolean
}

export function createHighlightManager(): {
  state: HighlightState
  loading: LoadingState
  highlight(emailId, source, html, text): Promise<void>
  clear(): void
}
```

**Key features:**
- One worker per highlight type (parallel processing)
- Per-email caching with version tracking
- Separate caching for formatted vs raw HTML
- Svelte 5 reactive state (`$state`)

### 8. UI Components

#### Responsive Layout (`ResponsiveLayout.svelte`)

The root layout wrapper that switches between mobile and desktop layouts based on viewport width:

```typescript
// Breakpoint: 768px (mobile if width <= 768px)

// Desktop layout:
// - Sidebar (fixed 320px width) + EmailViewer (flex: 1)
// - Tab switching via horizontal tab bar in viewer header
// - Resizable email preview with drag handles

// Mobile layout:
// - Full-width email preview (no resize handles)
// - Bottom navigation bar with menu and tab dropdown
// - Slide-in sidebar overlay (triggered by menu button)
```

Uses `createResponsiveState()` for reactive mobile detection via `matchMedia`.

#### Layout (`+layout.svelte`)

- Minimal layout that renders `<ResponsiveLayout />` component
- Handles keyboard shortcuts via `handleKeyboardShortcut`
- Handles service worker cleanup on mount

#### Sidebar Component (`Sidebar.svelte` + `sidebar.svelte.ts`)

Desktop navigation sidebar that wraps `SidebarContent`:

```typescript
// sidebar.svelte.ts - Extracted state logic
const sidebar = createSidebarState()

sidebar.viewMode        // 'emails' | 'examples' | 'documentation'
sidebar.currentList     // Items for current mode
sidebar.navStructure    // { uncategorized, folders } for rendering
sidebar.navTitle        // Display title (e.g., "*.email.svelte")
sidebar.selectedId      // Currently selected item ID
sidebar.handleItemClick // Navigate with shallow routing
sidebar.toggleFolder    // Expand/collapse folder
sidebar.navigateToMode  // Switch between modes
```

Features:
- Three view modes: emails (user's templates), examples (bundled), documentation (bundled)
- Folder grouping via `category` attribute or folder structure
- Shallow routing for instant navigation
- SSE subscription for live updates
- Zebra-striped rows with alternating backgrounds

#### Shared Components (`components/shared/`)

**SidebarContent.svelte** — Shared sidebar content for both desktop and mobile:
- Email/example/documentation list with folder grouping
- Mode switching buttons (Examples, Documentation)
- `showShortcuts` prop controls keyboard shortcut display (desktop: yes, mobile: no)
- `onitemclick` callback for closing mobile sidebar after selection

**TabButton.svelte** — Reusable tab button for desktop tabs and mobile dropdown:
- Displays icon + label with loading spinner state
- Uses shared `ViewMode` type from `view-mode.svelte.ts`

#### Mobile Components (`components/mobile/`)

**MobileSidebar.svelte** — Slide-in overlay sidebar:
- Uses `floating-runes` portal to render at document root
- Animated slide-in/fade with 200ms timing
- Backdrop click or Escape key to close

**MobileBottomNav.svelte** — Fixed bottom navigation bar:
- Left: Menu button (opens sidebar)
- Center: Email name and preview text (truncated)
- Right: Tab button (opens dropdown)

**MobileTabDropdown.svelte** — Tab selection dropdown:
- Renders above bottom nav via portal
- Uses shared `TabButton` component
- Closes on selection or outside click

**MobileEmailPreview.svelte** — Full-width iframe preview:
- Same grid background and glow effect as desktop
- No resize handles (full width on mobile)
- Same scroll position persistence as desktop

#### EmailViewer Component (`EmailViewer.svelte` + `email-viewer.svelte.ts`)

Desktop viewer for all view modes (emails, examples, documentation):

```typescript
// email-viewer.svelte.ts - Extracted state logic
const viewer = createEmailViewerState(
  () => mode,
  () => itemId
)

viewer.email           // Current email metadata
viewer.source          // Source code
viewer.rendered        // { html, htmlRaw, text }
viewer.formattedHtml   // Prettified HTML (computed client-side)
viewer.renderError     // Error message if render failed
viewer.isLoading       // Initial load in progress
viewer.isRerendering   // Re-render after file change
viewer.setupContentChangeListener() // Subscribe to live updates
```

Features:
- Tabbed interface: Preview, Source, HTML, Text
- HTML tab has Formatted/Raw toggle (Raw shows minified output)
- Uses `createViewMode()` for URL-synced tab state
- Listens for `content-change` events to trigger reload
- Client-side data fetching for instant navigation
- Prefetches adjacent items for instant navigation

#### EmailPreview Component

Desktop resizable iframe for rendering email HTML:

```typescript
// Features:
// - Drag left/right edges to resize width
// - Width persisted to localStorage via createPreviewWidth()
// - Cursor glow effect on grid background
// - Image caching as data URLs (uncached show placeholder until loaded)
// - Auto-height sync with iframe content
```

The preview shows a grid background with a cursor-following glow effect,
giving visual feedback when hovering near the resize edges.

#### CodeView Component

Syntax-highlighted code panel with copy functionality:

```typescript
interface Props {
  code: string                   // Code to display
  highlightedHtml: string | null // Pre-highlighted HTML from Shiki
  rawCode?: string               // Code to copy (defaults to code)
}
```

Features:
- Copy to clipboard button with "Copied!" feedback
- Falls back to plain `<pre><code>` when Shiki unavailable
- Copies raw HTML when viewing formatted code

#### LoadingBar Component

Animated loading indicator shown during re-renders:

```typescript
interface Props {
  visible: boolean  // Controls visibility
}
```

Shows a smooth indeterminate progress animation with multiple animated lines.
Gracefully completes current animation cycle before hiding.

#### Client Load (`[email]/+page.ts`)

- Checks client-side cache for instant navigation
- Returns cached data immediately if available
- Returns placeholder data for client-side fetching if not cached
- SSR disabled (`export const ssr = false`) for instant client navigation

---

## Data Flow

### Initial Page Load

```
1. SvelteKit loads +layout.svelte
2. virtual:email-list provides initial email array
3. Browser connects to SSE endpoint
4. SSE sends current emails (init event)
5. User navigates to /[email] (shallow routing for instant URL update)
6. +page.ts checks client cache, returns immediately
7. Component fetches from /__svelte-emails/render API
8. Vite ssrLoadModule renders the component
9. Page displays preview
```

### File Change Flow

```
1. User saves *.email.svelte file
2. Chokidar detects change event
3. Plugin re-discovers all emails
4. Plugin broadcasts via SSE:
   - emails (updated list)
   - content-change (if existing file modified)
5. Client email-store receives events
6. Layout updates sidebar (if list changed)
7. Page invalidates cache and triggers refetch
8. Component fetches fresh render from API
9. UI updates with new content
```

---

## Key Learnings & Gotchas

### 1. Chokidar on Windows

- Native FS events work but need path normalization (`\` → `/`)
- Glob patterns don't reliably detect new files
- `usePolling: true` works but has high CPU cost
- Solution: Watch directory, filter in handler

### 2. Vite Module Graph

Must invalidate modules for fresh SSR renders:

```typescript
const mod = server.moduleGraph.getModuleById(email.path)
if (mod) server.moduleGraph.invalidateModule(mod)
```

Without this, file changes won't reflect in rendered output.

### 3. SSE vs WebSocket

SSE chosen over WebSocket because:
- Simpler API (just HTTP)
- Auto-reconnect built-in
- Sufficient for server→client updates
- No need for bidirectional communication

### 4. Virtual Module Timing

`buildStart` may not run before `configureServer`, so discovery runs in both:

```typescript
async configureServer(server) {
  if (emails.length === 0) {
    emails = await discoverEmails(options.cwd)
  }
  // ...
}
```

### 5. Path Normalization

Windows uses backslashes, everything else uses forward slashes. Always normalize:

```typescript
const normalizedPath = filePath.replace(/\\/g, '/')
```

### 6. CSS Virtual Module Race Condition (Rolldown-Vite)

With rolldown-vite (Vite 7+), CSS virtual modules can fail to load on first page request:

```
[vite-plugin-svelte:load] failed to load virtual css module .../+page.svelte?svelte&type=style&lang.css
```

**Why this happens:**

When the browser requests a page, Vite loads the Svelte component which emits a CSS import. The CSS is stored in a virtual module that's populated during component compilation. With rolldown-vite, there's a race condition where the browser requests the CSS before compilation completes.

**Solution:** Use `css: 'injected'` in Svelte compiler options to inject CSS directly into JS instead of emitting separate CSS files:

```javascript
// svelte.config.js
const config = {
  compilerOptions: {
    css: 'injected'
  }
}
```

This bypasses the virtual CSS module system entirely. Since this is a dev-only tool, the slight performance tradeoff (CSS bundled with JS instead of separate files) is acceptable.

**Alternative (did not work reliably):** Using `server.warmup` to pre-compile components was attempted but did not reliably fix the issue on first load.

**References:**
- [vite-plugin-svelte #1192](https://github.com/sveltejs/vite-plugin-svelte/issues/1192)
- [vite-plugin-svelte #1194](https://github.com/sveltejs/vite-plugin-svelte/pull/1194)

---

## SSR Module Resolution & `ssr.noExternal`

This section documents a critical piece of the CLI architecture: how Svelte components are loaded during SSR rendering.

### The Problem

When users run `bunx svelte-emails` (or install from npm), the CLI dev server needs to:
1. Import user's `*.email.svelte` files
2. Import `svelte-emails` components for rendering

During SSR, Vite must decide for each dependency: should it **externalize** (let Node.js load it) or **process** (transform through Vite's pipeline)?

```
User Email Template (*.email.svelte)
        │
        ├── imports → svelte-emails (Email, Div, Text, etc.)
        │                    │
        │                    └── contains .svelte files
        │
        └── imports → User's other dependencies
```

**The failure mode:**

By default, Vite externalizes npm packages during SSR for performance. When `svelte-emails` is externalized, Node.js tries to load `.svelte` files directly:

```
Error [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".svelte"
```

Node.js ESM doesn't understand `.svelte` files - they must be compiled to JavaScript first.

### The Solution: `ssr.noExternal`

The `vite.config.ts` includes:

```typescript
ssr: {
  noExternal: ['svelte-emails']
}
```

This tells Vite: "Don't externalize `svelte-emails` - process it through the Vite transform pipeline instead."

When Vite processes the package:
1. `vite-plugin-svelte` compiles `.svelte` → JavaScript
2. Other Vite transforms run (TypeScript, etc.)
3. The compiled code works in Node.js

### Is This a Hack?

**No, it's the intended solution.** The `vite-plugin-svelte` is *supposed* to auto-detect Svelte libraries and add them to `ssr.noExternal`. However, auto-detection can fail when:

1. **Package installed in temp directory** - `bunx` creates ephemeral installs that may not be fully resolved at config time
2. **Non-standard package manager resolution** - bun/pnpm/npm resolve dependencies differently
3. **Timing issues** - The dependency graph isn't fully known when Vite config runs

Explicitly setting `ssr.noExternal` is the documented workaround, used by many Svelte component libraries.

### Caveats & Potential Issues

#### 1. User Imports in Email Templates

Users may import their own components/helpers into `*.email.svelte` files:

```svelte
<!-- MyEmail.email.svelte -->
<script>
  import { Email, Text } from 'svelte-emails'
  import Header from './components/Header.svelte'        // ✅ Works (local file)
  import { formatDate } from './utils/format.ts'         // ✅ Works (local file)
  import { SomeComponent } from 'some-svelte-library'    // ⚠️ May fail
</script>
```

| Import Type | Status | Notes |
|-------------|--------|-------|
| Local `.svelte` files | ✅ Works | Processed by Vite automatically |
| Local `.ts`/`.js` files | ✅ Works | Processed by Vite automatically |
| `svelte-emails` | ✅ Works | Explicitly in `noExternal` |
| Other Svelte libraries | ⚠️ May fail | Depends on library's packaging |
| Plain JS/TS npm packages | ✅ Works | Node.js loads directly |

#### 2. When Other Svelte Libraries Fail

If a user imports a third-party Svelte library and gets the `.svelte` extension error:

**Workaround 1:** The user can create a `vite.config.ts` in their project:

```typescript
// In user's project root
import { defineConfig } from 'vite'

export default defineConfig({
  ssr: {
    noExternal: ['problematic-svelte-library']
  }
})
```

However, **this won't work** because the CLI runs its own Vite instance with its own config.

**Workaround 2:** We could extend `noExternal` to include more patterns:

```typescript
ssr: {
  noExternal: [
    'svelte-emails',
    /^svelte-/,  // Any package starting with "svelte-"
    // Or even broader: all packages containing .svelte files
  ]
}
```

**Trade-off:** Broader patterns mean more packages processed through Vite, which is slower. But it prevents confusing errors for users.

#### 3. The `ssrLoadModule` Chain

When rendering an email:

```typescript
const mod = await server.ssrLoadModule(email.path)
const { render } = await server.ssrLoadModule('svelte-emails')
```

The `ssrLoadModule` call triggers Vite's SSR module resolution for the entire import tree:

```
MyEmail.email.svelte
  → svelte-emails (noExternal → Vite processes)
    → svelte (framework, externalized)
  → ./Header.svelte (local → Vite processes)
  → some-svelte-lib (NOT in noExternal → externalized → MAY FAIL)
```

#### 4. Framework Dependencies

Packages like `svelte` itself are intentionally externalized because:
- They're pure JavaScript (no `.svelte` files at runtime)
- They should match the version used by the compiled components
- Externalizing prevents duplicate copies

The `noExternal` should only include packages that contain uncompiled `.svelte` files.

#### 5. Svelte Version Mismatches

If the user's project uses Svelte 5 but a third-party library was compiled with Svelte 4:
- The compiled output may be incompatible
- This manifests as runtime errors, not module resolution errors
- **This is unrelated to `noExternal`** - it's a general Svelte compatibility issue

### Future Improvements

1. **Auto-detect Svelte packages:** Scan `node_modules` for packages containing `.svelte` files and add them to `noExternal` automatically
2. **User config merging:** Support reading the user's `vite.config.ts` and merging `ssr.noExternal` arrays
3. **Better error messages:** Catch the `ERR_UNKNOWN_FILE_EXTENSION` error and provide actionable guidance
4. **Package pre-check:** Validate imports before rendering and warn about potentially problematic packages

### Summary

| Scenario | Outcome |
|----------|---------|
| Import `svelte-emails` components | ✅ Works (explicit `noExternal`) |
| Import local `.svelte` files | ✅ Works (Vite auto-processes) |
| Import local `.ts`/`.js` utilities | ✅ Works |
| Import compiled npm packages | ✅ Works (externalized to Node.js) |
| Import other Svelte component libraries | ⚠️ May fail unless added to `noExternal` |

---

## State Management Utilities

### View Mode (`view-mode.svelte.ts`)

URL-synced tab state using Svelte 5 runes:

```typescript
type ViewMode = 'preview' | 'source' | 'html' | 'raw' | 'text'

const viewMode = createViewMode()

viewMode.value    // Current mode
viewMode.isRaw    // Shorthand for mode === 'raw'
viewMode.set('html')  // Updates state and URL
```

The mode is stored in the URL query parameter `?mode=html`, allowing:
- Shareable links to specific views
- Browser back/forward navigation between views
- Page refresh preserves view state

**Note:** `html` and `raw` share the same tab (HTML) but have a Formatted/Raw toggle within the CodeView panel.

Also exports:
- `TAB_MODES` — Array of all view modes in order
- `TABS` — Centralized tab configuration array with mode, label, icon, and shortcut
- `getTabConfig(mode)` — Helper to get tab config by mode
- `TabConfig` — Interface for tab configuration `{ mode, label, icon, shortcut }`

### Responsive State (`responsive.svelte.ts`)

Mobile detection using `matchMedia`:

```typescript
const responsive = createResponsiveState()

responsive.isMobile   // true if viewport <= 768px
responsive.isDesktop  // true if viewport > 768px
```

Uses `matchMedia` for efficient viewport tracking (no resize event listeners).
Defaults to desktop for SSR, hydrates correctly on client.

### Preview Width (`preview-width.svelte.ts`)

Persisted iframe width using localStorage:

```typescript
const previewWidth = createPreviewWidth()

previewWidth.value  // Current width (10-100%)
previewWidth.value = 60  // Update width
previewWidth.persist()   // Save to localStorage
```

The width is persisted under the key `svelte-emails-preview-width`.

### Scroll Position (`scroll-positions.svelte.ts`)

Global scroll position cache for email previews:

```typescript
import { saveScrollPosition, getScrollPosition, shouldRestore } from '$lib/utils/scroll-positions.svelte'

saveScrollPosition('emails:my-email', 500)  // Save position
getScrollPosition('emails:my-email')         // Get position (or undefined)
shouldRestore('emails:my-email')             // Returns true on first call per key
```

Keys are formatted as `${mode}:${emailId}` to namespace by view mode (emails, examples, documentation). The state persists in memory across navigation but resets on page refresh.

### Email Preview State (`email-preview.svelte.ts`)

Shared state logic for `EmailPreview.svelte` and `MobileEmailPreview.svelte`:

```typescript
import { createPreviewState, createScrollPersistence } from '$lib/utils/email-preview.svelte'

// Image cache and cursor glow effect
const previewState = createPreviewState()
previewState.imageCache    // getImageSrc, isLoading, error
previewState.cursorGlow    // x, y, visible for CSS custom properties

// Scroll position persistence
const scroll = createScrollPersistence(
  () => currentEmailId,       // Getter for email ID
  () => currentSourceType     // Getter for source type
)
scroll.save(element)          // Save scroll position
scroll.restore(element)       // Restore scroll position (once per email)
```

Both preview components use these shared utilities to:
- Cache and load email images asynchronously
- Track cursor position for glow effect
- Persist scroll positions across email navigation

---

## Configuration

The plugin accepts options via environment variable:

```bash
# Set the directory to scan for *.email.svelte files
SVELTE_EMAILS_CWD=/path/to/emails bun run dev
```

In `vite.config.ts`:

```typescript
import { emailListPlugin } from './src/lib/vite-plugin'

export default defineConfig({
  plugins: [
    emailListPlugin({
      cwd: process.env.SVELTE_EMAILS_CWD || process.cwd()
    }),
    sveltekit()
  ]
})
```

---

## Static Site Build

The CLI supports building a static HTML preview site for sharing or deployment. This is useful for companies that want to showcase their email templates without running a dev server.

### Usage

```bash
# Basic usage
bunx svelte-emails build

# With options
bunx svelte-emails build --out ./dist --base /emails

# From a specific directory
bunx svelte-emails build --cwd ./my-emails --out ./preview-site
```

### CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `--cwd <dir>` | Directory containing `*.email.svelte` files | Current directory |
| `--out <dir>` | Output directory for the static build | `build` |
| `--base <path>` | Base path for deployment (e.g., `/emails` for `https://example.com/emails`) | `/` |

### Output Structure

```
dist/
├── index.html          # SPA entry point (fallback for all routes)
├── robots.txt          # Standard robots file
├── _app/               # SvelteKit app assets (JS, CSS, fonts)
│   ├── immutable/      # Hashed assets (long cache)
│   └── version.json
└── _data/
    ├── email-list.json # List of all emails with metadata
    └── emails/         # Pre-rendered email data
        ├── src-myemail.json
        ├── src-newsletter.json
        └── ... (one JSON per email)
```

### How It Works

The build process has two phases:

#### Phase 1: Pre-render Emails (Vite SSR)

1. Start a Vite dev server in SSR mode
2. Discover all `*.email.svelte` files
3. For each email:
   - Import the Svelte component via `ssrLoadModule`
   - Render to HTML/text using `svelte-emails` render function
   - Read the source file
   - Format HTML using `prettier` (if available)
4. Write results as JSON files to `_data/` directory

```typescript
// Simplified from packages/cli/src/cli/build.ts
const vite = await createServer({ /* SSR config */ })
await vite.ssrRunner.import('svelte-emails')

for (const email of emails) {
  const mod = await vite.ssrRunner.import(email.path)
  const result = await render(mod.default)
  writeFileSync(`_data/emails/${email.id}.json`, JSON.stringify({
    email: { id, name, ... },
    source: readFileSync(email.path),
    rendered: result,
    formattedHtml: await prettier.format(result.html)
  }))
}
```

#### Phase 2: SvelteKit Static Build

1. Set environment variables for static mode:
   - `SVELTE_EMAILS_BUILD=1` — Triggers adapter-static in svelte.config.js
   - `SVELTE_EMAILS_OUT_DIR` — Output directory
   - `SVELTE_EMAILS_BASE` — Base path
2. Run `vite build` which invokes SvelteKit's build
3. SvelteKit uses `@sveltejs/adapter-static` with:
   - `fallback: 'index.html'` — SPA mode with client-side routing
   - `strict: false` — Don't fail on missing prerendered routes
   - `prerender: false` — Pure SPA, no static page generation

### Static Mode Behavior

When `SVELTE_EMAILS_BUILD=1` is set, several components adapt:

| Component | Dev Mode | Static Mode |
|-----------|----------|-------------|
| `email-store.ts` | SSE connection for live updates | Load from `/_data/email-list.json` |
| `email-viewer.svelte.ts` | Fetch from `/__svelte-emails/render` | Fetch from `/_data/emails/{id}.json` |
| `image-cache.svelte.ts` | Proxy images through dev server | Use original URLs directly |
| `svelte.config.js` | No adapter | `adapter-static` |
| `vite-plugin.ts` | Full dev server with SSE | Virtual module for build mode detection |

### Virtual Module: `virtual:svelte-emails-build-mode`

Components detect static mode via:

```typescript
import { isStaticBuild } from 'virtual:svelte-emails-build-mode'

if (isStaticBuild) {
  // Load from static JSON files
} else {
  // Use dev server APIs
}
```

### Deployment

The output is a standard static site. Deploy to any static host:

```bash
# Build
bunx svelte-emails build --out ./dist --base /emails

# Deploy examples:
# Netlify: drag-drop dist folder
# Vercel: vercel --prod dist
# GitHub Pages: copy to gh-pages branch
# S3: aws s3 sync dist s3://bucket-name/emails
# nginx: copy to /var/www/html/emails
```

**Important:** If using a non-root base path, ensure your server redirects all routes to `index.html` for SPA routing.

### Preview Command

Before deploying, test the build locally with the `preview` command:

```bash
# Preview the default ./build directory
bunx svelte-emails preview

# Preview a specific directory
bunx svelte-emails preview ./dist

# Preview with custom port and auto-open browser
bunx svelte-emails preview --port 3000 --open
```

#### Preview CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `[dir]` | Directory to serve (positional argument) | `./build` |
| `--dir, -d <path>` | Directory to serve (alternative to positional) | `./build` |
| `--port, -p <number>` | Port to serve on | `4173` |
| `--open, -o` | Open browser automatically | `false` |

The preview command uses Vite's built-in preview server, which handles SPA routing automatically. This ensures the preview matches production behavior.

### Limitations in Static Build

1. **No live reload** — Changes require a rebuild
2. **Images not proxied** — External images must be CORS-enabled or may show broken. In dev mode, images are proxied through the server to bypass CORS.
3. **No SSE updates** — Email list is frozen at build time
4. **No server-side rendering** — Pure client-side SPA

### Implementation Files

| File | Purpose |
|------|---------|
| `cli/build.ts` | Build orchestration, email pre-rendering |
| `cli.ts` | CLI argument parsing, command routing |
| `svelte.config.js` | Conditional adapter-static configuration |
| `vite-plugin.ts` | Build mode virtual module |
| `email-store.ts` | Static mode JSON loading |
| `email-viewer.svelte.ts` | Static mode data fetching |
| `+layout.ts` | SPA prerender configuration |

---

## Future Improvements

1. **CLI binary** - `npx svelte-emails dev` to run from any project
2. **Props editor** - UI to modify placeholder values
3. **Send test email** - Integration with email providers
4. ~~**Mobile preview** - Responsive width simulation~~ ✅ Implemented (drag to resize)
5. **Dark mode toggle** - Preview emails in dark mode
6. **Export** - Download rendered HTML/text
7. **Accessibility audit** - Check email accessibility
8. **Placeholder editor** - Edit `[[variable]]` values in UI
9. ~~**Static site build** - Export as deployable HTML site~~ ✅ Implemented

---

## Dependencies

| Package | Purpose | Required |
|---------|---------|----------|
| `fast-glob` | File discovery with gitignore support | Yes |
| `chokidar` | File system watching | Yes |
| `@sveltejs/kit` | Application framework | Yes |
| `vite` | Dev server and bundling | Yes |
| `svelte-emails` | Email rendering (workspace dependency) | Yes |
| `shiki` | Syntax highlighting | Optional |
| `@shikijs/langs` | Language definitions for Shiki | Optional |
| `@shikijs/themes` | Theme definitions for Shiki | Optional |
