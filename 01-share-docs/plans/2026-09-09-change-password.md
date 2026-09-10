# Plan: Change Password

Date: 2026-09-09
Branch: `feature/change-password`

## Goal

Let an authenticated user change their login password, without permanently
orphaning any of their existing encrypted credential data.

## Why this is not a simple password-change endpoint

There is **one password**, not two: the login password is also the sole
input (with `userId` as salt) to `deriveEncryptionKey`, which produces the
AES-256-GCM key used to encrypt/decrypt every `encryptedPassword` /
`encryptedPin` on `credentials` (confirmed identically in
`frontend-react-personal-vault/src/shared/lib/crypto.ts` and
`mobile-expo-personal-vault/src/shared/lib/crypto/cryptoAdapter.ts`, and
documented in `frontend-react-personal-vault/src/features/auth/CONTEXT.md`).
Changing the password changes the derived key. Any credential ciphertext
still encrypted under the old key becomes permanently undecryptable — AES-GCM
auth-tag verification will fail with no recovery path, since the old
plaintext password is never stored anywhere.

`documents` are **not** client-side encrypted (per `BACKLOG.md` §3.1,
explicitly deferred), so they are entirely unaffected by this feature.

## Decisions (resolved with the user)

1. **Atomicity**: one backend endpoint, one DB transaction. The client
   decrypts every owned credential with the *old* key, re-encrypts with the
   *new* key, and sends the current password + new password + the full set
   of re-encrypted ciphertexts in a single request. The backend applies the
   password-hash change and every credential ciphertext update together, or
   nothing at all. Rejected alternative: N separate `PATCH /credentials/{id}`
   calls after a password change — risks leaving some credentials encrypted
   under a key that no longer exists if the client dies mid-loop.
2. **Session handling**: revoke all of the user's `refresh_tokens` **except**
   the one belonging to the current session. Web identifies "current" via
   the existing `refreshToken` HttpOnly cookie (same mechanism already used
   by `/auth/refresh` and `/auth/logout`); the request DTO also reserves an
   optional `currentRefreshToken` body field for the future mobile slice
   (mobile has no cookie, so it must send its own token), mirroring the
   existing cookie-first-then-body pattern in `AuthController.refresh()`.
3. **Delivery scope**: Slice 1 (backend) and Slice 2 (web UI) now. Slice 3
   (mobile UI) is planned but built later, reusing the same endpoint
   unchanged.

## API contract addition (`API_SPEC.md` / `DATABASE.md` will be updated in Slice 1)

`POST /api/v1/auth/change-password` — Auth: User

Request:
```json
{
  "currentPassword": "old-password",
  "newPassword": "new-password",
  "currentRefreshToken": "only present for mobile clients (no cookie)",
  "credentials": [
    { "id": "uuid", "encryptedPassword": "base64(iv):base64(ct)", "encryptedPin": null, "ciphertextVersion": 1 }
  ]
}
```

- `credentials` must be exactly the full set of the user's current owned
  credential ids — no more, no fewer. A mismatch (stale client state, e.g.
  a credential was created/deleted from another tab while the form was
  open) is rejected with `409` / `CREDENTIAL_002`, and the client should
  refetch and let the user retry rather than silently partially applying.
- Wrong `currentPassword` → `401` / `AUTH_006`.
- `newPassword` reuses `RegisterRequest`'s existing validation
  (`@NotBlank @Size(min = 8, max = 255)`).
- On success: `password_hash` updated, every listed credential's
  `encrypted_password`/`encrypted_pin`/`ciphertext_version` overwritten
  verbatim from the request, all refresh tokens for the user revoked except
  the current session's. Response: `200`, `data: null`.
- `ciphertextVersion` is not bumped by this flow — it identifies
  algorithm/encoding, not key; re-encrypting under a new key with the same
  AES-GCM scheme keeps the same version.

New error codes: `AUTH_006` (current password incorrect, 401),
`CREDENTIAL_002` (stale/incomplete credential set, 409).

## Slices

### Slice 1 — Backend: `POST /auth/change-password` (independent PR)
**Class**: behavior change → TDD + testing.
- `CredentialRepository`: add `List<Credential> findAllByUserId(UUID userId)`.
- `CredentialService`: add `replaceAllCiphertext(UUID userId, List<CredentialCiphertextUpdate> updates)` — verifies the update-id set exactly equals the owned-id set (else `CredentialNotFoundException`-style set-mismatch → new `StaleCredentialSetException`), then overwrites each credential's ciphertext fields. This is the public-service-interface path `auth` uses to touch `credentials` data (allowed per `BE-PROJECT-RULES.md` §3 — no repository reach-across).
- `RefreshTokenRepository`: add a bulk revoke-all-except-one query.
- `AuthService`: add `changePassword(ChangePasswordRequest, String cookieRefreshToken)`, `@Transactional`: verify current password (`passwordEncoder.matches`), re-hash new password, call `credentialService.replaceAllCiphertext(...)`, revoke other refresh tokens.
- `AuthController`: new route, cookie-first-then-body current-refresh-token read (mirrors `refresh()`/`logout()`).
- New DTOs: `ChangePasswordRequest`, `CredentialCiphertextUpdate`.
- New exceptions: `InvalidCurrentPasswordException` (`AUTH_006`), `StaleCredentialSetException` (`CREDENTIAL_002`).
- Update `API_SPEC.md` §5/§6/§7 and `DATABASE.md` if needed (no schema change — same columns as the PIN feature added).
- Tests: service-level (wrong current password, stale credential set, happy path revokes correctly, keeps current session), controller-level (validation, cookie vs body token), no mobile/web involved.

### Slice 2 — Frontend web: Change Password UI (independent PR, depends on Slice 1 merged)
**Class**: behavior change → TDD + testing.
- New `auth` (or `profile`) feature UI: a "Change password" form (current password, new password, confirm new password) inside the Profile page.
- On submit: derive old key (`deriveEncryptionKey(currentPassword, userId)`), derive new key (`deriveEncryptionKey(newPassword, userId)`), page through `credentialService.getAll` (respecting `MAX_PAGE_SIZE`) to collect every owned credential, decrypt each `encryptedPassword`/`encryptedPin` with the old key, re-encrypt with the new key, call the new `authService.changePassword(...)`.
- On success: call `setEncryptionKey(newKey)` so the unlocked vault keeps working without re-entering anything; show a success toast.
- On `AUTH_006`: show "current password is incorrect" inline on the current-password field.
- On `CREDENTIAL_002`: show a "your credentials changed, please retry" error and let the user resubmit (re-fetch happens naturally on resubmit).
- On old-key decrypt failure mid-loop (shouldn't happen if current password check already passed, but guard anyway): abort before sending anything, show a generic error — never send a partial/best-effort payload.
- Tests: form validation, full success path (mocks decrypt→re-encrypt→submit, asserts new key installed), wrong-current-password path, stale-set-conflict path — all via MSW, no real crypto surprises (reuse the existing `deriveEncryptionKey`/`encryptValue`/`decryptValue` test patterns already used in `CredentialForm.test.tsx`).

### Slice 3 — Mobile: Change Password UI (planned, not built now)
Same shape as Slice 2, using `cryptoAdapter` instead of `shared/lib/crypto`,
sending `currentRefreshToken` in the body (no cookie available). Explicitly
deferred until Slices 1–2 are merged and reviewed.

## Out of scope
- Documents: unaffected (not client-encrypted).
- Forcing logout of the *current* session: explicitly rejected per decision #2.
- Any change to `ciphertextVersion` semantics.
- Rate-limiting change-password attempts (not requested; flag to `BACKLOG.md` only if the user wants it later).
