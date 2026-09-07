# Dark/Light Mode + Multi-language (vi default) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This plan describes *what* to change and *why*; read the current file before editing it and write idiomatic code that matches the surrounding style — do not treat any snippet below as copy-paste-ready source.

**Goal:** Add a Settings screen (Appearance: Light/Dark/System, Language: vi/en, vi default) reachable from a gear icon on Home, backed by a new theme engine and i18n system that every existing mobile screen is migrated onto.

**Architecture:** A `ThemeProvider` (React Context) resolves `light`/`dark` colors from a Zustand-persisted `mode` preference (`light`/`dark`/`system`, `system` following `useColorScheme()`). `i18next`/`react-i18next` resolve strings from per-feature-namespace JSON files, defaulting to `vi` and persisting the user's choice the same way. Both preferences gate first paint via a combined `useAppReady` hydration signal alongside the existing `fontsLoaded` gate.

**Tech Stack:** React Native, Expo Router, Zustand (`persist` middleware), `@react-native-async-storage/async-storage`, `i18next`, `react-i18next`, Jest + React Native Testing Library + MSW.

**Spec:** `mobile-expo-personal-vault/docs/superpowers/specs/2026-09-05-theme-i18n-design.md`

## Global Constraints

- Default language is always `vi` on first launch — never detect device locale (spec §3.2).
- No app-lock/biometric settings — the Mẫu A mockup's those rows are illustration-only and are not built (spec §2).
- No translation of backend-generated error strings (`error.message`, `COMMON_001` field errors) — only client-authored UI copy (spec §2, §3.2).
- `docType` picker: only the **display label** is localized; the **value** sent to the API (e.g. `identity_civil_status`) is a fixed English enum string, never translated (spec §7).
- No screen layout redesign — theming/translation must preserve existing visual structure (spec §2).
- The new `ThemeProvider` must be imported under an alias wherever `@react-navigation/native`'s own `ThemeProvider` is also imported, to avoid a name collision (spec §3.1).
- **Corrected file count**: the spec's "24 files" (files with a module-level `StyleSheet.create` importing `colors`) undercounts by 3 — `src/shared/components/Logo.tsx`, `src/shared/components/TextField.tsx`, and `app/(protected)/_layout.tsx` also consume `colors` from `tokens.ts` via inline style objects / `Stack` `contentStyle`, not `StyleSheet.create`. The real count is **27 files**. This plan's migration tasks cover all 27.
- **Expanded dead-code scope**: verified by grepping every reference (see Task 6) — beyond the spec's named `constants/theme.ts` / `hooks/use-theme-color.ts` / `themed-*` components, the entire top-level `components/` directory and `hooks/use-color-scheme*.ts` are also unused Expo-template scaffolding with zero references from any `app/` route or `src/` code. Task 6 removes all of it in one pass.

## Recurring migration pattern (applies to every "migrate X" step below)

Every file that currently imports the flat `colors` constant from `src/shared/theme/tokens.ts` gets the same mechanical treatment — stated once here instead of repeated per file:

1. Replace `import { colors } from '.../tokens'` with `const { colors } = useTheme()` (from `src/shared/theme/ThemeProvider`) inside the component body.
2. Any module-level `StyleSheet.create({...})` that referenced `colors` becomes a `createStyles(colors: Colors) => StyleSheet.create({...})` factory, called as `useMemo(() => createStyles(colors), [colors])` inside the component. Inline style objects (no `StyleSheet.create`) just reference `colors` from the hook directly.
3. Any hardcoded UI string becomes `useTranslation('<feature-namespace>')` + `t('key')`. Namespaces map 1:1 to features (`auth`, `credentials`, `documents`, `profile`, `settings`, `home`) plus `common` for shared strings (button labels, "offline" message, back-button a11y label).
4. Zod validation message strings move from a module-level schema into a `useMemo(() => zodResolver(z.object({...})), [t])` built inside the component (so switching language re-validates in the new language); a module-level "shape-only" schema with no message strings still backs the exported `*FormValues` type via `z.infer`.

Steps below only call out **exceptions** to this pattern (new files, non-mechanical logic changes, files needing extra namespace keys).

---

## Task 1: Install dependencies

**Files:** `package.json`, `package-lock.json`

