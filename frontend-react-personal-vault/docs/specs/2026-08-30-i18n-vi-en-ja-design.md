# i18n (vi / en / ja) — Design Spec

Date: 2026-08-30
Status: Implemented

## Problem

The frontend currently mixes languages inconsistently (e.g. "Đăng xuất", "Xin chào" hardcoded in Vietnamese inside otherwise-English pages). There is no language-switching mechanism. The user wants:

- Three selectable languages: Vietnamese (`vi`), English (`en`), Japanese (`ja`).
- A language switcher with a flag icon next to each language name.
- Selecting a language must make **every** piece of UI text on the site render in that language.
- First-time visitors (no stored preference) default to `vi`.
- The chosen language persists across visits.

## Current state (relevant findings)

- No i18n library is installed.
- There is no shared layout/header component. `DashboardPage.tsx`, `CredentialListPage.tsx`, `DocumentListPage.tsx`, and `ProfilePage.tsx` each duplicate their own top header (logo, dark-mode toggle, logout button) — this duplication is why the language mix-up happened (edits to one header weren't mirrored to the others).
- ~28 `.tsx` files contain user-facing static text across `app/`, `features/auth`, `features/credentials`, `features/documents`, `features/profile`, and `shared/components`. `features/admin` has no UI yet (scaffolding only) and is out of scope.
- Auth pages (`LoginPage`, `RegisterPage`) were recently redesigned with a `VaultBadge` header (see prior session) and don't currently have a language switcher.
- Zod validation schemas (e.g. in `LoginForm.tsx`, `RegisterForm.tsx`, `CredentialForm.tsx`, `ProfileForm.tsx`, `DocumentUploadForm.tsx`) currently hardcode English error messages inline at module scope.

## Approach

### Library

Use `i18next` + `react-i18next`. Rationale: standard for React, handles interpolation, well-documented, easy to extend with more languages later. No `i18next-browser-languagedetector` — the default must always be `vi` for first-time visitors regardless of browser locale, so detection is explicit custom logic, not the plugin's heuristics.

### Initialization & persistence

`src/shared/i18n/index.ts`:
- Reads `localStorage["personal-vault:lang"]`; if absent or not one of `vi`/`en`/`ja`, defaults to `"vi"`.
- Initializes `i18next` with that language and the three resource bundles.
- Exposes a `setLanguage(lang)` helper used by the switcher that calls `i18n.changeLanguage(lang)` and writes the new value to `localStorage["personal-vault:lang"]`.
- Imported once in `main.tsx` before the app renders.

### Translation resources

`src/shared/i18n/locales/{vi,en,ja}.json`. Each file is one flat-ish object namespaced by feature:

```json
{
  "common": { "loading": "...", "cancel": "...", ... },
  "auth": { "loginTitle": "...", ... },
  "dashboard": { ... },
  "credentials": { ... },
  "documents": { ... },
  "profile": { ... }
}
```

Components consume via `useTranslation()` and `t('auth.loginTitle')` etc. Keys are named after what they represent, not after the English source text.

### Validation messages

Each form's Zod schema becomes a factory function taking `t`, called inside the component with `useMemo(() => createXSchema(t), [t])`, e.g.:

```ts
function createLoginSchema(t: TFunction) {
  return z.object({
    phone: z.string().min(1, t('auth.errors.phoneRequired')),
    password: z.string().min(1, t('auth.errors.passwordRequired')),
  })
}
```

Backend error messages (`error.message` from the API) are **not** translated — per `API_SPEC.md` these are fixed English server strings, and existing forms already show their own frontend-owned copy instead of the raw backend message (e.g. `LoginForm` shows "Invalid phone number or password." itself rather than rendering `error.response.data.error.message`). That frontend-owned copy is what gets translated; the backend message itself is never surfaced.

### Shared `TopBar`

Extract the duplicated authenticated-area header into `shared/components/TopBar.tsx` (logo/wordmark, dark-mode toggle, `LanguageSwitcher`, logout button). `DashboardPage`, `CredentialListPage`, `DocumentListPage`, `ProfilePage` render `<TopBar />` instead of their own inline header markup. This is the single place the language switcher is wired in for authenticated pages, avoiding the same four-way duplication that caused the original language mix-up.

### `LanguageSwitcher`

`shared/components/LanguageSwitcher.tsx`: a `<select>` styled consistently with existing form inputs. Options, in order: `🇻🇳 Tiếng Việt`, `🇬🇧 English`, `🇯🇵 日本語`. On change, calls the `setLanguage` helper from `shared/i18n`. Rendered in `TopBar` for authenticated pages, and directly under `VaultBadge` on `LoginPage`/`RegisterPage` for unauthenticated visitors (per user's explicit choice).

### Migration scope

Every `.tsx` file listed under "Current state" gets its hardcoded strings replaced with `t(...)` calls: labels, headings, buttons, placeholders, empty/loading states, frontend-owned error copy. `features/admin` is skipped (no UI exists yet); when admin UI is built later it must use the same `t(...)` pattern from the start.

## Testing

No existing frontend test asserts against literal UI strings, so this change doesn't break the test suite by translating copy — confirmed by scanning `*.test.tsx` files before starting. Verification is manual: run the dev server, switch between `vi`/`en`/`ja` via the switcher on both an authenticated page and `LoginPage`/`RegisterPage`, and visually confirm no leftover hardcoded text in the other two languages.

## Out of scope

- `features/admin` (no UI built yet).
- Translating backend (`error.message`) strings.
- Auto-detecting browser language.
- Adding more languages beyond vi/en/ja (structure supports it, but not built now).
