# Admin Feature

Owns `GET/PATCH/DELETE /api/v1/admin/users...`. See `01-share-docs/API_SPEC.md` §6/§7 (Admin) and `01-share-docs/DATABASE.md` §3 (cascade rules).

## No entity/repository of its own

Unlike every other feature, `admin` has no dedicated table — it operates entirely on `users` (via `UserRepository`, imported from the `users` feature) and, for cleanup on delete, `documents` (via `DocumentRepository`/`DocumentStorageService`, imported from the `documents` feature). There's no `entity/`/`repository/` folder here by design.

## Authorization

Enforced with `@PreAuthorize("hasRole('ADMIN')")` on the controller (method security enabled via `@EnableMethodSecurity` on `SecurityConfig`). The role comes from the JWT's `role` claim → `JwtAuthenticationFilter` sets a `ROLE_<ROLE>` authority. A non-admin authenticated user gets `403`/`ADMIN_001` (mapped from Spring Security's `AccessDeniedException` in `GlobalExceptionHandler`); an unauthenticated request still gets Spring Security's default response for a missing/invalid token (see the same known gap noted in `AuthContext.md`).

## Delete cascade

`credentials` and `refresh_tokens` rows cascade at the DB level (`ON DELETE CASCADE`, already in their migrations) — nothing to do here. `documents` rows also cascade, but the **file bytes don't** — `AdminService.deleteUser()` loads the user's documents, deletes each file from storage, then deletes the document rows, and only then deletes the user, so no orphaned files are left on disk (same ordering rationale as `DocumentService.delete()` in `DocumentContext.md`).

## Admin scope stays narrow

Per `API_SPEC.md` §6, admin can lock/unlock/delete accounts but has no path to another user's credential plaintext or document contents — `AdminService` never touches `Credential`/document file contents, only document *rows* (for cleanup) and the `User` entity's `status` field.
