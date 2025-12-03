# Dev Server Plan

Build a standalone CLI dev server using SvelteKit that discovers and previews `*.email.svelte` files.

## Target UI (from screenshot)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 📧 *.email.svelte  │ [Preview] [Source] [HTML] [Text]   /src/some/folder/... │
├────────────────────┼─────────────────────────────────────────────────────────┤
│ Invoice            │                                                         │
│   Your payment at..│                     Preview Area                        │
│ Newsletter         │                                                         │
│   Stay updated...  │                                                         │
│ ▶ My Email        │                                                         │
│   This is the...   │                                                         │
│ Reminder           │                                                         │
│   Don't forget...  │                                                         │
│                    │                                                         │
├────────────────────┤                                                         │
│ ⚡ Examples        │                                                         │
│ 📖 Documentation   │                                                         │
└────────────────────┴─────────────────────────────────────────────────────────┘
```

**Features:**
- Left sidebar: email file list with name + preview text
- Top tabs: Preview | Source | HTML | Text
- File path indicator (top right)
- Examples / Documentation links at bottom

---

## Phase 1: Project Setup

### 1.1 Create CLI package
- Create folder `packages/cli`
- Use `bunx sv create packages/cli` with minimal SvelteKit template (no add-ons)
- Configure as library with CLI entry point

### 1.2 Package structure
```
packages/cli/
├── package.json          # name: "svelte-emails", bin: "./dist/cli.js"
├── src/
│   ├── cli.ts            # CLI entry point (uses Vite API)
│   ├── lib/
│   │   ├── discovery.ts  # File discovery (glob *.email.svelte)
│   │   └── watcher.ts    # File watcher for HMR
│   └── routes/
│       ├── +layout.svelte
│       ├── +page.svelte  # Redirect to first email
│       └── [email]/
│           └── +page.svelte  # Email preview page
└── static/
```

### 1.3 Dependencies
```json
{
  "dependencies": {
    "svelte-emails": "workspace:*",
    "fast-glob": "^3.x",
    "chokidar": "^4.x"
  }
}
```

---

## Phase 2: File Discovery

### 2.1 Discovery service (`discovery.ts`)
```ts
interface EmailFile {
  id: string           // URL-safe identifier (path hash or slugified)
  name: string         // Display name (filename without .email.svelte)
  path: string         // Absolute path
  relativePath: string // Path relative to CWD
  previewText: string  // Extracted from <Email preview="...">
}

function discoverEmails(cwd: string): EmailFile[]
```

### 2.2 Ignore patterns
- Read `.gitignore` patterns
- Always ignore `node_modules`
- Use `fast-glob` with negation patterns

### 2.3 Preview text extraction
- Parse Svelte file to extract `preview` prop from `<Email>` component
- Simple regex or AST parsing (svelte/compiler)

---

## Phase 3: CLI Entry Point

### 3.1 CLI interface (`cli.ts`)
```bash
bunx svelte-emails [options]
  --port, -p    Port number (default: 33411)
  --open, -o    Open browser automatically
  --cwd         Working directory (default: process.cwd())
```

### 3.2 Vite dev server (programmatic)
```ts
import { createServer } from 'vite'
import { sveltekit } from '@sveltejs/kit/vite'

const server = await createServer({
  configFile: false,
  root: __dirname, // CLI package root
  plugins: [sveltekit()],
  server: { port: 33411 }
})
await server.listen()
```

### 3.3 Virtual module for email list
- Use Vite virtual module `virtual:email-list`
- Exposes discovered emails to frontend
- Updates on file changes

---

## Phase 4: SvelteKit Routes

### 4.1 Layout (`+layout.svelte`)
- Dark sidebar (screenshot style)
- Email file list with selection state
- Bottom links (Examples, Documentation)

### 4.2 Email list component
```svelte
<script>
  import emails from 'virtual:email-list'
</script>

{#each emails as email}
  <a href="/{email.id}" class:selected={...}>
    <strong>{email.name}</strong>
    <span>{email.previewText}</span>
  </a>
{/each}
```

### 4.3 Email page (`[email]/+page.svelte`)
- Tabs: Preview | Source | HTML | Text
- Dynamic import of email component
- Uses `Email.Render` for preview mode
- Shows source code (fetch raw file)
- Shows rendered HTML/Text

---

## Phase 5: Dynamic Email Import

### 5.1 Challenge
- Email components are in user's project, not CLI package
- Need to resolve and import from arbitrary paths

### 5.2 Solution: Vite's `import.meta.glob`
```ts
// Won't work - glob patterns must be static

// Alternative: Use virtual module that generates imports
// virtual:email-components returns dynamic import map
```

### 5.3 Better solution: API route
```ts
// +page.server.ts for [email] route
export async function load({ params }) {
  const email = findEmail(params.email)
  const EmailComponent = await import(email.path)
  const rendered = await render(EmailComponent.default)
  return { rendered, source: await readFile(email.path) }
}
```

### 5.4 HMR for email components
- Vite handles HMR for imported Svelte files
- May need custom HMR handling for files outside project root

---

## Phase 6: UI Components

### 6.1 Sidebar
- Logo/header: `📧 *.email.svelte`
- Scrollable email list
- Footer: Examples, Documentation links

### 6.2 Tab navigation
- Preview (iframe or direct render)
- Source (syntax highlighted)
- HTML (rendered output)
- Text (plain text output)

### 6.3 Preview panel
- Responsive viewport toggle (mobile/desktop)
- Current file path display

---

## Phase 7: File Watching

### 7.1 Chokidar watcher
```ts
chokidar.watch('**/*.email.svelte', {
  ignored: ['node_modules', ...gitignorePatterns],
  cwd
}).on('all', (event, path) => {
  // Update email list
  // Trigger HMR if needed
})
```

### 7.2 WebSocket updates
- Send file list updates to frontend
- Frontend refreshes sidebar

---

## Implementation Order

1. ✅ **Setup** - Create CLI package skeleton
2. ✅ **Discovery** - File discovery + ignore patterns
3. ✅ **CLI** - Basic CLI with Vite dev server
4. ✅ **Routes** - Layout + email list sidebar
5. ✅ **Email page** - Dynamic import + preview (via Vite ssrLoadModule)
6. ✅ **Tabs** - Source/HTML/Text views
7. ✅ **Watcher** - Live file watching with SSE
8. 🚧 **Polish** - UI styling to match screenshot

---

## Technical Decisions

### Why SvelteKit for CLI?
- Built-in SSR for `render()` function
- File-based routing simplifies structure
- Vite for HMR and fast refresh
- Can use `svelte-emails` components directly

### Virtual modules vs. API routes
- Virtual modules: Good for static data, fast
- API routes: Better for dynamic imports, SSR
- **Decision**: Use both - virtual module for list, API for rendering

---

## Open Questions

See [CLI-TODO.md](CLI-TODO.md) for outstanding questions and future improvements.
