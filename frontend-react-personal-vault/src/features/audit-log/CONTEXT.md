# Feature: audit-log

## Responsibility
Read-only view of the current user's audit log (credential/document/PIN/password changes, login events, admin lock) and the unread-count bell in `TopBar`. No create/update/delete — the backend is the sole writer.

## Data flow
`NotificationBell → useUnreadCount()/useAuditLogs() → GET /audit-logs*` · opening the dropdown fires `useMarkAllRead() → PATCH /audit-logs/read-all`.

## Decisions
- No local client state store — everything is server state via TanStack Query, per the read-only nature of this feature.
- Opening the bell dropdown marks everything read immediately (matches the approved UX: "mark-all-read on open", not per-item).
- The badge is meant to update right after any action elsewhere in the app (credential/document/password changes), not just on a timer. Since those mutations live in other features, `auditLogKeys` is exported from this feature's `index.ts` and imported by `useCreateCredential`/`useUpdateCredential`/`useDeleteCredential` (credentials), `useUploadDocument`/`useDeleteDocument` (documents), and `useChangePassword` (auth) to invalidate `audit-logs` after `onSuccess`. This is the one place this feature is imported *by* another feature rather than the reverse — it's the same "import only via index.ts" rule, just used for cross-feature cache invalidation instead of UI composition.
- `NotificationBell` is rendered from `TopBar` directly (not lazy-loaded) since it's present on every protected page.
- `AuditLogItem` renders `t('auditLog.actions.<ACTION>')` for the action label — translation-driven rather than hardcoded English, so it stays in sync with the app's existing i18n setup.
