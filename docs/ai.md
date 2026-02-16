# AI Assistance (Frontend)

## Route

- `/ai` (if exposed) may be embedded inside contract/template screens.

## Backend endpoints used (typical)

- `/api/v1/ai/` (viewset)
- Streaming endpoints for generation/suggestions (see `app/lib/api-client.ts`)

## Approach

- Prefer **server-side** AI calls; the browser only sends the user’s intent and context.
- Use streaming for long-running responses to keep UI responsive.
- Respect tenant AI policy (PII scrubbing / full-text sending) if returned by backend.

## How to verify locally

1) Login.
2) Trigger an AI action (rewrite/summarize/risk spotting).
3) Confirm streaming output renders incrementally.
