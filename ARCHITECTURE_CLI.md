# svelte-emails CLI Architecture

This document covers the architecture, design decisions, and implementation details of the `svelte-emails` CLI development server.

---

## Overview

The CLI provides a development server for previewing `*.email.svelte` templates with:

- **Sidebar** listing all discovered email files
- **Tabbed viewer** with Preview, Source, HTML, Raw, and Text views
- **Resizable preview** — drag edges to resize, persisted to localStorage
- **Live reload** when files are added, removed, or modified
- **SSR rendering** using the `svelte-emails` render function
- **Syntax highlighting** via Shiki (off-thread worker)

---

## Package Structure

```
packages/cli/
├── src/
│   ├── cli.ts                 # CLI entry point (future)
│   ├── app.html               # SvelteKit HTML template
│   ├── app.d.ts               # Type declarations
│   ├── hooks.client.ts        # Client-side hooks (console warning suppression)
│   ├── lib/
│   │   ├── email-store.ts     # Client-side SSE state management
│   │   ├── page-cache.ts      # Client-side cache for instant navigation
│   │   ├── image-cache.svelte.ts # Image caching with CORS proxy
│   │   ├── highlight.svelte.ts # Off-thread syntax highlighting with caching
│   │   ├── Icons.svelte       # SVG icons as Svelte snippets
│   │   ├── components/
│   │   │   ├── EmailPreview.svelte  # Resizable iframe preview
│   │   │   ├── CodeView.svelte      # Syntax-highlighted code panel
│   │   │   └── LoadingBar.svelte    # Animated loading indicator
│   │   ├── utils/
│   │   │   ├── view-mode.svelte.ts  # URL-synced view mode state
│   │   │   └── preview-width.svelte.ts # Persisted preview width
│   │   └── cli/
│   │       ├── discovery.ts   # Email file discovery
│   │       └── vite-plugin.ts # Core Vite plugin
│   └── routes/
│       ├── +layout.svelte     # Main layout with sidebar + shallow routing
│       ├── +page.svelte       # Index redirect
│       └── [email]/
│           ├── +page.svelte   # Email viewer with tabs
│           └── +page.ts       # Client-side load function
├── static/
│   └── theme.css              # CSS variables and theme
├── vite.config.ts             # Vite configuration
└── package.json
```

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
}
```

**Key behaviors:**
- Respects `.gitignore` patterns
- Ignores `node_modules`, `.svelte-kit`, `dist`, `build`
- Extracts preview text from `<Email preview="...">` attribute
- Converts filenames to human-readable display names (CamelCase → spaces)

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

export function getCached(emailId: string): CachedData | undefined
export function setCache(emailId: string, data: EmailRenderData): void
export function setCacheFormattedHtml(emailId: string, html: string): void
export function invalidateCache(emailId?: string): void
export function prefetchAdjacentEmails(currentId: string, emailIds: string[], count?: number): void
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
  htmlRaw: string | null
  text: string | null
}

export function createHighlightManager(): {
  state: HighlightState
  loading: LoadingState
  highlight(emailId, source, html, htmlRaw, text): Promise<void>
  clear(): void
}
```

**Key features:**
- One worker per highlight type (parallel processing)
- Per-email caching with version tracking
- Separate caching for formatted vs raw HTML
- Svelte 5 reactive state (`$state`)

### 8. UI Components

#### Layout (`+layout.svelte`)

- Renders sidebar with email list
- Subscribes to `emailStore` for live updates
- Initial data from `virtual:email-list` (SSR-safe)
- Footer links to documentation and examples

#### Email Viewer (`[email]/+page.svelte`)

- Tabbed interface: Preview, Source, HTML, Text
- HTML tab has Formatted/Raw toggle (Raw shows minified output)
- Uses `createViewMode()` for URL-synced tab state
- Listens for `content-change` events to trigger reload
- Client-side data fetching for instant navigation
- Prefetches adjacent emails for instant navigation

#### EmailPreview Component

Resizable iframe for rendering email HTML:

```typescript
// Features:
// - Drag left/right edges to resize width
// - Width persisted to localStorage via createPreviewWidth()
// - Cursor glow effect on grid background
// - Image caching as data URLs for instant loading
// - Auto-height sync with iframe content
```

The preview shows a grid background with a cursor-following glow effect,
giving visual feedback when hovering near the resize edges.

#### CodeView Component

Syntax-highlighted code panel with optional toggle:

```typescript
interface Props {
  code: string                   // Primary code to display
  highlightedHtml: string | null // Pre-highlighted HTML from Shiki
  showToggle?: boolean           // Show Formatted/Raw toggle
  rawCode?: string               // Alternative code for raw view
  highlightedRawHtml?: string | null // Highlighted HTML for raw view
  showRaw?: boolean              // Controlled: current state
  onToggle?: (raw) => void       // Callback when toggled
}
```

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

viewMode.current  // Current mode
viewMode.isRaw    // Shorthand for mode === 'raw'
viewMode.set('html')  // Updates state and URL
```

The mode is stored in the URL query parameter `?mode=html`, allowing:
- Shareable links to specific views
- Browser back/forward navigation between views
- Page refresh preserves view state

**Note:** `html` and `raw` share the same tab (HTML) but have a Formatted/Raw toggle within the CodeView panel.

### Preview Width (`preview-width.svelte.ts`)

Persisted iframe width using localStorage:

```typescript
const previewWidth = createPreviewWidth()

previewWidth.value  // Current width (10-100%)
previewWidth.value = 60  // Update width
previewWidth.persist()   // Save to localStorage
```

The width is persisted under the key `svelte-emails-preview-width`.

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

## Future Improvements

1. **CLI binary** - `npx svelte-emails dev` to run from any project
2. **Props editor** - UI to modify placeholder values
3. **Send test email** - Integration with email providers
4. ~~**Mobile preview** - Responsive width simulation~~ ✅ Implemented (drag to resize)
5. **Dark mode toggle** - Preview emails in dark mode
6. **Export** - Download rendered HTML/text
7. **Accessibility audit** - Check email accessibility
8. **Placeholder editor** - Edit `[[variable]]` values in UI

---

## Dependencies

| Package | Purpose |
|---------|---------|
| `fast-glob` | File discovery with gitignore support |
| `chokidar` | File system watching |
| `@sveltejs/kit` | Application framework |
| `vite` | Dev server and bundling |
| `svelte-emails` | Email rendering (workspace dependency) |
