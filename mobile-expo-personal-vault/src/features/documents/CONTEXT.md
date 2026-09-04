# Feature: documents

## Responsibility
Pick, validate, upload, list, preview, download, and delete private documents (max 10MB, jpeg/png/pdf only).

## Data flow
`app/(protected)/documents/upload.tsx → DocumentUploadScreen → useUploadDocument() → POST /api/v1/documents (multipart)`
`app/(protected)/documents/index.tsx → DocumentListScreen → useDocuments() → GET /api/v1/documents`
`app/(protected)/documents/[id].tsx → DocumentDetailScreen → useDocument(id) + useDownloadDocument() → GET /api/v1/documents/{id}/download`

## Decisions
- No client-side encryption: per `API_SPEC.md`, only credential passwords are encrypted end-to-end. Documents are stored as opaque files behind ownership checks on the backend, so this feature never touches `shared/lib/crypto/`.
- No update endpoint exists (`API_SPEC.md` §6 lists no `PATCH /documents/{id}`), so there is no edit screen/route — only upload (create), list, detail, download, and delete.
- `DocumentPickerButton` offers two system pickers — `expo-document-picker` (Files) and `expo-image-picker` (Photos) — funneling into the same `PickedFile` shape, since either can plausibly hold a jpeg/png/pdf scan.
- On-device type/size validation (`utils/documentValidation.ts`) is best-effort UX feedback only; the upload screen also surfaces the backend's `413`/`415` responses as the authoritative rejection.
- `docType` chips mirror the picker categories in `API_SPEC.md` §3 plus a free-typed "Other" field — any value is accepted as-is by the backend (no whitelist, no migration needed for new categories).
- Download streams the file via `expo-file-system`'s `File.downloadFileAsync` directly against the API (not through the shared Axios instance, which isn't built for binary responses), attaching the in-memory access token as a bearer header, then hands the cached file to `expo-sharing` for the user to preview/save through the OS share sheet. The downloaded copy lives under the app's cache directory and is not persisted to `AsyncStorage`.
- The `documents` route group and its `Stack.Screen` entry in `app/(protected)/_layout.tsx` were added by this feature — it previously only had `credentials`.
