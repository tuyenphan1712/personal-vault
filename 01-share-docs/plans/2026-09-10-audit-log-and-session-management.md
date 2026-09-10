# Plan: Audit Log + Session Management

> Cross-app (backend + frontend + mobile) — kept here per root `CLAUDE.md`.
> Branch: `feature/audit-log-session-management`

## Goal

1. **Audit log**: record sensitive user actions (password change, PIN change,
   credential CRUD, document upload/delete, login success/failure, admin
   lock) and surface them as a notification list — bell icon in web `TopBar`,
   bell icon on mobile Home header.
2. **Session management**: let a user see their other active login sessions
   (web/mobile, device info) and revoke any session that isn't the current
   one — a section inside `ProfilePage` (web) / `ProfileScreen` (mobile).

## Decisions locked in during brainstorming

- Audit scope (MVP): `PASSWORD_CHANGED`, `PIN_CHANGED`, `CREDENTIAL_CREATED`,
  `CREDENTIAL_UPDATED`, `CREDENTIAL_DELETED`, `DOCUMENT_UPLOADED`,
  `DOCUMENT_DELETED`, `LOGIN_SUCCESS`, `LOGIN_FAILED`, `ACCOUNT_LOCKED`.
- Write path: direct synchronous call from each existing service into a new
  `AuditLogService` in the same transaction — no event bus (none exists
  today, YAGNI).
- Unread badge: `read_at IS NULL` count; opening the dropdown (web) /
  notifications screen (mobile) marks all as read.
- Badge refresh: optimistic, refetched right after the acting mutation
  succeeds — no polling.
- Web placement: bell icon + badge in the existing `TopBar`, dropdown of
  recent items with a link to a full `/audit-log` page.
- Mobile placement: bell icon + badge on the Home header, tapping opens a
  dedicated Notifications screen (list).
- Session list source: existing `refresh_tokens` table (`client_type`,
  `device_info`, `expires_at`, `revoked_at`) — no new table.
- Web sessions UI: new section inside `ProfilePage`, below
  `ProfileDetail`/`ProfileForm`.
- Mobile sessions UI: new section inside `ProfileScreen`, near "Change
  Password".
- Revoking another session only needs a confirm dialog, not password
  re-entry.
- Revoking the *current* session is blocked (`400`/`SESSION_002`) — use the
  existing `/auth/logout` flow for that instead, so "revoke" and "logout"
  stay two distinct, unambiguous actions.

## New backend contracts (to also land in `API_SPEC.md` / `DATABASE.md`)

### `audit_logs` table (migration `V6__create_audit_logs_table.sql`)

| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → users.id, NOT NULL | owner, cascade delete |
| action | VARCHAR(50) NOT NULL | one of the MVP scope values above |
| target_label | VARCHAR(255) NULL | human-readable snapshot (e.g. credential's `platform_name`, document's `title`) captured at write time, since the target row may later be deleted |
| read_at | TIMESTAMP NULL | NULL = unread |
| created_at | TIMESTAMP NOT NULL default now() | |

Indexes: `idx_audit_logs_user_id`, `idx_audit_logs_user_id_read_at`.

### Audit log endpoints

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/audit-logs` | Paginated list, newest first | User |
| GET | `/audit-logs/unread-count` | `{ count }` | User |
| PATCH | `/audit-logs/read-all` | Marks all of the caller's logs read, `204` | User |

No new error codes needed (list/count/mark-all have no failure modes beyond
standard auth).

### Session endpoints

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/sessions` | List caller's non-revoked, non-expired refresh-token sessions | User |
| DELETE | `/sessions/{id}` | Revoke one session (not the current one) | User |

`GET /sessions` response item: `{ id, clientType, deviceInfo, createdAt, expiresAt, isCurrent }`.
"Current" is resolved by hashing the caller's own refresh token (web: read
from the `refreshToken` HttpOnly cookie; mobile: `currentRefreshToken` query
param, same pattern as `POST /auth/change-password`) and matching
`token_hash`.

New error codes: `SESSION_001` session not found (`404`), `SESSION_002`
cannot revoke the current session (`400`).

## Vertical slices (each its own trunk-based PR)

1. **BE: audit log write + read** — `audit_logs` entity/migration/repo/
   service; wire `AuditLogService.record(...)` calls into
   `CredentialService`, `DocumentService`, `AuthService` (login
   success/failure), `AdminService` (lock); `GET /audit-logs`,
   `GET /audit-logs/unread-count`, `PATCH /audit-logs/read-all`.
2. **FE: audit log UI** — bell icon + badge in `TopBar`, dropdown (recent
   items, opening marks-all-read), `/audit-log` full list page.
3. **Mobile: audit log UI** — bell icon + badge on Home header, Notifications
   screen (list, opening marks-all-read).
4. **BE: session management** — `GET /sessions`, `DELETE /sessions/{id}`
   against existing `refresh_tokens`, current-session resolution for both
   client types, `SESSION_001`/`SESSION_002`.
5. **FE: session management UI** — "Active Sessions" section in
   `ProfilePage`, revoke button + confirm dialog per non-current session.
6. **Mobile: session management UI** — "Active Sessions" section in
   `ProfileScreen`, same revoke UX.

Slices 1→2→3 and 4→5→6 are sequential (FE/mobile consume the merged BE API).
2/3 and 5/6 are independent of each other and can proceed in either order
once their BE slice is merged.

## Testing

Each slice follows this repo's `tdd`/`testing` conventions: backend slices
get JUnit unit tests (service), MockMvc controller tests, and a Testcontainers
integration test for the new repository query; frontend/mobile slices get
Vitest+RTL / Jest+RNTL component and hook tests with MSW-mocked services.
Mutation testing runs once per slice at the PR-readiness gate, per the
`mutation-testing` skill.
