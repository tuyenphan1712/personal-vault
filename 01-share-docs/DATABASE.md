# Database Design — Personal Vault

> **Project**: Personal Vault — secure storage for credentials, personal identity data, and sensitive documents.
> **Stack**: MySQL 8.x, Spring Data JPA + Hibernate
> **Audience**: Developers & AI coding assistants working on this codebase

---

## 1. Overview

- **Database type**: MySQL 8.x
- **ORM**: Spring Data JPA + Hibernate
- **Code organization**: Feature-based (each feature owns its own entities/repositories)
- **Naming conventions**:
  - Tables & columns: `snake_case` (e.g. `password_hash`, `refresh_tokens`)
  - Primary keys: `UUID`
  - Indexes: `idx_<table>_<column>` (e.g. `idx_users_phone`)
  - Foreign keys: `fk_<table>_<column>_<ref_table>` (e.g. `fk_credentials_user_id_users`)
  - Character set: `utf8mb4` for text-heavy fields (`note`, `storage_path`, etc.)

---

## 2. Entities by Feature

### Feature: User Management (`users`)

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | Unique user identifier |
| phone | VARCHAR(20) | UNIQUE, NOT NULL | Login identifier |
| full_name | VARCHAR(255) | NOT NULL | User full name |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt/argon2 hash |
| birthday | DATE | NULL | Optional |
| role | ENUM('admin','member') | NOT NULL, default `member` | Operational role only |
| status | ENUM('active','locked') | NOT NULL, default `active` | Account lock status |
| created_at | TIMESTAMP | NOT NULL, default now() | Audit field |
| updated_at | TIMESTAMP | NOT NULL, default now() | Auto-updated |

**Indexes**: `idx_users_phone` on `phone`

---

### Feature: Authentication (`refresh_tokens`)

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | Unique token record identifier |
| user_id | UUID | FK → `users.id`, NOT NULL | Owner of the token |
| token_hash | VARCHAR(255) | UNIQUE, NOT NULL | SHA-256 hash of the refresh token |
| device_info | VARCHAR(255) | NULL | User agent / device name |
| expires_at | TIMESTAMP | NOT NULL | Expiration time |
| revoked_at | TIMESTAMP | NULL | Set on logout, rotation, or security event |
| created_at | TIMESTAMP | NOT NULL, default now() | Audit field |

**Indexes**:
- `idx_refresh_tokens_user_id` on `user_id`
- `idx_refresh_tokens_token_hash` on `token_hash`

---

### Feature: Credential Vault (`credentials`)

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | Unique credential identifier |
| user_id | UUID | FK → `users.id`, NOT NULL | Owner of the record |
| platform_name | VARCHAR(255) | NOT NULL | e.g. Gmail, Facebook |
| account | VARCHAR(255) | NOT NULL | Username/email on that platform |
| encrypted_password | TEXT | NOT NULL | Client-side encrypted password |
| note | TEXT | NULL | Extra notes or reminders |
| created_at | TIMESTAMP | NOT NULL, default now() | Audit field |
| updated_at | TIMESTAMP | NOT NULL, default now() | Auto-updated |

**Indexes**:
- `idx_credentials_user_id` on `user_id`
- `idx_credentials_platform_name` on `platform_name`

---

### Feature: Sensitive Document Storage (`documents`)

| Field | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | Unique document identifier |
| user_id | UUID | FK → `users.id`, NOT NULL | Owner of the record |
| title | VARCHAR(255) | NOT NULL | e.g. "CCCD front side" |
| doc_type | VARCHAR(100) | NULL | `cccd`, `diploma`, `passport` |
| storage_path | TEXT | NOT NULL | File path or object storage URL |
| created_at | TIMESTAMP | NOT NULL, default now() | Audit field |
| updated_at | TIMESTAMP | NOT NULL, default now() | Auto-updated |

**Indexes**:
- `idx_documents_user_id` on `user_id`
- `idx_documents_doc_type` on `doc_type`

---

## 3. Relationships

```text
users (1) ──< owns >── (n) credentials
users (1) ──< owns >── (n) documents
users (1) ──< owns >── (n) refresh_tokens
```

- All relationships are **one-to-many**; no many-to-many in v1.
- `credentials.user_id`, `documents.user_id`, `refresh_tokens.user_id` → FK to `users.id`.
- **Cross-feature access rule**: every query on `credentials`, `documents`, or `refresh_tokens` must be scoped by `user_id` from the authenticated token — never trust a client-supplied `user_id`.

---

## 4. Conventions

- **Primary keys**: UUID for all tables.
- **Soft delete**: not used in v1 — hard delete is acceptable for owner-controlled cleanup.
- **Timestamps**: every table has `created_at` and `updated_at`.
- **Enums**:
  - `users.role`: `admin`, `member`
  - `users.status`: `active`, `locked`

### Security Conventions
- `users.password_hash` — one-way hashed (bcrypt/argon2). Never store or log plaintext.
- `credentials.encrypted_password` — encrypted **client-side** before upload; server never sees plaintext.
- `refresh_tokens.token_hash` — stores a hash (SHA-256) of the token, never the raw value.
- **Refresh token rotation**: on each use, the old record is revoked (`revoked_at` set) and a new record is issued. Expired/revoked tokens must be rejected at the **API layer**, not just filtered out of a query.
- All sensitive endpoints must authorize via the authenticated user token and enforce `user_id` ownership checks.

---

## 5. Migration Rules

- **Naming format**: `V<version>__<description>.sql`
  - Example: `V1__create_users_table.sql`
  - Example: `V2__create_credentials_table.sql`
- **Versioning**: sequential migration numbers, applied in ascending order.
- **Rollback policy**: no automatic rollback in production — a manual rollback script is required for any destructive change.

---

## 6. Tech-Specific Notes (Spring Boot / JPA)

- Use `@Entity`, `@Table`, `@Column` annotations on all entities.
- Use `@ManyToOne` for `credentials.user_id`, `documents.user_id`, `refresh_tokens.user_id`.
- Use `@CreationTimestamp` / `@UpdateTimestamp` for audit columns.
- MySQL text-heavy fields (`note`, `storage_path`) use `utf8mb4`.
- **Never store file content in the DB** — only metadata + `storage_path` are persisted; actual files live in object storage / filesystem.

### Example: Feature-based folder mapping

```text
src/main/java/com/personalvault/
├── user/
│   ├── User.java                  # entity → users
│   ├── UserRepository.java
│   └── UserService.java
├── auth/
│   ├── RefreshToken.java          # entity → refresh_tokens
│   └── RefreshTokenRepository.java
├── credential/
│   ├── Credential.java            # entity → credentials
│   └── CredentialRepository.java
├── document/
│   ├── Document.java              # entity → documents
│   └── DocumentRepository.java
└── shared/
    ├── BaseEntity.java            # common audit fields (created_at/updated_at)
    └── exception/
```
