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
- `docType` is a free-text field on the backend (no whitelist — only non-blank + ≤100 chars is enforced, see `API_SPEC.md` §7). The upload `<select>` offers one broad category per option (`DOCUMENT_TYPE_OPTIONS` in `document.types.ts`), plus a sentinel `OTHER_DOCUMENT_TYPE` option that reveals a free-text input for anything not covered — these are a UI convenience only, not modeled as a TS union, since the backend accepts any value. `getDocumentTypeLabel()` maps a stored value back to its Vietnamese label for display, falling back to the raw value for a free-typed "Other" entry.
- Create/edit uses a `Modal` + `DocumentUploadForm` from the list page, consistent with the `credentials` feature's pattern. There is no edit flow — documents are immutable metadata once uploaded (matches `API_SPEC.md`, which has no `PATCH /documents/{id}`).
