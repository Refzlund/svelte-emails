# CLI Limitations & Known Issues

This document outlines the limitations and potential issues when using the `svelte-emails` CLI dev server.

---

## SSR Module Resolution

### The Problem

When you run `bunx svelte-emails` (or install from npm), the CLI needs to render your `*.email.svelte` files server-side. During SSR, Vite decides for each dependency whether to:

- **Externalize** — Let Node.js load it directly (faster)
- **Process** — Transform through Vite's pipeline (required for `.svelte` files)

Node.js ESM **cannot load `.svelte` files directly** — they must be compiled to JavaScript first.

### What Works

| Import Type | Status | Notes |
|-------------|--------|-------|
| `svelte-emails` components | ✅ Works | Explicitly configured |
| Local `.svelte` files | ✅ Works | Vite auto-processes local files |
| Local `.ts`/`.js` utilities | ✅ Works | Vite auto-processes local files |
| Compiled npm packages | ✅ Works | Node.js loads them directly |

### What May Fail

| Import Type | Status | Notes |
|-------------|--------|-------|
| Other Svelte component libraries | ⚠️ May fail | Not in `noExternal` config |
| Packages shipping uncompiled `.svelte` | ⚠️ May fail | Same issue |

**Example failure:**

```svelte
<!-- MyEmail.email.svelte -->
<script>
  import { Email, Text } from 'svelte-emails'           // ✅ Works
  import Header from './components/Header.svelte'       // ✅ Works
  import { SomeComponent } from 'some-svelte-library'   // ⚠️ May fail
</script>
```

**Error message:**

```
Error [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".svelte"
```

### Why This Happens

The CLI's `vite.config.ts` includes:

```typescript
ssr: {
  noExternal: ['svelte-emails']
}
```

This tells Vite to process `svelte-emails` through `vite-plugin-svelte` instead of letting Node.js load it. Other Svelte libraries aren't included in this list.

### Workarounds

#### Option 1: Use Pre-compiled Components

If the third-party library offers a pre-compiled version (common for larger libraries), import from that path instead.

#### Option 2: Fork and Build

For smaller libraries, you can fork and run `svelte-package` to generate compiled output.

#### Option 3: Copy Components Locally

Copy the needed components into your project as local files — Vite will process local `.svelte` files automatically.

---

## File System Watching

### Supported

- Creating new `*.email.svelte` files
- Modifying existing `*.email.svelte` files
- Deleting `*.email.svelte` files
- Changes to local imports (triggers re-render)

### Limitations

- **New directories** — The watcher uses periodic discovery (every 3 seconds) to find emails in new directories
- **Symlinked files** — May not trigger change events on all platforms
- **Network drives** — File watching may be unreliable; consider copying files locally

---

## Email Template Constraints

These are limitations of the `svelte-emails` library itself, not the CLI:

### No Dynamic Imports

Email templates are rendered at build/send time, not in a browser. Dynamic imports (`import()`) won't work as expected.

```svelte
<!-- ❌ Won't work -->
<script>
  const Component = await import('./dynamic.svelte')
</script>
```

### No Browser APIs

Templates render server-side. Browser APIs like `window`, `document`, `localStorage` are unavailable.

```svelte
<!-- ❌ Won't work -->
<script>
  const width = window.innerWidth
</script>
```

### No Reactivity at Render Time

Svelte reactivity (`$state`, `$derived`, `$effect`) doesn't apply — the template renders once to static HTML.

```svelte
<!-- This works but reactivity is meaningless for emails -->
<script>
  let count = $state(0)
  // Clicking won't do anything in the rendered email
</script>
<button onclick={() => count++}>{count}</button>
```

---

## Platform-Specific Issues

### Windows

- **Path separators** — Internally normalized to forward slashes
- **File locking** — Some editors lock files briefly; the CLI uses `awaitWriteFinish` to handle this
- **Long paths** — Paths over 260 characters may cause issues on older Windows versions

### macOS

- **Case sensitivity** — macOS is case-insensitive by default; `MyEmail.email.svelte` and `myemail.email.svelte` may conflict

### Linux

- **inotify limits** — Large projects may hit the default watcher limit. Increase with:
  ```bash
  echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
  sudo sysctl -p
  ```

---

## Performance Considerations

### Large Projects

- **Many email files** — Discovery scans the entire directory tree; use `.gitignore` patterns to exclude irrelevant folders
- **Large templates** — Complex templates with many imports take longer to render
- **Frequent saves** — Rapid saves are debounced (50ms) to prevent excessive re-renders

### Memory Usage

The CLI keeps Vite's module graph in memory. Very large projects may benefit from:

- Keeping email templates in a dedicated subdirectory
- Excluding unrelated files via `.gitignore`

---

## Troubleshooting

### "Unknown file extension .svelte"

A Svelte library is being externalized. See [SSR Module Resolution](#ssr-module-resolution) above.

### Changes Not Reflected

1. Check that the file ends with `.email.svelte`
2. Try saving again (debounce may have skipped the first save)
3. Check the terminal for error messages
4. Hard refresh the browser (`Ctrl+Shift+R`)

### High CPU Usage

File watching should use <1% CPU. If you see high usage:

1. Check if `node_modules` is being watched (it shouldn't be)
2. Ensure you're not running multiple CLI instances
3. Check for circular imports causing infinite re-renders

### Port Already in Use

The CLI uses Vite's default port (5173). If it's in use:

```bash
# Kill the process using the port (Windows)
netstat -ano | findstr :5173
taskkill /PID <pid> /F

# Or use a different port
PORT=3000 bunx svelte-emails
```

---

## Requesting Features

If you encounter a limitation that affects your workflow, please open an issue at:
https://github.com/Refzlund/svelte-emails/issues

Include:
- What you're trying to accomplish
- The error message (if any)
- Your environment (OS, Node version, package manager)
