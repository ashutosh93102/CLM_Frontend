# Notifications (Frontend)

## Route

- `/notifications` -> `app/notifications/page.tsx`

## Backend endpoints used

Notifications use a legacy prefix in this repo:

- `GET /api/notifications/`
- `PATCH /api/notifications/{id}/` (mark read)
- `DELETE /api/notifications/{id}/`

## Approach

- Treat backend as source of truth.
- Update UI optimistically (optional), then reconcile with server response.
- Keep “mark read” idempotent.

## How to verify locally

1) Login.
2) Open `/notifications`.
3) Mark an item as read, confirm it persists on refresh.
