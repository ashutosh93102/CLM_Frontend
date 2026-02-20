# Signing Requests / E-sign (Frontend)

## Routes

- `/signing-requests` -> `app/signing-requests/page.tsx`

## Key modules

- API client: `app/lib/api-client.ts` (in-house e-sign requests, status, downloads)
- Contracts UI links into in-house signing flows.

## Backend endpoints used (typical)

### In-house e-sign

- `POST /api/v1/inhouse/esign/start/`
- `GET /api/v1/inhouse/esign/requests/`
- `GET /api/v1/inhouse/esign/status/{contract_id}/`
- `GET /api/v1/inhouse/esign/audit/{contract_id}/`
- `GET /api/v1/inhouse/esign/executed/{contract_id}/`
- `GET /api/v1/inhouse/esign/certificate/{contract_id}/`

## Approach

The UI treats in-house signing requests as the source of truth, and uses the status + audit endpoints to show progress.

## How to verify locally

1) Login.
2) Create/upload a contract.
3) Send for signature.
4) Open `/signing-requests` and confirm the request is listed.
5) Open `/contracts/signing-status?id={contract_id}` and confirm “Audit Logs” shows events.
