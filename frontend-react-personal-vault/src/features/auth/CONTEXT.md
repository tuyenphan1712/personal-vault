# Feature: auth

## Responsibility
Registration, login, logout, session restoration, and exposing the current user.

## Data flow
`LoginForm → useLogin() → auth.service.ts → POST /api/v1/auth/login`

## Decisions
- Access token is kept in memory only (`shared/lib/tokenStore.ts`), never in `localStorage`.
- Web refresh token lives in an HttpOnly cookie; native mobile is out of scope for this app.
- `auth.store.ts` (Zustand) holds only session UI state (`user`, `isAuthenticated`) — server data itself stays in TanStack Query.
- **Credential encryption key**: derived on login (`useLogin`) from the plaintext login password via PBKDF2-SHA256 (salt = user id, 100k iterations) into an AES-256-GCM `CryptoKey`, kept in memory only (`shared/lib/keyStore.ts`). Same password always re-derives the same key, so nothing about the key is persisted anywhere. Trade-off: a page reload restores the session (via silent refresh + `/auth/me`) but **not** the encryption key, since the plaintext password isn't available after reload — the `credentials` feature must handle a missing key by prompting the user to unlock again, not by crashing. Changing the login password will need a re-encryption migration for existing credentials; not handled yet (no "change password" flow exists).
- `useSessionBootstrap` (called once at app root) wires the axios 401 → refresh → retry handlers and attempts a silent refresh on mount so a reload keeps the user logged in.
