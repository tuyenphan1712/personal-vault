# Feature: admin

## Responsibility
Manage users and account status (lock/activate, delete). Never access another user's credential plaintext or private document contents. See `01-share-docs/API_SPEC.md` §6/§7 (Admin) and the backend's `AdminContext.md`.

## Decisions

- Single page (`AdminUsersPage`) — no detail/create/edit pages, since the API only exposes list + status update + delete (no `GET /admin/users/{id}`, and admin never creates a user).
- No `{Feature}Form.tsx` — every admin action is a button click (lock/unlock toggle, delete), not a form submission.
- `AdminUserTable` owns its own `search`/`page` UI state and calls `useAdminUsers` directly, following the same self-contained pattern as `DocumentList`/`CredentialList`.
- Delete is destructive (removes a whole account + owned data), so it goes through a confirm modal (`DeleteUserDialog`) — unlike `credentials`/`documents` delete, which fires immediately on click.
- Self-protection: the row matching the currently logged-in admin (`useAuthStore` user id) has its Lock/Delete buttons disabled, to prevent an admin from locking or deleting their own account by mistake.
- Errors from status update / delete are surfaced as a generic translated toast, matching the error-handling depth already used elsewhere in the app (no per-error-code branching for `ADMIN_001`/`USER_001`/`COMMON_001`).
