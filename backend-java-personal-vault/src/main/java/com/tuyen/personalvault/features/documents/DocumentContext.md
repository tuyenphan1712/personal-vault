# Documents Feature

Owns `GET/POST /api/v1/documents`, `GET /api/v1/documents/{id}`, `GET /api/v1/documents/{id}/download`, `DELETE /api/v1/documents/{id}`. See `01-share-docs/API_SPEC.md` §3/§6/§7 (Documents) and `01-share-docs/DATABASE.md` §2 (`documents`).

## File storage

`DocumentStorageService` writes files under `app.storage.path` (private filesystem, not web-served) using a random UUID as the on-disk filename — never the original filename. `storage_path` is stored in the DB but never leaves the service layer: `DocumentResponse` doesn't include it, and the only way to get file bytes back is `GET /{id}/download`, which streams via `DocumentStorageService.load()`.

## Size/type validation happens twice, deliberately

`spring.servlet.multipart.max-file-size=10MB` (already configured) rejects an oversized request body before it reaches the controller, via `MaxUploadSizeExceededException` — handled in `GlobalExceptionHandler` and mapped to `413`/`DOCUMENT_003`. `DocumentStorageService.store()` also checks size and the MIME allow-list (`image/jpeg`, `image/png`, `application/pdf`) explicitly, so the enforced limits are visible in code and don't only exist as servlet config.

## `docType` validation

Per `DATABASE.md`, `doc_type` is free-text at the DB level (extendable later without a migration) but validated at the service layer against the MVP set (`cccd`, `diploma`, `passport`). An unsupported value is rejected as `COMMON_001` with a field-level `details` entry (same shape as Jakarta Bean Validation errors), not a dedicated `DOCUMENT_*` code, since it's a request-validation failure rather than a storage/lookup error.

## Ownership and cleanup

Every read/download/delete goes through `findByIdAndUserId`. `delete()` removes the file from disk **before** deleting the DB row — the two aren't atomic (file I/O isn't part of the JPA transaction), so this ordering is a deliberate choice: if something fails between the two steps, the failure mode is a DB row with no backing file (visible, safe to clean up) rather than a file that silently outlives its "deleted" record (invisible, and the file was supposed to be private/removed).
