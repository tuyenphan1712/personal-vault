# Feature: settings

## Responsibility
Appearance (theme mode), language, and biometric-login preferences for the current device.

## Decisions
- Appearance and language are pure client device preferences, persisted locally only (AsyncStorage, via `theme.store.ts` for theme mode and `shared/i18n`'s `setLanguage` for language) — there is no server sync and no relation to `/profile`. `PATCH /profile` never sees these values.
- Default language is always `vi` on first launch (`shared/i18n`'s `i18next.init({ lng: 'vi', ... })`); a previously persisted choice is loaded and applied by the root layout's `useAppReady` hydration gate before first render, so it never flashes as `vi` first.
- `AppearancePicker` is a 3-way segmented control over `ThemeMode` (`light`/`dark`/`system`), backed directly by `useTheme()`'s `mode`/`setMode` — no local state duplication.
- `LanguagePicker` shows the current `i18n.language` and opens a modal listing `SUPPORTED_LANGUAGES`; selecting one calls `setLanguage()`, which persists to AsyncStorage and updates `i18next` immediately.
- `BiometricToggle` hides itself entirely unless `src/shared/lib/auth/biometricAdapter.getBiometricAvailability()` resolves `'available'` (device has biometric hardware and at least one enrolled biometric). The on/off preference itself is a non-secret AsyncStorage-backed flag (`biometric.store.ts`, mirrors `theme.store.ts`'s `persist` pattern) — the *secret* it gates (the user's plaintext login password, needed to re-authenticate against `/auth/login` and to re-derive the vault encryption key) is never in this store; it lives only in `expo-secure-store` behind `requireAuthentication: true` (`src/shared/lib/auth/biometricCredentialStore.ts`). Turning the toggle on prompts for the current password and wraps it directly (no upfront server/key validation, same "fails later" precedent as `UnlockVaultPrompt`); turning it off clears the wrapped secret immediately. `useChangePassword` also clears it on every successful password change, since a stale wrapped password would otherwise derive the wrong vault key or fail server login silently.
- This flag/secret pair is also consumed by `auth` (login-screen fingerprint button) and `credentials` (vault-unlock fingerprint button) in later slices of the same plan (`docs/plans/2026-09-11-biometric-auth-plan.md`).
