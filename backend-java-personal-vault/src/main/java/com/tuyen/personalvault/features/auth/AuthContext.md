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

## Unauthenticated requests

`SecurityConfig` registers a custom `AuthenticationEntryPoint` so a missing/invalid/expired access token on a protected endpoint returns `401`/`AUTH_005` in the project's standard `{ success: false, error: {...} }` envelope (see `API_SPEC.md` §2/§5), not Spring Security's default response.

## Cookie `Secure` flag

The refresh cookie's `Secure` attribute is controlled by `app.cookie.secure` (env `COOKIE_SECURE`, default `true`). Keep it `true` in every real deployment — browsers require `Secure` cookies to travel over HTTPS. Only local HTTP-only frontend dev should set `COOKIE_SECURE=false`, otherwise the browser silently drops the refresh cookie and the web login/refresh flow can't be exercised end-to-end.
