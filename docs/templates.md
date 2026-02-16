# Templates (Frontend)

## Routes

- `/templates` -> `app/templates/page.tsx`

## Key modules

- Template UI components under `app/components/*`.
- Some direct `fetch()` usage exists in components (for older paths).
- Typed API client supports template flows.

## Backend endpoints used (typical)

- `GET /api/v1/templates/types/`
- `GET /api/v1/templates/types/{template_type}/`
- `GET /api/v1/templates/files/`
- `GET /api/v1/templates/files/{template_type}/`
- `GET /api/v1/templates/files/content/{filename}/`
- `GET /api/v1/templates/files/schema/{filename}/`
- `POST /api/v1/templates/validate/`
- `POST /api/v1/templates/create-from-type/`

Signature field config:

- `GET|POST /api/v1/templates/files/signature-fields-config/{filename}/`

## Approach

### Two “template concepts”

- **Template types**: predefined categories and metadata.
- **Template files**: DB-backed files; these can be tenant/user scoped.

### Schema-driven forms

The UI uses the backend schema endpoint to build forms and map placeholders.

### Safety

If HTML is rendered, the UI sanitizes content via `app/lib/sanitize-html.ts`.

## How to verify locally

1) Login.
2) Open `/templates`.
3) List template types.
4) Open a template, fetch schema + content.
5) Run validation and generate a document.
