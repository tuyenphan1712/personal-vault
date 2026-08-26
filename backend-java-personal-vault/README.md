# Backend — Personal Vault (Java / Spring Boot)

REST API backend for Personal Vault: authentication, credential vault, and private document storage.

## Tech Stack

| Layer | Choice |
|---|---|
| Language | Java 21 |
| Framework | Spring Boot 4.1.1 (Web, Data JPA, Security, Validation) |
| Database | MySQL 8.x |
| Migration | Flyway |
| Auth | JWT (`io.jsonwebtoken`) |
| Build | Gradle (wrapper included, no local Gradle install needed) |

## Prerequisites

- **JDK 21** (`java -version` must report 21). The Gradle toolchain will otherwise try to provision it automatically.
- **MySQL 8.x** running locally or reachable remotely, with a database created for this project.
- Git.

## 1. Clone and enter the backend folder

```bash
git clone <repo-url>
cd personal-vault/backend-java-personal-vault
```

## 2. Create the database

```sql
CREATE DATABASE personal_vault CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Flyway (`spring.flyway.enabled=true`) will manage the schema — migration scripts live under `src/main/resources/db/migration/` following `V<version>__<description>.sql`. Do not create tables manually.

> **Current state:** this project is still early scaffold — no migration scripts and no JPA entities exist yet. The app will start (Flyway has nothing to run), but auth/credentials/documents endpoints are not implemented yet. See `docs/BE-ARCHITECTURE.md` and the feature `context.md` files for the intended shape.

## 3. Configure environment variables

Copy the example env file and fill in real values:

```bash
cp .env.example .env
```

```dotenv
DB_URL=jdbc:mysql://localhost:3306/personal_vault
DB_USERNAME=root
DB_PASSWORD=your-mysql-password

JWT_SECRET=change-me-to-a-long-random-secret   # e.g. `openssl rand -base64 48`
JWT_ACCESS_EXPIRATION_MS=900000                 # 15 minutes
JWT_REFRESH_EXPIRATION_MS=2592000000            # 30 days

CORS_ALLOWED_ORIGINS=http://localhost:5173

STORAGE_PATH=./storage/documents                # where uploaded documents are stored on disk
```

These map directly to `application.properties`. **Never commit `.env`** — it's already gitignored.

`.env` is loaded automatically at startup via Spring Boot's config import (no extra library needed):

```properties
spring.config.import=optional:file:.env[.properties]
```

The `optional:` prefix means the app still starts fine without a `.env` file (e.g. in CI or a container where you export real environment variables instead) — either source works since `application.properties` reads values with `${VAR:default}`.

## 4. Build

```bash
./gradlew build
```

This compiles, runs tests, and produces a jar under `build/libs/`.

## 5. Run

```bash
./gradlew bootRun
```

The API starts on **`http://localhost:8080`**, base path **`/api/v1`** (see `../01-share-docs/API_SPEC.md` for the full contract).

Alternatively, run the packaged jar:

```bash
java -jar build/libs/personal-vault-0.0.1-SNAPSHOT.jar
```

## 6. Verify it's up

```bash
curl http://localhost:8080/api/v1/auth/me
```

(expect a `401` since no token is sent — that confirms the app booted and security is wired up).

## Project structure

Feature-based; each feature under `features/<name>/` owns its own `controller/`, `service/`, `repository/`, `dto/`, `entity/`, `mapper/`, `exception/`, and a `<Feature>Context.md` describing intent.

```text
src/main/java/com/tuyen/personalvault/
├── config/            → CorsConfig, SecurityConfig
├── shared/             → cross-feature: security, exception handling, response envelopes
└── features/
    ├── auth/
    ├── users/
    ├── credentials/
    ├── documents/
    └── admin/
```

Full conventions: `CLAUDE.md`, `docs/BE-PROJECT-RULES.md`, `docs/BE-ARCHITECTURE.md`.
Schema/API contract shared with frontend & mobile: `../01-share-docs/DATABASE.md`, `../01-share-docs/API_SPEC.md`.

## Troubleshooting

| Problem | Likely cause |
|---|---|
| `Communications link failure` on startup | MySQL not running, or `DB_URL`/host/port wrong |
| `Access denied for user` | Wrong `DB_USERNAME`/`DB_PASSWORD` |
| App starts but every request 500s | `JWT_SECRET` unset/empty — set a real value in `.env` |
| File upload always fails | `STORAGE_PATH` directory doesn't exist or isn't writable — create it (`mkdir -p storage/documents`) |
