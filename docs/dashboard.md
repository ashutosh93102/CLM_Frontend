# Dashboard (Frontend)

## Route

- `/dashboard` -> `app/dashboard/page.tsx`

## Key UI

- Dashboard page(s) typically compose reusable cards and charts from `app/components/*`.
- Charts use `recharts`.

## Backend endpoints used

- Commonly: `GET /api/v1/dashboard/insights/`

## Approach

- Dashboard focuses on **read-only** aggregation.
- Uses the global auth context for user/session state.
- Fetches server metrics and renders charts with defensive defaults (empty arrays when missing).

## How to verify locally

1) Login.
2) Open `/dashboard`.
3) Confirm API calls succeed and render meaningful values for your tenant.

## Troubleshooting

- If the dashboard is blank, check browser devtools network tab for `401/403`.
- If you see `CORS` errors, update backend `CORS_ALLOWED_ORIGINS` to include the frontend origin.