- [ ] Run `npx expo install @react-native-async-storage/async-storage`, then `npm install i18next react-i18next`.
- [ ] Sanity-check with `npx expo start -c` that Metro resolves both packages with no errors (Ctrl+C once confirmed).
- [ ] Commit: `chore(mobile): add async-storage and i18next dependencies`

---

## Task 2: Split theme tokens into light/dark palettes

**Files:** Modify `src/shared/theme/tokens.ts`

**Interfaces:** Produces `lightColors`, `darkColors` (same key shape: `bg, surface, surfaceHover, primary, primaryDark, primarySoft, mist, mistSoft, ink, muted, line, danger, dangerDark, dangerSoft`), `type Colors = typeof lightColors`. `fonts`, `radii`, `spacing` are unchanged.

- [ ] **Step 1:** Add `lightColors` (today's existing values, unchanged) and `darkColors` (a parallel palette where each key keeps the same *semantic role* as its light counterpart — e.g. `primaryDark` stays "the accessible text color on a `primarySoft` background" — even though the literal shade moves in the opposite direction). Mirror the web client's design tokens (`frontend-react-personal-vault/src/index.css`) so both clients read as the same product. Export `type Colors = typeof lightColors`.
- [ ] **Step 2: Temporary compatibility alias.** Also export `export const colors = lightColors` with a comment explaining it's a **temporary shim** for the 27 files not yet migrated (Tasks 8–14), so every existing `import { colors }` keeps compiling and the app keeps running at every commit in between. Task 14's last step deletes this alias once a grep confirms nothing imports it anymore.
- [ ] **Step 3:** `npx tsc --noEmit` — expect no new errors (the alias covers every currently-unmigrated file).
- [ ] Commit: `refactor(mobile): split theme tokens into light/dark palettes`

---

## Task 3: Theme preference store

**Files:** Create `src/shared/theme/theme.store.ts`; test `src/shared/theme/__tests__/theme.store.test.ts`

**Interfaces:** `useThemeStore` (Zustand hook) with state `{ mode: ThemeMode, hasHydrated: boolean, setMode: (mode: ThemeMode) => void }`; `export type ThemeMode = 'light' | 'dark' | 'system'`.

- [ ] **Step 1 (TDD):** Write a failing test asserting: default `mode` is `'system'`; `setMode('dark')` updates state; the persisted value round-trips through AsyncStorage under key `'vault-theme-mode'`; `hasHydrated` flips to `true` after rehydration.
- [ ] **Step 2:** Implement with Zustand's `persist` middleware, `storage: createJSONStorage(() => AsyncStorage)`, `partialize` keeping only `mode`, and `onRehydrateStorage` setting `hasHydrated: true`.
- [ ] **Step 3:** Tests pass (4 tests). Commit: `feat(mobile): add persisted theme preference store`

---

## Task 4: ThemeProvider + useTheme hook

**Files:** Create `src/shared/theme/ThemeProvider.tsx`; test `src/shared/theme/__tests__/ThemeProvider.test.tsx`

**Interfaces:** `ThemeProvider` (component); `useTheme(): { colors: Colors, fonts, radii, spacing, mode: ThemeMode, resolvedScheme: 'light' | 'dark', setMode: (mode: ThemeMode) => void }`.

- [ ] **Step 1 (TDD):** Failing test covering: `mode: 'system'` resolves `resolvedScheme` from a mocked `useColorScheme()`; an explicit `'dark'` mode override wins regardless of the mocked OS scheme; calling `useTheme()` outside the provider throws `'useTheme must be used within a ThemeProvider'`.
- [ ] **Step 2:** Implement via React Context. `resolvedScheme = mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode`; memoize the context value on `[resolvedScheme, mode, setMode]`.
- [ ] **Step 3:** Tests pass (3 tests). Commit: `feat(mobile): add ThemeProvider and useTheme hook`

---

## Task 5: i18n locale files + init module

**Files:**
- Create `src/shared/i18n/locales/{vi,en}/{common,auth,credentials,documents,profile,settings,home}.json` (7 namespaces × 2 languages = 14 files)
- Create `src/shared/i18n/index.ts`; test `src/shared/i18n/__tests__/index.test.ts`

**Interfaces:** default export `i18next` instance (initialized, `lng: 'vi'`, `fallbackLng: 'vi'`, `defaultNS: 'common'`); `SUPPORTED_LANGUAGES = ['vi', 'en'] as const`; `type SupportedLanguage`; `loadPersistedLanguage(): Promise<void>`; `setLanguage(language: SupportedLanguage): Promise<void>` (persists to AsyncStorage key `'vault-language'`).

- [ ] **Step 1: Populate the locale JSON files.** `en` is a 1:1 mirror of every hardcoded English string that exists in the app today (so no test assertion needs to change once screens switch to `t()` — see Task 7's design note). `vi` is the Vietnamese translation. Source each namespace's keys by grepping the feature's current hardcoded strings; the key groupings below are the contract every later task's `t('...')` calls must match:
  - `common`: `actions.{cancel,save,edit,delete,retry,copy,show,hide}`, `status.offline`, `a11y.goBack`
  - `auth`: `login.{title,subtitle,phoneLabel,phonePlaceholder,passwordLabel,passwordPlaceholder,submit,signingIn,derivingKey,noAccount,registerLink}`, `register.{title,subtitle,fullNameLabel,fullNamePlaceholder,phoneLabel,phonePlaceholder,passwordLabel,passwordPlaceholder,submit}`, `validation.{phoneRequired,passwordMinLength,fullNameRequired}`
  - `credentials`: `list.{title,add,empty,loadError}`, `detail.{invalid,notFound,preparingVault,note,account,accountCopied,passwordCopied,copiedTitle,deleteTitle,deleteMessage}` (`deleteMessage` interpolates `{{platform}}`), `form.{editTitle,addTitle,platformLabel,platformPlaceholder,accountLabel,accountPlaceholder,passwordLabel,passwordPlaceholder,noteLabel,notePlaceholder,saveChanges,addSubmit,saveError}`, `validation.{platformRequired,accountRequired,passwordRequired}`, `password.{label,locked,decryptError,unlockAgain}`, `unlock.{title,subtitle,passwordLabel,passwordPlaceholder,submit,deriving}`
  - `documents`: `list.{title,upload,empty,loadError}`, `detail.{invalid,notFound,category,file,uploaded,download,downloadFailedTitle,downloadFailedMessage,deleteTitle,deleteMessage}` (`deleteMessage` interpolates `{{title}}`), `upload.{title,titleLabel,titlePlaceholder,submit,chooseFile,choosePhoto,genericError,tooLarge,unsupportedType}`, `docType.{label,customLabel,customPlaceholder,other,uncategorized,categories.*}` where `categories.*` has one key per `API_SPEC.md` §3 picker value (`identity_civil_status`, `education_qualifications`, `employment_contracts`, `medical_health`, `finance_tax`, `property_vehicles`, `legal_misc`)
  - `profile`: `title, fullNameLabel, fullNamePlaceholder, phone, birthday, birthdayNotSet, birthdayFieldLabel, birthdaySelect, editProfile, saveError, loadError`, `validation.fullNameRequired`, `role.{admin,member}`, `status.{active,locked}`
  - `home`: `welcome, defaultName, vaultSection, credentialsTitle, credentialsSubtitle, documentsTitle, documentsSubtitle, profileTitle, profileSubtitle, logout, loggingOut, settingsA11y, soonTag`
  - `settings`: `title`, `appearance.{sectionLabel,light,dark,system}`, `language.{sectionLabel,rowLabel,vi,en}`
- [ ] **Step 2 (TDD):** Before implementing `index.ts`, write a failing test asserting: `i18next.language` defaults to `'vi'`; a known key translates in `vi`; `loadPersistedLanguage()` leaves `vi` in place when nothing is stored; `setLanguage('en')` switches language, persists it, and updates translations; `loadPersistedLanguage()` restores a previously persisted choice on a fresh call.
- [ ] **Step 3:** Implement `index.ts`: `i18next.use(initReactI18next).init({...})` with `resources` built from the 14 JSON imports, `ns` listing all 7 namespaces, `react: { useSuspense: false }`. Note in a comment that the module's synchronous `lng: 'vi'` always wins for the very first render since AsyncStorage has no sync read — the root layout's hydration gate (Task 6) awaits `loadPersistedLanguage()` before rendering themed content so a persisted `'en'` choice never flashes as `'vi'` first.
- [ ] **Step 4:** Tests pass (5 tests). Commit: `feat(mobile): add i18next setup with vi/en locale files`

---

## Task 6: App-ready hydration gate + root layout wiring + dead-code removal

**Files:**
- Create `src/providers/useAppReady.ts`; test `src/providers/__tests__/useAppReady.test.tsx`
- Modify `app/_layout.tsx`, `app/(protected)/_layout.tsx`, `src/providers/AppProviders.tsx`
- Delete: `constants/theme.ts`, `hooks/use-theme-color.ts`, `hooks/use-color-scheme.ts`, `hooks/use-color-scheme.web.ts`, and the whole `components/` directory (Expo-template scaffolding — `external-link`, `haptic-tab`, `hello-wave`, `themed-view`, `themed-text`, `parallax-scroll-view`, `ui/collapsible`, `ui/icon-symbol*`)

**Interfaces:** `useAppReady(fontsLoaded: boolean): boolean` — `true` only once fonts are loaded, `useThemeStore().hasHydrated` is `true`, and `loadPersistedLanguage()` has resolved.

- [ ] **Step 1 (TDD):** Failing test: not ready while `fontsLoaded` is `false` even after theme/i18n settle; ready once fonts are loaded and both signals settle.
- [ ] **Step 2:** Implement `useAppReady` (theme hydration via `useThemeStore`, i18n readiness via a `useEffect` calling `loadPersistedLanguage()` once on mount). Tests pass (2 tests).
- [ ] **Step 3: Wire the root layout.** In `app/_layout.tsx`: import the new `ThemeProvider` under an alias (e.g. `VaultThemeProvider`) alongside the existing `@react-navigation/native` `ThemeProvider` (aliased `NavigationThemeProvider`) to avoid the name collision (Global Constraints). Gate the fonts-loaded branch on `useAppReady(fontsLoaded)` instead of `fontsLoaded` alone, hiding the splash screen only once ready. Drive `NavigationThemeProvider`'s `value` (`DarkTheme`/`DefaultTheme`) from the new `useTheme().resolvedScheme`, not a raw `useColorScheme()` call, so an explicit in-app override doesn't desync native chrome from the rest of the app. Wrap the whole tree in `VaultThemeProvider` before `AppProviders`.
- [ ] **Step 4: Make the protected stack theme-aware.** In `app/(protected)/_layout.tsx`, read `colors` from `useTheme()` and set the `Stack`'s `contentStyle.backgroundColor` from it. Also declare the `settings` route (`<Stack.Screen name="settings" />`, added by Task 13 — declaring it now is harmless since Expo Router only needs the file to exist once navigated to).
- [ ] **Step 5: Delete dead code.** Confirm zero references first: `grep -rln "external-link\|haptic-tab\|hello-wave\|icon-symbol\|use-color-scheme\|use-theme-color\|themed-view\|themed-text\|parallax-scroll-view\|ui/collapsible\|constants/theme" app src --include="*.tsx" --include="*.ts"` should return nothing outside the files being deleted and the now-updated `app/_layout.tsx`. Then `git rm -r constants/theme.ts hooks/use-theme-color.ts hooks/use-color-scheme.ts hooks/use-color-scheme.web.ts components/`.
- [ ] **Step 6:** `npx tsc --noEmit` — no new errors (the 27 not-yet-migrated files still resolve via Task 2's temporary alias).
- [ ] Commit: `feat(mobile): gate first paint on theme/i18n hydration, remove dead Expo template scaffolding`

---

## Task 7: Shared test utilities

**Files:** Create `src/shared/testing/renderWithProviders.tsx`; modify `jest.setup.ts`

**Interfaces:** `renderWithProviders(ui, options?)` — drop-in replacement for RTL's `render` that also wraps `ThemeProvider` + a fresh `QueryClientProvider` (reusing the existing `createTestQueryClient`).

- [ ] **Step 1:** Implement `renderWithProviders` wrapping `ui` in `<ThemeProvider><QueryClientProvider client={queryClient}>...`.
- [ ] **Step 2:** Add `@react-native-async-storage/async-storage`'s built-in Jest mock (`.../jest/async-storage-mock`) to `jest.setup.ts` — without it, Zustand's `persist` and the i18n module's AsyncStorage calls hit the real native module and throw under Jest.
- [ ] **Step 3: Pin test-process i18n language to `en`.** In `jest.setup.ts`, `await i18n.changeLanguage('en')` inside `beforeAll`. **Design decision** (deviates from spec §5's literal wording of a "test-utils wrapper with an initialized i18next test instance"): `react-i18next`'s `useTranslation()` reads the global `i18next` singleton automatically once `i18next.init()` has run — no `I18nextProvider` needed unless a test wants a *second, isolated* instance. Since Task 5's `index.ts` already calls `.init()` at module load, every Jest process already has one initialized instance; pinning its language to `en` in `jest.setup.ts` means every existing assertion against the original hardcoded English copy (e.g. `getByText('Log in')`) keeps passing unchanged once a screen switches to `t()`, because the `en` resources are 1:1 copies of those literals (Task 5). Only the `ThemeProvider` wrapper is actually needed per test file.
- [ ] **Step 4:** `npm test` — full suite still green (this task only adds infra; no screen calls `useTheme()` yet).
- [ ] Commit: `test(mobile): add renderWithProviders and pin test i18n language to en`

---

## Task 8: Migrate shared components + update the 8 tests that transitively depend on them

**Why its own task:** `Button`, `TextField`, `BackButton`, and `Logo` are used by nearly every screen. The moment any of them calls `useTheme()`, every existing test that renders a screen/component containing one of them breaks with "useTheme must be used within a ThemeProvider" — even before that screen's own file is migrated. Fixing this at the source (this task) avoids piecemeal breakage spread across Tasks 9–10.

**Files:**
- Modify (recurring pattern, Task 4/5's `useTheme`/`useTranslation('common')` where they have visible text): `src/shared/components/{Button,BackButton,Logo,TextField}.tsx`
- Modify (test-wrapper swap only — `render(...)` → `renderWithProviders(...)`, no assertion changes): `src/features/auth/components/__tests__/{LoginForm,RegisterForm}.test.tsx`, `src/features/auth/screens/__tests__/{LoginScreen,RegisterScreen}.test.tsx`, `src/features/credentials/components/__tests__/PasswordReveal.test.tsx`, `src/features/credentials/screens/__tests__/{CredentialDetailScreen,CredentialFormScreen,CredentialListScreen}.test.tsx`

- [ ] **Step 1:** Migrate `Button.tsx`, `BackButton.tsx` (add `useTranslation('common')` for its `a11y.goBack` label), `Logo.tsx` (colors only — the wordmark text stays hardcoded English; it's a brand asset like a logo image, ported 1:1 from the web client, not UI copy), `TextField.tsx` (colors only, inline styles).
- [ ] **Step 2:** Swap the 8 listed test files to `renderWithProviders` — mechanical import + call-site change only, no assertion edits.
- [ ] **Step 3:** `npm test` — all 8 updated files pass unchanged in their assertions; everything else stays green.
- [ ] Commit: `refactor(mobile): migrate shared Button/BackButton/Logo/TextField to useTheme`

---

## Task 9: Migrate the Auth feature

**Files:** `src/features/auth/screens/{LoginScreen,RegisterScreen}.tsx`, `src/features/auth/components/{LoginForm,RegisterForm}.tsx`

Recurring pattern only (namespace `auth`). No test changes — Task 8 already moved these 4 test files onto `renderWithProviders`, and `en` matches their existing assertions.

- [ ] Migrate `LoginForm`, `LoginScreen`, `RegisterForm`, `RegisterScreen` per the recurring pattern.
- [ ] `npx jest src/features/auth` — passes, no assertion changes.
- [ ] Commit: `refactor(mobile): migrate auth feature to useTheme + i18n`

---

## Task 10: Migrate the Credentials feature

**Files:** `src/features/credentials/screens/{CredentialFormScreen,CredentialDetailScreen,CredentialListScreen}.tsx`, `src/features/credentials/components/{CredentialForm,CredentialCard,CopyableField,PasswordReveal,UnlockVaultPrompt}.tsx`; test-wrapper swap for `src/features/credentials/components/__tests__/CredentialCard.test.tsx`

**Note:** `CredentialCard.test.tsx` was *not* touched in Task 8 (at that point `CredentialCard.tsx` didn't call `useTheme()` yet) — swap it to `renderWithProviders` here. The three screen tests were already swapped in Task 8 (they transitively render `BackButton`/`Button`).

- [ ] Migrate all 8 components/screens per the recurring pattern (namespace `credentials`).
- [ ] Swap `CredentialCard.test.tsx` to `renderWithProviders`.
- [ ] `npx jest src/features/credentials` — passes.
- [ ] Commit: `refactor(mobile): migrate credentials feature to useTheme + i18n`

---

## Task 11: Migrate the Documents feature

**Files:** `src/features/documents/utils/documentValidation.ts`, `src/features/documents/components/{DocumentTypeSelect,DocumentPickerButton,DocumentCard}.tsx`, `src/features/documents/screens/{DocumentListScreen,DocumentDetailScreen,DocumentUploadScreen}.tsx`; create `src/features/documents/hooks/useDocTypeLabel.ts`. No existing tests reference this feature yet.

**Non-mechanical design note:** `validatePickedFile` and the upload screen's server-error mapping currently return hardcoded English **messages** from a plain (non-React) utility function that can't call `t()`. Change them to return an **error code** instead (`'unsupportedType' | 'tooLarge' | 'genericError' | null`); the calling component (which already has `useTranslation('documents')`) translates via `t(\`upload.${code}\`)`. Similarly, replace the current `DOC_TYPE_CATEGORIES` array of `{ value, label }` (hardcoded English labels) with `DOC_TYPE_CATEGORY_VALUES` — just the fixed `value`s, since these are the literal strings sent to the API per `API_SPEC.md` §7 and must never be translated. Look up the display label via `t(\`docType.categories.${value}\`)` at render time in `DocumentTypeSelect`, and via the new `useDocTypeLabel()` hook (using `t(key, { defaultValue: docType })` so a user-typed free-text "Other" category still displays as-is) everywhere else a doc-type label is shown.

- [ ] **Step 1:** Refactor `documentValidation.ts` to the error-code + category-values shape above.
- [ ] **Step 2:** Add `useDocTypeLabel(): (docType: string | null) => string`.
- [ ] **Step 3:** Migrate `DocumentTypeSelect`, `DocumentPickerButton`, `DocumentCard`, `DocumentListScreen`, `DocumentDetailScreen`, `DocumentUploadScreen` per the recurring pattern (namespace `documents`), using the error codes / `useDocTypeLabel` from Steps 1–2.
- [ ] **Step 4:** `npx tsc --noEmit` and `npx jest src/features/documents` (if any tests exist by then) — clean.
- [ ] Commit: `refactor(mobile): migrate documents feature to useTheme + i18n`

---

## Task 12: Migrate the Profile feature

**Files:** `src/features/profile/components/{BirthdayField,ProfileForm}.tsx`, `src/features/profile/screens/ProfileScreen.tsx`. No existing tests reference this feature.

- [ ] **Step 0:** Before migrating, confirm `profile.json` (both languages, Task 5) includes `fullNamePlaceholder` and the `role.{admin,member}` / `status.{active,locked}` badge-label keys — these are easy to miss when first writing Task 5's key list since they're used only here, not in `GET /profile`'s own display. Add them now if they're missing.
- [ ] **Step 1:** Migrate `BirthdayField`, `ProfileForm`, `ProfileScreen` per the recurring pattern (namespace `profile`).
- [ ] **Step 2:** `npx tsc --noEmit` — clean.
- [ ] Commit: `refactor(mobile): migrate profile feature to useTheme + i18n`

---

## Task 13: New Settings feature (Appearance + Language)

**Files:**
- Create `src/features/settings/components/{AppearancePicker,LanguagePicker}.tsx`, `src/features/settings/screens/SettingsScreen.tsx`, `app/(protected)/settings.tsx`
- Modify `src/features/settings/index.ts`, `src/features/settings/CONTEXT.md`
- Test `src/features/settings/components/__tests__/{AppearancePicker,LanguagePicker}.test.tsx`, `src/features/settings/screens/__tests__/SettingsScreen.test.tsx`

This is genuinely new behavior (unlike Tasks 9–12's mechanical migrations), so it follows full TDD per component: failing test, then implementation.

- [ ] **Step 1 (TDD): `AppearancePicker`.** Test: renders one option per `ThemeMode` (`light`/`dark`/`system`) labeled via `t('appearance.<mode>')`, marks the current `useTheme().mode` as `accessibilityState={{ selected: true }}`, and pressing a different option calls `useTheme().setMode(...)`. Implement as a 3-way segmented control.
- [ ] **Step 2 (TDD): `LanguagePicker`.** Test: shows the current language's label (from `i18n.language`); pressing the row opens a modal/bottom-sheet listing `SUPPORTED_LANGUAGES`, and selecting one calls `setLanguage(...)` (Task 5), which persists to AsyncStorage key `'vault-language'` and updates `i18n.language`.
- [ ] **Step 3 (TDD): `SettingsScreen`.** Test: renders a header (with `BackButton`) plus an "Appearance" section wrapping `AppearancePicker` and a "Language" section wrapping `LanguagePicker`, all via `useTranslation('settings')`. Also create the thin route file `app/(protected)/settings.tsx` (renders `SettingsScreen`) and export `SettingsScreen` from `src/features/settings/index.ts`.
- [ ] **Step 4:** Update `src/features/settings/CONTEXT.md`'s Responsibility/Decisions to: appearance + language are pure client device preferences, persisted locally only, no server sync, no relation to `/profile`; default language is always `vi` on first launch; app-lock/biometric rows from the Mẫu A mockup are explicitly out of scope (spec §2).
- [ ] **Step 5:** `npx jest src/features/settings` — all tests pass (5 total across the 3 files).
- [ ] Commit: `feat(mobile): add Settings screen with Appearance and Language`

---

## Task 14: Migrate Home + protected layout, add the gear icon, drop the temporary alias

**Files:** `app/(protected)/index.tsx`; `src/shared/theme/tokens.ts`

`app/(protected)/_layout.tsx` was already migrated in Task 6 (needed early since the theme/i18n gate lives at the root).

- [ ] **Step 1:** Migrate `app/(protected)/index.tsx` per the recurring pattern (namespace `home`), and add a gear icon (`@expo/vector-icons`'s `Ionicons name="settings-outline"`) in the header, `accessibilityLabel={t('settingsA11y')}`, navigating to `/(protected)/settings` via `router.push`.
- [ ] **Step 2: Remove the temporary `colors` alias.** Run `grep -rn "import { colors" app src --include="*.tsx" --include="*.ts" | grep -v __tests__` — expect no output (all 27 files now use `useTheme`). Then delete the `// TEMPORARY compatibility alias` comment and `export const colors = lightColors` line added in Task 2.
- [ ] **Step 3: Full verification.** `npx tsc --noEmit` — no errors. `npm test` — full suite green.
- [ ] Commit: `feat(mobile): migrate Home to useTheme + i18n, add Settings entry point, drop temporary colors alias`

---

## Task 15: Update `MOBILE-ARCHITECTURE.md`

**Files:** `docs/MOBILE-ARCHITECTURE.md`

- [ ] In §4's feature table, change the `settings` row from "App lock, biometric preference, privacy and session settings" to "Appearance (light/dark/system) and display language (vi default, en) preferences" — the old line predates this feature and never matched what's being built.
- [ ] Commit: `docs(mobile): correct settings feature responsibility to match what was built`

---

## Self-Review Notes

- **Spec coverage**: §3.1 theme system → Tasks 2–4, 6, 8–14. §3.2 i18n → Tasks 5, 8–14. §3.3 Settings screen → Tasks 13–14. §4 data flow → Task 3/5's store + `setLanguage` design. §5 testing → Task 7 (shared wrapper), Task 8 (the 8 tests that break first), Task 10 (the 1 test Task 8 couldn't have caught yet), Task 13 (new TDD tests). §6 rollout order → Tasks 1–14 follow it, split per-feature. §7 risks → the `docType` risk is handled in Task 11; the missing-mockup-file risk is a note for the user, not an engineering task.
- **Type consistency**: `ThemeMode`, `Colors`, `SupportedLanguage`, `useTheme()`'s returned shape, and `renderWithProviders`' signature are each defined once (Tasks 3–5, 7) and referenced identically everywhere else.
- **Sequencing fixes beyond the spec**: the spec didn't anticipate that (a) migrating shared components would transitively break 8 existing tests before their own screens were migrated — fixed by doing the shared-component migration and test-wrapper swap together in Task 8 instead of spreading it across Tasks 9–10; or (b) that removing the flat `colors` export outright would break the 19-or-so not-yet-migrated files' typecheck for several tasks running — fixed by Task 2's temporary alias, removed only in Task 14 once nothing references it.
