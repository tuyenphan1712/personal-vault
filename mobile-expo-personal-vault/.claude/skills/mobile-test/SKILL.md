---
name: mobile-test
description: >
  Generate tests for a mobile feature. Creates component/screen tests and
  hook tests using Jest + React Native Testing Library + MSW, following
  project conventions.
  Use when user says "write test", "add tests", "test feature",
  "viết test", or wants to add tests for a mobile feature.
argument-hint: "[feature-name]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
---

# Generate Mobile Tests (Expo / React Native)

**Scope:** Creates unit/component tests for one feature in `mobile-expo-personal-vault`.

## Pre-flight Checks

1. **Argument provided?** Feature name required (e.g., `credentials`, `auth`)
2. **Feature exists?** Check `src/features/{feature-name}/` has real files
   - If not → Error: "Feature not found. Run `/mobile-crud {feature}` first"
3. **Test tooling installed?** Check `package.json` for `jest`/`jest-expo`
   - **It is not installed by default in this project.** If missing, run Step 0 below *before* generating any test file.
4. **Tests already exist?** Check for `.test.tsx`/`.test.ts` files next to the feature's source files
   - If exists → Ask: "Tests exist. Add more or overwrite?"

---

## Required Reading (READ FIRST)

| Doc | What to look for |
|-----|------------------|
| `mobile-expo-personal-vault/docs/MOBILE-PROJECT-RULES.md` §9 | Testing tools, what to test, device coverage expectations |
| `mobile-expo-personal-vault/docs/MOBILE-ARCHITECTURE.md` §10 | Test layering (unit vs integration vs e2e) |
| `src/features/{feature-name}/` | All files to understand what to test |

---

## Step 0: Install Test Tooling (only if missing)

This project currently ships **no test runner** — `package.json` has no `test` script and no Jest dependency. Per `MOBILE-PROJECT-RULES.md` (Tech Stack table) and `MOBILE-ARCHITECTURE.md` §10, the required stack is **Jest (via `jest-expo`) + React Native Testing Library + MSW**. Install once, before the first `/mobile-test` run:

```bash
npx expo install jest-expo jest @testing-library/react-native @testing-library/jest-native msw
```

Then add to `package.json`:
```json
"scripts": {
  "test": "jest",
  "test:watch": "jest --watch"
},
"jest": {
  "preset": "jest-expo"
}
```

Confirm with the user before adding dependencies/scripts — this is a one-time project setup, not a per-feature action.

---

## Workflow

### Step 1: Analyze Feature

Read and understand:
- Components (UI logic, states to test)
- Hooks (data fetching, mutations, query keys, refresh coordination)
- Screens (integration of components + navigation)
- Any crypto adapter or secure-storage usage this feature depends on

### Step 2: Summary & Confirmation (REQUIRED — do NOT skip)

Before writing any file, present the full plan and **wait for user confirmation**.

Output format:
```
📋 Test plan for feature "{feature-name}"

📁 Files to be CREATED:
- src/features/{feature-name}/components/__tests__/{Feature}Card.test.tsx
- src/features/{feature-name}/hooks/__tests__/use{Feature}s.test.ts
- src/features/{feature-name}/hooks/__tests__/useCreate{Feature}.test.ts
- src/features/{feature-name}/screens/__tests__/{Feature}ListScreen.test.tsx

⚠️  {N} test files will be created.

Proceed? (yes / no / adjust)
```

**Rules:**
- Do NOT create or edit any file before the user replies "yes" (or equivalent affirmative, incl. "tiếp tục"/"ok")
- If user says "no" → stop and ask what to change
- If user says "adjust" / requests changes → update the plan and show it again
- Only after explicit approval → proceed to Step 3

### Step 3: Generate Test Files

Tests live in `__tests__/` folders alongside the code they cover, per `MOBILE-ARCHITECTURE.md` §10:

```
src/features/{feature-name}/
├── components/
│   ├── {Feature}Card.tsx
│   └── __tests__/{Feature}Card.test.tsx
├── hooks/
│   ├── use{Feature}s.ts
│   └── __tests__/use{Feature}s.test.ts
└── screens/
    ├── {Feature}ListScreen.tsx
    └── __tests__/{Feature}ListScreen.test.tsx
```

### Step 4: Write Component Tests

**Structure:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react-native';

describe('{Feature}Card', () => {
  it('renders the item fields', () => {});
  it('calls onPress when tapped', () => {});
  it('hides sensitive content until explicitly revealed', () => {}); // e.g. credential value
});

