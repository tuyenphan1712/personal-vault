---
name: fe-test
description: >
  Generate tests for a frontend feature. Creates component tests, hook tests,
  and page integration tests using Vitest + React Testing Library + MSW,
  following project conventions.
  Use when user says "write test", "add tests", "test feature",
  "viết test", or wants to add tests for a frontend feature.
argument-hint: "[feature-name]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
---

# Generate Frontend Tests

**Scope:** Creates component tests + hook tests for one feature in `frontend-react-personal-vault`.

## Pre-flight Checks

1. **Argument provided?** Feature name required (e.g., `credentials`, `auth`)
2. **Feature exists?** Check `src/features/{feature-name}/` has real files
   - If not → Error: "Feature not found. Run `/fe-crud {feature}` first"
3. **Test tooling installed?** Check `package.json` for `vitest`
   - **It is not installed by default in this project.** If missing, run Step 0 below *before* generating any test file.
4. **Tests already exist?** Check for `.test.tsx`/`.test.ts` files next to the feature's source files
   - If exists → Ask: "Tests exist. Add more or overwrite?"

---

## Required Reading (READ FIRST)

| Doc | What to look for |
|-----|------------------|
| `frontend-react-personal-vault/docs/FE-PROJECT-RULES.md` §9 | Testing tools, what to test, coverage focus |
| `src/features/{feature-name}/` | All files to understand what to test |

---

## Step 0: Install Test Tooling (only if missing)

This project currently ships **no test runner** — `package.json` has no `test` script and no Vitest/RTL/MSW dependency. Per `FE-PROJECT-RULES.md` §9, the required stack is **Vitest + React Testing Library + MSW**. Install once, before the first `/fe-test` run:

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom msw
```

Then add to `package.json`:
```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
}
```

And a `vitest.config.ts` (or a `test` block in `vite.config.ts`) with `environment: 'jsdom'` and a setup file that imports `@testing-library/jest-dom`. Confirm with the user before adding dependencies/scripts — this is a one-time project setup, not a per-feature action.

---

## Workflow

### Step 1: Analyze Feature

Read and understand:
- Components (UI logic, states to test)
- Hooks (data fetching, mutations, query keys)
- Pages (integration of components + routing)
- User interactions (clicks, form submissions)

### Step 2: Summary & Confirmation (REQUIRED — do NOT skip)

Before writing any file, present the full plan and **wait for user confirmation**.

Output format:
```
📋 Test plan for feature "{feature-name}"

📁 Files to be CREATED:
- src/features/{feature-name}/components/{Feature}List.test.tsx
- src/features/{feature-name}/components/{Feature}Form.test.tsx
- src/features/{feature-name}/hooks/use{Feature}s.test.ts
- src/features/{feature-name}/hooks/useCreate{Feature}.test.ts
- src/features/{feature-name}/pages/{Feature}ListPage.test.tsx

⚠️  {N} test files will be created.

Proceed? (yes / no / adjust)
```

**Rules:**
- Do NOT create or edit any file before the user replies "yes" (or equivalent affirmative, incl. "tiếp tục"/"ok")
- If user says "no" → stop and ask what to change
- If user says "adjust" / requests changes → update the plan and show it again
- Only after explicit approval → proceed to Step 3

### Step 3: Generate Test Files

Tests live **next to the source file**, per `FE-PROJECT-RULES.md` §4/§9 (not in a separate `tests/` folder):

```
src/features/{feature-name}/
├── components/
│   ├── {Feature}List.tsx
│   ├── {Feature}List.test.tsx
│   ├── {Feature}Form.tsx
│   └── {Feature}Form.test.tsx
├── hooks/
│   ├── use{Feature}s.ts
│   ├── use{Feature}s.test.ts
│   └── ...
└── pages/
    ├── {Feature}ListPage.tsx
    └── {Feature}ListPage.test.tsx
```

### Step 4: Write Component Tests

**Structure (Vitest, not Jest):**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('{Feature}List', () => {
  it('renders a loading state', () => {});
  it('renders an empty state when there is no data', () => {});
  it('renders the list of items', () => {});
  it('calls onSelect when an item is clicked', async () => {});
});

describe('{Feature}Form', () => {
  it('renders all form fields', () => {});
  it('shows validation errors for invalid input', async () => {});
  it('calls onSubmit with the encrypted/validated payload', async () => {});
  it('disables the submit button while the mutation is pending', () => {});
});
```

