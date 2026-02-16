# Settings (Frontend)

## Route

- `/settings` -> `app/settings/page.tsx`

## Backend endpoints used

Depends on what is enabled in the backend. Common patterns:

- `GET /api/auth/me/` for user context
- Admin endpoints if the settings are admin-only

## Approach

- Settings screens should not assume the user is admin.
- Prefer feature flags / capability checks from backend responses.

## How to verify locally

1) Login.
2) Open `/settings`.
3) Confirm it loads user context and saves changes (if enabled).
