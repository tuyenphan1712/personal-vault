# Design: Dark/Light Mode + Multi-language (vi default)

> Status: approved for planning
> Date: 2026-09-05
> App: mobile-expo-personal-vault

## 1. Goal

Add a Settings screen (reached via a gear icon on the Home screen header) that
lets the user:

- Switch appearance between **Light / Dark / System**, matching mockup "Mẫu A"
  (segmented control).
- Switch app language between **Vietnamese (default) / English**, via a row
  that opens a picker; the choice persists across app restarts.

The app currently has no theme system (colors are hardcoded in
`src/shared/theme/tokens.ts`) and no i18n library. Both are being introduced as
new shared infrastructure, and — per explicit decision — every existing screen
is translated in this same pass rather than deferred.

## 2. Non-goals

- No app-lock / biometric settings. The Mẫu A visual mockup showed placeholder
  "Khoá ứng dụng" / "Sinh trắc học" rows for illustration only — those features
  do not exist yet and are **not** part of this work.
- No new languages beyond vi/en.
- No per-user server-side preference sync — theme and language are pure client
  device preferences, stored locally only. Nothing here touches
  `01-share-docs/API_SPEC.md` or the backend.
- No redesign of any screen's layout — translation and theming must preserve
  existing visual structure, only making colors/strings dynamic.

## 3. Architecture

### 3.1 Theme system

```text
src/shared/theme/
├── tokens.ts          # becomes lightColors / darkColors (+ shared fonts/radii/spacing, unchanged)
├── ThemeProvider.tsx   # new: React Context, wraps app, exposes useTheme()
└── theme.store.ts      # new: Zustand store, persisted (mode: 'light' | 'dark' | 'system')
```

- `theme.store.ts` holds only the user's **preference** (`mode`), persisted via
  Zustand's `persist` middleware backed by
  `@react-native-async-storage/async-storage` (new dependency — theme/language
  preferences are not sensitive data, so `AsyncStorage` is allowed here per
  `MOBILE-PROJECT-RULES.md` §5, which only bans secrets/tokens/plaintext
  credentials from it).
- `ThemeProvider` reads the persisted `mode`. When `mode === 'system'`, it
  resolves the actual scheme via React Native's `useColorScheme()` and reacts
  to OS changes live. It exposes:
  ```ts
  useTheme(): {
    colors: typeof lightColors
    fonts: typeof fonts
    radii: typeof radii
    spacing: typeof spacing
    mode: 'light' | 'dark' | 'system'
    resolvedScheme: 'light' | 'dark'
    setMode: (mode: 'light' | 'dark' | 'system') => void
  }
  ```
- **Migration of the 24 existing files using `StyleSheet.create({...})` at
  module scope with statically-imported `colors`** (full list captured in the
  implementation plan): each becomes a `createStyles(colors: Colors) =>
  StyleSheet.create({...})` factory function, called inside the component body
  with `const { colors } = useTheme()`. This is mechanical and repeats the same
  pattern per file — no visual/layout changes, only the color source becomes
  dynamic.
- **Startup flash**: the root layout must wait for the Zustand persist
  middleware's `onRehydrateStorage`/`hasHydrated` signal before rendering
  themed content (a brief blank/splash frame is acceptable; rendering once in
  the wrong theme then flashing to the right one is not).

### 3.2 i18n system

```text
src/shared/i18n/
├── index.ts                 # new: i18next init + language persistence glue
└── locales/
    ├── vi/
    │   ├── common.json
    │   ├── auth.json
    │   ├── credentials.json
    │   ├── documents.json
    │   ├── profile.json
    │   ├── settings.json
    │   └── home.json
    └── en/
        └── (same namespaces)
```

- New dependencies: `i18next`, `react-i18next` (reuses the
  `@react-native-async-storage/async-storage` dependency added for theme).
- Default language is **always `vi`** on first launch — no device-locale
  detection — per explicit requirement. Once the user picks a language, it is
  persisted the same way as theme (AsyncStorage, read synchronously before
  i18next initializes, same hydration-gate approach as the theme store to
  avoid a flash of the wrong language).
