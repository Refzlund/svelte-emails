# Contributing to svelte-emails

## Project Structure

```
svelte-emails/
├── packages/
│   ├── svelte-emails/     # Core library (publishable package)
│   │   ├── src/           # Library source
│   │   ├── dist/          # Built library (git-ignored)
│   │   └── cli/           # CLI files (copied during build, git-ignored)
│   └── cli/               # Dev server CLI source
├── emails/                # Example templates
├── scripts/build.ts       # Build script
├── .changeset/            # Changesets configuration
└── run-emails.ts          # Dev CLI wrapper
```

## Prerequisites

- [Bun](https://bun.sh/) v1.0+

## Quick Start

```bash
bun install
bun run dev       # Start dev server with example emails
```

## Development

### Dev Server in Monorepo

```bash
bun run dev
```

### Testing Changes

- **Core library** (`packages/svelte-emails/src/`) — Run dev server, verify rendering
- **CLI** (`packages/cli/src/`) — Test file discovery, live reload, SSE updates
- **Type check**: `cd packages/cli && bunx svelte-check`

## Build & Publish

This project uses [Changesets](https://github.com/changesets/changesets) for versioning.

### Creating a Changeset

After making changes, create a changeset:

```bash
bun changeset
```

Follow the prompts to describe your changes and select the version bump type.

### Building

```bash
bun run build
```

This builds:
- Core library to `packages/svelte-emails/dist/`
- CLI files to `packages/svelte-emails/cli/`

### Testing the Built Package

```bash
cd packages/svelte-emails
bun link
```

Then in another project:

```bash
bun link svelte-emails
bunx svelte-emails
```

> **Note:** Re-run `bun run build` after changes.

### Versioning & Publishing

```bash
bun version       # Apply changesets and bump versions
bun publish       # Build and publish to npm
```

Or manually:

```bash
bun run build
cd packages/svelte-emails && npm publish
```

## Architecture

- [ARCHITECTURE.md](ARCHITECTURE.md) — Core library
- [ARCHITECTURE_CLI.md](ARCHITECTURE_CLI.md) — CLI dev server
