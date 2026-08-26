---
name: fe-crud
description: >
  Generate CRUD UI for a frontend feature. Creates pages, components, hooks,
  services, stores, and types following project conventions.
  Use when user says "create crud", "add feature", "generate pages",
  "tạo crud", or wants to add a new frontend feature.
argument-hint: "[feature-name]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
---

# Generate Frontend CRUD

**Scope:** Creates complete CRUD UI for one feature in `frontend-react-personal-vault`.

## Pre-flight Checks

1. **Argument provided?** Feature name required (e.g., `credentials`, `documents`)
2. **Project initialized?** Check `src/features/` folder exists
   - If not → Suggest: "Run `/init-base frontend` first"
3. **Feature already exists?** Check `src/features/{feature-name}/`
   - If it already has real files (not empty) → Ask: "Feature exists. Add to it or overwrite?"

---

## Required Reading (READ FIRST)

| Doc | What to look for |
|-----|------------------|
| `01-share-docs/API_SPEC.md` | Endpoints to call, request/response shape, `{ success, data, meta }` envelope, error codes |
| `01-share-docs/DATABASE.md` | Field names/types behind the DTOs (for accurate TypeScript types) |
| `frontend-react-personal-vault/docs/FE-PROJECT-RULES.md` | Naming, state rules, sensitive-data rules |
| `frontend-react-personal-vault/docs/FE-ARCHITECTURE.md` | Folder structure, feature anatomy, routing, data flow |

---

## Workflow

### Step 1: Gather Information

Ask user (if not clear from context or `API_SPEC.md`):
- Feature name (kebab-case, matches the backend feature): `credentials`, `documents`
- Which pages needed? (list, detail, create, edit)
- Does this feature need an admin-only page? (guard with `AdminRoute`, not `ProtectedRoute`)
- Any field in this feature that must be **encrypted client-side** before it's sent to the API (see Step 4 note on `credentials`)?

### Step 2: Check Existing Code

- Read an existing feature (`credentials` or `documents` under `src/features/`) end-to-end — its `components/`, `hooks/`, `pages/`, `services/`, `stores/`, `types/`, `utils/`, `index.ts`.
- Read `src/shared/lib/` for the shared Axios instance and query client setup.
- Read `src/routes/routes.ts` and `src/routes/index.tsx` to see the existing routing pattern (`ProtectedRoute` / `AdminRoute`).
- Follow the same patterns exactly.

### Step 3: Summary & Confirmation (REQUIRED — do NOT skip)

Before writing any file, present the full plan and **wait for user confirmation**.

Output format:
```
📋 Plan for feature "{feature-name}"

📁 Files to be CREATED:
- src/features/{feature-name}/components/{Feature}List.tsx, {Feature}Card.tsx, {Feature}Form.tsx, {Feature}Detail.tsx
- src/features/{feature-name}/pages/{Feature}ListPage.tsx, {Feature}DetailPage.tsx
- src/features/{feature-name}/hooks/use{Feature}s.ts, use{Feature}.ts, useCreate{Feature}.ts, useUpdate{Feature}.ts, useDelete{Feature}.ts
- src/features/{feature-name}/services/{feature}.service.ts
- src/features/{feature-name}/types/{feature}.types.ts
- src/features/{feature-name}/index.ts
- src/features/{feature-name}/CONTEXT.md

📝 Files to be UPDATED:
- src/routes/routes.ts        → add route path constants
- src/routes/index.tsx        → register routes (ProtectedRoute/AdminRoute)

⚠️  {N} files will be created, {M} files will be updated.

Proceed? (yes / no / adjust)
```

**Rules:**
- Do NOT create or edit any file before the user replies "yes" (or equivalent affirmative, incl. "tiếp tục"/"ok")
- If user says "no" → stop and ask what to change
- If user says "adjust" / requests changes → update the plan and show it again
- Only after explicit approval → proceed to Step 4

### Step 4: Generate Files

Create in order, matching the feature anatomy in `FE-ARCHITECTURE.md` §3 exactly (do **not** drop `stores/`, `utils/`, or `CONTEXT.md` — they are part of the required anatomy even when a feature ends up not needing them):

```
src/features/{feature-name}/
├── components/
│   ├── {Feature}List.tsx            # List/table component
│   ├── {Feature}Card.tsx            # Card item component
│   ├── {Feature}Form.tsx            # Create/Edit form
│   └── {Feature}Detail.tsx          # Detail view
├── pages/
│   ├── {Feature}ListPage.tsx
│   ├── {Feature}DetailPage.tsx
│   ├── {Feature}CreatePage.tsx      # if needed
│   └── {Feature}EditPage.tsx        # if needed
├── hooks/
│   ├── use{Feature}s.ts             # list query hook
│   ├── use{Feature}.ts              # single item query hook
│   ├── useCreate{Feature}.ts
│   ├── useUpdate{Feature}.ts
│   └── useDelete{Feature}.ts
├── services/
│   └── {feature}.service.ts         # Axios calls for this feature
├── stores/                          # only if the feature needs local client state; otherwise omit contents but keep the folder empty/absent per FE-ARCHITECTURE, don't force one
├── types/
│   └── {feature}.types.ts
├── utils/                           # feature-specific pure functions, if any
├── index.ts                         # public barrel exports
└── CONTEXT.md                       # feature decisions and data flow, mirrors *Context.md on the backend
```

### Step 5: Implement Each Layer

**Types** (`types/{feature}.types.ts`) — model the **unwrapped** resource shape from `API_SPEC.md`, not the raw envelope:
```typescript
export interface Credential {
  id: string;
  platformName: string;
  account: string;
  encryptedPassword: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCredentialRequest {
  platformName: string;
  account: string;
  encryptedPassword: string;
  note?: string | null;
}
```
Use the shared `ApiResponse<T>` / `PageMeta` types from `src/shared/types/` for the envelope — don't redefine them per feature.

