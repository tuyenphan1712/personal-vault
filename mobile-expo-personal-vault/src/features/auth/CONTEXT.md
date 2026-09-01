# Feature: auth

## Responsibility
Login, register, refresh, logout, current user, app lock.

## Data flow
`app/(public)/login.tsx → LoginScreen → useLogin() → auth.service.ts → POST /api/v1/auth/login { clientType: "mobile" }`
`app/(public)/register.tsx → RegisterScreen → useRegister() → auth.service.ts → POST /api/v1/auth/register`
`app/_layout.tsx (root) → useSessionBootstrap() → auth.service.ts refresh + getMe → auth.store.ts`
`app/(protected)/_layout.tsx → useAuthStore() gate → redirect to /(public)/login when unauthenticated`

## Decisions
- Access token stays in memory (`shared/lib/auth/tokenStore.ts`).
- Refresh token is persisted only via `shared/lib/storage/secureStorage.ts` (Keychain/Keystore through `expo-secure-store`).
- `auth.store.ts` (Zustand) holds session/app-lock UI state only — server data stays in TanStack Query.
- Concurrent 401s are coordinated onto a single refresh call in `shared/lib/api/axios.ts`.
- `useSessionBootstrap()` (called once, from the root `app/_layout.tsx`) registers the axios refresh/session-expired handlers and attempts to restore the session from the stored refresh token on cold start; `auth.store.ts.isSessionLoading` gates the initial route decision so the app never flashes the login screen before the restore attempt finishes.
- `useLogout()` calls `POST /auth/logout` best-effort, then always clears the in-memory access token, the SecureStore refresh token, the Zustand session, and the TanStack Query cache regardless of network outcome.
- `clientType: "mobile"` is always sent on login so the backend returns a `refreshToken` in the response body (web relies on the cookie instead).
- **Credential encryption key**: `useLogin()` also derives the `credentials` feature's AES-256-GCM key from the plaintext login password via `shared/lib/crypto/cryptoAdapter.ts` (PBKDF2-SHA256, salt = user id, 100k iterations) and stores it in memory only (`shared/lib/crypto/keyStore.ts`) — this mirrors the web client's `shared/lib/crypto.ts`/`keyStore.ts` exactly so a credential encrypted on one platform decrypts on the other. The key is cleared on logout and on `handleSessionExpired`, and is **not** restored by `useSessionBootstrap()` (a cold start only has the refresh token, never the plaintext password) — the `credentials` feature must handle a missing key via its own `useUnlockVault` prompt, not by crashing.
