---
name: mobile-crud
description: >
  Generate CRUD UI for a mobile feature. Creates Expo Router routes, screens,
  components, hooks, services, stores, and types following project conventions.
  Use when user says "create crud", "add feature", "generate screens",
  "tạo crud", or wants to add a new mobile feature.
argument-hint: "[feature-name]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
---

# Generate Mobile CRUD (Expo / React Native)

**Scope:** Creates complete CRUD UI for one feature in `mobile-expo-personal-vault`.

## Pre-flight Checks

1. **Argument provided?** Feature name required (e.g., `credentials`, `documents`)
2. **Project initialized?** Check `src/features/` folder exists
   - If not → Suggest: "Run `/init-base mobile` first"
3. **Feature already exists?** Check `src/features/{feature-name}/`
   - If it already has real files (not empty) → Ask: "Feature exists. Add to it or overwrite?"

---

## Required Reading (READ FIRST)

| Doc | What to look for |
|-----|------------------|
| `01-share-docs/API_SPEC.md` | Endpoints to call, request/response shape, `{ success, data, meta }` envelope, error codes |
| `01-share-docs/DATABASE.md` | Field names/types behind the DTOs |
| `mobile-expo-personal-vault/docs/MOBILE-PROJECT-RULES.md` | Naming, state rules, sensitive-data/device-security rules |
| `mobile-expo-personal-vault/docs/MOBILE-ARCHITECTURE.md` | Folder structure, feature anatomy, navigation, auth/crypto contract |

---

## Workflow

### Step 1: Gather Information

Ask user (if not clear from context or `API_SPEC.md`):
- Feature name (kebab-case, matches the backend feature): `credentials`, `documents`
- Which screens needed? (list, detail, create/upload, edit)
- Does anything in this feature need the system file/image picker (documents-style upload)?
- Any field that must be **encrypted client-side** before it's sent to the API (see the `credentials` note in Step 4)?

### Step 2: Check Existing Code

- Read an existing feature (`credentials`, `documents`, or `auth`) end-to-end under `src/features/` — its `components/`, `hooks/`, `screens/`, `services/`, `stores/`, `types/`, `utils/`, `index.ts`.
- Read `src/shared/lib/api/` for the shared Axios instance and interceptor.
- Read the existing `app/` routing (currently `app/(tabs)/`) — this project has **not yet** built out the `(public)`/`(protected)` route groups described in `MOBILE-ARCHITECTURE.md` §3/§8. If the target feature needs a protected group that doesn't exist yet, create it following that doc's structure rather than inventing a new pattern; flag this explicitly in the output so the user notices the routing shell is growing.
- Follow the same patterns exactly.

### Step 3: Summary & Confirmation (REQUIRED — do NOT skip)

Before writing any file, present the full plan and **wait for user confirmation**.

Output format:
```
📋 Plan for feature "{feature-name}"

📁 Files to be CREATED:
- src/features/{feature-name}/components/{Feature}Card.tsx, {Feature}Form.tsx
- src/features/{feature-name}/screens/{Feature}ListScreen.tsx, {Feature}DetailScreen.tsx, {Feature}FormScreen.tsx
- src/features/{feature-name}/hooks/use{Feature}s.ts, use{Feature}.ts, useCreate{Feature}.ts, useUpdate{Feature}.ts, useDelete{Feature}.ts
- src/features/{feature-name}/services/{feature}.service.ts
- src/features/{feature-name}/types/{feature}.types.ts
- src/features/{feature-name}/index.ts
- src/features/{feature-name}/CONTEXT.md
- app/(protected)/{feature-name}/index.tsx, new.tsx, [id].tsx

⚠️  {N} files will be created. {Note if the (protected) route group doesn't exist yet and will be created.}

Proceed? (yes / no / adjust)
```

**Rules:**
- Do NOT create or edit any file before the user replies "yes" (or equivalent affirmative, incl. "tiếp tục"/"ok")
- If user says "no" → stop and ask what to change
- If user says "adjust" / requests changes → update the plan and show it again
- Only after explicit approval → proceed to Step 4

### Step 4: Generate Files

