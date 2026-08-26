# Frontend: personal-vault

## Tech Stack
- React 19 + Vite
- TypeScript
- TanStack Query
- Zustand
- Tailwind CSS
- Axios
- React Router
- React Hook Form + Zod

## Documentation

### Must Read
- @docs/FE-PROJECT-RULES.md - Conventions, patterns, MUST/MUST NOT
- @docs/FE-ARCHITECTURE.md - Folder structure, components, state

### Reference
- @../01-share-docs/API_SPEC.md - API contract to consume
- @../01-share-docs/DATABASE.md - Schema understanding for client-side data modeling

## Quick Reference

### Feature Location
`src/features/[name]/` - each feature owns its own pages, components, hooks, services, types, and optional `CONTEXT.md`.

### Public Exports
Always via the feature `index.ts` barrel export.

### API
- Base path: `/api/v1`
- IDs: UUID
- Request fields: camelCase
- Database fields: snake_case

### Error Code Prefix
`[FEATURE]_[NUMBER]` - e.g., `AUTH_001`, `CREDENTIAL_001`, `DOCUMENT_001`

### Common Rules
- Keep business logic out of components.
- API calls should live in feature services.
- Use TanStack Query for server state and Zustand only for light client state.
- Use protected routes for authenticated pages.
- Never trust a client-supplied `userId` for ownership logic; the backend decides authorization.
- Store access tokens and encryption keys in memory only.
- Never store decrypted passwords or encryption keys in `localStorage`.
- Never log passwords, tokens, encryption keys, or document contents.
