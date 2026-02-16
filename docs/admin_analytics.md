# Admin + Analytics (Frontend)

## Routes

- `/admin` -> `app/admin/page.tsx`
- `/analytics` -> `app/analytics/page.tsx`

## Backend endpoints used (typical)

Admin:

- `GET /api/v1/admin/me/`
- `GET /api/v1/admin/users/`
- `POST /api/v1/admin/users/promote/`
- `POST /api/v1/admin/users/demote/`

Analytics:

- `GET /api/v1/admin/analytics/`
- `GET /api/v1/admin/activity/`
- `GET /api/v1/admin/feature-usage/`

## Approach

- Admin screens rely entirely on backend claims (`is_admin`, `is_superadmin`).
- UI should treat `403` as “not authorized” and route away from admin pages.
- Filters/search in admin lists should be reflected in query params to allow sharing links.

## How to verify locally

1) Login as an admin.
2) Open `/admin` and confirm `/api/v1/admin/me/` succeeds.
3) Try the same as a non-admin and confirm you’re blocked.
