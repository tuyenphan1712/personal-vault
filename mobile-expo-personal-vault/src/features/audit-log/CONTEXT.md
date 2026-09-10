# Feature: audit-log

## Responsibility
Read-only view of the current user's audit log (credential/document/PIN/password changes, login events, admin lock). Surfaced as a bell + unread badge on the Home header and a full `NotificationsScreen`. No create/update/delete — the backend is the sole writer.

## Data flow
`app/(protected)/index.tsx` (bell) `→ useUnreadCount() → GET /audit-logs/unread-count`
`app/(protected)/notifications.tsx → NotificationsScreen → useAuditLogs() → GET /audit-logs`, and on mount `→ useMarkAllRead() → PATCH /audit-logs/read-all`

## Decisions
- No detail screen and no local client store — this is a flat, read-mostly feature, so `app/(protected)/notifications.tsx` is a single flat route file (mirrors `profile.tsx`/`settings.tsx`), not a `notifications/` folder like `credentials`/`documents`.
- Opening `NotificationsScreen` marks everything read immediately (fires `useMarkAllRead()` once on mount), matching the web dropdown's "mark all read on open" behavior — not per-item read state.
- `auditLogKeys` and `useUnreadCount` are exported from this feature's `index.ts` specifically so `useCreateCredential`/`useUpdateCredential`/`useDeleteCredential` (credentials), `useUploadDocument`/`useDeleteDocument` (documents), and `useChangePassword` (auth) can invalidate the badge right after their own mutation succeeds, instead of waiting for the query's normal staleness — mirrors the same decision made on the web client.
- `AuditLogItem` renders `t('notifications:actions.<ACTION>')` rather than hardcoded English, consistent with the app's bilingual (vi default, en) i18n setup.
