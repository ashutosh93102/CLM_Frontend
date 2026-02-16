# Contracts (Frontend)

## Routes

- `/contracts` -> `app/contracts/page.tsx` (thin wrapper)
- `/create-contract` -> `app/create-contract/page.tsx`
- Contract detail/edit flows are typically implemented via components under `app/components/*`.

## Key modules

- Typed API client: `app/lib/api-client.ts`
- Legacy helpers (some contract calls): `app/lib/api.ts`
- PDF helpers: `pdf-lib`, `pdfjs-dist`

## Backend endpoints used (typical)

- `GET /api/v1/contracts/` (list)
- `POST /api/v1/contracts/` (create)
- `GET /api/v1/contracts/{id}/` (detail)
- `PATCH /api/v1/contracts/{id}/` (update)
- `DELETE /api/v1/contracts/{id}/` (delete)

Supporting flows:

- R2 download URLs: `GET /api/v1/{contract_id}/download-url/`
- Uploads: `POST /api/v1/upload-contract-document/`

## Approach

### List/detail composition

The `/contracts` page is kept small and delegates rendering to a component (for maintainability and faster iteration).

### Tenant + user scoping

The frontend does **not** enforce tenant scoping itself; it relies on backend authorization.

UI assumptions:

- A non-admin user only sees contracts they created or can approve.
- Delete actions may be disabled/hidden based on contract status.

### Delete behavior

The UI calls `DELETE /api/v1/contracts/{id}/` and treats backend as source of truth.

Backend performs best-effort Cloudflare R2 cleanup after DB delete.

## How to verify locally

1) Login.
2) Create a contract.
3) Confirm it shows up in `/contracts`.
4) Delete it, confirm it disappears and backend returns `204`.

## Troubleshooting

- `409` or `403` on delete: contract executed or insufficient permission.
- If PDF preview fails, verify `npm install` ran the pdfjs asset copy script.
