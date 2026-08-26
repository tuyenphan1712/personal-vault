# API Specification — Personal Vault

> **Project**: Personal Vault — secure storage for credentials, personal identity data, and sensitive documents.
> **Audience**: Developers & AI coding assistants working on this codebase

---

## 1. Overview

| Concern | Value |
|---|---|
| API style | REST |
| Base path | `/api/v1` |
| Local base URL | `http://localhost:8080/api/v1` |
| Production base URL | Configured by environment — never hardcoded in Frontend |
| Default content type | `application/json` |
| File upload type | `multipart/form-data` |
| IDs | UUID strings |
| Dates | ISO-8601, e.g. `2026-08-22` or `2026-08-22T10:30:00Z` |

All successful responses use:

```json
{
  "success": true,
  "data": {},
  "meta": null
}
```

---

## 2. Authentication

The API uses **JWT access tokens** and **refresh tokens**:

- **Access token**: short-lived, kept in Frontend memory, sent via the `Authorization` header.
- **Web refresh token**: long-lived, stored in an HttpOnly, Secure cookie.
- **Native mobile refresh token**: long-lived, returned only for a native-client auth flow and stored in iOS Keychain/Android Keystore through secure storage. Mobile does not depend on browser cookies.
- Refresh tokens are stored and revocable in the `refresh_tokens` table, tagged with `client_type` (`web` or `mobile`).
- Login and refresh must reject users whose `status` is `locked`.
- **Brute-force protection**: after 5 consecutive failed login attempts for the same phone, `POST /auth/login` rejects further attempts with `429` / `AUTH_004` for 15 minutes, independent of the admin-controlled `status` lock. A successful login resets the counter. See `DATABASE.md` §2/§4 for the underlying `failed_login_attempts` / `lockout_until` fields.
- **Accepted limitation**: `status` is only re-checked at login/refresh time, not on every authenticated request. If an admin locks a user mid-session, that user's still-unexpired access token continues to work until it naturally expires (15 minutes by default). This bounded window is an accepted MVP trade-off, not a bug — do not "fix" it by adding a per-request DB check without discussing the performance trade-off first.

Request header:

```http
Authorization: Bearer <access-token>
```

**Authentication endpoints**:

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

> The backend gets the authenticated `userId` from the JWT security context. The Frontend must **never** provide a `userId` to decide resource ownership.

---

## 3. Request Conventions

### Pagination

List endpoints support:

```text
?page=1&limit=20
```

| Param | Default | Max |
|---|---|---|
| `page` | 1 | — |
| `limit` | 20 | 100 |

Supported optional parameters: `search`, `sortBy`, `sortDirection`, and feature-specific filters such as `docType`.

### JSON body

JSON request bodies use `camelCase`:

```json
{
  "platformName": "Gmail",
  "account": "user@gmail.com",
  "encryptedPassword": "base64-ciphertext",
  "note": "Personal account"
}
```

### File upload

Document upload uses `multipart/form-data`:

```text
file: binary file
title: string
docType: string, optional
```

**MVP file rules**:

- Max file size: **10MB** per file.
- Allowed types: `image/jpeg`, `image/png`, `application/pdf`.
- Storage: private filesystem or private object storage.
- File name: random UUID — never the original filename.
- Rejects unsupported types with `415`, oversized files with `413`.

> 10MB is normally enough for a phone photo or scanned document. A high-resolution photo may occasionally exceed it — the Frontend should show an error and allow compression before retrying. This limit can be raised later.

---

## 4. Response Format

### Single resource

```json
{
  "success": true,
  "data": {
    "id": "6c7f2c2d-5d3c-4a6f-9a14-123456789abc",
    "platformName": "Gmail"
  },
  "meta": null
}
```

### Collection

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "CREDENTIAL_001",
    "message": "Credential not found",
    "details": null
  }
}
```

---

## 5. HTTP Status and Error Codes

| Status | Meaning |
|---|---|
| 200 | Read or update succeeded |
| 201 | Resource created |
| 204 | Delete succeeded with no body |
| 400 | Invalid request or validation failure |
| 401 | Missing or invalid authentication |
| 403 | Authenticated but not authorized |
| 404 | Resource not found or not owned by the user |
| 409 | Duplicate or conflicting resource |
| 413 | File is too large |
| 415 | File type is unsupported |
| 429 | Too many failed login attempts — temporarily locked out |
| 500 | Unexpected server error |

**Error code prefixes by feature**:

```text
COMMON_001       Invalid request
AUTH_001         Invalid phone or password
AUTH_002         Account is locked
AUTH_003         Refresh token is invalid or revoked
AUTH_004         Too many failed login attempts — temporarily locked out
USER_001         User not found
USER_002         Phone number already registered
CREDENTIAL_001   Credential not found
DOCUMENT_001     Document not found
DOCUMENT_002     File type is unsupported
DOCUMENT_003     File is too large
ADMIN_001        Admin permission required
```

> `USER_002` maps to HTTP `409` and is returned by `POST /auth/register` when the given `phone` already exists.

---

## 6. Endpoints by Feature

### Auth

| Method | Path | Description | Auth |
|---|---|---|---|
| POST | `/auth/register` | Create a member account | No |
| POST | `/auth/login` | Authenticate by phone and password | No |
| POST | `/auth/refresh` | Issue a new access token | Refresh cookie (web) or `refreshToken` body field (mobile) |
| POST | `/auth/logout` | Revoke current refresh token | Refresh cookie (web) or `refreshToken` body field (mobile) |
| GET | `/auth/me` | Get current user summary | User |

### Profile

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/profile` | Get current user's profile | User |
| PATCH | `/profile` | Update current user's profile (`fullName`, `birthday` only — `phone` is immutable via this endpoint) | User |

