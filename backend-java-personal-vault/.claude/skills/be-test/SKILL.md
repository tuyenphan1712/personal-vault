---
name: be-test
description: >
  Generate tests for a backend feature in the Spring Boot backend. Creates
  JUnit 5 unit tests for the service layer, MockMvc tests for the controller,
  and optional Testcontainers integration tests, following project conventions.
  Use when user says "write test", "add tests", "test feature",
  "viết test", or wants to add tests for a backend feature.
argument-hint: "[feature-name]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
---

# Generate Backend Tests (Spring Boot)

**Scope:** Creates unit tests + integration tests for one feature in `backend-java-personal-vault`.

## Pre-flight Checks

1. **Argument provided?** Feature name required (e.g., `credentials`, `auth`)
2. **Feature exists?** Check `features/{feature-name}/` has real classes (not just `.gitkeep`)
   - If not → Error: "Feature not found. Run `/be-crud {feature}` first"
3. **Tests already exist?** Check `src/test/java/com/tuyen/personalvault/features/{feature-name}/`
   - If exists → Ask: "Tests exist. Add more or overwrite?"

---

## Required Reading (READ FIRST)

| Doc | What to look for |
|-----|------------------|
| `backend-java-personal-vault/docs/BE-PROJECT-RULES.md` §8 | Testing conventions, naming, coverage expectations |
| `backend-java-personal-vault/docs/BE-ARCHITECTURE.md` §10 | Test layering (unit vs MockMvc vs Testcontainers) |
| `01-share-docs/API_SPEC.md` | Expected status codes and error codes to assert on |
| `src/main/java/.../features/{feature-name}/` | All production files to understand what to test |

---

## Workflow

### Step 1: Analyze Feature

Read and understand:
- Service methods (business rules, ownership checks, thrown exceptions)
- Controller endpoints (HTTP method, path, request/response DTOs, status codes)
- DTOs (validation annotations to test)
- Repository (custom query methods worth a Testcontainers check)

### Step 2: Summary & Confirmation (REQUIRED — do NOT skip)

Before writing any file, present the full plan and **wait for user confirmation**.

Output format:
```
📋 Test plan for feature "{feature-name}"

📁 Files to be CREATED:
- src/test/java/com/tuyen/personalvault/features/{feature-name}/service/{Feature}ServiceTest.java
- src/test/java/com/tuyen/personalvault/features/{feature-name}/controller/{Feature}ControllerTest.java
- src/test/java/com/tuyen/personalvault/features/{feature-name}/{Feature}IT.java  (if this is a security-sensitive feature)

⚠️  {N} test files will be created.

Proceed? (yes / no / adjust)
```

**Rules:**
- Do NOT create or edit any file before the user replies "yes" (or equivalent affirmative, incl. "tiếp tục"/"ok")
- If user says "no" → stop and ask what to change
- If user says "adjust" / requests changes → update the plan and show it again
- Only after explicit approval → proceed to Step 3

### Step 3: Generate Test Files

Test code mirrors the production package structure under `src/test/java`, **not** inside the feature's own package:

```
src/test/java/com/tuyen/personalvault/features/{feature-name}/
├── service/{Feature}ServiceTest.java        # Unit tests (JUnit 5 + Mockito)
├── controller/{Feature}ControllerTest.java  # @WebMvcTest / MockMvc slice test
└── {Feature}IT.java                         # Optional: full Spring context + Testcontainers MySQL
```

### Step 4: Write Service Unit Tests

**Structure:**
```java
@ExtendWith(MockitoExtension.class)
class {Feature}ServiceTest {

    @Mock
    private {Entity}Repository repository;

    @Mock
    private CurrentUser currentUser;

    @InjectMocks
    private {Feature}Service service;

    @Nested
    class Create {
        @Test
        void createsEntitySuccessfully() { }

        @Test
        void rejectsInvalidData() { }
    }

    @Nested
    class FindAll {
        @Test
        void returnsPaginatedListScopedToOwner() { }
    }

    @Nested
    class FindOne {
        @Test
        void returnsEntityByIdWhenOwnedByCurrentUser() { }

        @Test
        void throwsNotFoundWhenEntityBelongsToAnotherUser() { }
    }

    @Nested
    class Update {
        @Test
        void updatesEntitySuccessfully() { }

        @Test
        void throwsNotFoundWhenMissing() { }
    }

    @Nested
    class Delete {
        @Test
        void deletesEntitySuccessfully() { }

        @Test
        void throwsNotFoundWhenMissing() { }
    }
}
```

