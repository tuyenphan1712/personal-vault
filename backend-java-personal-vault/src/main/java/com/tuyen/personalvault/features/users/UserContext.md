# Users Feature

Owns the `User` entity/table and the current user's profile endpoints (`GET`/`PATCH /api/v1/profile`). See `01-share-docs/API_SPEC.md` §6/§7 (Profile) and `01-share-docs/DATABASE.md` §2 (`users`).

## Scope

This feature is deliberately **not** full CRUD from the client's perspective:

- **Create**: happens via `/auth/register` (`auth` feature) — not here.
- **Read/Update**: `GET`/`PATCH /profile`, scoped to the caller via `CurrentUser.id()`. `PATCH` only accepts `fullName`/`birthday`; `phone`, `role`, and `status` are not exposed as request fields at all, so they can't be set through this endpoint.
- **Delete**: happens via `/admin/users/{id}` (`admin` feature) — not here.

## Why the entity carries fields this feature doesn't expose

`role`, `status`, `failed_login_attempts`, and `lockout_until` are mapped on `User` even though `ProfileResponse`/`UpdateProfileRequest` don't touch most of them, because `auth` and `admin` (built later) need the same entity/repository for login, lockout, and account administration. `password_hash` is never mapped into any DTO.

## Enum storage

`UserRole`/`UserStatus` enum constants are lowercase (`admin`/`member`, `active`/`locked`) so `@Enumerated(EnumType.STRING)` serializes to the exact values in the `users.role`/`users.status` MySQL `ENUM` columns — no converter needed.

## Ownership

Both endpoints resolve the target row from `CurrentUser.id()` (JWT security context), never from a client-supplied id — there's no `{id}` path variable on these routes by design.