**Service** (`services/{feature}.service.ts`) — uses the shared Axios instance, unwraps `response.data.data`:
```typescript
import { axiosClient } from '@/shared/lib/axios';
import type { ApiResponse, PageMeta } from '@/shared/types';
import type { Credential, CreateCredentialRequest } from '../types/credential.types';

export const credentialService = {
  getAll: async (params?: { page?: number; limit?: number }) => {
    const res = await axiosClient.get<ApiResponse<Credential[]>>('/credentials', { params });
    return { data: res.data.data, meta: res.data.meta as PageMeta };
  },
  getById: async (id: string) => {
    const res = await axiosClient.get<ApiResponse<Credential>>(`/credentials/${id}`);
    return res.data.data;
  },
  create: async (payload: CreateCredentialRequest) => {
    const res = await axiosClient.post<ApiResponse<Credential>>('/credentials', payload);
    return res.data.data;
  },
  update: async (id: string, payload: Partial<CreateCredentialRequest>) => {
    const res = await axiosClient.patch<ApiResponse<Credential>>(`/credentials/${id}`, payload);
    return res.data.data;
  },
  remove: (id: string) => axiosClient.delete(`/credentials/${id}`),
};
```

**Hooks** (`hooks/`) — TanStack Query, one typed query-key factory per feature, no `useEffect` for fetching:
```typescript
export const credentialKeys = {
  all: ['credentials'] as const,
  list: (params?: object) => [...credentialKeys.all, 'list', params] as const,
  detail: (id: string) => [...credentialKeys.all, 'detail', id] as const,
};

export const useCredentials = (params?: { page?: number; limit?: number }) =>
  useQuery({ queryKey: credentialKeys.list(params), queryFn: () => credentialService.getAll(params) });

export const useCreateCredential = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: credentialService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: credentialKeys.all }),
  });
};
```

**Components** — reusable UI pieces:
- Use shared components from `src/shared/components/` (`Button`, `Input`, `Modal`) — don't reinvent them.
- Tailwind classes only, no inline styles.
- Handle loading, empty, success, and error states explicitly.
- Use React Hook Form + Zod for any form component.
- Stable unique `id` as list keys — never array index.

**Pages** — connect everything, keep thin:
- Call feature hooks for data, read route params via React Router.
- No business logic or Axios calls directly in a page/component.

> **Sensitive-data note (`credentials` feature specifically)**: per `FE-PROJECT-RULES.md` §6, the credential password must be encrypted with **AES-GCM in the browser** before it's sent — never send plaintext to `POST /credentials`. Put the encrypt/decrypt calls in `shared/lib` (a crypto helper) invoked from the `{Feature}Form` component or a dedicated hook, never inline in JSX, and keep the key in memory only — never in `localStorage`. If generating the `credentials` feature, wire this in explicitly; don't silently skip it as if this were a generic CRUD.

### Step 6: Add Routes

Update `src/routes/`:
- Add route path constants to `routes.ts` (`ROUTES.CREDENTIALS`, etc. — see `FE-PROJECT-RULES.md` §2 naming).
- Register routes in `src/routes/index.tsx`, wrapped in `ProtectedRoute` (or `AdminRoute` for admin-only pages).
- Add navigation entries only if a shared nav/layout component already lists other features the same way.

---

## Output

```
✅ Feature "{feature-name}" created!

📁 Files created:
- src/features/{feature-name}/
  ├── components/{Feature}List.tsx, {Feature}Card.tsx, {Feature}Form.tsx, {Feature}Detail.tsx
  ├── pages/{Feature}ListPage.tsx, {Feature}DetailPage.tsx
  ├── hooks/use{Feature}s.ts, use{Feature}.ts, useCreate{Feature}.ts, useUpdate{Feature}.ts, useDelete{Feature}.ts
  ├── services/{feature}.service.ts
  ├── types/{feature}.types.ts
  ├── index.ts
  └── CONTEXT.md

📝 Updated:
- src/routes/routes.ts (added path constants)
- src/routes/index.tsx (added routes)

🚀 Next steps:
1. Review generated code
2. Run `npm run dev` and navigate to the new route to verify
3. Confirm loading/error/empty states render correctly
4. Run `/fe-test {feature-name}` to generate tests (note: test tooling isn't installed yet — see that skill's pre-flight)
```

---

## Important Rules

1. **Follow existing patterns** — read `credentials` or `documents` feature first.
2. **Match `API_SPEC.md`** — types match the unwrapped `data` shape; never leak the raw `{ success, data, meta }` envelope into a component.
3. **Use TanStack Query** — no `useEffect` for data fetching, ever.
4. **Use shared components** — don't reinvent `Button`, `Input`, `Modal`.
5. **Handle all states** — loading, error, empty, success.
6. **No `any` types** — proper TypeScript everywhere.
7. **Ownership stays server-side** — never send or trust a client-supplied `userId`.
8. **Never store secrets client-side** — no plaintext passwords, tokens, or encryption keys in `localStorage`; keep them in memory.
9. **Features only import each other's `index.ts`** — no reaching into another feature's internals.

## Error Handling

| Error | Action |
|-------|--------|
| Missing feature name | Ask: "Which feature? e.g., `/fe-crud documents`" |
| `API_SPEC.md` has no endpoints for this feature | Ask user for endpoint details before generating |
| Feature already exists with real files | Ask: "Overwrite or add to existing?" |
| Backend not ready | Can still generate against the documented `API_SPEC.md` contract with typed mocks in the service layer, but flag this clearly in `CONTEXT.md` |
