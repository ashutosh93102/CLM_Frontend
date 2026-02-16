# Repository + Uploads (Frontend)

## Routes

- `/uploads` -> `app/uploads/page.tsx`
- Repository-related routes may exist under `app/indexing` or dedicated repository screens (depending on current UI).

## Key modules

- Upload logic: `app/lib/api-client.ts` (uses XHR when progress is needed)
- Downloads utilities: `app/lib/downloads.ts`

## Backend endpoints used (typical)

- `GET|POST /api/v1/private-uploads/`
- `POST /api/v1/private-uploads/url/`
- `POST /api/v1/upload-document/`
- `POST /api/v1/document-download-url/`

## Approach

### Why XHR for uploads

`fetch()` does not reliably expose upload progress across browsers.

The API client uses XHR for:

- progress callbacks
- better control over timeouts and abort

### Private URLs

The backend issues short-lived signed URLs so the frontend can download without exposing the bucket.

## How to verify locally

1) Login.
2) Upload a document.
3) Confirm progress UI updates.
4) Request a download URL and verify download works.