Create in order, matching the feature anatomy in `MOBILE-ARCHITECTURE.md` §4 exactly (keep `stores/`, `utils/`, and `CONTEXT.md` even if a feature turns out not to need all of them — it's the required anatomy, not optional per-feature):

```
src/features/{feature-name}/
├── components/
│   ├── {Feature}Card.tsx            # list item
│   ├── {Feature}Form.tsx            # create/edit form
│   └── {Feature}PickerButton.tsx    # only for file-upload style features
├── screens/
│   ├── {Feature}ListScreen.tsx
│   ├── {Feature}DetailScreen.tsx
│   └── {Feature}FormScreen.tsx      # create/edit
├── hooks/
│   ├── use{Feature}s.ts             # list query hook
│   ├── use{Feature}.ts              # single item query hook
│   ├── useCreate{Feature}.ts
│   ├── useUpdate{Feature}.ts
│   └── useDelete{Feature}.ts
├── services/
│   └── {feature}.service.ts         # Axios calls for this feature
├── stores/                          # only feature-local client state, e.g. selected filter
├── types/
│   └── {feature}.types.ts
├── utils/                           # feature-specific pure functions
├── index.ts                         # public exports
└── CONTEXT.md

app/(protected)/{feature-name}/
├── index.tsx                        # route → {Feature}ListScreen
├── new.tsx                          # route → {Feature}FormScreen (create)
└── [id].tsx                         # route → {Feature}DetailScreen
```

### Step 5: Implement Each Layer

**Types** (`types/{feature}.types.ts`) — model the **unwrapped** resource shape from `API_SPEC.md`:
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
```
Use shared `ApiResponse<T>` / `PageMeta` types from `src/shared/types/` for the envelope.

**Service** (`services/{feature}.service.ts`) — shared Axios instance from `src/shared/lib/api/`, unwraps `response.data.data`:
```typescript
import { apiClient } from '@/shared/lib/api/client';
import type { ApiResponse, PageMeta } from '@/shared/types';
import type { Credential, CreateCredentialRequest } from '../types/credential.types';

export const credentialService = {
  getAll: async (params?: { page?: number; limit?: number }) => {
    const res = await apiClient.get<ApiResponse<Credential[]>>('/credentials', { params });
    return { data: res.data.data, meta: res.data.meta as PageMeta };
  },
  create: async (payload: CreateCredentialRequest) => {
    const res = await apiClient.post<ApiResponse<Credential>>('/credentials', payload);
    return res.data.data;
  },
  // ...update, remove
};
```

**Hooks** — TanStack Query, one typed query-key factory per feature, no `useEffect` for fetching. Invalidate related queries after mutations. Cancel/ignore stale requests on screen unmount.

**Components** — reusable UI pieces:
- Use `StyleSheet` or the shared theme (`src/shared/theme/`) — no scattered magic dimensions/colors.
- Use `FlatList`/`SectionList` for any collection — never render an unbounded array inside a `ScrollView`.
- `SafeAreaView`, keyboard-aware forms, accessible labels, platform-safe touch targets.
- React Hook Form + Zod for any form component.

**Screens** — compose components + hooks, keep thin:
- Called from a thin `app/` route file — no business logic in the route file itself.
- Handle loading, empty, success, error, and **offline** states (mobile has an extra offline state web doesn't).
- Validate any route param before using it in an API call.

> **Sensitive-data note (`credentials` feature specifically)**: per `MOBILE-PROJECT-RULES.md` §5, the credential password must be encrypted with **AES-GCM (or the project-approved equivalent)** using a dedicated crypto adapter under `src/shared/lib/crypto/` — never inline crypto calls in a screen/component. Do **not** assume `crypto.subtle` exists in React Native; the adapter must use a vetted native-compatible implementation. Web and mobile must produce/consume the **same ciphertext format** (`MOBILE-ARCHITECTURE.md` §7) — if this project hasn't pinned that format yet, flag it rather than inventing one silently. Keep the decryption key in memory only, cleared on lock/logout/app termination.

> **Documents-style upload note**: use the system document/image picker, validate type/size on-device for immediate feedback but treat the backend's `415`/`413` response as authoritative, use multipart upload with progress, and never persist the original file to `AsyncStorage`.

### Step 6: Add Routes

- Create the Expo Router files under `app/(protected)/{feature-name}/` (see Step 3).
- If `(protected)/_layout.tsx` doesn't exist yet, create it per `MOBILE-ARCHITECTURE.md` §8: checks session state, redirects unauthenticated users to `(public)/login`.
- Route files stay thin — they only import and render the corresponding screen.

---

## Output

```
✅ Feature "{feature-name}" created!

📁 Files created:
- src/features/{feature-name}/
  ├── components/{Feature}Card.tsx, {Feature}Form.tsx
  ├── screens/{Feature}ListScreen.tsx, {Feature}DetailScreen.tsx, {Feature}FormScreen.tsx
  ├── hooks/use{Feature}s.ts, use{Feature}.ts, useCreate{Feature}.ts, useUpdate{Feature}.ts, useDelete{Feature}.ts
  ├── services/{feature}.service.ts
  ├── types/{feature}.types.ts
  ├── index.ts
  └── CONTEXT.md
- app/(protected)/{feature-name}/index.tsx, new.tsx, [id].tsx

⚠️  Note if applicable: this created/extended the (protected) route group, which didn't fully exist yet in this project.

🚀 Next steps:
1. Review generated code
2. Run `npm run ios` / `npm run android` (or `npm start`) and navigate to the new route to verify
3. Confirm loading/empty/error/offline states render correctly on-device or in the simulator
4. Run `/mobile-test {feature-name}` to generate tests (note: test tooling isn't installed yet — see that skill's pre-flight)
```

---

## Important Rules

1. **Follow existing patterns** — read `credentials`, `documents`, or `auth` feature first.
2. **Match `API_SPEC.md`** — types match the unwrapped `data` shape; never leak the raw envelope into a screen.
3. **Use TanStack Query** — no `useEffect` for data fetching.
4. **Screens never call Axios, crypto, or secure storage directly** — always through a hook/service/adapter.
5. **`FlatList`/`SectionList` for collections**, never `ScrollView` with unbounded data.
6. **No `any` types**, no array-index list keys, no hardcoded API URLs.
7. **Ownership stays server-side** — never send or trust a client-supplied `userId`; never trust an unvalidated route param.
8. **Never store secrets in `AsyncStorage`** — refresh token goes in `expo-secure-store` only; access token and decrypted values stay in memory.
9. **Never log tokens, credentials, keys, or document contents** — including in crash reports/analytics.
10. **Features only import each other's `index.ts`.**

## Error Handling

| Error | Action |
|-------|--------|
| Missing feature name | Ask: "Which feature? e.g., `/mobile-crud documents`" |
| `API_SPEC.md` has no endpoints for this feature | Ask user for endpoint details before generating |
| Feature already exists with real files | Ask: "Overwrite or add to existing?" |
| `(protected)` route group doesn't exist yet | Create it per `MOBILE-ARCHITECTURE.md` §8, and call this out in the output — it's a project-wide addition, not just this feature's |
| Backend not ready | Can still generate against the documented `API_SPEC.md` contract with typed mocks in the service layer, flagged in `CONTEXT.md` |