- Every existing feature screen/component with hardcoded UI strings is
  updated to call `useTranslation('<namespace>')` and `t('key')` instead of
  literal strings. Namespaces map 1:1 to features (`auth`, `credentials`,
  `documents`, `profile`, `settings`, `home`) plus a `common` namespace for
  shared strings (buttons like "Cancel"/"Save", generic error copy).
- Validation error messages coming from the backend (`error.message`,
  `COMMON_001` field errors per `API_SPEC.md` §5) are **not** translated by
  this work — they are server-generated English strings outside this scope;
  translating them would require backend changes and is out of scope per
  §2 Non-goals. Only client-authored UI copy (labels, buttons, headers,
  placeholders, static Zod validation messages) is translated.

### 3.3 New Settings screen

```text
app/(protected)/settings.tsx              # route, thin — composes the feature screen
src/features/settings/
├── screens/SettingsScreen.tsx            # Appearance segmented control + Language row
├── components/AppearancePicker.tsx       # 3-way segmented control (light/dark/system)
├── components/LanguagePicker.tsx         # row + bottom sheet/modal (vi/en)
└── index.ts
```

- Matches Mẫu A exactly: an "Appearance" card with a 3-way segmented control,
  and a "Language" card below it as a row that opens a picker.
- `app/(protected)/index.tsx` (Home): add a gear icon button next to the
  "Welcome back" header text, navigating to `/(protected)/settings` via
  `router.push`.

## 4. Data flow

```text
User taps segmented option
  → AppearancePicker calls setMode('dark')
  → theme.store.ts updates + persists to AsyncStorage
  → ThemeProvider re-resolves colors
  → every screen's createStyles(colors) re-runs on next render
```

```text
User picks "English" in language sheet
  → LanguagePicker calls i18n.changeLanguage('en') + persists choice
  → react-i18next triggers re-render of every useTranslation() consumer
```

Both preferences are independent, in-memory + AsyncStorage only, no network
calls, no interaction with TanStack Query cache.

## 5. Testing

- `ThemeProvider`/`theme.store`: unit tests for mode transitions
  (light/dark/system), persistence round-trip, and `system` mode reacting to
  `useColorScheme()` changes (mock the RN module).
- i18n: a smoke test that renders one screen in both `vi` and `en` and asserts
  translated text appears; a test that changing language persists and survives
  a simulated app restart (re-mount with fresh store).
- `SettingsScreen`: interaction tests — selecting each appearance option
  updates state; opening language picker and selecting a language updates
  state and closes the picker.
- No new tests needed for the mechanical `createStyles(colors)` refactor
  itself beyond existing screen tests continuing to pass unchanged.

## 6. Rollout order (for the implementation plan)

1. Add dependencies (`@react-native-async-storage/async-storage`, `i18next`,
   `react-i18next`).
2. Theme infra: `tokens.ts` split, `theme.store.ts`, `ThemeProvider`, root
   layout hydration gate.
3. i18n infra: `src/shared/i18n/index.ts`, `vi` locale files seeded from
   current hardcoded strings (audit all 5 existing features + home), root
   layout wiring, hydration gate.
4. `en` locale files (translated from the same keys).
5. Migrate the 24 existing `StyleSheet.create` files to `createStyles(colors)`
   + wire `useTranslation()` into each screen/component with hardcoded text.
6. New Settings feature (screen, components, route) + Home gear icon.
7. Tests per §5.
8. Update `mobile-expo-personal-vault/CLAUDE.md` Quick Reference / feature
   list if needed (settings feature responsibility already documented in
   `src/features/settings/CONTEXT.md`, update its "Decisions" section).

## 7. Risks

- **Scope size**: touches nearly every screen file in the app (24 style
  files + all user-facing strings). The implementation plan should split this
  into independently-reviewable chunks per feature rather than one giant
  change.
- **Hydration flash**: both theme and language must block first paint on
  their persisted-value read; getting this wrong is the most visible possible
  bug (visible flash of wrong theme/language).
- **`docType` free-text values** (per `API_SPEC.md` §7): the *picker category
  labels* are UI copy and get translated; the *stored value* sent to the
  backend (e.g. `identity_civil_status`) must remain the fixed English enum
  string regardless of UI language — only the picker's display label is
  localized, never the value persisted through the API.
