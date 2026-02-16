# Authentication (Frontend)

## Routes

- `/register` -> `app/register/page.tsx`
- `/login` -> `app/login/page.tsx`
- `/verify-otp` -> `app/verify-otp/page.tsx`
- `/forgot-password` -> `app/forgot-password/page.tsx`
- `/reset-password` -> `app/reset-password/page.tsx`

## Key modules

- Auth provider/context: `app/lib/auth-context.tsx`
- Auth API helpers + token storage: `app/lib/api.ts` (`authAPI`, `tokenManager`, `APIError`)
- Typed API client (also used by non-auth flows): `app/lib/api-client.ts`

## Backend endpoints used

- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `POST /api/auth/google/` (optional)
- `GET /api/auth/me/`
- `POST /api/auth/refresh/`
- `POST /api/auth/logout/`

OTP flows:

- `POST /api/auth/request-login-otp/`
- `POST /api/auth/verify-email-otp/`

Password reset flows:

- `POST /api/auth/forgot-password/`
- `POST /api/auth/verify-password-reset-otp/`
- `POST /api/auth/resend-password-reset-otp/`
- `POST /api/auth/reset-password/`

## Approach (implementation details)

### 1) Stateless auth in the browser

The frontend stores tokens in `localStorage` via `tokenManager`:

- `access_token`
- `refresh_token`
- `user` (cached user context)

This makes client-side navigation fast and avoids a DB-backed session cookie.

### 2) Global auth state via React context

`AuthProvider` wraps the entire app in `app/layout.tsx` and exposes:

- `isAuthenticated`, `isLoading`, `user`, `error`
- `login`, `loginWithGoogle`, `register`, `logout`

### 3) OTP-gated onboarding

The UI supports a backend behavior where credentials are valid but the account is inactive.

- The backend returns HTTP `403` with `{ pending_verification: true }`.
- The login screen detects that response and redirects to `/verify-otp?email=...&type=login`.

### 4) “Bootstrap /me” on refresh

If a token exists but cached user data is missing, the provider calls `GET /api/auth/me/` once to rehydrate the UI.

## How to verify locally

1) Set `NEXT_PUBLIC_API_BASE_URL` in `.env.local`.
2) Start frontend: `npm run dev`.
3) Register -> verify OTP -> login.
4) Refresh the page and confirm you remain logged in.

## Common issues

- **Google sign-in button doesn’t appear**: set `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
- **401 on /me**: backend base URL mismatch or token expired.
- **CORS errors**: backend must allow `http://localhost:3000` (no path, no trailing slash).
