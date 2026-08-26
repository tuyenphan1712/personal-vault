# Feature: auth

## Responsibility
Login, register, refresh, logout, current user, app lock.

## Data flow
`app/(public)/login.tsx → useLogin() → auth.service.ts → POST /api/v1/auth/login { clientType: "mobile" }`

## Decisions
- Access token stays in memory (`shared/lib/auth/tokenStore.ts`).
- Refresh token is persisted only via `shared/lib/storage/secureStorage.ts` (Keychain/Keystore through `expo-secure-store`).
- `auth.store.ts` (Zustand) holds session/app-lock UI state only — server data stays in TanStack Query.
- Concurrent 401s are coordinated onto a single refresh call in `shared/lib/api/axios.ts`.
