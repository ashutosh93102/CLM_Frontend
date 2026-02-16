# CLM Frontend Documentation

This folder documents the **Next.js (App Router)** frontend: how to run it, how features are implemented, and how it integrates with the Django/DRF backend.

## Quick links

- **Feature docs index**: `docs/FEATURES_INDEX.md`
- **Setup / local dev**: `docs/SETUP.md`
- **Architecture**: `docs/ARCHITECTURE.md`
- **Static export (Cloudflare Pages)**: `docs/STATIC_EXPORT.md`

## Backend API / Swagger

The frontend talks directly to the backend defined in `NEXT_PUBLIC_API_BASE_URL`.

- Swagger UI: `GET /api/docs/`
- OpenAPI schema: `GET /api/schema/`

Backend docs live in `CLM_Backend/docs/`.

- Backend feature docs index: `../../../CLM_Backend/docs/FEATURES_INDEX.md`
- Backend API documentation: `../../../CLM_Backend/docs/BACKEND_API_DOCUMENTATION.md`

## How this docs set is organized

- **Per-feature docs** explain:
  - routes (URL paths in `app/`)
  - key UI components
  - backend endpoints used
  - approach/implementation details (state, error handling, auth)
  - how to verify the feature locally
