# Feature: auth

## Responsibility
Registration, login, logout, session restoration, and exposing the current user.

## Data flow
`LoginForm → useLogin() → auth.service.ts → POST /api/v1/auth/login`

## Decisions
- Access token is kept in memory only (`shared/lib/tokenStore.ts`), never in `localStorage`.
- Web refresh token lives in an HttpOnly cookie; native mobile is out of scope for this app.
- `auth.store.ts` (Zustand) holds only session UI state (`user`, `isAuthenticated`) — server data itself stays in TanStack Query.
