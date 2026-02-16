# Static Export (Cloudflare Pages)

This frontend supports static export for Cloudflare Pages.

## How it works

- `next.config.ts` checks `STATIC_EXPORT=1`.
- When enabled it sets:
  - `output: 'export'`
  - `trailingSlash: true`
  - `images: { unoptimized: true }`

## Build

```bash
STATIC_EXPORT=1 npm run build
```

Or via the provided script:

```bash
npm run build:pages
```

## Output

- Static site is emitted to `out/`.

## Important constraints

- Any feature that requires server-side rendering must be implemented client-side.
- API calls must go directly to the backend base URL (`NEXT_PUBLIC_API_BASE_URL`).

## Recommended deployment checks

- Confirm the backend allows the deployed Pages origin in CORS.
- Confirm `/login` and `/register` work end-to-end.
- Confirm deep links work with `trailingSlash` behavior.
