# Feature: sessions

## Responsibility
View and revoke the current user's other active login sessions (`refresh_tokens` rows). No screen of its own — `SessionList` renders as a section inside `ProfileScreen`, mirroring the web client's placement.

## Data flow
`ProfileScreen → SessionList → useSessions() → GET /api/v1/sessions`
`SessionRow "Revoke" → Alert.alert confirm → useRevokeSession() → DELETE /api/v1/sessions/{id}`

## Decisions
- Mobile has no cookie transport, so `sessionService` reads the current refresh token from `expo-secure-store` (`getRefreshToken()`) and sends it as the `currentRefreshToken` query param on both `GET /sessions` and `DELETE /sessions/{id}` — same pattern `useChangePassword` already uses to identify the current session server-side.
- No pagination — `GET /sessions` returns a plain array, so `sessionService.getAll` returns `Session[]` directly.
- Revoke confirmation uses `Alert.alert` (native), the same pattern `CredentialDetailScreen` already uses for delete — there's no shared `Modal` component on mobile to build a custom dialog with.
- The current session (`isCurrent: true`) never renders a "Revoke" button — the backend rejects that anyway (`SESSION_002`); revoking your own session is `/auth/logout`'s job, not this list's.
