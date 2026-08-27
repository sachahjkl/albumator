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
cp .env.example .env
pnpm dev
```

`BODY_SIZE_LIMIT` must remain finite in production. `DATABASE_URL` and `IMAGE_CACHE_DIR`
must point to persistent locations writable by the application user.
The built-in demo account is disabled by default. Enable it explicitly with
`ENABLE_DEMO_USER=true` in controlled deployments.

Login and registration are rate-limited per client address and account. When running behind a
trusted reverse proxy, configure `ADDRESS_HEADER` and `XFF_DEPTH`; never trust forwarded headers
when the Node listener is directly reachable.

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

Migrations are applied automatically before development and production startup. Backfill
ThumbHash and dimension metadata for existing images after upgrading older installations:

```bash
DATABASE_URL="file:local.db" pnpm run images:backfill
```

Generated responsive image variants are cached on disk in `IMAGE_CACHE_DIR`.
Cache entries are published atomically, deduplicated within the server process, removed after
image deletion, and evicted by generated age and total size. Configure the policy with
`IMAGE_CACHE_MAX_BYTES`, `IMAGE_CACHE_MAX_AGE_SECONDS`, and
`IMAGE_CACHE_CLEANUP_INTERVAL_SECONDS`; zero disables the corresponding limit.

Inspect the current cache footprint:

```bash
pnpm run images:cache:stats
```

### Run the packaged app

```bash
nix run .
```

The packaged app applies committed migrations before listening. Back up the SQLite database
before upgrading; if a migration fails, the application exits without starting.

### Build the Docker image

```bash
nix build .#dockerImage
```

### NixOS service

The flake exports `nixosModules.default`, which defines `services.albumator`.
Set `services.albumator.enable = true;` and configure `databaseUrl` or `environmentFile` as needed.
