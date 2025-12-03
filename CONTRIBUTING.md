# Contributing to svelte-emails

## Project Structure

```
svelte-emails/
├── packages/
│   ├── svelte-emails/     # Core library for rendering email templates
│   └── cli/               # Dev server CLI for previewing emails
├── emails/                # Example email templates for testing
├── run-emails.ts          # CLI wrapper for development
└── package.json           # Monorepo root with workspace config
```

## Prerequisites

- [Bun](https://bun.sh/) v1.0+

## Setup

1. **Install dependencies**

   ```bash
   bun install
   ```

2. **Link the CLI for development**

   This makes the `svelte-emails` command available globally, pointing to your local code:

   ```bash
   bun link
   ```

## Development

### Running the Email Dev Server

After linking, you can run the dev server from anywhere in the monorepo:

```bash
# Scans current directory for *.email.svelte files
svelte-emails

# With options
svelte-emails --port 3000 --open

# Scan a specific directory
svelte-emails --cwd ./emails/src
```

Or use the npm script:

```bash
bun run emails
```

### Running the Example App

```bash
bun run dev
```

This runs the dev app from `apps/dev`.

### Testing Changes

1. **Core library changes** (`packages/svelte-emails/`)
   - Run the dev server and verify email rendering
   - Check that styles are applied correctly

2. **CLI changes** (`packages/cli/`)
   - Run `svelte-emails` and test:
     - File discovery (adding/removing `*.email.svelte` files)
     - Live reload on file changes
     - SSE updates in the browser

3. **Type checking**

   ```bash
   cd packages/cli
   bunx svelte-check
   ```

## Unlinking

To remove the global `svelte-emails` command:

```bash
bun unlink svelte-emails-repository
```

Or manually remove it from your global bin directory:

- **macOS/Linux**: `~/.bun/bin/svelte-emails`
- **Windows**: `%USERPROFILE%\.bun\bin\svelte-emails`

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for details on the core library.

See [ARCHITECTURE_CLI.md](ARCHITECTURE_CLI.md) for details on the CLI dev server.
