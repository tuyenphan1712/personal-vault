# Mobile Project Rules — Personal Vault

> **Project**: Personal Vault — secure storage for credentials, personal identity data, and sensitive documents.
> **Architecture**: React Native, Expo, TypeScript, feature-based organization
> **Audience**: Developers & AI coding assistants

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | React Native with Expo and Expo Router |
| Language | TypeScript with strict mode |
| Build/release | EAS Build and EAS Submit |
| Server state | TanStack Query |
| Client state | Zustand, only for small client/session state |
| Forms/validation | React Hook Form + Zod |
| HTTP client | Axios |
| Secure storage | `expo-secure-store` backed by iOS Keychain / Android Keystore |
| Navigation | Expo Router with protected route groups |
| Testing | Jest, React Native Testing Library, MSW |
| UI | React Native components and a small shared design system |

## 1. Feature Structure

```text
app/                              # Expo Router route files only
├── _layout.tsx
├── (public)/
│   ├── login.tsx
│   └── register.tsx
└── (protected)/
    ├── _layout.tsx
    ├── index.tsx
    ├── credentials/
    ├── documents/
    └── profile.tsx

src/
├── features/
│   ├── auth/
│   ├── credentials/
│   ├── documents/
│   ├── profile/
│   └── settings/
├── shared/
│   ├── components/
│   ├── hooks/
│   ├── lib/                     # axios, query client, secure storage, crypto
│   ├── types/
│   ├── utils/
│   └── theme/
├── config/
└── providers/
```

Each feature should contain only what it needs:

```text
features/credentials/
├── components/
├── hooks/
├── services/
├── stores/                       # only feature-local client state
├── types/
├── utils/
├── screens/
├── index.ts                      # public exports only
└── CONTEXT.md
```

Route files in `app/` compose screens from `src/features`; they must not contain business logic.

## 2. Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Feature folders | kebab-case | `credentials` |
| Screens/components | PascalCase | `CredentialDetailScreen.tsx` |
| Hooks | camelCase with `use` prefix | `useCredentials.ts` |
| Services | camelCase with `.service.ts` | `credential.service.ts` |
| Stores | camelCase with `.store.ts` | `auth.store.ts` |
| Types | PascalCase with `.types.ts` | `Credential.types.ts` |
| Route paths | Expo Router filesystem convention | `app/(protected)/credentials/[id].tsx` |
| Constants | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |

## 3. Feature Rules

- A feature owns its screens, components, hooks, services, types, and local utilities.
- Other features may import only from a feature's `index.ts`.
- Shared code belongs in `src/shared/`; do not use it as an unbounded dumping ground.
- API data belongs to TanStack Query, not Zustand.
- The authenticated user ID always comes from the backend session/JWT; never send a client-selected owner ID.
- Keep mobile-specific presentation and device adapters in mobile code; keep domain/API contracts aligned with web.
- Any platform-specific implementation must have a typed interface and a testable fallback/error path.

## 4. Code Patterns (MUST follow)

- Screens compose components and hooks; they do not call Axios directly.
- API calls live in feature service files and use the shared Axios client.
- Use query keys from one typed query-key factory per feature.
- Show loading, empty, success, offline, and error states for every API screen.
- Use `FlatList`/`SectionList` for collections; do not render unbounded arrays with `ScrollView`.
- Use `SafeAreaView`, keyboard-aware forms, accessible labels, and platform-safe touch targets.
- Use `StyleSheet` or the shared design system; do not scatter magic dimensions/colors through screens.
- Cancel or ignore stale requests when a screen unmounts; invalidate related queries after mutations.
- Use deep links only through declared routes and validate route parameters before API calls.
- Add an error boundary around the authenticated application shell.

## 5. Sensitive Data and Device Security

- Never store plaintext passwords, access tokens, refresh tokens, encryption keys, or document contents in `AsyncStorage`.
- Store the mobile refresh token only in Keychain/Keystore through `expo-secure-store`; keep the access token in memory where practical.
- Never log credentials, tokens, keys, document contents, request bodies containing secrets, or full API responses.
- Credential encryption/decryption must happen in a dedicated crypto adapter, never in a screen or JSX component.
- The encryption key remains in memory and is cleared on logout, lock, or app termination as far as the platform permits.
- Use authenticated encryption (AES-GCM or the project-approved equivalent) with a fresh IV/nonce per value. Never invent a cryptographic format.
- Do not capture screenshots of sensitive screens where the platform allows prevention; hide sensitive content in app switcher previews when possible.
- Do not expose private document URLs. Download through an authenticated API request and use a temporary in-app/file-preview path.
- Treat clipboard, share sheets, crash reports, analytics, and accessibility output as possible leakage channels.
- Biometrics may unlock a locally protected session/key; they do not replace server authentication or authorization.
- Do not assume secure storage is indestructible on a rooted/jailbroken device; document the threat model.

## 6. Mobile Authentication Rules

- Use short-lived access tokens and rotated, revocable refresh tokens.
- Mobile refresh requests send the refresh token using the API contract for native clients; they do not depend on browser-only `HttpOnly` cookies.
- On `401`, perform at most one coordinated refresh request, retry the original request once, then clear the session and route to login.
- Prevent multiple simultaneous refresh requests with a single shared refresh promise/lock.
- Revoke the refresh token on logout and clear all local sensitive state.
- Support explicit app lock/session timeout before displaying decrypted credentials.
- Do not persist a decrypted credential for offline access in the MVP.

## 7. Documents and Device Files

- Use the system document/image picker; request only the permissions needed for the current action.
- Validate type and size on device for user feedback, but treat backend validation as authoritative.
- Compress or resize photos only when it does not reduce document legibility; never overwrite the original before upload succeeds.
- Use multipart upload with progress and retry for recoverable network failures.
- Remove temporary downloaded files after preview/cleanup when they are no longer needed.

## 8. Anti-patterns (MUST NOT do)

- Import another feature's internal files.
- Call Axios, crypto, or secure storage directly from a presentational component.
- Put server data in Zustand or use `useEffect` as a replacement for TanStack Query.
- Store tokens, passwords, encryption keys, or document data in `AsyncStorage`, logs, analytics, or crash reports.
- Use `any`, array indexes as dynamic list keys, or hardcoded API URLs.
- Trust route parameters or request fields for ownership decisions.
- Build a custom encryption algorithm or silently change the shared ciphertext format.
- Assume web APIs such as `window`, `localStorage`, `document`, or browser cookies exist on mobile.

## 9. Git and Testing

- Branch names: `feature/<name>`, `fix/<name>`, `refactor/<name>`.
- Use Conventional Commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`.
- Test feature hooks, validation, navigation guards, loading/error/offline states, upload behavior, and auth refresh coordination.
- Test crypto adapters with known test vectors and verify that secrets never appear in logs.
- Test on at least one iOS and one Android device/emulator before release.
- Never use real passwords, tokens, biometric data, or personal documents in tests.
- Document security impact for authentication, crypto, storage, permission, and release changes.
