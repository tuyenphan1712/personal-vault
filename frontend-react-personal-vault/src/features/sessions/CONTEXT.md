# Feature: sessions

## Responsibility
View and revoke the current user's other active login sessions (`refresh_tokens` rows). No page of its own — `SessionList` is rendered as a section inside `ProfilePage`.

## Data flow
`ProfilePage → SessionList → useSessions() → GET /api/v1/sessions`
`SessionRow "Revoke" → RevokeSessionDialog confirm → useRevokeSession() → DELETE /api/v1/sessions/{id}`

## Decisions
- No pagination — `GET /sessions` returns a plain array (a user has at most a handful of active sessions), so `sessionService.getAll` returns `Session[]` directly, not `{ data, meta }` like `credentials`/`documents`.
- The current session (`isCurrent: true`) never shows a "Revoke" button — the backend rejects that anyway (`SESSION_002`), and revoking your own session is what `/auth/logout` is for, not this list.
- Revoking someone else's session (a different device you own) only needs a confirm dialog, not password re-entry — it's not as destructive as changing the password or deleting an account.
- `sessionKeys.all` has no sub-keys (`list`/`detail`) since there's exactly one query shape here — no params, no per-item fetch.
