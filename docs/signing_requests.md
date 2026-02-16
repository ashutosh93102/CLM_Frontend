# Signing Requests / E-sign (Frontend)

## Routes

- `/signing-requests` -> `app/signing-requests/page.tsx`

## Key modules

- API client: `app/lib/api-client.ts` (Firma stream + signing URL helpers)
- Contracts UI often links into signing flows.

## Backend endpoints used (typical)

### SignNow

- `POST /api/v1/esign/send/`
- `GET /api/v1/esign/signing-url/{contract_id}/`
- `GET /api/v1/esign/status/{contract_id}/`

### Firma

- `POST /api/v1/firma/esign/send/`
- `GET /api/v1/firma/esign/signing-url/{contract_id}/`
- `GET /api/v1/firma/esign/status/{contract_id}/`
- `GET /api/v1/firma/esign/requests/`
- `DELETE /api/v1/firma/esign/requests/{record_id}/` (delete local tracking record)

Realtime updates:

- `GET /api/v1/firma/webhooks/stream/{contract_id}/`

## Approach

### “Tracking record” model

The UI treats Firma signing requests as:

- a backend vendor state (Firma)
- plus a local tracking record the UI can list and delete

Deleting a signing request in the UI deletes the tracking record (not necessarily the vendor artifact).

### Realtime updates

The client uses a streaming endpoint (via `fetch()` streaming) so it can attach Authorization headers.

## How to verify locally

1) Login.
2) Create/upload a contract.
3) Send for signature.
4) Open `/signing-requests` and confirm the request is listed.
5) Delete the request and confirm it disappears.
