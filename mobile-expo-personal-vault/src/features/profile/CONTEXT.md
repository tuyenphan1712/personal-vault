# Feature: profile

## Responsibility
Read and update the current user's profile.

## Data flow
`app/(protected)/profile.tsx → ProfileScreen → useProfile() → GET /api/v1/profile`
`ProfileScreen (edit mode) → ProfileForm → useUpdateProfile() → PATCH /api/v1/profile`

## Decisions
- `profile` is a singleton resource (`GET`/`PATCH /profile` only, per `API_SPEC.md` §6-7) — there is no list/create/delete, so this feature deliberately skips that part of the generic CRUD anatomy (no `ProfileCard`, no `useProfiles`/`useCreateProfile`/`useDeleteProfile`, no `[id]` route). `ProfileScreen` toggles between a read view and an inline edit form instead of a separate route, matching the single `app/(protected)/profile.tsx` file in `MOBILE-ARCHITECTURE.md` §3.
- `phone` and `role`/`status` are read-only here — `PATCH /profile` only accepts `fullName` and `birthday`; the form only exposes those two fields.
- Birthday uses `@react-native-community/datetimepicker` (a real native date picker) rather than a free-text field — added specifically for this feature. On Android it opens via the imperative `DateTimePickerAndroid.open()` API; on iOS it renders an inline spinner (`BirthdayField.tsx`), since the two platforms have different recommended usage patterns for this library.
- After a successful update, `useUpdateProfile` also patches `fullName` into `auth`'s `useAuthStore` session (imported via `auth`'s public `index.ts`) so the home screen's greeting reflects the new name immediately, since that screen reads the name from the session rather than this feature's query cache.
