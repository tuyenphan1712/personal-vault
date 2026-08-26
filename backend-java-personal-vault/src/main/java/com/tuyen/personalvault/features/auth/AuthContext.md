# Auth Feature

Owns `POST /auth/register|login|refresh|logout` and `GET /auth/me`, plus the `RefreshToken` entity. See `01-share-docs/API_SPEC.md` §2/§6/§7 and `01-share-docs/DATABASE.md` §2 (`refresh_tokens`).

## Why this imports from `users`

`User`/`UserRepository`/`UserStatus`/`UserNotFoundException` are imported directly from the `users` feature. `User` is the entity every other feature's FK relationships hang off of (`RefreshToken.user`, and later `Credential.user`/`Document.user`), so this is a legitimate entity relationship, not reaching into another feature's private implementation.

## Web vs mobile branching

`clientType` (login) / presence of a `refreshToken` body field (refresh, logout) decides the flow:

- **Web**: raw refresh token is set as an HttpOnly/Secure cookie (`refreshToken`, path `/api/v1/auth`) and never appears in the JSON body (`LoginResponse`/`RefreshResponse` use `@JsonInclude(NON_NULL)` so the field is omitted, not just `null`).
- **Mobile**: raw refresh token is returned in the JSON body for Keychain/Keystore storage; no cookie is set.

`RefreshToken.clientType` (persisted at issuance) — not the incoming request — decides how `refresh()`'s result is delivered, so a rotated token keeps behaving the way it was originally issued.

## Refresh token storage

Only a SHA-256 hex hash of the raw token is stored (`token_hash`). The raw token itself (64 random bytes, base64url) exists only in the client-facing response/cookie and is never persisted or logged.

## Brute-force lockout

`AuthService.login` checks `lockout_until` before checking the password. On the 5th consecutive failed attempt it sets `lockout_until = now + 15m` (still returns `AUTH_001` for that failing attempt itself); every login request while `lockout_until` is still in the future returns `429`/`AUTH_004` with `retryAfterSeconds` in `error.details`, independent of the admin-controlled `status` lock (`AUTH_002`).

## Known gaps (flagged, not fixed here)

- No `AuthenticationEntryPoint` is configured, so a missing/invalid access token currently gets Spring Security's default response rather than the project's `{ success: false, error: {...} }` envelope. Revisit when unauthenticated-request behavior needs to match the documented error format exactly.
- The refresh cookie is always marked `Secure`, so it will not be sent by browsers over plain HTTP in local dev — needs local HTTPS (or a temporary dev-only override) to exercise the web login/refresh flow end-to-end.
