# svelte-emails CLI Architecture

This document covers the architecture, design decisions, and implementation details of the `svelte-emails` CLI development server.

---

## Overview

The CLI provides a development server for previewing `*.email.svelte` templates with:

- **Sidebar** listing all discovered email files
- **Tabbed viewer** with Preview, Source, HTML, and Text views
- **Live reload** when files are added, removed, or modified
- **SSR rendering** using the `svelte-emails` render function

---

## Package Structure

```
packages/cli/
├── src/
│   ├── cli.ts                 # CLI entry point (future)
│   ├── app.html               # SvelteKit HTML template
│   ├── app.d.ts               # Type declarations
│   ├── lib/
│   │   ├── discovery.ts       # Email file discovery
│   │   ├── email-store.ts     # Client-side SSE state management
│   │   └── vite-plugin.ts     # Core Vite plugin
│   └── routes/
│       ├── +layout.svelte     # Main layout with sidebar
│       ├── +page.svelte       # Index redirect
│       └── [email]/
│           ├── +page.svelte   # Email viewer with tabs
│           └── +page.server.ts # Server-side data loading
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

### 6. UI Components

#### Layout (`+layout.svelte`)

- Renders sidebar with email list
- Subscribes to `emailStore` for live updates
- Initial data from `virtual:email-list` (SSR-safe)

#### Email Viewer (`[email]/+page.svelte`)

- Tabbed interface: Preview, Source, HTML, Text
- Listens for `content-change` events to trigger reload
- Uses `invalidateAll()` for SvelteKit data refetch

#### Server Load (`[email]/+page.server.ts`)

- Fetches from `/__svelte-emails/render` endpoint
- Handles render errors gracefully
- Returns email metadata, source, and rendered output

---

## Data Flow

### Initial Page Load

```
1. SvelteKit loads +layout.svelte
2. virtual:email-list provides initial email array
3. Browser connects to SSE endpoint
4. SSE sends current emails (init event)
5. User navigates to /[email]
6. +page.server.ts fetches from /__svelte-emails/render
7. Vite ssrLoadModule renders the component
8. Page displays preview
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
7. Page calls invalidateAll() (if viewing changed file)
8. +page.server.ts refetches fresh render
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
4. **Mobile preview** - Responsive width simulation
5. **Dark mode toggle** - Preview emails in dark mode
6. **Export** - Download rendered HTML/text
7. **Accessibility audit** - Check email accessibility

---

## Dependencies

| Package | Purpose |
|---------|---------|
| `fast-glob` | File discovery with gitignore support |
| `chokidar` | File system watching |
| `@sveltejs/kit` | Application framework |
| `vite` | Dev server and bundling |
| `svelte-emails` | Email rendering (workspace dependency) |
