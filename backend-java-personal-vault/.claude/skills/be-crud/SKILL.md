---
name: be-crud
description: >
  Generate CRUD for a backend feature/entity in the Spring Boot backend.
  Creates entity, controller, service, repository, DTOs, mapper, exception,
  and Flyway migration following project conventions.
  Use when user says "create crud", "add feature", "generate entity",
  "tạo crud", or wants to add a new backend feature.
argument-hint: "[feature-name]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
---

# Generate Backend CRUD (Spring Boot)

**Scope:** Creates complete CRUD for one feature/entity in `backend-java-personal-vault`.

## Pre-flight Checks

1. **Argument provided?** Feature name required (e.g., `credentials`, `documents`, `orders`)
2. **Project initialized?** Check `backend-java-personal-vault/src/main/java/com/tuyen/personalvault/features/` exists
   - If not → Suggest: "Run `/init-base backend` first"
3. **Feature already exists?** Check `features/{feature-name}/`
   - If it already has real classes (not just `.gitkeep`) → Ask: "Feature exists. Add to it or overwrite?"

---

## Required Reading (READ FIRST)

| Doc | What to look for |
|-----|------------------|
| `01-share-docs/DATABASE.md` | Entity schema, columns, relationships, naming conventions |
| `01-share-docs/API_SPEC.md` | Endpoints, request/response format, error codes |
| `backend-java-personal-vault/docs/BE-PROJECT-RULES.md` | Coding patterns, anti-patterns, naming conventions |
| `backend-java-personal-vault/docs/BE-ARCHITECTURE.md` | Folder structure, layer responsibilities |
| `backend-java-personal-vault/CLAUDE.md` | Quick reference (package name, error code prefix, migration format) |

---

## Workflow

### Step 1: Gather Information

Ask user (if not clear from context or `DATABASE.md`):
- Entity name (singular, PascalCase): `Credential`, `Document`, `Order`
- Fields/columns (or reference `DATABASE.md`)
- Relationships (e.g. `@ManyToOne` to `User` via `user_id`)
- Which endpoints need auth (in this project: **all** feature endpoints require the JWT user; ownership is always scoped by `user_id`)
- Whether a new error code prefix is needed (e.g. `ORDER_001`)

### Step 2: Check Existing Code

- Read an existing feature (`credentials` or `documents`) end-to-end for patterns: controller, service, repository, dto, entity, mapper, exception, and its `*Context.md`.
- Follow the same patterns exactly — do not invent a different layering.

### Step 3: Summary & Confirmation (REQUIRED — do NOT skip)

Before writing any file, present the full plan and **wait for user confirmation**.

Output format:
```
📋 Plan for feature "{feature-name}"

📁 Files to be CREATED:
- features/{feature-name}/controller/{Feature}Controller.java
- features/{feature-name}/service/{Feature}Service.java
- features/{feature-name}/repository/{Entity}Repository.java
- features/{feature-name}/entity/{Entity}.java
- features/{feature-name}/dto/Create{Entity}Request.java
- features/{feature-name}/dto/Update{Entity}Request.java
- features/{feature-name}/dto/{Entity}Response.java
- features/{feature-name}/mapper/{Entity}Mapper.java
- features/{feature-name}/exception/{Entity}NotFoundException.java
- features/{feature-name}/{Feature}Context.md
- src/main/resources/db/migration/V{next}__create_{table_name}_table.sql

📝 Files to be UPDATED (if applicable):
- 01-share-docs/API_SPEC.md  → new error code(s) / endpoint details

⚠️  {N} files will be created, {M} files will be updated.

Proceed? (yes / no / adjust)
```

**Rules:**
- Do NOT create or edit any file before the user replies "yes" (or equivalent affirmative, incl. "tiếp tục"/"ok")
- If user says "no" → stop and ask what to change
- If user says "adjust" / requests changes → update the plan and show it again
- Only after explicit approval → proceed to Step 4

### Step 4: Generate Files

Create in order, under `features/{feature-name}/`:

```
features/{feature-name}/
├── controller/
│   └── {Feature}Controller.java
├── service/
│   └── {Feature}Service.java
├── repository/
│   └── {Entity}Repository.java
├── entity/
│   └── {Entity}.java
├── dto/
│   ├── Create{Entity}Request.java
│   ├── Update{Entity}Request.java
│   └── {Entity}Response.java
├── mapper/
│   └── {Entity}Mapper.java
├── exception/
│   └── {Entity}NotFoundException.java
└── {Feature}Context.md
```

Plus a Flyway migration:

```
src/main/resources/db/migration/V{next}__create_{table_name}_table.sql
```

> Check the highest existing `V*__` number first — do not reuse or skip numbers.

### Step 5: Implement Each File

**Entity** (`entity/{Entity}.java`) — follow `DATABASE.md` exactly:
- `@Entity`, `@Table(name = "table_name")`
- UUID primary key (`@Id`, UUID generator)
- `@Column(name = "snake_case_column")` mapping to camelCase Java fields
- `@ManyToOne` to `User` for `user_id`, `@JoinColumn(name = "user_id")`
- `@CreationTimestamp` / `@UpdateTimestamp` for audit fields