**Testing patterns:**
- Use React Testing Library — `screen.getByRole`, `getByText`; avoid `getByTestId` unless nothing else identifies the element.
- Test user behavior, not implementation details.
- Mock feature hooks with `vi.mock(...)`, or prefer MSW to mock the underlying HTTP call so the real hook/service code still runs.
- For the `credentials` feature specifically: test that the value passed to the service is **ciphertext**, never plaintext — assert the mocked service call payload, don't assert on the crypto internals here (those belong in a `shared/lib` crypto adapter test).

### Step 5: Write Hook Tests

**Structure:**
```typescript
import { renderHook, waitFor } from '@testing-library/react';

describe('use{Feature}s', () => {
  it('returns a loading state initially', () => {});
  it('returns data on success', async () => {});
  it('returns an error on failure', async () => {});
  it('refetches when params change', async () => {});
});

describe('useCreate{Feature}', () => {
  it('calls the service on mutate', async () => {});
  it('invalidates the feature query on success', async () => {});
  it('surfaces an error on failure', async () => {});
});
```

**Testing patterns:**
- Wrap `renderHook` with a `QueryClientProvider` using a fresh `QueryClient` per test (`retry: false`).
- Mock the HTTP layer with MSW so TanStack Query's real request/cache logic is exercised.
- Assert loading → success/error transitions, not internal query-key structure.

### Step 6: Write Page Tests (Integration)

```typescript
describe('{Feature}ListPage', () => {
  it('renders the page title', () => {});
  it('fetches and displays data', async () => {});
  it('navigates to the detail page on row click', async () => {});
  it('redirects to /login if the session is missing (ProtectedRoute)', () => {});
});
```

- Mock React Router (`MemoryRouter`, or mock `useNavigate`/`useParams`).
- Use `waitFor`/`findBy*` for async assertions, never arbitrary `setTimeout`.

---

## Test Coverage Focus

Per `FE-PROJECT-RULES.md` §9 — no fixed percentage target, focus coverage on:

| Area | Must be tested |
|---|---|
| Auth | Login/register form validation, session redirect behavior |
| Credentials | Client-side encryption before submit, decrypt-on-view flow, never logging plaintext |
| Documents | Upload validation (type/size), permission-denied UI on `403`/`404` |
| Profile | Update form validation and success/error feedback |
| Every API screen | Loading, empty, success, and error states |

Never use real passwords, tokens, or personal documents in test fixtures.

---

## Output

```
✅ Tests for "{feature-name}" created!

📁 Files created:
- src/features/{feature-name}/components/{Feature}List.test.tsx
- src/features/{feature-name}/components/{Feature}Form.test.tsx
- src/features/{feature-name}/hooks/use{Feature}s.test.ts
- src/features/{feature-name}/hooks/useCreate{Feature}.test.ts
- src/features/{feature-name}/pages/{Feature}ListPage.test.tsx

🧪 Run tests:
- All tests:     npm run test
- Watch mode:    npm run test:watch
- Coverage:      npm run test:coverage
```

---

## Important Rules

1. **Test user behavior, not implementation** — assert on rendered output and callbacks, not internal state.
2. **Use Testing Library queries** — `getByRole`, `getByText`; `getByTestId` only as a last resort.
3. **Mock external dependencies** — HTTP (via MSW), router, and any device/browser API — never hit the real backend.
4. **Test all states** — loading, error, empty, success.
5. **Descriptive names** — `"shows an error toast when the API call fails"`, not `"test 1"`.
6. **Independent tests** — each test must be runnable alone; reset MSW handlers and the query client between tests.

## Error Handling

| Error | Action |
|-------|--------|
| Missing feature name | Ask: "Which feature? e.g., `/fe-test credentials`" |
| Feature not found | Suggest: "Run `/fe-crud {feature}` first" |
| Test tooling not installed | Run Step 0 first — confirm with the user before adding dependencies/scripts |
