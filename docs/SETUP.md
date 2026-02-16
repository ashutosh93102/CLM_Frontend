# Frontend Setup (Local Dev + Build)

## Prerequisites

- Node.js `20.x` (see `package.json -> engines.node`)
- npm (or yarn; repo includes both lock files)

## Environment variables

Copy the example file:

```bash
cp .env.local.example .env.local
```

Key vars:

- `NEXT_PUBLIC_API_BASE_URL`
  - Backend base URL, e.g. `http://127.0.0.1:11000` (local) or your Cloud Run URL
  - This is used by the frontend API clients.
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (optional)
  - Enables Google sign-in in the Login/Register screens.
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (optional)
  - Used if/when the UI needs Supabase.

## Install

```bash
npm install
```

A postinstall script copies `pdfjs-dist` assets used by PDF viewing.

## Run dev server

```bash
npm run dev
```

App defaults to `http://localhost:3000`.

## Lint

```bash
npm run lint
```

## Production build

```bash
npm run build
npm run start
```

## Static export (Cloudflare Pages)

This repo supports static export via `next.config.ts` when `STATIC_EXPORT=1`.

```bash
npm run build:pages
```

Output is placed in `out/`.

## Common local issues

### CORS failures

If you point the frontend to a different backend origin, ensure the backend `CORS_ALLOWED_ORIGINS` includes the frontend origin (scheme + host + port, no path).

### Swagger “Try it out”

Swagger is hosted by the backend.

1) Open: `<NEXT_PUBLIC_API_BASE_URL>/api/docs/`
2) Click **Authorize**
3) Enter: `Bearer <access_token>`

Backend Swagger relies on explicit request/response schemas for some APIViews; if an endpoint shows “No parameters”, it likely needs schema annotations server-side.

### Auth failures (401)

- Ensure you clicked **Authorize** in Swagger and used `Bearer <access_token>`.
- Ensure the frontend `NEXT_PUBLIC_API_BASE_URL` points to the correct backend.
