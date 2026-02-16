# Calendar (Frontend)

## Route

- `/calendar` -> `app/calendar/page.tsx`

## Backend endpoints used (typical)

- `GET /api/v1/events/`
- `POST /api/v1/events/`
- `PATCH /api/v1/events/{id}/`
- `DELETE /api/v1/events/{id}/`

## Approach

- Calendar events are tenant-scoped.
- UI typically converts date/time fields to local timezone for display but sends ISO strings back to backend.

## How to verify locally

1) Login.
2) Create an event.
3) Refresh the page and confirm it persists.
