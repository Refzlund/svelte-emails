# Contributing to svelte-emails

## Project Structure

```
svelte-emails/
├── packages/
│   ├── svelte-emails/     # Core library
│   └── cli/               # Dev server CLI
├── emails/                # Example templates
├── scripts/build.ts       # Build script
├── _dist/                 # Built output (git-ignored)
└── run-emails.ts          # Dev CLI wrapper
```

## Prerequisites

- [Bun](https://bun.sh/) v1.0+

## Quick Start

```bash
bun install
bun link          # Links source CLI globally
svelte-emails     # Run from any directory
```

## Development

### Dev Server

```bash
svelte-emails                      # Scan current directory
svelte-emails --port 3000 --open   # Custom port + auto-open
svelte-emails --cwd ./emails       # Scan specific directory
bun run emails                     # Alternative via npm script
```

### Testing Changes

- **Core library** (`packages/svelte-emails/`) — Run dev server, verify rendering
- **CLI** (`packages/cli/`) — Test file discovery, live reload, SSE updates
- **Type check**: `cd packages/cli && bunx svelte-check`

## Build & Link for Testing

To test the built package (as it would be published):

```bash
bun run build     # Creates _dist/
bun run link      # Registers svelte-emails globally
```

### Use in Another Project

```bash
bun link svelte-emails
```

Or in `package.json`:

```json
{ "dependencies": { "svelte-emails": "link:svelte-emails" } }
```

Then `bunx svelte-emails` to test.

> **Note:** Re-run `bun run build` after changes.

## Unlinking

```bash
bun unlink svelte-emails
```

## Architecture

- [ARCHITECTURE.md](ARCHITECTURE.md) — Core library
- [ARCHITECTURE_CLI.md](ARCHITECTURE_CLI.md) — CLI dev server
