# Search (Frontend)

## Route

- `/search` -> `app/search/page.tsx`

## Key modules

- API client search methods: `app/lib/api-client.ts`

## Backend endpoints used

- `GET /api/search/?q=...`
- `GET /api/search/semantic/?q=...`
- `POST /api/search/advanced/`
- `GET /api/search/suggestions/?q=...`
- `GET|POST /api/search/similar/`

## Approach

### Multiple strategies

The UI exposes multiple search modes, but keeps a consistent result shape.

- Keyword search -> fast + predictable
- Semantic search -> embedding-based similarity
- Advanced search -> combines query + filters

### Debouncing + suggestions

Autocomplete calls `suggestions` as the user types. To keep UX responsive:

- debounce input changes
- handle `400` gracefully when query length is too small

## How to verify locally

1) Login.
2) Open `/search`.
3) Run keyword search with `q` length >= 2.
4) Run semantic search and confirm it returns results or a clear error.
