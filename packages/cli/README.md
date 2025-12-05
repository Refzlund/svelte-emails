# @svelte-emails/cli

Development server for previewing `*.email.svelte` templates.

## Usage

```bash
# Run from your project directory
bunx svelte-emails

# With options
bunx svelte-emails --port 3000 --open

# Scan a specific directory
bunx svelte-emails --cwd ./packages/emails
```

## Features

- **Live reload** — Changes to `*.email.svelte` files update instantly
- **Multiple views** — Preview, Source, HTML (formatted/raw), Text
- **Folder grouping** — Organize emails with `category` attribute or folder structure
- **Resizable preview** — Drag edges to resize, persisted to localStorage
- **Syntax highlighting** — Shiki-powered highlighting (off-thread worker)
- **Image proxy** — Bypasses CORS for external images

## Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--port` | `-p` | Port number | 33411 |
| `--open` | `-o` | Open browser | false |
| `--cwd` | | Directory to scan | `process.cwd()` |
| `--help` | `-h` | Show help | |

## Folder Grouping

Emails can be grouped into collapsible folders:

```svelte
<Email category="Receipts" preview="Order confirmation">
  <!-- Email content -->
</Email>
```

Emails with the same `category` appear in a folder. Emails without a category appear at the top level.

## Architecture

See [ARCHITECTURE_CLI.md](../../ARCHITECTURE_CLI.md) for detailed documentation on the internal architecture.
