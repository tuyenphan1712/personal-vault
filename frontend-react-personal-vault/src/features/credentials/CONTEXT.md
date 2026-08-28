# Feature: credentials

## Responsibility
CRUD for saved platform credentials. The password is encrypted client-side (AES-GCM) before it is sent to the backend; the backend only ever stores/returns ciphertext.

## Data flow
`CredentialForm → encrypt locally → useCreateCredential() → POST /api/v1/credentials`

## Decisions
- Encryption key comes from `shared/lib/keyStore.ts`, populated by `auth`'s `useLogin` (see `auth/CONTEXT.md` for the PBKDF2 derivation). This feature never derives a key itself except through `useUnlockVault`, used when the key is missing (e.g. after a page reload) — `CredentialListPage`/`CredentialDetailPage` show `UnlockVaultPrompt` instead of the data until a key is present.
- Password is only decrypted on demand ("Show password" button), not eagerly for every row — avoids decrypting data the user never looks at.
- A wrong unlock password isn't validated separately — AES-GCM's built-in auth tag verification makes decryption throw for any wrong key, which surfaces as "Could not decrypt — try unlocking the vault again." per credential.
- Create/edit uses a `Modal` + shared `CredentialForm` from the list page rather than separate route pages, since there was no need for deep-linkable create/edit URLs.
