# Backend Project Rules — Personal Vault

> **Project**: Personal Vault — secure storage for credentials, personal identity data, and sensitive documents.
> **Architecture**: Monolith, feature-based code organization
> **Audience**: Developers & AI coding assistants working on this codebase

---

## Tech Stack

| Concern | Choice |
|---|---|
| Language | Java 17+ (LTS) |
| Framework | Spring Boot |
| Security | Spring Security + JWT access/refresh token flow |
| ORM | Spring Data JPA with Hibernate |
| Database | MySQL |
| Migration | Flyway |
| Validation | Jakarta Bean Validation |

---

## 1. Feature Structure

Feature-based packages under the main application package:

```text
src/main/java/com/example/vault/
├── config/
├── shared/
│   ├── exception/
│   ├── response/
│   ├── security/
│   └── util/
└── features/
    ├── auth/
    ├── users/
    ├── credentials/
    ├── documents/
    └── admin/
```

Each feature contains only the layers it needs:

```text
features/credentials/
├── controller/
├── service/
├── repository/
├── dto/
├── entity/
├── mapper/
├── exception/
└── CredentialContext.md
```

**Layer responsibilities**:

| Layer | Responsibility |
|---|---|
| `controller` | HTTP routes, request binding, response status |
| `service` | Business rules, transaction boundaries |
| `repository` | Database access only |
| `dto` | Request/response contracts — never expose entities directly |
| `entity` | JPA database mapping |
| `mapper` | Convert entities ↔ DTOs |

---

## 2. Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Feature/package names | lowercase | `credentials`, `documents` |
| Classes/interfaces | PascalCase | `CredentialService`, `UserRepository` |
| Methods/variables | camelCase | `findByOwnerId` |
| Constants | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| DTOs | descriptive suffix | `LoginRequest`, `UserResponse` |
| Entities | singular PascalCase | `User`, `Credential`, `Document` |
| Repositories | entity name + `Repository` | `CredentialRepository` |
| Controllers | feature name + `Controller` | `CredentialController` |
| Tests | class name + `Test`/`IT` | `CredentialServiceTest`, `CredentialControllerIT` |

---

## 3. Feature Rules

- A feature must be self-contained around one business capability.
- ❌ Do not import another feature's internal classes directly.
- ✅ Cross-feature communication uses a public service interface, shared service, or event.
- Keep shared code in `shared/` — do not use it as a general dumping ground.
- Required features: `auth`, `users`, `credentials`, `documents`, `admin`.
- Ownership of credentials/documents is always determined from the **authenticated JWT user**.
- Never trust a client-provided `userId` for authorization.

---

## 4. Code Patterns (MUST follow)

- Controllers contain **no business logic** and do not call JPA repositories directly.
- Services contain business logic and use `@Transactional` where data changes occur.
- Repositories contain query methods only — no business rules.
- Validate request DTOs with `@Valid` + Jakarta Bean Validation annotations.
- Handle errors with a global `@RestControllerAdvice` and typed application exceptions.
- Use a consistent success response format:

```json
{ "success": true, "data": {}, "meta": null }
```

- Use this error response format:

```json
{ "success": false, "error": { "code": "CREDENTIAL_001", "message": "...", "details": null } }
```

- Use structured logging — never log passwords, tokens, encryption keys, or document contents.
- Store configuration in environment variables or profile-specific config files.
- Use Flyway migrations — do not change production schema manually.

---

## 5. Security and File Rules

- Hash login passwords with BCrypt or Argon2 — never store plaintext passwords.
- Use Spring Security for authentication and role checks.
- Access/refresh tokens must support logout/revocation per the auth design.
- `password_hash` and credential ciphertext must never appear in API responses or logs.
- The backend stores `credentials.encrypted_password` but **does not decrypt it**.
- Documents use HTTPS, private storage, authorization checks, random storage names, and file type/size validation.
- Do not expose direct public URLs for private documents.
- Store document **metadata** in MySQL and file **bytes** in private filesystem/object storage.
- Configure upload limits and allow only approved types (e.g. JPG, PNG, PDF).

---

## 6. Anti-patterns (MUST NOT do)

- ❌ Import another feature's repository or internal implementation.
- ❌ Put business logic in controllers or entities.
- ❌ Query the database outside a repository.
- ❌ Return JPA entities directly from controllers.
- ❌ Trust `userId` from the request body or URL for ownership decisions.
- ❌ Hardcode database credentials, JWT secrets, API URLs, or storage paths.
- ❌ Use `System.out.println` — use the application logger.
- ❌ Log sensitive data or commit secrets to Git.
- ❌ Use `CascadeType.REMOVE` without understanding its data-loss impact.
- ❌ Store document files directly as database blobs in the MVP.

---

## 7. Git Workflow

- **Branch naming**: `feature/<name>`, `fix/<name>`, `refactor/<name>`.
- **Commit messages** use Conventional Commits:
  - `feat: add credential ownership check`
  - `fix: reject locked user login`
  - `test: add document authorization tests`
- One feature or bug fix per pull request.
- PRs must describe API/database/security impact and include test results.
- Database migrations must be included in the same PR as the related code.

---

## 8. Testing

- Unit tests live in `src/test/java/...` mirroring the production package structure.
- Naming: unit test `ClassNameTest`, integration test `ClassNameIT`.
- Use JUnit 5, Mockito, Spring Boot Test; use Testcontainers for MySQL integration tests when needed.
- Test service business rules, DTO validation, ownership authorization, locked accounts, and error responses.
- Cover success, invalid input, unauthenticated, unauthorized, and not-found cases.
- Never use real passwords, tokens, or personal documents in tests.

---

## 9. Spring-Specific Additions

- Use `@RestController`, `@Service`, `@Repository`, and constructor injection.
- Use `@ConfigurationProperties` for typed application configuration.
- Use a security filter to read JWT authentication and populate the security context.
- Use `@PreAuthorize` (or equivalent service-level checks) for role-based access.
- Keep JPA entities inside their feature and expose DTOs at the API boundary.
- Keep transactions at the **service layer**, not in controllers.
