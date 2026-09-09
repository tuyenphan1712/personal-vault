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

- No app-lock/biometric settings — Mẫu A's "Khoá ứng dụng"/"Sinh trắc học"
  rows are illustration-only, not implemented here.
- No new languages beyond vi/en.
- No per-user server-side preference sync — theme and language are pure client
  device preferences, stored locally only. Nothing here touches
  `01-share-docs/API_SPEC.md` or the backend.
- No redesign of any screen's layout — translation and theming must preserve
  existing visual structure, only making colors/strings dynamic.
- No translation of backend-generated error strings (`error.message`,
  `COMMON_001` field errors) — see §3.2.

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
  `@react-native-async-storage/async-storage` (new dependency — allowed here
  per `MOBILE-PROJECT-RULES.md` §5, which bans plaintext passwords, tokens,
  encryption keys, and document contents in AsyncStorage; none of those apply
  to a theme/language preference).
- `ThemeProvider` reads the persisted `mode`. When `mode === 'system'`, it
  resolves via `useColorScheme() ?? 'light'` (fallback for the unknown-scheme
  case) and reacts to OS changes live; `'light'`/`'dark'` are fixed overrides.
  Exposes `useTheme()`: resolved `colors`/`fonts`/`radii`/`spacing`, `mode`,
  `resolvedScheme`, and `setMode`.
- **Existing React Navigation theme wiring**: `app/_layout.tsx` already wraps
  the app in `@react-navigation/native`'s own `ThemeProvider`, driven by a raw
  `useColorScheme()` call, to pick `DarkTheme`/`DefaultTheme` for native
  chrome. The new `ThemeProvider` must be imported under an alias to avoid a
  name collision, and `_layout.tsx` must drive React Navigation's chrome theme
  from the new `useTheme().resolvedScheme` instead — otherwise an explicit
  user override (e.g. Dark while the OS is Light) desyncs the native chrome
  from the rest of the app.
- **Migration of the 24 existing files using `StyleSheet.create({...})` at
  module scope with statically-imported `colors`** (full list captured in the
  implementation plan): each becomes a `createStyles(colors: Colors) =>
  StyleSheet.create({...})` factory function, memoized against `colors` and
  called inside the component body with `const { colors } = useTheme()`.
- **Startup flash**: the root layout must combine the theme hydration signal
  (Zustand persist's `onRehydrateStorage`/`hasHydrated`), the i18n readiness
  signal (§3.2), and the existing `fontsLoaded` gate into one `isAppReady`
  boolean before rendering themed content — a brief blank/splash frame is
  acceptable; flashing the wrong theme or language is not.
- **Cleanup**: the repo still has unused Expo-template theme scaffolding
  (`constants/theme.ts`, `hooks/use-theme-color.ts`, `themed-*` components) —
  dead code with naming confusingly close to `lightColors`/`darkColors`;
  remove it as part of this pass.
- The web client (`frontend-react-personal-vault`) already ships a theme
  store and i18n, but as a binary light/dark toggle and one flat JSON file per
  language rather than this design's 3-way mode and per-feature namespaces —
  an intentional mobile-specific divergence (OS-level system detection is
  mobile-only; per-feature files match this app's documented folder
  convention), not an oversight.

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
  detection — per explicit requirement. The persisted choice is read
  asynchronously on init (`AsyncStorage` has no sync API) and rendering is
  held back by the same combined hydration gate as theme (§3.1), to avoid a
  flash of the wrong language.
- Every existing feature screen/component with hardcoded UI strings is
  updated to call `useTranslation('<namespace>')` and `t('key')` instead of
  literal strings. Namespaces map 1:1 to features (`auth`, `credentials`,
  `documents`, `profile`, `settings`, `home`) plus a `common` namespace for
  shared strings.
- Backend-generated error strings (`error.message`, `COMMON_001` field errors
  per `API_SPEC.md` §5) are **not** translated — see §2 Non-goals. Only
  client-authored UI copy (labels, buttons, headers, placeholders, static Zod
  validation messages) is translated.

### 3.3 New Settings screen

```text
app/(protected)/settings.tsx              # route, thin — composes the feature screen
src/features/settings/
├── screens/SettingsScreen.tsx            # Appearance segmented control + Language row
├── components/AppearancePicker.tsx       # 3-way segmented control (light/dark/system)
├── components/LanguagePicker.tsx         # row + bottom sheet/modal (vi/en)
└── index.ts
```

- Home (`app/(protected)/index.tsx`) adds a gear icon routing to
  `/(protected)/settings`.
- `src/features/settings/CONTEXT.md`'s Responsibility line currently reads
  "App lock, biometric preference, privacy and session settings" (mirrored in
  `MOBILE-ARCHITECTURE.md` §4) — neither matches what's being built here.
  Both must be updated to Appearance + Language, not just the file's
  "Decisions" subsection.

## 4. Data flow

Both preferences are independent, in-memory + AsyncStorage only, no network
calls, no interaction with TanStack Query cache: theme changes call
`setMode` → persist → `ThemeProvider` re-resolves colors; language changes
call `i18n.changeLanguage` → persist → `react-i18next` re-renders consumers.

## 5. Testing

- The 24-file style migration itself needs no new tests. However, once these
  components also gain `useTranslation()`/`useTheme()`, existing tests that
  render them bare (no provider wrapping) will break — add a shared
  test-utils wrapper (`ThemeProvider` + an initialized i18next test instance)
  and update affected test files to use it.
- The i18n-restart test must force a real re-initialization (e.g.
  `jest.resetModules()` against a mock AsyncStorage pre-seeded with a
  persisted language) so it exercises the actual init-time storage read —
  re-mounting against the same live i18next singleton doesn't test anything.
- Remaining test cases (mode transitions, `SettingsScreen` interactions,
  etc.) are enumerated in the implementation plan.

## 6. Rollout order (constraints only — full breakdown belongs in the implementation plan)

Theme/i18n infra (store, provider, combined hydration gate) must land before
any screen migration or the new Settings screen. The 24-file migration must
be split into per-feature chunks (mirroring the namespace split in §3.2), not
one giant PR — add the shared test-utils wrapper (§5) alongside the first
migrated feature, not the last.

## 7. Risks

- **Scope size**: touches nearly every screen file in the app (24 style
  files + all user-facing strings) — see §6 for chunking.
- **`docType` free-text values** (per `API_SPEC.md` §7): the *picker category
  labels* are UI copy and get translated; the *stored value* sent to the
  backend (e.g. `identity_civil_status`) must remain the fixed English enum
  string regardless of UI language — only the picker's display label is
  localized, never the value persisted through the API.
- No mockup file for "Mẫu A" exists in the repo yet — attach it under `docs/`
  once available so implementers have a checkable reference.
