# Credentials Feature

Owns `GET/POST /api/v1/credentials` and `GET/PATCH/DELETE /api/v1/credentials/{id}`. See `01-share-docs/API_SPEC.md` §6/§7 (Credentials) and `01-share-docs/DATABASE.md` §2 (`credentials`).

## Encryption is opaque to the backend

`encryptedPassword` and `ciphertextVersion` are stored and returned as-is — the backend never decrypts, validates, or reinterprets them. They're only meaningful to the client, which uses `ciphertextVersion` to pick the right decryption path. Because of that, `CredentialResponse` returns `encryptedPassword` even though it's "sensitive" — the owner needs it client-side to decrypt.

## Ownership

Every read/update/delete goes through `findByIdAndUserId(id, CurrentUser.id())` — a credential that exists but belongs to another user returns `CREDENTIAL_001`/`404`, the same as a nonexistent id, so ownership can't be probed from the response.

## PATCH semantics

`UpdateCredentialRequest` fields are all optional; only non-null fields are applied, so a client can update just `note` without resending everything else.
