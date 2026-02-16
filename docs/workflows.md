# Workflows (Frontend)

## Route

- `/workflows` -> `app/workflows/page.tsx`

## Backend endpoints used (typical)

- `GET /api/v1/workflows/`
- `POST /api/v1/workflows/`
- `GET /api/v1/workflows/{id}/`
- `PATCH /api/v1/workflows/{id}/`

Instances:

- `GET /api/v1/workflow-instances/`
- `POST /api/v1/workflow-instances/`

## Approach

- Workflows are modeled as a set of ordered steps.
- UI generally edits steps in-memory then submits to backend.
- Validation should rely on backend constraints (step numbers unique, required fields present).

## How to verify locally

1) Login.
2) Create a workflow with 2-3 steps.
3) Start an instance (if exposed in UI).
4) Confirm it persists on refresh.
