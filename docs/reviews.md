# Reviews / Clause Library (Frontend)

## Route

- `/review` -> `app/review/page.tsx`

## Backend endpoints used (typical)

- `GET /api/v1/review-contracts/`
- `POST /api/v1/review-contracts/`
- `GET /api/v1/clause-library/`

## Approach

- Review screens often load large text payloads.
- Prefer rendering sanitized HTML for preview and a plain-text fallback.
- Any clause insertion/changes should be captured as explicit user actions (auditability).

## How to verify locally

1) Login.
2) Open `/review`.
3) Load a contract for review.
4) Confirm clause library search/insert works.
