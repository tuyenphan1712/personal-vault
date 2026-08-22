# Frontend Project Rules — Personal Vault

> **Project**: Personal Vault — secure storage for credentials, personal identity data, and sensitive documents.
> **Architecture**: Feature-based code organization
> **Audience**: Developers & AI coding assistants working on this codebase

---

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | React with Vite |
| Language | TypeScript (strict mode enabled) |
| State management | TanStack Query for server state; Zustand for small global client state only |
| Styling | Tailwind CSS |
| HTTP client | Axios |
| Forms | React Hook Form + Zod |
| Routing | React Router |

---

## 1. Feature Structure

```text
src/
├── features/
│   ├── auth/          # register, login, logout, session
│   ├── credentials/   # encrypted platform passwords
│   ├── documents/     # personal document metadata and files
│   ├── profile/       # user profile settings
│   └── admin/         # user management and audit features
├── shared/
│   ├── components/    # Button, Input, Modal, Dialog, etc.
│   ├── hooks/
│   ├── layouts/
│   ├── lib/           # Axios, encryption, validation helpers
│   ├── types/
│   └── utils/
├── config/
├── routes/
├── App.tsx
└── main.tsx
```

Each feature must use:

```text
features/[feature-name]/
├── components/
├── hooks/
├── services/          # API calls for this feature
├── stores/            # only when local feature state is needed
├── types/
├── utils/
├── pages/
├── index.ts           # public exports only
└── CONTEXT.md
```

---

## 2. Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Feature folders | kebab-case | `user-profile` |
| Components/pages | PascalCase | `CredentialCard.tsx` |
| Hooks | camelCase, `use` prefix | `useCredentials.ts` |
| Services | camelCase, `.service.ts` suffix | `credential.service.ts` |
| Stores | camelCase, `.store.ts` suffix | `auth.store.ts` |
| Types | PascalCase, `.types.ts` files | `Credential.types.ts` |
| Functions/variables | camelCase | `formatDate` |
| Constants | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| Route constants | `ROUTES.<NAME>` | `ROUTES.CREDENTIALS` |

---

## 3. Feature Rules

- Every feature must be self-contained.
- ✅ Other features may import **only** from a feature's `index.ts`.
- Shared code belongs in `src/shared/` — not inside an unrelated feature.
- Cross-feature communication uses minimal global state, URL parameters, or the query cache.
- Shared components live in `src/shared/components/`.

**Feature boundaries**:

| Feature | Responsibility |
|---|---|
| `auth` | Authentication and current user session |
| `credentials` | Create, list, edit, delete, and decrypt credentials locally |
| `documents` | Upload, list, preview, download, and delete documents |
| `profile` | Update the current user's profile |
| `admin` | Manage users and account status |

---

## 4. Component Rules

- One component per file.
- Props must be explicitly typed — no `any`.
- Keep components below 200 lines; split complex components.
- Put tests next to the component (`Component.test.tsx`).
- Keep business logic in hooks or services, not in JSX components.
- Use Tailwind classes instead of inline styles.

---

## 5. Code Patterns (MUST follow)

- API calls live in feature service files and use the shared Axios instance.
- Use TanStack Query for server data and mutations.
- Use Zustand only for auth/session UI state or small client-only state.
- Use React Hook Form + Zod for forms and validation.
- Use an Axios interceptor for common 401 handling and the refresh-token flow.
- Show loading, empty, success, and error states for every API screen.
- Use protected routes for authenticated pages and admin guards for admin pages.
- Read the authenticated `userId` from the server session — never trust an arbitrary client-provided owner ID.
- Never log passwords, encryption keys, tokens, or document contents.

---

## 6. Sensitive Data Rules

- `users.password_hash` is never displayed or stored in frontend state.
- Credential passwords must be encrypted with **AES-GCM** in the browser before upload.
- The credential encryption key must remain in memory and must **never** be sent to the backend.
- For documents, the MVP uses HTTPS, private storage, authorization checks, and random storage names.
- Client-side document encryption is a separate security phase and must be designed before implementation.
- Do not put access tokens or decrypted passwords in `localStorage`.
- Do not use public file URLs for private documents.

---

## 7. Anti-patterns (MUST NOT do)

- ❌ Import another feature's internal files.
- ❌ Call Axios directly from a component.
- ❌ Put business logic or encryption logic inside JSX.
- ❌ Store server data in Zustand instead of TanStack Query.
- ❌ Fetch API data with `useEffect` when a query hook is appropriate.
- ❌ Trust `userId` from request data for ownership decisions.
- ❌ Store plaintext passwords, tokens, or encryption keys in `localStorage`.
- ❌ Hardcode API URLs or route paths.
- ❌ Use `any`, index keys for dynamic lists, or uncontrolled security-sensitive logging.

---

## 8. Git Workflow

- **Branch naming**: `feature/<name>`, `fix/<name>`, `refactor/<name>`.
- **Commit messages** use Conventional Commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`.
- One feature or bug fix per pull request.
- Explain security impact for authentication, credentials, or documents changes.
- Add tests and update `CONTEXT.md` when feature behavior changes.

---

## 9. Testing

- **Tools**: Vitest + React Testing Library + MSW for API mocking.
- Test files live next to the source file.
- Test form validation, user interactions, loading/error states, route guards, and API mutations.
- Focus coverage on authentication, credential encryption flow, document permissions, and profile updates.
- Never use real passwords, tokens, or personal documents in tests.

---

## 10. React-Specific Additions

- Enable TypeScript strict mode and React StrictMode.
- Use `React.lazy` and `Suspense` for page-level lazy loading where useful.
- Use stable unique IDs as list keys — never array indexes for dynamic data.
- Use `useMemo`, `useCallback`, and `React.memo` only when there is a measured need.
- Keep encryption and API code in `shared/lib` or feature services, never in presentation components.
