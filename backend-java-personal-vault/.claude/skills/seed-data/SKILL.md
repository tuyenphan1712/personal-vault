---
name: seed-data
description: >
  Generate fake/seed data for the Spring Boot backend database.
  Use when user says "seed", "fake data", "generate data", "mock data",
  "tạo data test", "tạo dữ liệu mẫu", or wants sample data for local testing.
argument-hint: "[entity-name] [count]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
---

# Seed Data Generator (Spring Boot / MySQL)

## Usage

```
/seed-data credentials 20     → Seed 20 credentials (auto-seed users first)
/seed-data documents 10       → Seed 10 documents (auto-seed users first)
/seed-data users 5            → Seed 5 users (no dependencies)
```

There is no NestJS/TypeORM/`npm run seed` here — this project seeds through a **Spring profile-gated `CommandLineRunner`**, using **`net.datafaker`** (the Java equivalent of faker-js) and real `PasswordEncoder`/BCrypt hashing, never raw SQL inserts and never plaintext passwords.

## Pre-flight Checks

1. **Argument provided?** Entity name required — one of `users`, `credentials`, `documents` (see `./references/dependency-map.md` — **`refresh_tokens` is never seedable**, see Rules).
2. **Entity exists as a real feature?** Check `features/{entity}/entity/` has a JPA entity — if not, suggest `/be-crud {entity}` first.

---

## Workflow

1. **Read**: `01-share-docs/DATABASE.md` (exact field list) + `build.gradle` (check for `net.datafaker`)

2. **Check prerequisites**:
   - `net.datafaker:datafaker` in `build.gradle`?
   - A `seed` Spring profile / `SeedRunner` already exists under `src/main/java/.../devtools/seed/`?

3. **Resolve dependencies** from `./references/dependency-map.md`

4. **Show plan & confirm** (see `./templates/plan.md`)

5. **Execute after "yes"**:
   - Add `net.datafaker:datafaker` to `build.gradle` if missing (as `implementation`, not `testImplementation` — it must be on the classpath when `bootRun` launches with the `seed` profile active; it never executes outside that profile)
   - Create/extend seeder classes from `./templates/seeder.md`
   - Run: `./gradlew bootRun --args='--spring.profiles.active=seed --seed.entity={entity} --seed.count={count}'`

---

## Where seed code lives (exception to the normal feature-isolation rule)

`BE-ARCHITECTURE.md` §6 forbids importing another feature's repository directly. Seeding is the **one intentional exception** — a `UserCredentialSeeder` legitimately needs both `UserRepository` and `CredentialRepository` to attach fake credentials to fake users. To keep this from leaking into production code paths:

- All seeder classes live in a dedicated package **outside** `features/`: `src/main/java/com/tuyen/personalvault/devtools/seed/`
- Every seeder bean and the orchestrating runner are annotated `@Profile("seed")` — they are not on the bean graph at all unless `spring.profiles.active` includes `seed`.
- Never call a seeder's cross-feature repository access pattern from anywhere in `features/` — it stays confined to `devtools/seed/`.

```
src/main/java/com/tuyen/personalvault/devtools/seed/
├── SeedRunner.java          # @Profile("seed"), CommandLineRunner — orchestrates order
├── UserSeeder.java          # @Profile("seed")
├── CredentialSeeder.java    # @Profile("seed"), depends on UserSeeder's output
└── DocumentSeeder.java      # @Profile("seed"), depends on UserSeeder's output
```

---

## Rules

- Check the entity has a real JPA entity/repository before creating a seeder for it.
- Auto-seed dependencies first (recursive) — see `./references/dependency-map.md`.
- Idempotent: skip (or top up) if `repository.count() >= requested count` — never duplicate-seed on repeated runs.
- **Fixed dev accounts** — login is by `phone`, not email (this schema has no `email` column):
  ```
  Admin:  phone = "0900000000", password = "Admin@123", role = admin
  Member: phone = "0900000001", password = "User@123",  role = member
  ```
- **Always hash passwords** with the app's real `PasswordEncoder` bean (BCrypt) — never insert a plaintext or fake-hash string.
- **`credentials.encrypted_password` is fake ciphertext, not real crypto** — generate a plausible random base64 string (e.g. `Base64.getEncoder().encodeToString(faker.random().hex(32).getBytes())`) since the backend never decrypts it anyway. Flag clearly in the seeder's output/log that this fake ciphertext will **not** decrypt correctly if opened through the real Frontend/Mobile AES-GCM flow — it's only good for testing list/pagination/ownership, not the decrypt UI path.
- **`documents` seeding**: generate real metadata (`title`, `docType`, `mimeType`, `fileSize`), and optionally write a small placeholder file to `STORAGE_PATH` at the generated `storage_path` so `GET /documents/{id}/download` actually returns something in dev — otherwise document it as a known gap (metadata exists, file doesn't) rather than silently leaving a broken download.
- **Never seed `refresh_tokens`** — fake rows there would not correspond to a real signed JWT and would be meaningless (worse, confusing to debug). Real sessions must come from an actual `/auth/login` call. If the user asks to seed refresh tokens, explain this and decline.
- **Never run against a database with the `prod` profile active** — `SeedRunner` should check `Environment.getActiveProfiles()` and refuse to run (log an error and exit) if `prod` is present alongside `seed`, as a defense-in-depth guard against someone fat-fingering this in production.
- This inserts real rows into whatever database `application.properties`/`.env` currently points at — confirm with the user before running against anything other than a local dev database.

## Error Handling

| Error | Action |
|-------|--------|
| Missing entity name | Ask: "Which entity? `users`, `credentials`, or `documents`" |
| Entity is `refresh_tokens` | Explain why it's not seedable (see Rules) and decline |
| Entity has no JPA entity yet | Suggest: "Run `/be-crud {entity}` first" |
| `net.datafaker` not in `build.gradle` | Propose adding it, confirm before editing `build.gradle` |
| DB not local/dev | Stop and confirm the target database with the user before running |
