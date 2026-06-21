# albumator

A modern web application built with SvelteKit 5 for managing, sharing, and viewing your photo collections.
Built with a focus on simplicity and performance using SQLite as the database.

## Demo

![Demo](./assets/demo.webm)

## Tech Stack

- **Frontend**: SvelteKit 5 with TypeScript
- **Styling**: Tailwind CSS
- **Database**: DrizzleORM with SQLite
- **Language**: TypeScript

## Features

- Photo collection management
- Easy photo sharing capabilities
- Image viewing and gallery modes
- Search and filter functionality
- Responsive design
- Brutalist design
- User friendly UX

## Getting Started

### Prerequisites

- Nix with flakes enabled
- Node.js 22+ if you want to work outside `nix develop`

### Development

```bash
nix develop
pnpm install
pnpm dev
```

### Checks

```bash
pnpm run format
pnpm run lint
pnpm run check
pnpm run build
```

Or run the flake-native checks:

```bash
nix flake check
```

### Image Derivatives

Apply migrations and backfill ThumbHash and dimension metadata for existing images:

```bash
DATABASE_URL="file:local.db" pnpm run db:migrate
DATABASE_URL="file:local.db" pnpm run images:backfill
```

Generated responsive image variants are cached on disk in `IMAGE_CACHE_DIR`.

Inspect the current cache footprint:

```bash
pnpm run images:cache:stats
```

### Run the packaged app

```bash
nix run .
```

### Build the Docker image

```bash
nix build .#dockerImage
```

### NixOS service

The flake exports `nixosModules.default`, which defines `services.albumator`.
Set `services.albumator.enable = true;` and configure `databaseUrl` or `environmentFile` as needed.