**Testing patterns:**
- Mock the repository and `CurrentUser` with Mockito — no real database in unit tests.
- Test the happy path **and** the error/exception path for every method.
- Always test the ownership rule: a repository call scoped by `userId`, and a `NotFoundException`/`AppException` thrown when the entity doesn't belong to the current user (a 404, never a 403 — per `API_SPEC.md` §5, ownership mismatch is reported as not found, not forbidden).
- Assert the correct `AppException` error code is thrown (e.g. `CREDENTIAL_001`).

### Step 5: Write Controller Tests

**Structure:**
```java
@WebMvcTest({Feature}Controller.class)
class {Feature}ControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private {Feature}Service service;

    @Test
    void postReturns201OnValidRequest() throws Exception {
        mockMvc.perform(post("/api/v1/{feature-name}")
                .contentType(MediaType.APPLICATION_JSON)
                .content(validRequestJson))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void postReturns400OnInvalidBody() throws Exception { }

    @Test
    void getByIdReturns404WhenNotFound() throws Exception {
        mockMvc.perform(get("/api/v1/{feature-name}/{id}", randomId))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.error.code").value("{FEATURE}_001"));
    }

    // ... list, update, delete
}
```

**Testing patterns:**
- Use `@WebMvcTest` (slice test) with the service mocked via `@MockBean` — don't boot the full context for controller tests.
- Assert the `ApiResponse` envelope shape: `success`, `data`, `meta` (or `success`, `error.code`, `error.message`).
- Assert HTTP status codes match `API_SPEC.md` §5 (200/201/204/400/401/403/404/409/413/415).
- Test Jakarta Bean Validation failures on the request DTO return `400` with `COMMON_001` (or the feature-specific validation code).
- If the endpoint requires auth, verify the security filter path is exercised (`@WithMockUser` or a JWT test fixture — follow whatever `auth` feature's own tests already use).

### Step 6: Write Integration Tests (for critical features)

For features touching security-sensitive data (`credentials`, `documents`, `auth`), add a `{Feature}IT.java`:
- Boots the full Spring context with `@SpringBootTest`.
- Uses **Testcontainers MySQL** instead of mocks, per `BE-ARCHITECTURE.md` §10.
- Exercises the real HTTP → controller → service → repository → MySQL path.
- Explicitly tests:
  - Ownership: user A cannot read/update/delete user B's record → `404`.
  - Locked account rejected at login/refresh (`auth` feature) → `AUTH_002`.
  - File type/size rules (`documents` feature) → `415` / `413`.
- Cleans up test data after each test (e.g. `@Transactional` + rollback, or explicit teardown).

---

## Test Coverage Expectations

Per `BE-PROJECT-RULES.md` §8 — no hard percentage target, but every feature must cover:

| Case | Must be tested |
|---|---|
| Success | Normal create/read/update/delete |
| Invalid input | DTO validation failures |
| Unauthenticated | Missing/invalid JWT |
| Unauthorized / not owned | Cross-user access attempt → `404` |
| Not found | Non-existent ID |
| Feature-specific rules | Locked account, file type/size, ciphertext never returned to another user, etc. |

Never use real passwords, tokens, or personal documents in test fixtures — use synthetic values.

---

## Output

```
✅ Tests for "{feature-name}" created!

📁 Files created:
- src/test/java/com/tuyen/personalvault/features/{feature-name}/
  ├── service/{Feature}ServiceTest.java
  ├── controller/{Feature}ControllerTest.java
  └── {Feature}IT.java (if applicable)

🧪 Run tests:
- All tests:       ./gradlew test
- This feature:    ./gradlew test --tests "*{feature-name}*"
- With coverage:   ./gradlew test jacocoTestReport (if Jacoco is configured)
```

---

## Important Rules

1. **Follow AAA pattern** — Arrange, Act, Assert.
2. **Mock dependencies in unit tests** — never hit a real database (`{Feature}ServiceTest`); use Testcontainers only in `{Feature}IT`.
3. **Test edge cases** — empty lists, null fields, invalid/foreign IDs, locked accounts.
4. **Descriptive method names** — `throwsNotFoundWhenEntityBelongsToAnotherUser`, not `test1`.
5. **Independent tests** — each test must be runnable alone; no shared mutable state between tests.
6. **Naming**: unit test class `{Feature}ServiceTest` / `{Feature}ControllerTest`, integration test `{Feature}IT` — matches `BE-PROJECT-RULES.md` §2 and §8.

## Error Handling

| Error | Action |
|-------|--------|
| Missing feature name | Ask: "Which feature? e.g., `/be-test credentials`" |
| Feature not found | Suggest: "Run `/be-crud {feature}` first" |
| Testcontainers not set up | Check `build.gradle` for the Testcontainers MySQL dependency; propose adding it before writing `{Feature}IT` |
