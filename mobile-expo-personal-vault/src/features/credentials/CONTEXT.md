# Feature: credentials

## Responsibility
CRUD for saved platform credentials. The password is encrypted client-side (AES-256-GCM) via `shared/lib/crypto/cryptoAdapter.ts` before it is sent to the backend; the backend only ever stores/returns ciphertext.

## Data flow
`app/(protected)/credentials/new.tsx → CredentialFormScreen → encrypt locally → useCreateCredential()/useUpdateCredential() → POST/PATCH /api/v1/credentials`
`app/(protected)/credentials/index.tsx → CredentialListScreen → useCredentials() → GET /api/v1/credentials`
`app/(protected)/credentials/[id].tsx → CredentialDetailScreen → useCredential(id) + PasswordReveal (decrypt on demand)`

## Decisions
- **Encryption key/format is shared with the web client** (`frontend-react-personal-vault/src/shared/lib/crypto.ts`) — PBKDF2-SHA256 (salt = user id, 100k iterations) -> AES-256-GCM key, 12-byte random IV per value, `base64(iv):base64(ciphertext+authTag)` encoding. A credential encrypted on web must decrypt on mobile and vice versa. Implemented with `@noble/hashes`/`@noble/ciphers` (pure JS, works under Expo Go, no native module/prebuild required) plus `expo-crypto` for the IV's CSPRNG.
- The key itself comes from `auth`'s `useLogin()` (see `auth/CONTEXT.md`), populated into `shared/lib/crypto/keyStore.ts`. This feature never derives a key itself except through `useUnlockVault`, used when the key is missing (app restart, since the plaintext password isn't recoverable from the refresh-token session) — `CredentialListScreen`/`CredentialDetailScreen` show `UnlockVaultPrompt` instead of the data until a key is present.
- Password is only decrypted on demand (`PasswordReveal`'s "Show" button), not eagerly for every row — avoids decrypting data the user never looks at.
- A wrong unlock password isn't validated separately — AES-GCM's built-in auth tag verification makes decryption throw for any wrong key, surfaced as "Could not decrypt this password" per credential.
- Edit reuses the `new` route with an `id` search param (`router.push({ pathname: '/(protected)/credentials/new', params: { id } })`) rather than a separate `[id]/edit` route, since `CredentialFormScreen` already branches on whether an id was passed.
- The password field is always required on the form, even when editing — matches the web client; editing re-encrypts the password rather than supporting a partial "keep existing password" update.