**DTOs** (`dto/`) — follow `API_SPEC.md`:
- Request DTOs use Jakarta Bean Validation (`@NotBlank`, `@Size`, etc.), fields in camelCase
- Response DTO never exposes the entity directly, and never includes another user's data
- If the field is sensitive (e.g. `encryptedPassword`), only return it to the authenticated owner per `API_SPEC.md`

**Repository** (`repository/{Entity}Repository.java`):
- `extends JpaRepository<{Entity}, UUID>`
- Ownership-scoped query methods only, e.g. `findByIdAndUserId`, `findAllByUserId(UUID userId, Pageable pageable)`
- No business logic here

**Mapper** (`mapper/{Entity}Mapper.java`):
- Converts `{Entity}` ↔ DTOs
- Never leaks entity references into the controller layer

**Service** (`service/{Feature}Service.java`):
- `@Service`, constructor injection
- `@Transactional` on write operations
- Gets `userId` from `CurrentUser` / JWT security context — **never** from a client-supplied field
- Throws `AppException` with a typed error code for not-found/invalid cases

**Exception** (`exception/{Entity}NotFoundException.java`):
- Extends the shared `AppException` pattern used by other features
- Uses the feature's error code prefix from `API_SPEC.md` §5 (e.g. `CREDENTIAL_001`); if this is a brand-new feature, propose a new prefix and note that `API_SPEC.md` must be updated (see Step 5)

**Controller** (`controller/{Feature}Controller.java`):
- `@RestController`, `@RequestMapping("/api/v1/{feature-name}")`
- `@Valid` on request bodies
- Delegates to the service only — no business logic
- Wraps all responses in `ApiResponse` (`shared/response/ApiResponse.java`); list endpoints use `PageMeta` for `page`/`limit`/`total`/`totalPages`
- No manual module wiring needed — Spring component scanning picks up `@RestController`/`@Service`/`@Repository` automatically as long as the package is under `com.tuyen.personalvault`

**`{Feature}Context.md`**:
- Short doc following the style of `CredentialContext.md` / `DocumentContext.md` — key decisions, ownership rules, non-obvious flow

### Step 6: Update Shared Docs (if needed)

- If a new error code prefix was introduced, add it to `01-share-docs/API_SPEC.md` §5.
- If the endpoint shape differs from the CRUD default, update the Endpoints table in `API_SPEC.md` §6/§7.
- API/DB contract changes must be reflected in these shared docs per `CLAUDE.md` — do not let code and docs drift.

### Step 7: Verify

- Run `./gradlew build` (or the project's usual build/test command) to confirm compilation.
- No manual registration step exists in Spring Boot — if the feature doesn't show up, check the package path and component-scan base package.

---

## Output

```
✅ Feature "{feature-name}" created!

📁 Files created:
- backend-java-personal-vault/src/main/java/com/tuyen/personalvault/features/{feature-name}/
  ├── controller/{Feature}Controller.java
  ├── service/{Feature}Service.java
  ├── repository/{Entity}Repository.java
  ├── entity/{Entity}.java
  ├── dto/Create{Entity}Request.java
  ├── dto/Update{Entity}Request.java
  ├── dto/{Entity}Response.java
  ├── mapper/{Entity}Mapper.java
  ├── exception/{Entity}NotFoundException.java
  └── {Feature}Context.md
- backend-java-personal-vault/src/main/resources/db/migration/V{n}__create_{table}_table.sql

📝 Updated (if applicable):
- 01-share-docs/API_SPEC.md (new error codes / endpoints)

🚀 Next steps:
1. Review generated code
2. Run `./gradlew bootRun` to verify
3. Test endpoints with Postman/Thunder Client
4. Write unit/integration tests (ClassNameTest / ClassNameIT) per BE-PROJECT-RULES.md §8
```

---

## Important Rules

1. **Follow existing patterns** — read `credentials` or `documents` feature first.
2. **Match `DATABASE.md` exactly** — column names, types, relationships.
3. **Match `API_SPEC.md` exactly** — endpoints, response envelope, error codes.
4. **Never expose JPA entities** — controllers return DTOs only.
5. **Ownership always from JWT** — never trust a client-supplied `userId`.
6. **Validation in request DTOs** — Jakarta Bean Validation annotations.
7. **Errors via `AppException` + `GlobalExceptionHandler`** — no ad-hoc error formatting in controllers.
8. **Schema changes only via Flyway** — never hand-edit the database.
9. **No business logic in controllers or repositories.**

## Error Handling

| Error | Action |
|-------|--------|
| Missing feature name | Ask: "Which feature? e.g., `/be-crud orders`" |
| `DATABASE.md` has no schema for this entity | Ask user for the entity schema before generating |
| Feature already exists with real code | Ask: "Overwrite or add to existing?" |
| New error code prefix needed | Confirm the prefix with the user, then update `API_SPEC.md` §5 |