### Credentials

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/credentials` | List owned credentials | User |
| POST | `/credentials` | Create encrypted credential | User |
| GET | `/credentials/{id}` | Get one owned credential | User |
| PATCH | `/credentials/{id}` | Update owned credential | User |
| DELETE | `/credentials/{id}` | Delete owned credential | User |

> `encryptedPassword` may be returned to the authenticated owner because the Frontend needs it to decrypt the value locally. Plaintext passwords must never be sent or stored by the backend. The ciphertext must never be returned to another user or written to logs.

### Documents

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/documents` | List owned document metadata | User |
| POST | `/documents` | Upload a private document | User |
| GET | `/documents/{id}` | Get owned document metadata | User |
| GET | `/documents/{id}/download` | Download owned document | User |
| DELETE | `/documents/{id}` | Delete owned document and file | User |

### Admin

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/admin/users` | List users | Admin |
| PATCH | `/admin/users/{id}/status` | Lock or activate a user | Admin |
| DELETE | `/admin/users/{id}` | Delete a user and owned data | Admin |

> Admin role is for account administration only. It does not grant permission to read another user's credential plaintext or private document contents.

---

## 7. Endpoint Details

### `POST /auth/login`

Request:

```json
{
  "phone": "0900000000",
  "password": "user-password"
}
```

For web clients, response data contains the current user and access token; the refresh token is set as an HttpOnly cookie and is **not** included in the JSON body. For native clients, include `clientType: "mobile"` (or use dedicated mobile auth endpoints) and return the refresh token in the response so the client can store it in Keychain/Keystore. Native refresh tokens must be hashed, rotated, and revoked exactly like web refresh tokens.

On the 6th consecutive failed attempt within the lockout window, the response is `429` with `error.code = "AUTH_004"` and `error.details = { "retryAfterSeconds": <n> }` instead of the usual `401`/`AUTH_001`.

Response `data` (both client types):

```json
{
  "user": {
    "id": "6c7f2c2d-5d3c-4a6f-9a14-123456789abc",
    "phone": "0900000000",
    "fullName": "Nguyen Van A",
    "role": "member"
  },
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "only present for clientType=mobile",
  "expiresIn": 900
}
```

### `POST /auth/refresh`

- **Web**: no request body — the refresh token is read from the HttpOnly cookie. Response sets a new rotated cookie and returns `{ accessToken, expiresIn }`.
- **Mobile**: request body `{ "refreshToken": "..." }`. Response returns `{ accessToken, refreshToken, expiresIn }` with the refresh token **rotated** (the old `refresh_tokens` row is revoked, a new one issued) — the client must persist the new `refreshToken` and discard the old one.
- Both variants reject with `AUTH_003` if the token is invalid, expired, or already revoked, and with `AUTH_002` if the owning user is `locked`.

### `GET /auth/me`

Response `data`:

```json
{
  "id": "6c7f2c2d-5d3c-4a6f-9a14-123456789abc",
  "phone": "0900000000",
  "fullName": "Nguyen Van A",
  "role": "member",
  "status": "active"
}
```

### `GET /profile` / `PATCH /profile`

`GET` returns the same shape as `/auth/me` plus `birthday`. `PATCH` request body accepts only `fullName` and `birthday`; `phone`, `role`, and `status` are ignored if sent and can only change via `/auth/register` (phone, once) or admin endpoints (role/status).

### `POST /credentials`

Request:

```json
{
  "platformName": "Gmail",
  "account": "user@gmail.com",
  "encryptedPassword": "base64-ciphertext-and-iv",
  "note": null
}
```

The backend validates ownership from JWT, stores the ciphertext, and never decrypts it.

### `POST /documents`

Multipart request:

```text
file       = passport.png
title      = Passport front page
docType    = passport
```

The backend validates file size and type, stores the file privately, and saves metadata (including the validated `mimeType` and `fileSize`) + storage path in MySQL.

Response `data`:

```json
{
  "id": "6c7f2c2d-5d3c-4a6f-9a14-123456789abc",
  "title": "Passport front page",
  "docType": "passport",
  "mimeType": "image/png",
  "fileSize": 482113,
  "createdAt": "2026-08-22T10:30:00Z"
}
```

`storage_path` is never returned to clients — files are only reachable via `GET /documents/{id}/download`, which streams the file with `Content-Type` set from the stored `mimeType` and `Content-Disposition: attachment`.

---

## 8. API Contract Notes

- The exact Java DTO names and Frontend TypeScript types must follow this contract.
- Any endpoint, field, status code, or response change requires updating this file.
- CORS, JWT secrets, database credentials, and storage paths are environment config — **not** API request fields.
