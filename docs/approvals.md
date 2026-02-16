# Approvals (Frontend)

## Route

- `/approvals` -> `app/approvals/page.tsx`

## Backend endpoints used (typical)

- `GET /api/v1/approvals/`
- `POST /api/v1/approvals/` (request approval)
- `PATCH /api/v1/approvals/{id}/` (approve/reject)

## Approach

- Approvals are usually tied to an entity (contract, template, etc.).
- UI should show current status clearly and prevent double-submit.
- Backend is the source of truth for permission checks.

## How to verify locally

1) Login as a requester and create an approval.
2) Login as an approver and approve/reject.
3) Confirm status updates.
