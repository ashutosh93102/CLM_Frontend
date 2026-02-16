# Frontend Architecture

## Framework

- Next.js `16.x` App Router
- React `19`
- Tailwind CSS

The UI lives under `app/`.

## Routing

Each folder under `app/` maps to a route, e.g.

- `app/login/page.tsx` -> `/login`
- `app/contracts/page.tsx` -> `/contracts`

In many cases, a route page is a thin wrapper around a component in `app/components/*`.

## Auth + session model

### Where auth state lives

- `app/lib/auth-context.tsx` provides an `AuthProvider`.
- The provider is mounted in `app/layout.tsx`, so all pages can access `useAuth()`.

### Token storage

- Access token: `localStorage['access_token']`
- Refresh token: `localStorage['refresh_token']`
- Cached user: `localStorage['user']`

`tokenManager` (in `app/lib/api.ts`) owns read/write operations and emits an `auth:tokens` event so multiple tabs/components can stay in sync.

### Bootstrap on refresh

On page load, the provider:

- checks for access token + cached user
- if token exists but user is missing, it calls `GET /api/auth/me/` once and stores the result

## API integration

There are two layers:

1) `app/lib/api.ts`
   - focused on auth + a few legacy calls
   - includes `APIError` handling

2) `app/lib/api-client.ts`
   - “production-grade” typed client for most feature APIs
   - centralizes request() logic, auth headers, refresh flow

Backend base URL comes from `app/lib/env.ts` (`NEXT_PUBLIC_API_BASE_URL` preferred).

## Error handling approach

- Normalize server error shapes (`{error}`, `{detail}`, serializer errors)
- Throw typed errors (`APIError`) so UI can branch on status codes
- For OTP-gated login/register, UI routes to `/verify-otp` when backend returns `403` with `pending_verification: true`

## Streaming

Some endpoints use streaming responses. The API client uses `fetch()` streaming (not EventSource) when it needs Authorization headers.

## Static export

If `STATIC_EXPORT=1` at build time:

- `next.config.ts` sets `output: 'export'`
- `trailingSlash: true`

See `docs/STATIC_EXPORT.md`.
