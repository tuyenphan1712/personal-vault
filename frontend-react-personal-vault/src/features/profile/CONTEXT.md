# Feature: profile

## Responsibility
View and update the authenticated user's profile data.

## Data flow
`ProfilePage → useProfile() → profile.service.ts → GET /api/v1/profile`
`ProfileForm → useUpdateProfile() → profile.service.ts → PATCH /api/v1/profile`

## Decisions
- Single-resource feature (no list/create/delete) — only view and edit the current user's own profile.
- `phone`, `role`, and `status` are read-only here; only `fullName` and `birthday` are editable, matching the `PATCH /profile` contract.
- `useUpdateProfile` also syncs the new `fullName` into the auth store so `DashboardPage` and any other header/nav using `useAuthStore` stay in sync without a page reload.
