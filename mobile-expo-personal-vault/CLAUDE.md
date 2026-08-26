# Mobile: personal-vault

## Tech Stack
- React Native + Expo
- TypeScript
- Expo Router
- TanStack Query
- Zustand
- Axios
- Expo Secure Store
- React Hook Form + Zod

## Documentation

### Must Read
- @docs/MOBILE-PROJECT-RULES.md - Conventions, patterns, MUST/MUST NOT
- @docs/MOBILE-ARCHITECTURE.md - Folder structure, navigation, app architecture

### Reference
- @../01-share-docs/API_SPEC.md - API contract to consume
- @../01-share-docs/DATABASE.md - Schema understanding for mobile data modeling

## Quick Reference

### Feature Location
`src/features/[name]/` - each feature owns screens, hooks, services, types, and optional `CONTEXT.md`.

### App Routing
`app/` is for Expo Router pages; keep route files lightweight and push business logic into `src/features`.

### API
- Base path: `/api/v1`
- IDs: UUID
- Request fields: camelCase
- File upload: JPEG, PNG, or PDF up to 10MB

### Error Code Prefix
`[FEATURE]_[NUMBER]` - e.g., `AUTH_001`, `CREDENTIAL_001`, `DOCUMENT_001`

### Common Rules
- Keep screens thin and compose logic from hooks/services.
- Store access tokens in memory; keep refresh tokens in secure storage.
- Do not store plaintext secrets or document content in AsyncStorage.
- Do not use browser cookies or `localStorage` for authentication on mobile.
- Keep credential encryption/decryption in a dedicated crypto adapter.
- Use TanStack Query for API state and Zustand only for light session/app-lock state.
- Authentication and ownership decisions must remain server-side.
