# Feature: documents

## Responsibility
Upload, list, preview, download, and delete private documents (multipart upload, max 10MB, jpeg/png/pdf only).

## Data flow
`DocumentList → useDocuments() → document.service.ts → GET /api/v1/documents`
`DocumentUploadForm → useUploadDocument() → document.service.ts → POST /api/v1/documents (multipart)`
`DocumentCard/DocumentDetail → useDownloadDocument() → document.service.ts → GET /api/v1/documents/{id}/download (blob)`

## Decisions
- No client-side encryption: unlike `credentials`, document contents are protected by HTTPS + private storage + ownership checks on the backend (per `FE-PROJECT-RULES.md` §6). Client-side document encryption is a separate, unstarted security phase.
- File validation (`MAX_FILE_SIZE_BYTES`, `ALLOWED_DOCUMENT_TYPES` from `config/constants.ts`) is enforced client-side via the Zod schema in `DocumentUploadForm` purely for fast feedback — the backend is the source of truth and re-validates independently.
- Download never uses a public file URL. `useDownloadDocument` fetches the file as a `Blob` via the authenticated Axios client, then triggers a save through a short-lived `URL.createObjectURL` link.
- `docType` is optional and constrained client-side to the MVP set (`cccd`, `diploma`, `passport`) via a `<select>`, matching the backend's service-layer validation — not modeled as a hard union in the API contract since the backend can extend it without a migration.
- Create/edit uses a `Modal` + `DocumentUploadForm` from the list page, consistent with the `credentials` feature's pattern. There is no edit flow — documents are immutable metadata once uploaded (matches `API_SPEC.md`, which has no `PATCH /documents/{id}`).
