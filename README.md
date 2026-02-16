# CLM Frontend

Modern web UI for CLM built with **Next.js 16 (App Router)**, **React 19**, and **Tailwind CSS**.

## Tech stack

- Next.js `16.1.x` (App Router)
- React `19`
- Tailwind CSS
- ESLint `9`

## Project layout

- `app/` — routes + UI (each folder maps to a route)
- `app/components/` — shared UI components
- `app/lib/` — API clients, auth context, environment helpers
- `public/` — static assets
- `docs/` — feature docs, setup, architecture notes

## Environment variables

Copy the example file and fill values:

```bash
cp .env.local.example .env.local
```

Key variables (see `.env.local.example`):

- `NEXT_PUBLIC_API_BASE_URL` — backend base URL (Django/DRF)
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` — Google OAuth client id (frontend)
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase (frontend usage)

The API base URL is normalized and read from `NEXT_PUBLIC_API_BASE_URL` (preferred) or `NEXT_PUBLIC_API_URL` (legacy).

## Install & run

Requires Node.js **20.x**.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

### Scripts

- `npm run dev` — start dev server (uses webpack)
- `npm run build` — production build
- `npm run start` — run production server
- `npm run lint` — run ESLint

Notes:

- `postinstall`/`predev`/`prebuild` runs `scripts/copy-pdfjs-assets.mjs`.

## Auth & session model (high level)

- Auth state is provided by an `AuthProvider` mounted in `app/layout.tsx`.
- Tokens and cached user are stored in `localStorage`:
  - `access_token`
  - `refresh_token`
  - `user`
- A token manager emits an `auth:tokens` event to keep tabs/components in sync.
- On refresh, the app bootstraps auth from localStorage and may call `GET /api/auth/me/`.

## Backend integration

The frontend talks directly to the backend configured by `NEXT_PUBLIC_API_BASE_URL`.

Useful backend endpoints:

- Swagger UI: `GET /api/docs/`
- OpenAPI schema: `GET /api/schema/`

## Static export (Cloudflare Pages)

Static export is supported via build-time flag:

```bash
STATIC_EXPORT=1 npm run build
```

When `STATIC_EXPORT=1`:

- Next config sets `output: 'export'`
- `trailingSlash: true`
- images are unoptimized

See `docs/STATIC_EXPORT.md` for details.

## Documentation

- Docs entrypoint: `docs/README.md`
- Setup: `docs/SETUP.md`
- Architecture: `docs/ARCHITECTURE.md`
- Feature index: `docs/FEATURES_INDEX.md`
