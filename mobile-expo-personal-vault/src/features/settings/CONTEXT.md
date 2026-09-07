# Feature: settings

## Responsibility
Appearance (theme mode) and language preferences for the current device.

## Decisions
- Appearance and language are pure client device preferences, persisted locally only (AsyncStorage, via `theme.store.ts` for theme mode and `shared/i18n`'s `setLanguage` for language) — there is no server sync and no relation to `/profile`. `PATCH /profile` never sees these values.
- Default language is always `vi` on first launch (`shared/i18n`'s `i18next.init({ lng: 'vi', ... })`); a previously persisted choice is loaded and applied by the root layout's `useAppReady` hydration gate before first render, so it never flashes as `vi` first.
- `AppearancePicker` is a 3-way segmented control over `ThemeMode` (`light`/`dark`/`system`), backed directly by `useTheme()`'s `mode`/`setMode` — no local state duplication.
- `LanguagePicker` shows the current `i18n.language` and opens a modal listing `SUPPORTED_LANGUAGES`; selecting one calls `setLanguage()`, which persists to AsyncStorage and updates `i18next` immediately.
- App lock, biometric preference, and other rows shown in the Mẫu A settings mockup are explicitly out of scope for this feature (see the theme/i18n design spec §2) — this feature owns only Appearance + Language.