describe('{Feature}Form', () => {
  it('renders all fields', () => {});
  it('shows validation errors for invalid input', () => {});
  it('calls onSubmit with the encrypted/validated payload', async () => {});
});
```

**Testing patterns:**
- Use React Native Testing Library — query by role/text/label, not by internal implementation.
- Mock feature hooks or, preferably, mock the HTTP layer with MSW so the real hook/service logic runs.
- For the `credentials` feature: assert the value handed to the service is **ciphertext**, and assert plaintext never appears in any mock `console.log`/`Sentry`/analytics call made during the test.

### Step 5: Write Hook Tests

```typescript
import { renderHook, waitFor } from '@testing-library/react-native';

describe('use{Feature}s', () => {
  it('returns a loading state initially', () => {});
  it('returns data on success', async () => {});
  it('returns an error on failure', async () => {});
});

describe('useCreate{Feature}', () => {
  it('calls the service on mutate', async () => {});
  it('invalidates the feature query on success', async () => {});
});
```

- Wrap `renderHook` with a `QueryClientProvider` using a fresh `QueryClient` per test (`retry: false`).
- Mock HTTP via MSW.

### Step 6: Write Screen Tests (Integration)

```typescript
describe('{Feature}ListScreen', () => {
  it('renders the screen title', () => {});
  it('fetches and displays data', async () => {});
  it('navigates to the detail screen on item press', async () => {});
  it('shows an offline-friendly state when the network request fails', async () => {});
});
```

- Mock Expo Router navigation (`useRouter`/`useLocalSearchParams`).
- Use `waitFor`/`findBy*` for async assertions.

### Step 7: Crypto / Secure-Storage Adapter Tests (when the feature touches them)

For any feature that calls into `src/shared/lib/crypto/` or `src/shared/lib/storage/` (notably `credentials`):
- Test the crypto adapter with **known test vectors** (fixed plaintext/key/IV → expected ciphertext), not just round-trip encrypt/decrypt.
- Test that secrets never appear in any log/console call during encrypt/decrypt.
- Test that a locked/expired session clears the in-memory key.

---

## Test Coverage Focus

Per `MOBILE-PROJECT-RULES.md` §9 — no fixed percentage target, focus coverage on:

| Area | Must be tested |
|---|---|
| Auth | Login/register validation, refresh coordination (single shared refresh lock, retry-once-then-logout), app lock |
| Credentials | Client-side encryption before submit, decrypt-on-view, crypto adapter known vectors |
| Documents | Upload validation (type/size), permission-denied UI on `403`/`404`, temp file cleanup after preview |
| Profile | Update form validation and success/error feedback |
| Navigation | Route guards, deep-link parameter validation |
| Every API screen | Loading, empty, success, error, and offline states |

Never use real passwords, tokens, biometric data, or personal documents in test fixtures. Test on at least one iOS and one Android target before release, per `MOBILE-PROJECT-RULES.md` §9 — this skill covers unit/component tests only, not that device pass.

---

## Output

```
✅ Tests for "{feature-name}" created!

📁 Files created:
- src/features/{feature-name}/components/__tests__/{Feature}Card.test.tsx
- src/features/{feature-name}/hooks/__tests__/use{Feature}s.test.ts
- src/features/{feature-name}/hooks/__tests__/useCreate{Feature}.test.ts
- src/features/{feature-name}/screens/__tests__/{Feature}ListScreen.test.tsx

🧪 Run tests:
- All tests:   npm run test
- Watch mode:  npm run test:watch
```

---

## Important Rules

1. **Test user behavior, not implementation** — assert on rendered output and callbacks.
2. **Use Testing Library queries** — role/text/label over test IDs where possible.
3. **Mock external dependencies** — HTTP (via MSW), navigation, secure storage, crypto, device pickers — never hit a real backend or device API in a unit test.
4. **Test all states** — loading, error, empty, success, offline.
5. **Descriptive names** — `"clears the session after a failed refresh retry"`, not `"test 1"`.
6. **Independent tests** — reset MSW handlers and the query client between tests.
7. **Never assert against or print real secrets** — use synthetic test fixtures only.

## Error Handling

| Error | Action |
|-------|--------|
| Missing feature name | Ask: "Which feature? e.g., `/mobile-test credentials`" |
| Feature not found | Suggest: "Run `/mobile-crud {feature}` first" |
| Test tooling not installed | Run Step 0 first — confirm with the user before adding dependencies/scripts |
