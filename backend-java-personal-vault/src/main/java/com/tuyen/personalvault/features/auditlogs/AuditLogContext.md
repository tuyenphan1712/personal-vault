# Audit Logs Feature

Owns `GET /api/v1/audit-logs`, `GET /api/v1/audit-logs/unread-count`, `PATCH /api/v1/audit-logs/read-all`. See `01-share-docs/API_SPEC.md` §6/§7 (Audit Logs) and `01-share-docs/DATABASE.md` §2 (`audit_logs`).

## Write path is direct, synchronous service calls

No event bus/async infrastructure exists in this codebase yet (`BE-ARCHITECTURE.md` §6 permits domain events "only when asynchronous processing is genuinely useful" — nothing currently needs it). `AuditLogService` is injected directly into `CredentialService`, `DocumentService`, `AuthService`, and `AdminService`, the same established pattern as `AuthService` already injecting `CredentialService`. Each write happens in the same transaction as the action it records.

## `target_label` is a snapshot, not a live reference

`AuditLog` has no FK to the credential/document it describes — only a `target_label` string captured at write time (e.g. `platformName`, `title`). This is deliberate: the target may be deleted later (that's often the very event being logged), and the log must still read sensibly after that.

## Action selection for credential updates

`PATCH /credentials/{id}` records `PIN_CHANGED` when `encryptedPin` is part of the request (non-null, same convention `CredentialService.update` already uses to decide whether to apply the field), otherwise `CREDENTIAL_UPDATED`. A single PATCH records exactly one entry.

## `LOGIN_FAILED` is only recorded for a known phone number

A failed login against an unregistered phone has no `user_id` to own the entry (`audit_logs.user_id` is `NOT NULL`), so it is not logged at all — only a wrong-password attempt against an existing account is recorded, as a security signal to that account's owner.

## `ACCOUNT_LOCKED` is recorded for the target user, not the admin

`AdminService.updateStatus` records the entry against the user being locked, only on a transition *to* `locked` (reactivating to `active` records nothing).

## Ownership and unread state

`list`/`unreadCount`/`markAllRead` are always scoped by `CurrentUser.id()` — never a client-supplied id. `read_at IS NULL` means unread; `PATCH /audit-logs/read-all` bulk-sets `read_at` for every unread row owned by the caller.
