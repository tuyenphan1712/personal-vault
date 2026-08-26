# Backend: personal-vault

## Tech Stack
- Language: Java 21
- Framework: Spring Boot 4.1.1
- ORM: Spring Data JPA / Hibernate
- Database: MySQL
- Build Tool: Gradle

## Documentation

### Must Read
- @docs/BE-PROJECT-RULES.md - Conventions, patterns, MUST/MUST NOT
- @docs/BE-ARCHITECTURE.md - Folder structure, layers, feature anatomy

### Reference
- @../01-share-docs/API_SPEC.md - API contract
- @../01-share-docs/DATABASE.md - Schema

## Quick Reference

### Feature Location
`src/main/java/com/tuyen/personalvault/features/[name]/`

Each feature owns its controller, service, repository, DTOs, entities, and optional `context.md`.

### Database Migration
`src/main/resources/db/migration/`

Use Flyway with naming format:

```text
V1__create_users_table.sql
```

### API
- Base path: `/api/v1`
- IDs: UUID
- Request fields: camelCase
- Database fields: snake_case

### Error Code Prefix
`[FEATURE]_[NUMBER]`

Examples: `AUTH_001`, `USER_001`, `CREDENTIAL_001`, `DOCUMENT_001`

### Project Base Package
`com.tuyen.personalvault`

### Common Rules
- Organize code by business feature.
- Controllers must not contain business logic.
- Services handle business rules and transactions.
- Repositories handle database access only.
- Return DTOs, never expose entities directly.
- Authorization must use the authenticated JWT user.
- Never trust a client-supplied `userId`.
- Never log passwords, tokens, encryption keys, or document contents.
