# Dark/Light Mode + Multi-language (vi default) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

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

---

## Task 1: Install dependencies

**Files:**
- Modify: `package.json`, `package-lock.json` (via install commands, not hand-edited)

**Interfaces:**
- Produces: `@react-native-async-storage/async-storage`, `i18next`, `react-i18next` available to import from Task 3 onward.

- [ ] **Step 1: Install the Expo-managed AsyncStorage dependency**

Run: `npx expo install @react-native-async-storage/async-storage`

Expected: `package.json` gains `@react-native-async-storage/async-storage` pinned to the version Expo SDK 54 expects.

- [ ] **Step 2: Install i18next and react-i18next**

Run: `npm install i18next react-i18next`

Expected: `package.json` gains both packages under `dependencies`.

- [ ] **Step 3: Verify the app still boots**

Run: `npx expo start -c` and confirm the Metro bundler starts with no resolution errors (Ctrl+C once confirmed — this step is a sanity check, not a lasting process).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(mobile): add async-storage and i18next dependencies"
```

---

## Task 2: Split theme tokens into light/dark palettes

**Files:**
- Modify: `src/shared/theme/tokens.ts`

**Interfaces:**
- Produces: `lightColors`, `darkColors` (both `{ bg, surface, surfaceHover, primary, primaryDark, primarySoft, mist, mistSoft, ink, muted, line, danger, dangerDark, dangerSoft }`), `type Colors = typeof lightColors`, plus unchanged `fonts`, `radii`, `spacing`.
- Consumed by: Task 4 (`ThemeProvider`).

- [ ] **Step 1: Replace the flat `colors` export with `lightColors`/`darkColors`**

Replace the full contents of `src/shared/theme/tokens.ts` with:

```ts
// Mirrors the web client's design tokens exactly (frontend-react-personal-vault/src/index.css)
// so the two clients read as the same product. darkColors keeps the same semantic role per key
// as lightColors (e.g. `primaryDark` is always "the accessible text color on a `primarySoft`
// background") even though the literal shade moves in the opposite direction in dark mode.
export const lightColors = {
  bg: '#e7e2d5',
  surface: '#ffffff',
  surfaceHover: '#f0e9da',
  primary: '#4e8071',
  primaryDark: '#2c5545',
  primarySoft: '#d6e3dd',
  mist: '#635d57',
  mistSoft: '#f0e9da',
  ink: '#1e1c1a',
  muted: '#726a5f',
  line: '#d3c8b2',
  danger: '#9e4b39',
  dangerDark: '#7a3728',
  dangerSoft: '#f5e1dc',
} as const

export const darkColors = {
  bg: '#15140f',
  surface: '#211f19',
  surfaceHover: '#2a271e',
  primary: '#6fa593',
  primaryDark: '#8fc2b0',
  primarySoft: '#2a3b34',
  mist: '#a89e8c',
  mistSoft: '#2d2a20',
  ink: '#eee9dc',
  muted: '#a89e8c',
  line: '#3a3629',
  danger: '#e0806c',
  dangerDark: '#f0a494',
  dangerSoft: '#3a221d',
} as const

export type Colors = typeof lightColors

// TEMPORARY compatibility alias for the 27 files not yet migrated to useTheme() (Tasks 8–14).
// Every remaining `import { colors } from '.../tokens'` resolves to the light palette until its
// file is migrated, so the app keeps compiling and running at every commit in between. Task 14's
// last step deletes this alias once grep confirms zero remaining references.
export const colors = lightColors

export const fonts = {
  serif: 'Newsreader_500Medium',
  serifLight: 'Newsreader_300Light',
  serifSemiBold: 'Newsreader_600SemiBold',
  sans: 'IBMPlexSans_400Regular',
  sansMedium: 'IBMPlexSans_500Medium',
  sansSemiBold: 'IBMPlexSans_600SemiBold',
  mono: 'IBMPlexMono_400Regular',
  monoMedium: 'IBMPlexMono_500Medium',
} as const

export const radii = {
  sm: 9,
  md: 11,
  lg: 12,
  pill: 20,
  circle: 999,
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 24,
} as const
```

- [ ] **Step 2: Confirm the app still typechecks with the temporary alias in place**

Run: `npx tsc --noEmit`
Expected: no new errors — every one of the 27 not-yet-migrated files still resolves `colors` via the temporary alias added in Step 1. This is the baseline the rest of this plan migrates away from; Task 14's final step removes the alias once nothing imports it anymore.

- [ ] **Step 3: Commit**

```bash
git add src/shared/theme/tokens.ts
git commit -m "refactor(mobile): split theme tokens into light/dark palettes"
```

---

## Task 3: Theme preference store

**Files:**
- Create: `src/shared/theme/theme.store.ts`
- Test: `src/shared/theme/__tests__/theme.store.test.ts`

**Interfaces:**
- Produces: `useThemeStore` (Zustand hook) with state `{ mode: ThemeMode, hasHydrated: boolean, setMode: (mode: ThemeMode) => void }`, and `export type ThemeMode = 'light' | 'dark' | 'system'`.
- Consumed by: Task 4 (`ThemeProvider`), Task 6 (`useAppReady`), Task 13 (`AppearancePicker`).

- [ ] **Step 1: Write the failing test**

Create `src/shared/theme/__tests__/theme.store.test.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useThemeStore } from '../theme.store'

describe('useThemeStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear()
    useThemeStore.setState({ mode: 'system', hasHydrated: false })
  })

  it('defaults to system mode', () => {
    expect(useThemeStore.getState().mode).toBe('system')
  })

  it('updates mode via setMode', () => {
    useThemeStore.getState().setMode('dark')
    expect(useThemeStore.getState().mode).toBe('dark')
  })

  it('persists mode to AsyncStorage and rehydrates it on a fresh store instance', async () => {
    useThemeStore.getState().setMode('dark')
    await new Promise((resolve) => setTimeout(resolve, 0))

    const raw = await AsyncStorage.getItem('vault-theme-mode')
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw!).state.mode).toBe('dark')
  })

  it('flips hasHydrated to true after rehydration completes', async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(useThemeStore.getState().hasHydrated).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/shared/theme/__tests__/theme.store.test.ts`
Expected: FAIL with "Cannot find module '../theme.store'".

- [ ] **Step 3: Implement the store**

Create `src/shared/theme/theme.store.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeState {
  mode: ThemeMode
  hasHydrated: boolean
  setMode: (mode: ThemeMode) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'system',
      hasHydrated: false,
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'vault-theme-mode',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ mode: state.mode }),
      onRehydrateStorage: () => () => {
        useThemeStore.setState({ hasHydrated: true })
      },
    },
  ),
)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/shared/theme/__tests__/theme.store.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/shared/theme/theme.store.ts src/shared/theme/__tests__/theme.store.test.ts
git commit -m "feat(mobile): add persisted theme preference store"
```

---

## Task 4: ThemeProvider + useTheme hook

**Files:**
- Create: `src/shared/theme/ThemeProvider.tsx`
- Test: `src/shared/theme/__tests__/ThemeProvider.test.tsx`

**Interfaces:**
- Consumes: `useThemeStore` (Task 3), `lightColors`/`darkColors`/`fonts`/`radii`/`spacing`/`Colors` (Task 2).
- Produces: `ThemeProvider` (component), `useTheme(): { colors: Colors, fonts, radii, spacing, mode: ThemeMode, resolvedScheme: 'light' | 'dark', setMode: (mode: ThemeMode) => void }`.
- Consumed by: Task 6 (root layout, aliased on import), Task 7 (`renderWithProviders`), every migrated screen/component from Task 8 onward.

- [ ] **Step 1: Write the failing test**

Create `src/shared/theme/__tests__/ThemeProvider.test.tsx`:

```tsx
import { Text } from 'react-native'
import { render, screen } from '@testing-library/react-native'
import { useThemeStore } from '../theme.store'
import { ThemeProvider, useTheme } from '../ThemeProvider'

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => jest.fn(() => 'light'))

function Probe() {
  const { colors, resolvedScheme, mode } = useTheme()
  return <Text testID="probe">{`${mode}:${resolvedScheme}:${colors.bg}`}</Text>
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    useThemeStore.setState({ mode: 'system', hasHydrated: true })
  })

  it('resolves system mode against the OS color scheme', () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('probe').props.children).toBe('system:light:#e7e2d5')
  })

  it('lets an explicit dark override win regardless of OS scheme', () => {
    useThemeStore.setState({ mode: 'dark', hasHydrated: true })
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('probe').props.children).toBe('dark:dark:#15140f')
  })

  it('throws when useTheme is called outside the provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Probe />)).toThrow('useTheme must be used within a ThemeProvider')
    consoleError.mockRestore()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/shared/theme/__tests__/ThemeProvider.test.tsx`
Expected: FAIL with "Cannot find module '../ThemeProvider'".

- [ ] **Step 3: Implement the provider**

Create `src/shared/theme/ThemeProvider.tsx`:

```tsx
import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useColorScheme } from 'react-native'
import { darkColors, fonts, lightColors, radii, spacing, type Colors } from './tokens'
import { useThemeStore, type ThemeMode } from './theme.store'

interface ThemeContextValue {
  colors: Colors
  fonts: typeof fonts
  radii: typeof radii
  spacing: typeof spacing
  mode: ThemeMode
  resolvedScheme: 'light' | 'dark'
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme()
  const mode = useThemeStore((state) => state.mode)
  const setMode = useThemeStore((state) => state.setMode)

  const resolvedScheme: 'light' | 'dark' =
    mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: resolvedScheme === 'dark' ? darkColors : lightColors,
      fonts,
      radii,
      spacing,
      mode,
      resolvedScheme,
      setMode,
    }),
    [resolvedScheme, mode, setMode],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/shared/theme/__tests__/ThemeProvider.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/shared/theme/ThemeProvider.tsx src/shared/theme/__tests__/ThemeProvider.test.tsx
git commit -m "feat(mobile): add ThemeProvider and useTheme hook"
```

---

## Task 5: i18n locale files + init module

**Files:**
- Create: `src/shared/i18n/locales/vi/common.json`, `auth.json`, `credentials.json`, `documents.json`, `profile.json`, `settings.json`, `home.json`
- Create: `src/shared/i18n/locales/en/common.json`, `auth.json`, `credentials.json`, `documents.json`, `profile.json`, `settings.json`, `home.json`
- Create: `src/shared/i18n/index.ts`
- Test: `src/shared/i18n/__tests__/index.test.ts`

**Interfaces:**
- Produces: default export `i18next` instance (initialized, `lng: 'vi'`), `SUPPORTED_LANGUAGES`, `type SupportedLanguage = 'vi' | 'en'`, `loadPersistedLanguage(): Promise<void>`, `setLanguage(language: SupportedLanguage): Promise<void>`.
- Consumed by: Task 6 (`useAppReady`), Task 13 (`LanguagePicker`), every migrated screen/component via `useTranslation(namespace)`.

- [ ] **Step 1: Create the `vi` locale files**

Create `src/shared/i18n/locales/vi/common.json`:

```json
{
  "actions": {
    "cancel": "Huỷ",
    "save": "Lưu",
    "edit": "Sửa",
    "delete": "Xoá",
    "retry": "Thử lại",
    "copy": "Sao chép",
    "show": "Hiện",
    "hide": "Ẩn"
  },
  "status": {
    "offline": "Bạn đang ngoại tuyến. Kiểm tra kết nối và thử lại."
  },
  "a11y": {
    "goBack": "Quay lại"
  }
}
```

Create `src/shared/i18n/locales/vi/auth.json`:

```json
{
  "login": {
    "title": "Đăng nhập",
    "subtitle": "Truy cập kho lưu trữ cá nhân của bạn",
    "phoneLabel": "Số điện thoại",
    "phonePlaceholder": "0900 000 000",
    "passwordLabel": "Mật khẩu",
    "passwordPlaceholder": "••••••••••",
    "submit": "Đăng nhập",
    "signingIn": "Đang đăng nhập…",
    "derivingKey": "Đang tạo khoá mã hoá…",
    "noAccount": "Chưa có tài khoản? ",
    "registerLink": "Đăng ký"
  },
  "register": {
    "title": "Tạo tài khoản",
    "subtitle": "Bắt đầu kho lưu trữ cá nhân của bạn",
    "fullNameLabel": "Họ và tên",
    "fullNamePlaceholder": "Nguyễn Văn A",
    "phoneLabel": "Số điện thoại",
    "phonePlaceholder": "0900 000 000",
    "passwordLabel": "Mật khẩu",
    "passwordPlaceholder": "••••••••••",
    "submit": "Đăng ký"
  },
  "validation": {
    "phoneRequired": "Vui lòng nhập số điện thoại",
    "passwordMinLength": "Mật khẩu phải có ít nhất 8 ký tự",
    "fullNameRequired": "Vui lòng nhập họ và tên"
  }
}
```

Create `src/shared/i18n/locales/vi/credentials.json`:

```json
{
  "list": {
    "title": "Mật khẩu",
    "add": "+ Thêm",
    "empty": "Chưa có mật khẩu nào được lưu.",
    "loadError": "Không thể tải danh sách mật khẩu."
  },
  "detail": {
    "invalid": "Mật khẩu không hợp lệ.",
    "notFound": "Không tìm thấy mật khẩu.",
    "preparingVault": "Đang chuẩn bị kho lưu trữ…",
    "note": "Ghi chú",
    "account": "Tài khoản",
    "accountCopied": "Đã sao chép tài khoản.",
    "passwordCopied": "Đã sao chép mật khẩu.",
    "copiedTitle": "Đã sao chép",
    "deleteTitle": "Xoá mật khẩu",
    "deleteMessage": "Xoá \"{{platform}}\"? Hành động này không thể hoàn tác."
  },
  "form": {
    "editTitle": "Sửa mật khẩu",
    "addTitle": "Thêm mật khẩu",
    "platformLabel": "Nền tảng",
    "platformPlaceholder": "Gmail",
    "accountLabel": "Tài khoản",
    "accountPlaceholder": "user@gmail.com",
    "passwordLabel": "Mật khẩu",
    "passwordPlaceholder": "••••••••••",
    "noteLabel": "Ghi chú (không bắt buộc)",
    "notePlaceholder": "Tài khoản cá nhân",
    "saveChanges": "Lưu thay đổi",
    "addSubmit": "Thêm mật khẩu",
    "saveError": "Không thể lưu mật khẩu này."
  },
  "validation": {
    "platformRequired": "Vui lòng nhập nền tảng",
    "accountRequired": "Vui lòng nhập tài khoản",
    "passwordRequired": "Vui lòng nhập mật khẩu"
  },
  "password": {
    "label": "Mật khẩu",
    "locked": "Kho lưu trữ đang khoá",
    "decryptError": "Không thể giải mã mật khẩu này",
    "unlockAgain": "Mở khoá lại kho lưu trữ"
  },
  "unlock": {
    "title": "Kho lưu trữ đang khoá",
    "subtitle": "Nhập mật khẩu để xem và sửa các mật khẩu đã lưu.",
    "passwordLabel": "Mật khẩu",
    "passwordPlaceholder": "••••••••••",
    "submit": "Mở khoá",
    "deriving": "Đang tạo khoá mã hoá…"
  }
}
```

Create `src/shared/i18n/locales/vi/documents.json`:

```json
{
  "list": {
    "title": "Tài liệu",
    "upload": "+ Tải lên",
    "empty": "Chưa có tài liệu nào được tải lên.",
    "loadError": "Không thể tải danh sách tài liệu."
  },
  "detail": {
    "invalid": "Tài liệu không hợp lệ.",
    "notFound": "Không tìm thấy tài liệu.",
    "category": "Danh mục",
    "file": "Tệp",
    "uploaded": "Đã tải lên",
    "download": "Tải xuống",
    "downloadFailedTitle": "Tải xuống thất bại",
    "downloadFailedMessage": "Không thể tải xuống tài liệu này.",
    "deleteTitle": "Xoá tài liệu",
    "deleteMessage": "Xoá \"{{title}}\"? Hành động này không thể hoàn tác."
  },
  "upload": {
    "title": "Tải lên tài liệu",
    "titleLabel": "Tiêu đề",
    "titlePlaceholder": "Mặt trước hộ chiếu",
    "submit": "Tải lên",
    "chooseFile": "Chọn tệp",
    "choosePhoto": "Chọn ảnh",
    "genericError": "Không thể tải lên tài liệu này.",
    "tooLarge": "Tệp lớn hơn 10MB.",
    "unsupportedType": "Chỉ hỗ trợ tệp JPEG, PNG hoặc PDF."
  },
  "docType": {
    "label": "Danh mục (không bắt buộc)",
    "customLabel": "Danh mục tuỳ chỉnh",
    "customPlaceholder": "vd: Bảo hiểm",
    "other": "Khác",
    "uncategorized": "Chưa phân loại",
    "categories": {
      "identity_civil_status": "Giấy tờ tuỳ thân & hộ tịch",
      "education_qualifications": "Giáo dục & bằng cấp",
      "employment_contracts": "Việc làm & hợp đồng",
      "medical_health": "Y tế & sức khoẻ",
      "finance_tax": "Tài chính & thuế",
      "property_vehicles": "Tài sản & phương tiện",
      "legal_misc": "Pháp lý & khác"
    }
  }
}
```

Create `src/shared/i18n/locales/vi/profile.json`:

```json
{
  "title": "Hồ sơ",
  "fullNameLabel": "Họ và tên",
  "fullNamePlaceholder": "Nguyễn Văn A",
  "phone": "Số điện thoại",
  "birthday": "Ngày sinh",
  "birthdayNotSet": "Chưa đặt",
  "birthdayFieldLabel": "Ngày sinh (không bắt buộc)",
  "birthdaySelect": "Chọn ngày",
  "editProfile": "Sửa hồ sơ",
  "saveError": "Không thể lưu hồ sơ của bạn.",
  "loadError": "Không thể tải hồ sơ của bạn.",
  "validation": {
    "fullNameRequired": "Vui lòng nhập họ và tên"
  },
  "role": {
    "admin": "Quản trị viên",
    "member": "Thành viên"
  },
  "status": {
    "active": "Đang hoạt động",
    "locked": "Đã khoá"
  }
}
```

Create `src/shared/i18n/locales/vi/home.json`:

```json
{
  "welcome": "Chào mừng trở lại",
  "defaultName": "bạn",
  "vaultSection": "Kho lưu trữ của bạn",
  "credentialsTitle": "Mật khẩu",
  "credentialsSubtitle": "Mật khẩu các nền tảng đã lưu",
  "documentsTitle": "Tài liệu",
  "documentsSubtitle": "Tệp & bản scan cá nhân",
  "profileTitle": "Hồ sơ",
  "profileSubtitle": "Tài khoản & cài đặt",
  "logout": "Đăng xuất",
  "loggingOut": "Đang đăng xuất…",
  "settingsA11y": "Mở cài đặt",
  "soonTag": "Sắp có"
}
```

Create `src/shared/i18n/locales/vi/settings.json`:

```json
{
  "title": "Cài đặt",
  "appearance": {
    "sectionLabel": "Giao diện",
    "light": "Sáng",
    "dark": "Tối",
    "system": "Hệ thống"
  },
  "language": {
    "sectionLabel": "Ngôn ngữ",
    "rowLabel": "Ngôn ngữ hiển thị",
    "vi": "Tiếng Việt",
    "en": "English"
  }
}
```

- [ ] **Step 2: Create the `en` locale files (mirrors the current hardcoded English strings 1:1)**

Create `src/shared/i18n/locales/en/common.json`:

```json
{
  "actions": {
    "cancel": "Cancel",
    "save": "Save",
    "edit": "Edit",
    "delete": "Delete",
    "retry": "Retry",
    "copy": "Copy",
    "show": "Show",
    "hide": "Hide"
  },
  "status": {
    "offline": "You're offline. Check your connection and try again."
  },
  "a11y": {
    "goBack": "Go back"
  }
}
```

Create `src/shared/i18n/locales/en/auth.json`:

```json
{
  "login": {
    "title": "Log in",
    "subtitle": "Access your personal vault",
    "phoneLabel": "Phone number",
    "phonePlaceholder": "0900 000 000",
    "passwordLabel": "Password",
    "passwordPlaceholder": "••••••••••",
    "submit": "Log in",
    "signingIn": "Signing in…",
    "derivingKey": "Deriving encryption key…",
    "noAccount": "No account yet? ",
    "registerLink": "Register"
  },
  "register": {
    "title": "Create account",
    "subtitle": "Start your personal vault",
    "fullNameLabel": "Full name",
    "fullNamePlaceholder": "Nguyen Van A",
    "phoneLabel": "Phone number",
    "phonePlaceholder": "0900 000 000",
    "passwordLabel": "Password",
    "passwordPlaceholder": "••••••••••",
    "submit": "Register"
  },
  "validation": {
    "phoneRequired": "Phone number is required",
    "passwordMinLength": "Password must be at least 8 characters",
    "fullNameRequired": "Full name is required"
  }
}
```

Create `src/shared/i18n/locales/en/credentials.json`:

```json
{
  "list": {
    "title": "Credentials",
    "add": "+ Add",
    "empty": "No credentials saved yet.",
    "loadError": "Could not load credentials."
  },
  "detail": {
    "invalid": "Invalid credential.",
    "notFound": "Credential not found.",
    "preparingVault": "Preparing your vault…",
    "note": "Note",
    "account": "Account",
    "accountCopied": "Account copied to clipboard.",
    "passwordCopied": "Password copied to clipboard.",
    "copiedTitle": "Copied",
    "deleteTitle": "Delete credential",
    "deleteMessage": "Delete \"{{platform}}\"? This cannot be undone."
  },
  "form": {
    "editTitle": "Edit credential",
    "addTitle": "Add credential",
    "platformLabel": "Platform",
    "platformPlaceholder": "Gmail",
    "accountLabel": "Account",
    "accountPlaceholder": "user@gmail.com",
    "passwordLabel": "Password",
    "passwordPlaceholder": "••••••••••",
    "noteLabel": "Note (optional)",
    "notePlaceholder": "Personal account",
    "saveChanges": "Save changes",
    "addSubmit": "Add credential",
    "saveError": "Could not save this credential."
  },
  "validation": {
    "platformRequired": "Platform is required",
    "accountRequired": "Account is required",
    "passwordRequired": "Password is required"
  },
  "password": {
    "label": "Password",
    "locked": "Vault is locked",
    "decryptError": "Could not decrypt this password",
    "unlockAgain": "Unlock vault again"
  },
  "unlock": {
    "title": "Vault locked",
    "subtitle": "Enter your password to view and edit your saved credentials.",
    "passwordLabel": "Password",
    "passwordPlaceholder": "••••••••••",
    "submit": "Unlock",
    "deriving": "Deriving encryption key…"
  }
}
```

Create `src/shared/i18n/locales/en/documents.json`:

```json
{
  "list": {
    "title": "Documents",
    "upload": "+ Upload",
    "empty": "No documents uploaded yet.",
    "loadError": "Could not load documents."
  },
  "detail": {
    "invalid": "Invalid document.",
    "notFound": "Document not found.",
    "category": "Category",
    "file": "File",
    "uploaded": "Uploaded",
    "download": "Download",
    "downloadFailedTitle": "Download failed",
    "downloadFailedMessage": "Could not download this document.",
    "deleteTitle": "Delete document",
    "deleteMessage": "Delete \"{{title}}\"? This cannot be undone."
  },
  "upload": {
    "title": "Upload document",
    "titleLabel": "Title",
    "titlePlaceholder": "Passport front page",
    "submit": "Upload",
    "chooseFile": "Choose file",
    "choosePhoto": "Choose photo",
    "genericError": "Could not upload this document.",
    "tooLarge": "File is larger than 10MB.",
    "unsupportedType": "Only JPEG, PNG, or PDF files are supported."
  },
  "docType": {
    "label": "Category (optional)",
    "customLabel": "Custom category",
    "customPlaceholder": "e.g. Insurance",
    "other": "Other",
    "uncategorized": "Uncategorized",
    "categories": {
      "identity_civil_status": "Identity & Civil Status",
      "education_qualifications": "Education & Qualifications",
      "employment_contracts": "Employment & Contracts",
      "medical_health": "Medical & Health",
      "finance_tax": "Finance & Tax",
      "property_vehicles": "Property & Vehicles",
      "legal_misc": "Legal & Miscellaneous"
    }
  }
}
```

Create `src/shared/i18n/locales/en/profile.json`:

```json
{
  "title": "Profile",
  "fullNameLabel": "Full name",
  "fullNamePlaceholder": "Nguyen Van A",
  "phone": "Phone",
  "birthday": "Birthday",
  "birthdayNotSet": "Not set",
  "birthdayFieldLabel": "Birthday (optional)",
  "birthdaySelect": "Select a date",
  "editProfile": "Edit profile",
  "saveError": "Could not save your profile.",
  "loadError": "Could not load your profile.",
  "validation": {
    "fullNameRequired": "Full name is required"
  },
  "role": {
    "admin": "Admin",
    "member": "Member"
  },
  "status": {
    "active": "Active",
    "locked": "Locked"
  }
}
```

Create `src/shared/i18n/locales/en/home.json`:

```json
{
  "welcome": "Welcome back",
  "defaultName": "there",
  "vaultSection": "Your vault",
  "credentialsTitle": "Credentials",
  "credentialsSubtitle": "Saved platform passwords",
  "documentsTitle": "Documents",
  "documentsSubtitle": "Personal files & scans",
  "profileTitle": "Profile",
  "profileSubtitle": "Account & settings",
  "logout": "Log out",
  "loggingOut": "Logging out…",
  "settingsA11y": "Open settings",
  "soonTag": "Soon"
}
```

Create `src/shared/i18n/locales/en/settings.json`:

```json
{
  "title": "Settings",
  "appearance": {
    "sectionLabel": "Appearance",
    "light": "Light",
    "dark": "Dark",
    "system": "System"
  },
  "language": {
    "sectionLabel": "Language",
    "rowLabel": "Display language",
    "vi": "Tiếng Việt",
    "en": "English"
  }
}
```

- [ ] **Step 3: Write the failing test for the init module**

Create `src/shared/i18n/__tests__/index.test.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import i18next, { loadPersistedLanguage, setLanguage } from '../index'

describe('i18n', () => {
  beforeEach(async () => {
    await AsyncStorage.clear()
    await i18next.changeLanguage('vi')
  })

  it('defaults to vi', () => {
    expect(i18next.language).toBe('vi')
  })

  it('translates a known key in the default language', () => {
    expect(i18next.t('settings:title')).toBe('Cài đặt')
  })

  it('loadPersistedLanguage leaves vi in place when nothing is stored', async () => {
    await loadPersistedLanguage()
    expect(i18next.language).toBe('vi')
  })

  it('setLanguage switches language and persists the choice', async () => {
    await setLanguage('en')
    expect(i18next.language).toBe('en')
    expect(i18next.t('settings:title')).toBe('Settings')
    expect(await AsyncStorage.getItem('vault-language')).toBe('en')
  })

  it('loadPersistedLanguage restores a previously persisted choice', async () => {
    await setLanguage('en')
    await i18next.changeLanguage('vi')
    await loadPersistedLanguage()
    expect(i18next.language).toBe('en')
  })
})
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx jest src/shared/i18n/__tests__/index.test.ts`
Expected: FAIL with "Cannot find module '../index'".

- [ ] **Step 5: Implement the init module**

Create `src/shared/i18n/index.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

import authEn from './locales/en/auth.json'
import commonEn from './locales/en/common.json'
import credentialsEn from './locales/en/credentials.json'
import documentsEn from './locales/en/documents.json'
import homeEn from './locales/en/home.json'
import profileEn from './locales/en/profile.json'
import settingsEn from './locales/en/settings.json'
import authVi from './locales/vi/auth.json'
import commonVi from './locales/vi/common.json'
import credentialsVi from './locales/vi/credentials.json'
import documentsVi from './locales/vi/documents.json'
import homeVi from './locales/vi/home.json'
import profileVi from './locales/vi/profile.json'
import settingsVi from './locales/vi/settings.json'

export const SUPPORTED_LANGUAGES = ['vi', 'en'] as const
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

const LANGUAGE_STORAGE_KEY = 'vault-language'

i18next.use(initReactI18next).init({
  resources: {
    vi: {
      common: commonVi,
      auth: authVi,
      credentials: credentialsVi,
      documents: documentsVi,
      profile: profileVi,
      settings: settingsVi,
      home: homeVi,
    },
    en: {
      common: commonEn,
      auth: authEn,
      credentials: credentialsEn,
      documents: documentsEn,
      profile: profileEn,
      settings: settingsEn,
      home: homeEn,
    },
  },
  lng: 'vi',
  fallbackLng: 'vi',
  defaultNS: 'common',
  ns: ['common', 'auth', 'credentials', 'documents', 'profile', 'settings', 'home'],
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
})

// AsyncStorage has no synchronous API, so the module's default `lng: 'vi'` above always wins
// for the very first render; the root layout's hydration gate (useAppReady) awaits this before
// rendering themed content so a persisted 'en' choice never flashes as 'vi' first.
export async function loadPersistedLanguage(): Promise<void> {
  const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
  if (stored === 'vi' || stored === 'en') {
    await i18next.changeLanguage(stored)
  }
}

export async function setLanguage(language: SupportedLanguage): Promise<void> {
  await i18next.changeLanguage(language)
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language)
}

export default i18next
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx jest src/shared/i18n/__tests__/index.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 7: Commit**

```bash
git add src/shared/i18n
git commit -m "feat(mobile): add i18next setup with vi/en locale files"
```

---

## Task 6: App-ready hydration gate + root layout wiring + dead-code removal

**Files:**
- Create: `src/providers/useAppReady.ts`
- Modify: `app/_layout.tsx`, `app/(protected)/_layout.tsx`, `src/providers/AppProviders.tsx`
- Delete: `constants/theme.ts`, `hooks/use-theme-color.ts`, `hooks/use-color-scheme.ts`, `hooks/use-color-scheme.web.ts`, `components/external-link.tsx`, `components/haptic-tab.tsx`, `components/hello-wave.tsx`, `components/themed-view.tsx`, `components/themed-text.tsx`, `components/parallax-scroll-view.tsx`, `components/ui/collapsible.tsx`, `components/ui/icon-symbol.tsx`, `components/ui/icon-symbol.ios.tsx`
- Test: `src/providers/__tests__/useAppReady.test.tsx`

**Interfaces:**
- Consumes: `useThemeStore` (Task 3), `loadPersistedLanguage` (Task 5).
- Produces: `useAppReady(fontsLoaded: boolean): boolean`.
- Consumed by: `app/_layout.tsx`'s `RootLayout`.

- [ ] **Step 1: Write the failing test**

Create `src/providers/__tests__/useAppReady.test.tsx`:

```tsx
import { renderHook, waitFor } from '@testing-library/react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useThemeStore } from '@/src/shared/theme/theme.store'
import { useAppReady } from '../useAppReady'

describe('useAppReady', () => {
  beforeEach(async () => {
    await AsyncStorage.clear()
    useThemeStore.setState({ mode: 'system', hasHydrated: false })
  })

  it('is not ready while fonts have not loaded, even after theme/i18n settle', async () => {
    const { result } = renderHook(() => useAppReady(false))
    await waitFor(() => expect(useThemeStore.getState().hasHydrated).toBe(true))
    expect(result.current).toBe(false)
  })

  it('becomes ready once fonts are loaded and theme/i18n have both settled', async () => {
    const { result } = renderHook(() => useAppReady(true))
    await waitFor(() => expect(result.current).toBe(true))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/providers/__tests__/useAppReady.test.tsx`
Expected: FAIL with "Cannot find module '../useAppReady'".

- [ ] **Step 3: Implement the hook**

Create `src/providers/useAppReady.ts`:

```ts
import { useEffect, useState } from 'react'
import { loadPersistedLanguage } from '@/src/shared/i18n'
import { useThemeStore } from '@/src/shared/theme/theme.store'

export function useAppReady(fontsLoaded: boolean): boolean {
  const themeHydrated = useThemeStore((state) => state.hasHydrated)
  const [i18nReady, setI18nReady] = useState(false)

  useEffect(() => {
    let isMounted = true
    loadPersistedLanguage().finally(() => {
      if (isMounted) setI18nReady(true)
    })
    return () => {
      isMounted = false
    }
  }, [])

  return fontsLoaded && themeHydrated && i18nReady
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/providers/__tests__/useAppReady.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Wire `ThemeProvider` and the readiness gate into the root layout**

Replace the full contents of `app/_layout.tsx` with:

```tsx
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { IBMPlexMono_400Regular, IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono';
import { IBMPlexSans_400Regular, IBMPlexSans_500Medium, IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans';
import { Newsreader_300Light, Newsreader_500Medium, Newsreader_600SemiBold } from '@expo-google-fonts/newsreader';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useSessionBootstrap } from '@/src/features/auth';
import { AppProviders } from '@/src/providers/AppProviders';
import { useAppReady } from '@/src/providers/useAppReady';
import { ThemeProvider as VaultThemeProvider, useTheme } from '@/src/shared/theme/ThemeProvider';
import '@/src/shared/i18n';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(protected)',
};

function RootNavigator() {
  const { resolvedScheme } = useTheme();
  useSessionBootstrap();

  return (
    <NavigationThemeProvider value={resolvedScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(protected)" />
        <Stack.Screen name="(public)" />
      </Stack>
      <StatusBar style="auto" />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Newsreader_300Light,
    Newsreader_500Medium,
    Newsreader_600SemiBold,
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
  });
  const isAppReady = useAppReady(fontsLoaded);

  useEffect(() => {
    if (isAppReady) {
      SplashScreen.hideAsync();
    }
  }, [isAppReady]);

  if (!isAppReady) {
    return null;
  }

  return (
    <VaultThemeProvider>
      <AppProviders>
        <RootNavigator />
      </AppProviders>
    </VaultThemeProvider>
  );
}
```

- [ ] **Step 6: Make the protected route stack theme-aware**

Replace the full contents of `app/(protected)/_layout.tsx` with:

```tsx
import { useAuthStore } from '@/src/features/auth'
import { Redirect, Stack } from 'expo-router'
import { useTheme } from '@/src/shared/theme/ThemeProvider'

export default function ProtectedLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isSessionLoading = useAuthStore((state) => state.isSessionLoading)
  const { colors } = useTheme()

  if (isSessionLoading) {
    return null
  }

  if (!isAuthenticated) {
    return <Redirect href="/(public)/login" />
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="credentials" />
      <Stack.Screen name="documents" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="settings" />
    </Stack>
  )
}
```

(The `settings` screen is added by Task 13; declaring it here now is harmless — Expo Router only requires the route file to exist once it's navigated to, and Task 13 adds `app/(protected)/settings.tsx` before anything links to it.)

- [ ] **Step 7: Delete confirmed-dead Expo template scaffolding**

These files have zero references anywhere in `app/` or `src/` (verified via
`grep -rln "external-link\|haptic-tab\|hello-wave\|icon-symbol\|use-color-scheme\|use-theme-color\|themed-view\|themed-text\|parallax-scroll-view\|ui/collapsible\|constants/theme" app src --include="*.tsx" --include="*.ts"` returning nothing outside these files themselves and the now-updated `app/_layout.tsx`):

```bash
git rm -r constants/theme.ts hooks/use-theme-color.ts hooks/use-color-scheme.ts hooks/use-color-scheme.web.ts components/
```

- [ ] **Step 8: Confirm the app still typechecks and boots**

Run: `npx tsc --noEmit`
Expected: no errors referencing the deleted files or the old `colors` export from `tokens.ts` (aside from the 27 files still pending migration in Tasks 8–14, which will show type errors here until those tasks land — if this is run standalone before those tasks, expect exactly those pre-existing errors and nothing new).

- [ ] **Step 9: Commit**

```bash
git add app/_layout.tsx "app/(protected)/_layout.tsx" src/providers/useAppReady.ts src/providers/__tests__/useAppReady.test.tsx
git commit -m "feat(mobile): gate first paint on theme/i18n hydration, remove dead Expo template scaffolding"
```

---

## Task 7: Shared test utilities

**Files:**
- Create: `src/shared/testing/renderWithProviders.tsx`
- Modify: `jest.setup.ts`, `package.json` (jest config)

**Interfaces:**
- Consumes: `ThemeProvider` (Task 4), `createTestQueryClient` (existing `src/shared/testing/queryClient.ts`).
- Produces: `renderWithProviders(ui, options?): RenderResult` — a drop-in replacement for RTL's `render` that also wraps `ThemeProvider` + a fresh `QueryClientProvider`.
- Consumed by: Task 9's and Task 10's updated test files.

**Design note (deviates from the spec's literal wording in one place — flag this during plan review if it's wrong):** the spec's §5 asks for "a shared test-utils wrapper (`ThemeProvider` + an initialized i18next test instance)". This task provides the `ThemeProvider` half as a wrapper, but for i18n it instead pins the **global** i18next singleton's language to `'en'` once in `jest.setup.ts` (Step 3 below) rather than wrapping every test in an explicit `I18nextProvider`. `react-i18next`'s `useTranslation()` reads the global `i18next` singleton automatically once `i18next.init()` has run (no `I18nextProvider` is required unless a test wants a *second, isolated* instance) — since `src/shared/i18n/index.ts` (Task 5) already calls `i18next.use(initReactI18next).init(...)` at module load, every test process already has one initialized instance. Pinning its language to `'en'` in `jest.setup.ts` means every existing test assertion that expects the original hardcoded English strings (e.g. `getByText('Log in')`, `getByLabelText('Phone number')`) **keeps passing completely unchanged** even after the screen starts calling `t()` — because `en` resources are 1:1 copies of the original literals (Task 5). Only the `ThemeProvider` wrapper is actually needed per test file; no test needs to know i18n exists.

- [ ] **Step 1: Implement the render wrapper**

Create `src/shared/testing/renderWithProviders.tsx`:

```tsx
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react-native'
import type { ReactElement } from 'react'
import { ThemeProvider } from '@/src/shared/theme/ThemeProvider'
import { createTestQueryClient } from './queryClient'

interface RenderWithProvidersOptions extends RenderOptions {
  queryClient?: QueryClient
}

export function renderWithProviders(ui: ReactElement, options: RenderWithProvidersOptions = {}) {
  const { queryClient = createTestQueryClient(), ...renderOptions } = options

  return render(
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </ThemeProvider>,
    renderOptions,
  )
}

export { createTestQueryClient }
```

- [ ] **Step 2: Mock AsyncStorage for the Jest environment**

`@react-native-async-storage/async-storage` ships a ready-made Jest mock; without it, Zustand's `persist` middleware and `src/shared/i18n`'s `loadPersistedLanguage`/`setLanguage` would hit the real native module and throw in the test environment.

Modify `jest.setup.ts` to add this line before the existing imports:

```ts
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
)
```

- [ ] **Step 3: Pin the test-process i18n language to `en`**

Replace the full contents of `jest.setup.ts` with:

```ts
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
)

import { server } from './src/shared/testing/msw/server'
import i18n from './src/shared/i18n'

beforeAll(async () => {
  server.listen({ onUnhandledRequest: 'error' })
  // Pinned so every existing assertion against the original hardcoded English copy
  // (getByText('Log in'), getByLabelText('Phone number'), etc.) keeps passing once
  // screens switch to t() — see this task's design note above.
  await i18n.changeLanguage('en')
})
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

- [ ] **Step 4: Run the full existing suite to prove zero unexpected breakage**

Run: `npm test`
Expected: PASS — every test that existed before this task still passes with no changes to its own file. (Tasks 9 and 10 are what actually update these test files' `render(...)` calls to `renderWithProviders(...)`; this step only proves the *infra* change alone doesn't break anything yet, since no screen calls `useTheme()` until those tasks land.)

- [ ] **Step 5: Commit**

```bash
git add src/shared/testing/renderWithProviders.tsx jest.setup.ts
git commit -m "test(mobile): add renderWithProviders and pin test i18n language to en"
```

---

## Task 8: Migrate shared components + update the 8 existing tests that transitively depend on them

**Why this task exists as its own step:** `Button`, `TextField`, `BackButton`, and `Logo` are used by nearly every screen. The moment any of them calls `useTheme()`, every existing test that renders a screen/component containing one of them breaks with "useTheme must be used within a ThemeProvider" — **even though that screen's own file hasn't been migrated yet**. Rather than let that breakage surface piecemeal across Tasks 9–10, this task fixes it at the source: migrate the 4 shared components, and in the same commit, swap every existing test that renders something containing one of them over to `renderWithProviders`. The screens/forms themselves (still importing the temporary `colors` alias from Task 2) are migrated in Tasks 9–12 — this task does not touch their production code.

**Files:**
- Modify: `src/shared/components/Button.tsx`, `src/shared/components/BackButton.tsx`, `src/shared/components/Logo.tsx`, `src/shared/components/TextField.tsx`
- Modify (test-wrapper swap only, no assertion changes): `src/features/auth/components/__tests__/LoginForm.test.tsx`, `src/features/auth/components/__tests__/RegisterForm.test.tsx`, `src/features/auth/screens/__tests__/LoginScreen.test.tsx`, `src/features/auth/screens/__tests__/RegisterScreen.test.tsx`, `src/features/credentials/components/__tests__/PasswordReveal.test.tsx`, `src/features/credentials/screens/__tests__/CredentialDetailScreen.test.tsx`, `src/features/credentials/screens/__tests__/CredentialFormScreen.test.tsx`, `src/features/credentials/screens/__tests__/CredentialListScreen.test.tsx`

**Interfaces:**
- Consumes: `useTheme` (Task 4), `renderWithProviders` (Task 7).
- Produces: nothing new — same component APIs as before (`Button`, `BackButton`, `Logo`, `TextField` props are unchanged).

- [ ] **Step 1: Migrate `Button`**

Replace the full contents of `src/shared/components/Button.tsx`:

```tsx
import { useMemo } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native'
import { useTheme } from '../theme/ThemeProvider'
import { fonts, radii, type Colors } from '../theme/tokens'

type ButtonVariant = 'primary' | 'outline' | 'outlineDanger'

interface ButtonProps {
  label: string
  onPress: () => void
  variant?: ButtonVariant
  isLoading?: boolean
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}

export function Button({ label, onPress, variant = 'primary', isLoading = false, disabled = false, style }: ButtonProps) {
  const { colors } = useTheme()
  const { styles, variantStyles, labelVariantStyles } = useMemo(() => createStyles(colors), [colors])
  const isDisabled = disabled || isLoading

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={isDisabled}
      style={[styles.base, variantStyles[variant], isDisabled && styles.disabled, style]}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.surface : colors.primaryDark} />
      ) : (
        <Text style={[styles.label, labelVariantStyles[variant]]}>{label}</Text>
      )}
    </Pressable>
  )
}

function createStyles(colors: Colors) {
  const styles = StyleSheet.create({
    base: {
      borderRadius: radii.sm,
      paddingVertical: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      fontFamily: fonts.sansSemiBold,
      fontSize: 14.5,
    },
    disabled: {
      opacity: 0.6,
    },
  })

  const variantStyles = StyleSheet.create({
    primary: {
      backgroundColor: colors.primary,
      shadowColor: colors.primaryDark,
      shadowOpacity: 0.35,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 2,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.primary,
    },
    outlineDanger: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.danger,
    },
  })

  const labelVariantStyles = StyleSheet.create({
    primary: {
      color: colors.surface,
    },
    outline: {
      color: colors.primaryDark,
    },
    outlineDanger: {
      color: colors.danger,
    },
  })

  return { styles, variantStyles, labelVariantStyles }
}
```

- [ ] **Step 2: Migrate `BackButton`**

Replace the full contents of `src/shared/components/BackButton.tsx`:

```tsx
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { Pressable, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../theme/ThemeProvider'
import type { Colors } from '../theme/tokens'

export function BackButton() {
  const router = useRouter()
  const { t } = useTranslation('common')
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('a11y.goBack')}
      onPress={() => router.back()}
      style={styles.button}
    >
      <Ionicons name="chevron-back" size={18} color={colors.ink} />
    </Pressable>
  )
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    button: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      alignItems: 'center',
      justifyContent: 'center',
    },
  })
}
```

- [ ] **Step 3: Migrate `Logo`**

Replace the full contents of `src/shared/components/Logo.tsx`:

```tsx
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg'
import { useTheme } from '../theme/ThemeProvider'

interface LogoProps {
  width?: number
  height?: number
  showWordmark?: boolean
}

// Ported 1:1 from the web client's shared/components/Logo.tsx so both clients show the same mark.
// The wordmark text is a brand asset (like a logo image), not UI copy — it stays in English in
// both languages, matching the web client's logo.
export function Logo({ width = 176, height = 32, showWordmark = true }: LogoProps) {
  const { colors } = useTheme()

  if (!showWordmark) {
    return (
      <Svg width={height} height={height} viewBox="0 0 48 48" fill="none">
        <Circle cx={24} cy={24} r={19} stroke={colors.ink} strokeWidth={1.6} />
        <Circle cx={24} cy={24} r={13.5} stroke="#b08442" strokeWidth={1.1} strokeDasharray="1.4 3.2" strokeLinecap="round" />
        <Path d="M16.5 20.5 L24 28.5 L31.5 20.5" stroke={colors.ink} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M24 28.5 V34" stroke="#b08442" strokeWidth={2.4} strokeLinecap="round" />
      </Svg>
    )
  }

  return (
    <Svg width={width} height={height} viewBox="0 0 260 48" fill="none">
      <Circle cx={24} cy={24} r={19} stroke={colors.ink} strokeWidth={1.6} />
      <Circle cx={24} cy={24} r={13.5} stroke="#b08442" strokeWidth={1.1} strokeDasharray="1.4 3.2" strokeLinecap="round" />
      <Path d="M16.5 20.5 L24 28.5 L31.5 20.5" stroke={colors.ink} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M24 28.5 V34" stroke="#b08442" strokeWidth={2.4} strokeLinecap="round" />
      <SvgText x={56} y={26} fontFamily="Newsreader_400Regular" fontSize={23} fill={colors.ink} letterSpacing={-0.2}>
        Personal Vault
      </SvgText>
      <SvgText x={56.5} y={39} fontFamily="IBMPlexSans_500Medium" fontSize={8.5} letterSpacing={2.2} fill={colors.muted}>
        SEALED BEFORE IT LEAVES
      </SvgText>
    </Svg>
  )
}
```

- [ ] **Step 4: Migrate `TextField`**

Replace the full contents of `src/shared/components/TextField.tsx`:

```tsx
import { Text, TextInput, View, type TextInputProps } from 'react-native'
import { useTheme } from '../theme/ThemeProvider'
import { fonts } from '../theme/tokens'

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string
  error?: string
}

export function TextField({ label, error, ...inputProps }: TextFieldProps) {
  const { colors } = useTheme()

  return (
    <View style={{ gap: 5, alignSelf: 'stretch' }}>
      <Text style={{ fontFamily: fonts.mono, fontSize: 10.5, letterSpacing: 0.6, textTransform: 'uppercase', color: colors.mist }}>
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: error ? colors.danger : colors.line,
          borderRadius: 9,
          paddingHorizontal: 13,
          paddingVertical: 11,
          fontSize: 14,
          fontFamily: fonts.sans,
          color: colors.ink,
        }}
        {...inputProps}
      />
      {error ? <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.danger }}>{error}</Text> : null}
    </View>
  )
}
```

- [ ] **Step 5: Update the 3 pure-component tests to use `renderWithProviders`**

Replace the full contents of `src/features/auth/components/__tests__/LoginForm.test.tsx`:

```tsx
import { fireEvent, screen, waitFor } from '@testing-library/react-native'
import { renderWithProviders } from '@/src/shared/testing/renderWithProviders'
import { LoginForm } from '../LoginForm'

describe('LoginForm', () => {
  it('renders the phone and password fields', async () => {
    await renderWithProviders(<LoginForm onSubmit={jest.fn()} isSubmitting={false} errorMessage={null} />)

    expect(screen.getByLabelText('Phone number')).toBeTruthy()
    expect(screen.getByLabelText('Password')).toBeTruthy()
  })

  it('shows validation errors and does not submit when fields are invalid', async () => {
    const onSubmit = jest.fn()
    await renderWithProviders(<LoginForm onSubmit={onSubmit} isSubmitting={false} errorMessage={null} />)

    await fireEvent.changeText(screen.getByLabelText('Password'), 'short')
    await fireEvent.press(screen.getByRole('button', { name: 'Log in' }))

    expect(await screen.findByText('Phone number is required')).toBeTruthy()
    expect(await screen.findByText('Password must be at least 8 characters')).toBeTruthy()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('calls onSubmit with the entered values when valid', async () => {
    const onSubmit = jest.fn()
    await renderWithProviders(<LoginForm onSubmit={onSubmit} isSubmitting={false} errorMessage={null} />)

    await fireEvent.changeText(screen.getByLabelText('Phone number'), '0900000000')
    await fireEvent.changeText(screen.getByLabelText('Password'), 'a-strong-password')
    await fireEvent.press(screen.getByRole('button', { name: 'Log in' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onSubmit.mock.calls[0][0]).toEqual({ phone: '0900000000', password: 'a-strong-password' })
  })

  it('shows the server error message when provided', async () => {
    await renderWithProviders(<LoginForm onSubmit={jest.fn()} isSubmitting={false} errorMessage="Invalid phone or password" />)

    expect(screen.getByText('Invalid phone or password')).toBeTruthy()
  })

  it('disables the submit button while submitting', async () => {
    await renderWithProviders(<LoginForm onSubmit={jest.fn()} isSubmitting errorMessage={null} />)

    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

Replace the full contents of `src/features/auth/components/__tests__/RegisterForm.test.tsx`:

```tsx
import { fireEvent, screen, waitFor } from '@testing-library/react-native'
import { renderWithProviders } from '@/src/shared/testing/renderWithProviders'
import { RegisterForm } from '../RegisterForm'

describe('RegisterForm', () => {
  it('renders all fields', async () => {
    await renderWithProviders(<RegisterForm onSubmit={jest.fn()} isSubmitting={false} errorMessage={null} />)

    expect(screen.getByLabelText('Full name')).toBeTruthy()
    expect(screen.getByLabelText('Phone number')).toBeTruthy()
    expect(screen.getByLabelText('Password')).toBeTruthy()
  })

  it('shows validation errors for invalid input', async () => {
    const onSubmit = jest.fn()
    await renderWithProviders(<RegisterForm onSubmit={onSubmit} isSubmitting={false} errorMessage={null} />)

    await fireEvent.changeText(screen.getByLabelText('Password'), 'short')
    await fireEvent.press(screen.getByRole('button', { name: 'Register' }))

    expect(await screen.findByText('Full name is required')).toBeTruthy()
    expect(await screen.findByText('Phone number is required')).toBeTruthy()
    expect(await screen.findByText('Password must be at least 8 characters')).toBeTruthy()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('calls onSubmit with the entered values when valid', async () => {
    const onSubmit = jest.fn()
    await renderWithProviders(<RegisterForm onSubmit={onSubmit} isSubmitting={false} errorMessage={null} />)

    await fireEvent.changeText(screen.getByLabelText('Full name'), 'Nguyen Van A')
    await fireEvent.changeText(screen.getByLabelText('Phone number'), '0900000000')
    await fireEvent.changeText(screen.getByLabelText('Password'), 'a-strong-password')
    await fireEvent.press(screen.getByRole('button', { name: 'Register' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onSubmit.mock.calls[0][0]).toEqual({
      fullName: 'Nguyen Van A',
      phone: '0900000000',
      password: 'a-strong-password',
    })
  })

  it('shows the server error message when provided', async () => {
    await renderWithProviders(<RegisterForm onSubmit={jest.fn()} isSubmitting={false} errorMessage="Phone number already registered" />)

    expect(screen.getByText('Phone number already registered')).toBeTruthy()
  })

  it('disables the submit button while submitting', async () => {
    await renderWithProviders(<RegisterForm onSubmit={jest.fn()} isSubmitting errorMessage={null} />)

    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

Replace the full contents of `src/features/credentials/components/__tests__/PasswordReveal.test.tsx`:

```tsx
import { fireEvent, screen, waitFor } from '@testing-library/react-native'
import { renderWithProviders } from '@/src/shared/testing/renderWithProviders'
import { PasswordReveal } from '../PasswordReveal'

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/src/shared/lib/crypto/keyStore', () => ({
  getEncryptionKey: jest.fn(),
}))

jest.mock('@/src/shared/lib/crypto/cryptoAdapter', () => ({
  decryptCredential: jest.fn(),
}))

import * as Clipboard from 'expo-clipboard'
import { decryptCredential } from '@/src/shared/lib/crypto/cryptoAdapter'
import { getEncryptionKey } from '@/src/shared/lib/crypto/keyStore'

const ENCRYPTED = 'AAAAAAAAAAAAAAAA:ZmFrZS1jaXBoZXJ0ZXh0'

beforeEach(() => {
  jest.clearAllMocks()
})

describe('PasswordReveal', () => {
  it('hides the password by default', async () => {
    ;(getEncryptionKey as jest.Mock).mockReturnValue(new Uint8Array(32))
    await renderWithProviders(<PasswordReveal encryptedPassword={ENCRYPTED} onUnlockNeeded={jest.fn()} onCopied={jest.fn()} />)

    expect(screen.getByText('••••••••••••')).toBeTruthy()
    expect(decryptCredential).not.toHaveBeenCalled()
  })

  it('decrypts and shows the plaintext when "Show" is pressed', async () => {
    ;(getEncryptionKey as jest.Mock).mockReturnValue(new Uint8Array(32))
    ;(decryptCredential as jest.Mock).mockResolvedValue('my-secret-password')
    await renderWithProviders(<PasswordReveal encryptedPassword={ENCRYPTED} onUnlockNeeded={jest.fn()} onCopied={jest.fn()} />)

    await fireEvent.press(screen.getByRole('button', { name: 'Show' }))

    expect(await screen.findByText('my-secret-password')).toBeTruthy()
  })

  it('prompts to unlock the vault when the encryption key is missing', async () => {
    ;(getEncryptionKey as jest.Mock).mockReturnValue(null)
    const onUnlockNeeded = jest.fn()
    await renderWithProviders(<PasswordReveal encryptedPassword={ENCRYPTED} onUnlockNeeded={onUnlockNeeded} onCopied={jest.fn()} />)

    await fireEvent.press(screen.getByRole('button', { name: 'Show' }))

    expect(await screen.findByText('Vault is locked')).toBeTruthy()
    expect(decryptCredential).not.toHaveBeenCalled()
  })

  it('shows a decrypt error message when decryption throws (e.g. wrong key)', async () => {
    ;(getEncryptionKey as jest.Mock).mockReturnValue(new Uint8Array(32))
    ;(decryptCredential as jest.Mock).mockRejectedValue(new Error('bad auth tag'))
    await renderWithProviders(<PasswordReveal encryptedPassword={ENCRYPTED} onUnlockNeeded={jest.fn()} onCopied={jest.fn()} />)

    await fireEvent.press(screen.getByRole('button', { name: 'Show' }))

    expect(await screen.findByText('Could not decrypt this password')).toBeTruthy()
  })

  it('copies the revealed password to the clipboard and notifies the caller', async () => {
    ;(getEncryptionKey as jest.Mock).mockReturnValue(new Uint8Array(32))
    ;(decryptCredential as jest.Mock).mockResolvedValue('my-secret-password')
    const onCopied = jest.fn()
    await renderWithProviders(<PasswordReveal encryptedPassword={ENCRYPTED} onUnlockNeeded={jest.fn()} onCopied={onCopied} />)

    await fireEvent.press(screen.getByRole('button', { name: 'Show' }))
    await screen.findByText('my-secret-password')
    await fireEvent.press(screen.getByRole('button', { name: 'Copy' }))

    await waitFor(() => expect(onCopied).toHaveBeenCalled())
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('my-secret-password')
  })
})
```

- [ ] **Step 6: Update the 5 screen tests to use `renderWithProviders`**

Replace the full contents of `src/features/auth/screens/__tests__/LoginScreen.test.tsx`:

```tsx
import { fireEvent, screen, waitFor } from '@testing-library/react-native'
import { renderWithProviders } from '@/src/shared/testing/renderWithProviders'
import { setAccessToken } from '@/src/shared/lib/auth/tokenStore'
import { useAuthStore } from '../../stores/auth.store'
import { LoginScreen } from '../LoginScreen'
import { loginSuccessHandler, VALID_PASSWORD, VALID_PHONE } from '../../hooks/__tests__/mocks/authHandlers'
import { server } from '@/src/shared/testing/msw/server'

const mockReplace = jest.fn()
const mockPush = jest.fn()
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace, push: mockPush }) }))

jest.mock('@/src/shared/lib/storage/secureStorage', () => ({
  setRefreshToken: jest.fn().mockResolvedValue(undefined),
  getRefreshToken: jest.fn().mockResolvedValue(null),
  clearRefreshToken: jest.fn().mockResolvedValue(undefined),
}))

function renderScreen() {
  return renderWithProviders(<LoginScreen />)
}

beforeEach(() => {
  setAccessToken(null)
  useAuthStore.setState({ user: null, isAuthenticated: false, isSessionLoading: false, isAppLocked: false })
  jest.clearAllMocks()
})

describe('LoginScreen', () => {
  it('logs in and sets the session on success, without navigating imperatively', async () => {
    // Navigation to /(protected) is left entirely to app/(public)/_layout.tsx reacting to
    // isAuthenticated — an imperative router.replace() here previously raced that redirect.
    server.use(loginSuccessHandler)
    await renderScreen()

    await fireEvent.changeText(screen.getByLabelText('Phone number'), VALID_PHONE)
    await fireEvent.changeText(screen.getByLabelText('Password'), VALID_PASSWORD)
    await fireEvent.press(screen.getByRole('button', { name: 'Log in' }))

    await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(true), { timeout: 5000 })
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('shows an error message and does not change the session on invalid credentials', async () => {
    server.use(loginSuccessHandler)
    await renderScreen()

    await fireEvent.changeText(screen.getByLabelText('Phone number'), VALID_PHONE)
    await fireEvent.changeText(screen.getByLabelText('Password'), 'wrong-password')
    await fireEvent.press(screen.getByRole('button', { name: 'Log in' }))

    expect(await screen.findByText('Invalid phone or password')).toBeTruthy()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(mockReplace).not.toHaveBeenCalled()
  })
})
```

Replace the full contents of `src/features/auth/screens/__tests__/RegisterScreen.test.tsx`:

```tsx
import { fireEvent, screen, waitFor } from '@testing-library/react-native'
import { renderWithProviders } from '@/src/shared/testing/renderWithProviders'
import { server } from '@/src/shared/testing/msw/server'
import { RegisterScreen } from '../RegisterScreen'
import { registerDuplicatePhoneHandler, registerSuccessHandler } from '../../hooks/__tests__/mocks/authHandlers'

const mockReplace = jest.fn()
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }))

function renderScreen() {
  return renderWithProviders(<RegisterScreen />)
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('RegisterScreen', () => {
  it('registers and navigates to the login screen on success', async () => {
    server.use(registerSuccessHandler)
    await renderScreen()

    await fireEvent.changeText(screen.getByLabelText('Full name'), 'Nguyen Van A')
    await fireEvent.changeText(screen.getByLabelText('Phone number'), '0900000000')
    await fireEvent.changeText(screen.getByLabelText('Password'), 'a-strong-password')
    await fireEvent.press(screen.getByRole('button', { name: 'Register' }))

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(public)/login'))
  })

  it('shows an error message and does not navigate when the phone is already registered', async () => {
    server.use(registerDuplicatePhoneHandler)
    await renderScreen()

    await fireEvent.changeText(screen.getByLabelText('Full name'), 'Nguyen Van A')
    await fireEvent.changeText(screen.getByLabelText('Phone number'), '0900000000')
    await fireEvent.changeText(screen.getByLabelText('Password'), 'a-strong-password')
    await fireEvent.press(screen.getByRole('button', { name: 'Register' }))

    expect(await screen.findByText('Phone number already registered')).toBeTruthy()
    expect(mockReplace).not.toHaveBeenCalled()
  })
})
```

Replace the full contents of `src/features/credentials/screens/__tests__/CredentialDetailScreen.test.tsx`:

```tsx
import { fireEvent, screen, waitFor } from '@testing-library/react-native'
import { rest } from 'msw'
import { Alert } from 'react-native'
import { API_BASE_URL } from '@/src/config/constants'
import { renderWithProviders } from '@/src/shared/testing/renderWithProviders'
import { server } from '@/src/shared/testing/msw/server'
import { setEncryptionKey } from '@/src/shared/lib/crypto/keyStore'
import { deriveEncryptionKey, encryptCredential } from '@/src/shared/lib/crypto/cryptoAdapter'
import { CredentialDetailScreen } from '../CredentialDetailScreen'
import {
  credentialFixture,
  deleteCredentialSuccessHandler,
  getCredentialSuccessHandler,
} from '../../hooks/__tests__/mocks/credentialHandlers'

const mockBack = jest.fn()
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack, push: jest.fn() }) }))

function renderScreen(credentialId: string) {
  return renderWithProviders(<CredentialDetailScreen credentialId={credentialId} />)
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('CredentialDetailScreen', () => {
  it('shows an invalid-credential message for an empty route param instead of calling the API', async () => {
    await renderScreen('')

    expect(screen.getByText('Invalid credential.')).toBeTruthy()
  })

  it('shows the unlock prompt when the key is missing, then reveals the password once unlocked', async () => {
    setEncryptionKey(null)
    server.use(getCredentialSuccessHandler)
    await renderScreen('cred-1')

    expect(await screen.findByText('Vault locked')).toBeTruthy()
  })

  it('reveals the correct plaintext password when unlocked with the matching key', async () => {
    const key = await deriveEncryptionKey('hunter2', 'user-1')
    const encryptedPassword = await encryptCredential('the-real-password', key)
    setEncryptionKey(key)
    server.use(
      rest.get(`${API_BASE_URL}/credentials/:id`, (_req, res, ctx) =>
        res(ctx.status(200), ctx.json({ success: true, data: { ...credentialFixture, encryptedPassword }, meta: null })),
      ),
    )
    await renderScreen('cred-1')

    await screen.findByText(credentialFixture.platformName)
    await fireEvent.press(screen.getByRole('button', { name: 'Show' }))

    expect(await screen.findByText('the-real-password')).toBeTruthy()
  })

  it('deletes the credential after confirming and navigates back', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      const deleteButton = buttons?.find((button) => button.text === 'Delete')
      deleteButton?.onPress?.()
    })
    setEncryptionKey(new Uint8Array(32))
    server.use(getCredentialSuccessHandler, deleteCredentialSuccessHandler)
    await renderScreen('cred-1')

    await screen.findByText(credentialFixture.platformName)
    await fireEvent.press(screen.getByRole('button', { name: 'Delete' }))

    expect(alertSpy).toHaveBeenCalled()
    await waitFor(() => expect(mockBack).toHaveBeenCalled())

    alertSpy.mockRestore()
  })
})
```

Replace the full contents of `src/features/credentials/screens/__tests__/CredentialFormScreen.test.tsx`:

```tsx
import { fireEvent, screen, waitFor } from '@testing-library/react-native'
import { rest } from 'msw'
import { API_BASE_URL } from '@/src/config/constants'
import { renderWithProviders } from '@/src/shared/testing/renderWithProviders'
import { server } from '@/src/shared/testing/msw/server'
import { setEncryptionKey } from '@/src/shared/lib/crypto/keyStore'
import { CredentialFormScreen } from '../CredentialFormScreen'
import {
  credentialFixture,
  getCredentialSuccessHandler,
  updateCredentialSuccessHandler,
} from '../../hooks/__tests__/mocks/credentialHandlers'

const mockBack = jest.fn()
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack }) }))

function renderScreen(credentialId?: string) {
  return renderWithProviders(<CredentialFormScreen credentialId={credentialId} />)
}

beforeEach(() => {
  jest.clearAllMocks()
  setEncryptionKey(new Uint8Array(32).fill(7))
})

describe('CredentialFormScreen', () => {
  it('encrypts the password before sending it to the server on create', async () => {
    let capturedBody: { encryptedPassword?: string; platformName?: string } | undefined
    server.use(
      rest.post(`${API_BASE_URL}/credentials`, async (req, res, ctx) => {
        capturedBody = await req.json()
        return res(ctx.status(201), ctx.json({ success: true, data: { ...credentialFixture, ...capturedBody }, meta: null }))
      }),
    )

    await renderScreen()

    await fireEvent.changeText(screen.getByLabelText('Platform'), 'Gmail')
    await fireEvent.changeText(screen.getByLabelText('Account'), 'user@gmail.com')
    await fireEvent.changeText(screen.getByLabelText('Password'), 'plaintext-password-123')
    await fireEvent.press(screen.getByRole('button', { name: 'Add credential' }))

    await waitFor(() => expect(mockBack).toHaveBeenCalled())

    expect(capturedBody?.encryptedPassword).toBeDefined()
    expect(capturedBody?.encryptedPassword).not.toContain('plaintext-password-123')
    expect(capturedBody?.encryptedPassword).toMatch(/^[A-Za-z0-9+/]+=*:[A-Za-z0-9+/]+=*$/)
  })

  it('loads the existing credential and submits an update when editing', async () => {
    server.use(getCredentialSuccessHandler, updateCredentialSuccessHandler)
    await renderScreen('cred-1')

    expect(await screen.findByDisplayValue('Gmail')).toBeTruthy()
    expect(screen.getByText('Save changes')).toBeTruthy()

    await fireEvent.changeText(screen.getByLabelText('Password'), 'new-password')
    await fireEvent.press(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(mockBack).toHaveBeenCalled())
  })
})
```

Replace the full contents of `src/features/credentials/screens/__tests__/CredentialListScreen.test.tsx`:

```tsx
import { screen, waitFor } from '@testing-library/react-native'
import { renderWithProviders } from '@/src/shared/testing/renderWithProviders'
import { server } from '@/src/shared/testing/msw/server'
import { setEncryptionKey } from '@/src/shared/lib/crypto/keyStore'
import { CredentialListScreen } from '../CredentialListScreen'
import {
  listCredentialsEmptyHandler,
  listCredentialsNetworkErrorHandler,
  listCredentialsSuccessHandler,
} from '../../hooks/__tests__/mocks/credentialHandlers'

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }))

function renderScreen() {
  return renderWithProviders(<CredentialListScreen />)
}

describe('CredentialListScreen', () => {
  it('shows the unlock-vault prompt instead of data when the key is missing', async () => {
    setEncryptionKey(null)
    server.use(listCredentialsSuccessHandler)
    await renderScreen()

    expect(screen.getByText('Vault locked')).toBeTruthy()
    expect(screen.queryByText('Gmail')).toBeNull()
  })

  it('fetches and displays credentials once unlocked', async () => {
    setEncryptionKey(new Uint8Array(32))
    server.use(listCredentialsSuccessHandler)
    await renderScreen()

    expect(await screen.findByText('Gmail')).toBeTruthy()
    expect(screen.getByText('user@gmail.com')).toBeTruthy()
  })

  it('shows an empty state when there are no credentials', async () => {
    setEncryptionKey(new Uint8Array(32))
    server.use(listCredentialsEmptyHandler)
    await renderScreen()

    expect(await screen.findByText('No credentials saved yet.')).toBeTruthy()
  })

  it('shows an offline-friendly message on a network error', async () => {
    setEncryptionKey(new Uint8Array(32))
    server.use(listCredentialsNetworkErrorHandler)
    await renderScreen()

    await waitFor(() => expect(screen.getByText(/offline/i)).toBeTruthy())
  })
})
```

- [ ] **Step 7: Run the full suite**

Run: `npm test`
Expected: PASS — all 8 updated test files pass unchanged in their assertions (only their render plumbing changed); every other test file is untouched and still green.

- [ ] **Step 8: Commit**

```bash
git add src/shared/components/Button.tsx src/shared/components/BackButton.tsx src/shared/components/Logo.tsx src/shared/components/TextField.tsx \
  src/features/auth/components/__tests__/LoginForm.test.tsx src/features/auth/components/__tests__/RegisterForm.test.tsx \
  src/features/auth/screens/__tests__/LoginScreen.test.tsx src/features/auth/screens/__tests__/RegisterScreen.test.tsx \
  src/features/credentials/components/__tests__/PasswordReveal.test.tsx \
  src/features/credentials/screens/__tests__/CredentialDetailScreen.test.tsx \
  src/features/credentials/screens/__tests__/CredentialFormScreen.test.tsx \
  src/features/credentials/screens/__tests__/CredentialListScreen.test.tsx
git commit -m "refactor(mobile): migrate shared Button/BackButton/Logo/TextField to useTheme"
```

---

## Task 9: Migrate the Auth feature

**Files:**
- Modify: `src/features/auth/screens/LoginScreen.tsx`, `src/features/auth/components/LoginForm.tsx`, `src/features/auth/screens/RegisterScreen.tsx`, `src/features/auth/components/RegisterForm.tsx`

**Interfaces:**
- Consumes: `useTheme` (Task 4), `auth` namespace resources (Task 5) via `useTranslation('auth')`.
- No test files change in this task — Task 8 already moved `LoginForm.test.tsx`/`RegisterForm.test.tsx`/`LoginScreen.test.tsx`/`RegisterScreen.test.tsx` onto `renderWithProviders`, and `jest.setup.ts` pins the test process to `en`, whose strings are identical to the literals these tests already assert on.

Zod validation schemas move their translated messages into the component (built via `useMemo` keyed on `t`, so switching language re-validates in the new language); a module-level "shape-only" schema (no message strings — irrelevant to the inferred TS type) still backs the exported `*FormValues` type.

- [ ] **Step 1: Migrate `LoginForm`**

Replace the full contents of `src/features/auth/components/LoginForm.tsx`:

```tsx
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { z } from 'zod'
import { Button } from '@/src/shared/components/Button'
import { TextField } from '@/src/shared/components/TextField'
import { useTheme } from '@/src/shared/theme/ThemeProvider'
import { fonts, type Colors } from '@/src/shared/theme/tokens'

const loginShape = z.object({
  phone: z.string().min(1),
  password: z.string().min(8),
})

export type LoginFormValues = z.infer<typeof loginShape>

interface LoginFormProps {
  onSubmit: (values: LoginFormValues) => void
  isSubmitting: boolean
  errorMessage: string | null
  statusLabel?: string | null
}

export function LoginForm({ onSubmit, isSubmitting, errorMessage, statusLabel }: LoginFormProps) {
  const { t } = useTranslation('auth')
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const resolver = useMemo(
    () =>
      zodResolver(
        z.object({
          phone: z.string().min(1, t('validation.phoneRequired')),
          password: z.string().min(8, t('validation.passwordMinLength')),
        }),
      ),
    [t],
  )
  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver,
    defaultValues: { phone: '', password: '' },
  })

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="phone"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label={t('login.phoneLabel')}
            placeholder={t('login.phonePlaceholder')}
            keyboardType="phone-pad"
            autoCapitalize="none"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.phone?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label={t('login.passwordLabel')}
            placeholder={t('login.passwordPlaceholder')}
            secureTextEntry
            autoCapitalize="none"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.password?.message}
          />
        )}
      />

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <Button label={t('login.submit')} onPress={handleSubmit(onSubmit)} isLoading={isSubmitting} style={styles.button} />
      {isSubmitting && statusLabel ? <Text style={styles.statusText}>{statusLabel}</Text> : null}
    </View>
  )
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    container: {
      gap: 14,
    },
    errorText: {
      fontFamily: fonts.sans,
      color: colors.danger,
      fontSize: 13,
    },
    button: {
      marginTop: 4,
    },
    statusText: {
      fontFamily: fonts.sans,
      color: colors.muted,
      fontSize: 12.5,
      textAlign: 'center',
    },
  })
}
```

- [ ] **Step 2: Migrate `LoginScreen`**

Replace the full contents of `src/features/auth/screens/LoginScreen.tsx`:

```tsx
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Logo } from '@/src/shared/components/Logo'
import { useTheme } from '@/src/shared/theme/ThemeProvider'
import { fonts, spacing, type Colors } from '@/src/shared/theme/tokens'
import { LoginForm, type LoginFormValues } from '../components/LoginForm'
import { useLogin } from '../hooks/useLogin'
import { extractAuthErrorMessage } from '../utils/extractAuthErrorMessage'

const STAGE_KEYS: Record<string, string> = {
  signingIn: 'login.signingIn',
  derivingKey: 'login.derivingKey',
}

export function LoginScreen() {
  const router = useRouter()
  const { t } = useTranslation('auth')
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const { mutate, isPending, error, stage } = useLogin()

  function handleSubmit(values: LoginFormValues) {
    // No explicit navigation on success: setting the session (inside useLogin's mutationFn)
    // flips useAuthStore.isAuthenticated, and app/(public)/_layout.tsx reactively redirects to
    // /(protected) as soon as that happens. Navigating here too raced that redirect and could
    // leave the router stuck mid-transition after this screen had already been unmounted.
    mutate(values)
  }

  const stageKey = STAGE_KEYS[stage]

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mark}>
        <Logo showWordmark={false} height={48} />
      </View>
      <View style={styles.heading}>
        <Text style={styles.title}>{t('login.title')}</Text>
        <Text style={styles.subtitle}>{t('login.subtitle')}</Text>
      </View>
      <LoginForm
        onSubmit={handleSubmit}
        isSubmitting={isPending}
        errorMessage={error ? extractAuthErrorMessage(error) : null}
        statusLabel={stageKey ? t(stageKey) : undefined}
      />
      <View style={styles.footer}>
        <Text style={styles.footerText}>{t('login.noAccount')}</Text>
        <Text
          accessibilityRole="link"
          style={styles.footerLink}
          onPress={() => router.push('/(public)/register')}
        >
          {t('login.registerLink')}
        </Text>
      </View>
    </SafeAreaView>
  )
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
      padding: spacing.xxl,
      justifyContent: 'center',
      gap: spacing.xl,
    },
    mark: {
      alignSelf: 'center',
    },
    heading: {
      alignItems: 'center',
      gap: 4,
    },
    title: {
      fontFamily: fonts.serifLight,
      fontSize: 28,
      color: colors.ink,
    },
    subtitle: {
      fontFamily: fonts.sans,
      fontSize: 13,
      color: colors.muted,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
    },
    footerText: {
      fontFamily: fonts.sans,
      fontSize: 13,
      color: colors.muted,
    },
    footerLink: {
      fontFamily: fonts.sansSemiBold,
      fontSize: 13,
      color: colors.primaryDark,
    },
  })
}
```

- [ ] **Step 3: Migrate `RegisterForm`**

Replace the full contents of `src/features/auth/components/RegisterForm.tsx`:

```tsx
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { z } from 'zod'
import { Button } from '@/src/shared/components/Button'
import { TextField } from '@/src/shared/components/TextField'
import { useTheme } from '@/src/shared/theme/ThemeProvider'
import { fonts, type Colors } from '@/src/shared/theme/tokens'

const registerShape = z.object({
  fullName: z.string().min(1),
  phone: z.string().min(1),
  password: z.string().min(8),
})

export type RegisterFormValues = z.infer<typeof registerShape>

interface RegisterFormProps {
  onSubmit: (values: RegisterFormValues) => void
  isSubmitting: boolean
  errorMessage: string | null
}

export function RegisterForm({ onSubmit, isSubmitting, errorMessage }: RegisterFormProps) {
  const { t } = useTranslation('auth')
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const resolver = useMemo(
    () =>
      zodResolver(
        z.object({
          fullName: z.string().min(1, t('validation.fullNameRequired')),
          phone: z.string().min(1, t('validation.phoneRequired')),
          password: z.string().min(8, t('validation.passwordMinLength')),
        }),
      ),
    [t],
  )
  const { control, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver,
    defaultValues: { fullName: '', phone: '', password: '' },
  })

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="fullName"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label={t('register.fullNameLabel')}
            placeholder={t('register.fullNamePlaceholder')}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.fullName?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="phone"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label={t('register.phoneLabel')}
            placeholder={t('register.phonePlaceholder')}
            keyboardType="phone-pad"
            autoCapitalize="none"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.phone?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label={t('register.passwordLabel')}
            placeholder={t('register.passwordPlaceholder')}
            secureTextEntry
            autoCapitalize="none"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.password?.message}
          />
        )}
      />

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <Button label={t('register.submit')} onPress={handleSubmit(onSubmit)} isLoading={isSubmitting} style={styles.button} />
    </View>
  )
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    container: {
      gap: 14,
    },
    errorText: {
      fontFamily: fonts.sans,
      color: colors.danger,
      fontSize: 13,
    },
    button: {
      marginTop: 4,
    },
  })
}
```

- [ ] **Step 4: Migrate `RegisterScreen`**

Replace the full contents of `src/features/auth/screens/RegisterScreen.tsx`:

```tsx
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Logo } from '@/src/shared/components/Logo'
import { useTheme } from '@/src/shared/theme/ThemeProvider'
import { fonts, spacing, type Colors } from '@/src/shared/theme/tokens'
import { RegisterForm, type RegisterFormValues } from '../components/RegisterForm'
import { useRegister } from '../hooks/useRegister'
import { extractAuthErrorMessage } from '../utils/extractAuthErrorMessage'

export function RegisterScreen() {
  const router = useRouter()
  const { t } = useTranslation('auth')
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const { mutate, isPending, error } = useRegister()

  function handleSubmit(values: RegisterFormValues) {
    mutate(values, {
      onSuccess: () => router.replace('/(public)/login'),
    })
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mark}>
        <Logo showWordmark={false} height={48} />
      </View>
      <View style={styles.heading}>
        <Text style={styles.title}>{t('register.title')}</Text>
        <Text style={styles.subtitle}>{t('register.subtitle')}</Text>
      </View>
      <RegisterForm
        onSubmit={handleSubmit}
        isSubmitting={isPending}
        errorMessage={error ? extractAuthErrorMessage(error) : null}
      />
    </SafeAreaView>
  )
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
      padding: spacing.xxl,
      justifyContent: 'center',
      gap: spacing.xl,
    },
    mark: {
      alignSelf: 'center',
    },
    heading: {
      alignItems: 'center',
      gap: 4,
    },
    title: {
      fontFamily: fonts.serifLight,
      fontSize: 26,
      color: colors.ink,
    },
    subtitle: {
      fontFamily: fonts.sans,
      fontSize: 13,
      color: colors.muted,
    },
  })
}
```

- [ ] **Step 5: Run the affected tests**

Run: `npx jest src/features/auth`
Expected: PASS — no assertion changed; `en` resources match the original literals exactly.

- [ ] **Step 6: Commit**

```bash
git add src/features/auth/screens/LoginScreen.tsx src/features/auth/components/LoginForm.tsx \
  src/features/auth/screens/RegisterScreen.tsx src/features/auth/components/RegisterForm.tsx
git commit -m "refactor(mobile): migrate auth feature to useTheme + i18n"
```

---

## Task 10: Migrate the Credentials feature

**Files:**
- Modify: `src/features/credentials/screens/CredentialFormScreen.tsx`, `src/features/credentials/screens/CredentialDetailScreen.tsx`, `src/features/credentials/screens/CredentialListScreen.tsx`, `src/features/credentials/components/CredentialForm.tsx`, `src/features/credentials/components/CredentialCard.tsx`, `src/features/credentials/components/CopyableField.tsx`, `src/features/credentials/components/PasswordReveal.tsx`, `src/features/credentials/components/UnlockVaultPrompt.tsx`
- Modify (test-wrapper swap only): `src/features/credentials/components/__tests__/CredentialCard.test.tsx`

**Interfaces:**
- Consumes: `useTheme` (Task 4), `credentials`/`common` namespace resources (Task 5).
- `CredentialCard.test.tsx` was **not** touched in Task 8 (at that point `CredentialCard.tsx` didn't call `useTheme()` yet) — this task migrates `CredentialCard.tsx` itself, so its test needs the same `renderWithProviders` swap now. `CredentialDetailScreen.test.tsx`, `CredentialFormScreen.test.tsx`, and `CredentialListScreen.test.tsx` were already swapped in Task 8 (they transitively render `BackButton`/`Button`) — no further test changes needed for them here.

- [ ] **Step 1: Migrate `CredentialForm`**

Replace the full contents of `src/features/credentials/components/CredentialForm.tsx`:

```tsx
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { z } from 'zod'
import { Button } from '@/src/shared/components/Button'
import { TextField } from '@/src/shared/components/TextField'
import { useTheme } from '@/src/shared/theme/ThemeProvider'
import { fonts, type Colors } from '@/src/shared/theme/tokens'

const credentialShape = z.object({
  platformName: z.string().min(1),
  account: z.string().min(1),
  password: z.string().min(1),
  note: z.string().optional(),
})

export type CredentialFormValues = z.infer<typeof credentialShape>

interface CredentialFormProps {
  defaultValues?: Partial<CredentialFormValues>
  onSubmit: (values: CredentialFormValues) => void
  isSubmitting: boolean
  errorMessage: string | null
  submitLabel: string
}

export function CredentialForm({ defaultValues, onSubmit, isSubmitting, errorMessage, submitLabel }: CredentialFormProps) {
  const { t } = useTranslation('credentials')
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const resolver = useMemo(
    () =>
      zodResolver(
        z.object({
          platformName: z.string().min(1, t('validation.platformRequired')),
          account: z.string().min(1, t('validation.accountRequired')),
          password: z.string().min(1, t('validation.passwordRequired')),
          note: z.string().optional(),
        }),
      ),
    [t],
  )
  const { control, handleSubmit, formState: { errors } } = useForm<CredentialFormValues>({
    resolver,
    defaultValues: {
      platformName: defaultValues?.platformName ?? '',
      account: defaultValues?.account ?? '',
      password: '',
      note: defaultValues?.note ?? '',
    },
  })

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="platformName"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label={t('form.platformLabel')}
            placeholder={t('form.platformPlaceholder')}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.platformName?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="account"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label={t('form.accountLabel')}
            placeholder={t('form.accountPlaceholder')}
            autoCapitalize="none"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.account?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label={t('form.passwordLabel')}
            placeholder={t('form.passwordPlaceholder')}
            secureTextEntry
            autoCapitalize="none"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.password?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="note"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label={t('form.noteLabel')}
            placeholder={t('form.notePlaceholder')}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <Button label={submitLabel} onPress={handleSubmit(onSubmit)} isLoading={isSubmitting} style={styles.button} />
    </View>
  )
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    container: {
      gap: 14,
    },
    errorText: {
      fontFamily: fonts.sans,
      color: colors.danger,
      fontSize: 13,
    },
    button: {
      marginTop: 4,
    },
  })
}
```

- [ ] **Step 2: Migrate `CredentialCard`**

Replace the full contents of `src/features/credentials/components/CredentialCard.tsx`:

```tsx
import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTheme } from '@/src/shared/theme/ThemeProvider'
import { fonts, radii, type Colors } from '@/src/shared/theme/tokens'
import type { Credential } from '../types/credential.types'

interface CredentialCardProps {
  credential: Credential
  onPress: (id: string) => void
}

export function CredentialCard({ credential, onPress }: CredentialCardProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const initial = credential.platformName.trim().charAt(0).toUpperCase() || '?'

  return (
    <Pressable accessibilityRole="button" style={styles.card} onPress={() => onPress(credential.id)}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <View style={styles.copy}>
        <Text style={styles.platform} numberOfLines={1}>
          {credential.platformName}
        </Text>
        <Text style={styles.account} numberOfLines={1}>
          {credential.account}
        </Text>
      </View>
    </Pressable>
  )
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radii.md,
      paddingHorizontal: 14,
      paddingVertical: 13,
    },
    avatar: {
      width: 34,
      height: 34,
      borderRadius: radii.sm,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    avatarText: {
      fontFamily: fonts.serifSemiBold,
      fontSize: 15,
      color: colors.primaryDark,
    },
    copy: {
      flex: 1,
      minWidth: 0,
    },
    platform: {
      fontFamily: fonts.sansSemiBold,
      fontSize: 14,
      color: colors.ink,
    },
    account: {
      fontFamily: fonts.sans,
      fontSize: 12,
      color: colors.muted,
    },
  })
}
```

- [ ] **Step 3: Update `CredentialCard.test.tsx` to use `renderWithProviders`**

Replace the full contents of `src/features/credentials/components/__tests__/CredentialCard.test.tsx`:

```tsx
import { fireEvent, screen } from '@testing-library/react-native'
import { renderWithProviders } from '@/src/shared/testing/renderWithProviders'
import { CredentialCard } from '../CredentialCard'
import { credentialFixture } from '../../hooks/__tests__/mocks/credentialHandlers'

describe('CredentialCard', () => {
  it('renders the platform name and account', async () => {
    await renderWithProviders(<CredentialCard credential={credentialFixture} onPress={jest.fn()} />)

    expect(screen.getByText('Gmail')).toBeTruthy()
    expect(screen.getByText('user@gmail.com')).toBeTruthy()
  })

  it('never renders the encrypted password value', async () => {
    await renderWithProviders(<CredentialCard credential={credentialFixture} onPress={jest.fn()} />)

    expect(screen.queryByText(credentialFixture.encryptedPassword)).toBeNull()
  })

  it('calls onPress with the credential id when tapped', async () => {
    const onPress = jest.fn()
    await renderWithProviders(<CredentialCard credential={credentialFixture} onPress={onPress} />)

    await fireEvent.press(screen.getByRole('button'))

    expect(onPress).toHaveBeenCalledWith(credentialFixture.id)
  })
})
```

- [ ] **Step 4: Migrate `CopyableField`**

Replace the full contents of `src/features/credentials/components/CopyableField.tsx`:

```tsx
import * as Clipboard from 'expo-clipboard'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTheme } from '@/src/shared/theme/ThemeProvider'
import { fonts, radii, type Colors } from '@/src/shared/theme/tokens'

interface CopyableFieldProps {
  label: string
  value: string
  onCopied: () => void
}

export function CopyableField({ label, value, onCopied }: CopyableFieldProps) {
  const { t } = useTranslation('common')
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  async function handleCopy() {
    await Clipboard.setStringAsync(value)
    onCopied()
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.card}>
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" onPress={handleCopy} style={styles.pill}>
            <Text style={styles.pillText}>{t('actions.copy')}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    container: {
      gap: 6,
    },
    label: {
      fontFamily: fonts.mono,
      fontSize: 10.5,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: colors.mist,
    },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radii.md,
      padding: 14,
      gap: 10,
    },
    value: {
      fontFamily: fonts.mono,
      fontSize: 15,
      color: colors.ink,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    pill: {
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
      borderRadius: radii.pill,
      paddingHorizontal: 11,
      paddingVertical: 5,
    },
    pillText: {
      fontFamily: fonts.monoMedium,
      fontSize: 10.5,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: colors.primaryDark,
    },
  })
}
```

- [ ] **Step 5: Migrate `PasswordReveal`**

Replace the full contents of `src/features/credentials/components/PasswordReveal.tsx`:

```tsx
import * as Clipboard from 'expo-clipboard'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { decryptCredential } from '@/src/shared/lib/crypto/cryptoAdapter'
import { getEncryptionKey } from '@/src/shared/lib/crypto/keyStore'
import { Button } from '@/src/shared/components/Button'
import { useTheme } from '@/src/shared/theme/ThemeProvider'
import { fonts, radii, type Colors } from '@/src/shared/theme/tokens'

interface PasswordRevealProps {
  encryptedPassword: string
  onUnlockNeeded: () => void
  onCopied: () => void
}

export function PasswordReveal({ encryptedPassword, onUnlockNeeded, onCopied }: PasswordRevealProps) {
  const { t } = useTranslation('credentials')
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [revealed, setRevealed] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleToggle() {
    if (revealed) {
      setRevealed(null)
      return
    }
    setError(null)
    const key = getEncryptionKey()
    if (!key) {
      setError(t('password.locked'))
      return
    }
    try {
      setRevealed(await decryptCredential(encryptedPassword, key))
    } catch {
      setError(t('password.decryptError'))
    }
  }

  async function handleCopy() {
    if (!revealed) {
      return
    }
    await Clipboard.setStringAsync(revealed)
    onCopied()
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('password.label')}</Text>
      <View style={styles.card}>
        <Text style={styles.value} numberOfLines={1}>
          {revealed ?? '••••••••••••'}
        </Text>
        <View style={styles.actions}>
          {revealed ? (
            <Pressable accessibilityRole="button" onPress={handleCopy} style={styles.pill}>
              <Text style={styles.pillText}>{t('common:actions.copy')}</Text>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: revealed !== null }}
            onPress={handleToggle}
            style={styles.pill}
          >
            <Text style={styles.pillText}>{revealed ? t('common:actions.hide') : t('common:actions.show')}</Text>
          </Pressable>
        </View>
      </View>
      {error ? (
        <View style={styles.errorRow}>
          <Text style={styles.errorText}>{error}</Text>
          <Button label={t('password.unlockAgain')} variant="outline" onPress={onUnlockNeeded} style={styles.unlockButton} />
        </View>
      ) : null}
    </View>
  )
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    container: {
      gap: 6,
    },
    label: {
      fontFamily: fonts.mono,
      fontSize: 10.5,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: colors.mist,
    },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radii.md,
      padding: 14,
      gap: 10,
    },
    value: {
      fontFamily: fonts.mono,
      fontSize: 15,
      letterSpacing: 1,
      color: colors.ink,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
    },
    pill: {
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
      borderRadius: radii.pill,
      paddingHorizontal: 11,
      paddingVertical: 5,
    },
    pillText: {
      fontFamily: fonts.monoMedium,
      fontSize: 10.5,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: colors.primaryDark,
    },
    errorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 2,
    },
    errorText: {
      fontFamily: fonts.sans,
      color: colors.danger,
      fontSize: 13,
      flexShrink: 1,
    },
    unlockButton: {
      paddingVertical: 6,
      paddingHorizontal: 10,
    },
  })
}
```

- [ ] **Step 6: Migrate `UnlockVaultPrompt`**

Replace the full contents of `src/features/credentials/components/UnlockVaultPrompt.tsx`:

```tsx
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { z } from 'zod'
import { Button } from '@/src/shared/components/Button'
import { Logo } from '@/src/shared/components/Logo'
import { TextField } from '@/src/shared/components/TextField'
import { useTheme } from '@/src/shared/theme/ThemeProvider'
import { fonts, radii, type Colors } from '@/src/shared/theme/tokens'
import { useUnlockVault } from '../hooks/useUnlockVault'

const unlockShape = z.object({
  password: z.string().min(1),
})

type UnlockFormValues = z.infer<typeof unlockShape>

interface UnlockVaultPromptProps {
  onUnlocked: () => void
}

export function UnlockVaultPrompt({ onUnlocked }: UnlockVaultPromptProps) {
  const { t } = useTranslation('credentials')
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const resolver = useMemo(
    () => zodResolver(z.object({ password: z.string().min(1, t('validation.passwordRequired')) })),
    [t],
  )
  const { control, handleSubmit, formState: { errors } } = useForm<UnlockFormValues>({
    resolver,
    defaultValues: { password: '' },
  })
  const { unlock, isUnlocking } = useUnlockVault()

  const onSubmit = handleSubmit(async (values) => {
    await unlock(values.password)
    onUnlocked()
  })

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Logo showWordmark={false} height={44} />
        <Text style={styles.title}>{t('unlock.title')}</Text>
        <Text style={styles.subtitle}>{t('unlock.subtitle')}</Text>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label={t('unlock.passwordLabel')}
              placeholder={t('unlock.passwordPlaceholder')}
              secureTextEntry
              autoCapitalize="none"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.password?.message}
            />
          )}
        />
        <Button label={t('unlock.submit')} onPress={onSubmit} isLoading={isUnlocking} style={styles.button} />
        {isUnlocking ? <Text style={styles.statusText}>{t('unlock.deriving')}</Text> : null}
      </View>
    </View>
  )
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    container: {
      padding: 24,
      alignItems: 'center',
    },
    card: {
      width: '100%',
      maxWidth: 340,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radii.lg,
      padding: 24,
      gap: 12,
      alignItems: 'center',
    },
    title: {
      fontFamily: fonts.serifLight,
      fontSize: 24,
      color: colors.ink,
    },
    subtitle: {
      fontFamily: fonts.sans,
      fontSize: 13.5,
      color: colors.muted,
      textAlign: 'center',
      marginBottom: 4,
    },
    button: {
      width: '100%',
      marginTop: 4,
    },
    statusText: {
      fontFamily: fonts.sans,
      color: colors.muted,
      fontSize: 12.5,
      textAlign: 'center',
    },
  })
}
```

- [ ] **Step 7: Migrate `CredentialFormScreen`**

Replace the full contents of `src/features/credentials/screens/CredentialFormScreen.tsx`:

```tsx
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { encryptCredential } from '@/src/shared/lib/crypto/cryptoAdapter'
import { getEncryptionKey } from '@/src/shared/lib/crypto/keyStore'
import { BackButton } from '@/src/shared/components/BackButton'
import { useTheme } from '@/src/shared/theme/ThemeProvider'
import { fonts, spacing, type Colors } from '@/src/shared/theme/tokens'
import { CredentialForm, type CredentialFormValues } from '../components/CredentialForm'
import { useCredential } from '../hooks/useCredential'
import { useCreateCredential } from '../hooks/useCreateCredential'
import { useUpdateCredential } from '../hooks/useUpdateCredential'

interface CredentialFormScreenProps {
  credentialId?: string
}

export function CredentialFormScreen({ credentialId }: CredentialFormScreenProps) {
  const router = useRouter()
  const { t } = useTranslation('credentials')
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const isEditing = Boolean(credentialId)
  const { data: existingCredential, isLoading } = useCredential(credentialId ?? '')
  const createCredential = useCreateCredential()
  const updateCredential = useUpdateCredential()
  const isSubmitting = createCredential.isPending || updateCredential.isPending
  const mutationError = createCredential.error ?? updateCredential.error

  async function handleSubmit(values: CredentialFormValues) {
    const key = getEncryptionKey()
    if (!key) {
      return
    }

    const encryptedPassword = await encryptCredential(values.password, key)
    const payload = {
      platformName: values.platformName,
      account: values.account,
      encryptedPassword,
      note: values.note || null,
    }

    if (isEditing && existingCredential) {
      updateCredential.mutate(
        { id: existingCredential.id, payload },
        { onSuccess: () => router.back() },
      )
    } else {
      createCredential.mutate(payload, { onSuccess: () => router.back() })
    }
  }

  if (isEditing && isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{isEditing ? t('form.editTitle') : t('form.addTitle')}</Text>
        <CredentialForm
          defaultValues={
            existingCredential
              ? { ...existingCredential, note: existingCredential.note ?? undefined }
              : undefined
          }
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          errorMessage={mutationError ? t('form.saveError') : null}
          submitLabel={isEditing ? t('form.saveChanges') : t('form.addSubmit')}
        />
      </View>
    </SafeAreaView>
  )
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    header: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
    },
    content: {
      padding: spacing.xl,
      gap: spacing.lg,
    },
    title: {
      fontFamily: fonts.serif,
      fontSize: 21,
      color: colors.ink,
    },
  })
}
```

- [ ] **Step 8: Migrate `CredentialDetailScreen`**

Replace the full contents of `src/features/credentials/screens/CredentialDetailScreen.tsx`:

```tsx
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useHasEncryptionKey, useIsDerivingKey } from '@/src/shared/lib/crypto/keyStore'
import { BackButton } from '@/src/shared/components/BackButton'
import { Button } from '@/src/shared/components/Button'
import { useTheme } from '@/src/shared/theme/ThemeProvider'
import { fonts, radii, spacing, type Colors } from '@/src/shared/theme/tokens'
import { CopyableField } from '../components/CopyableField'
import { PasswordReveal } from '../components/PasswordReveal'
import { UnlockVaultPrompt } from '../components/UnlockVaultPrompt'
import { useCredential } from '../hooks/useCredential'
import { useDeleteCredential } from '../hooks/useDeleteCredential'

interface CredentialDetailScreenProps {
  credentialId: string
}

export function CredentialDetailScreen({ credentialId }: CredentialDetailScreenProps) {
  const router = useRouter()
  const { t } = useTranslation('credentials')
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const { data: credential, isLoading, isError } = useCredential(credentialId)
  const deleteCredential = useDeleteCredential()
  const hasKey = useHasEncryptionKey()
  const isDerivingKey = useIsDerivingKey()

  if (!credentialId) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{t('detail.invalid')}</Text>
      </SafeAreaView>
    )
  }

  if (!hasKey && isDerivingKey) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.errorText}>{t('detail.preparingVault')}</Text>
      </SafeAreaView>
    )
  }

  if (!hasKey) {
    return (
      <SafeAreaView style={styles.container}>
        <UnlockVaultPrompt onUnlocked={() => {}} />
      </SafeAreaView>
    )
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    )
  }

  if (isError || !credential) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{t('detail.notFound')}</Text>
      </SafeAreaView>
    )
  }

  function handleDelete() {
    Alert.alert(t('detail.deleteTitle'), t('detail.deleteMessage', { platform: credential!.platformName }), [
      { text: t('common:actions.cancel'), style: 'cancel' },
      {
        text: t('common:actions.delete'),
        style: 'destructive',
        onPress: () => deleteCredential.mutate(credential!.id, { onSuccess: () => router.back() }),
      },
    ])
  }

  const initial = credential.platformName.trim().charAt(0).toUpperCase() || '?'

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton />
        <View style={styles.titleRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.titleCopy}>
            <Text style={styles.title} numberOfLines={1}>
              {credential.platformName}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        <CopyableField
          label={t('detail.account')}
          value={credential.account}
          onCopied={() => Alert.alert(t('detail.copiedTitle'), t('detail.accountCopied'))}
        />

        <PasswordReveal
          encryptedPassword={credential.encryptedPassword}
          onUnlockNeeded={() => {}}
          onCopied={() => Alert.alert(t('detail.copiedTitle'), t('detail.passwordCopied'))}
        />

        {credential.note ? (
          <View style={styles.kvBlock}>
            <Text style={styles.kvLabel}>{t('detail.note')}</Text>
            <Text style={styles.kvValue}>{credential.note}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Button
            label={t('common:actions.edit')}
            variant="outline"
            style={styles.actionButton}
            onPress={() => router.push({ pathname: '/(protected)/credentials/new', params: { id: credential.id } })}
          />
          <Button label={t('common:actions.delete')} variant="outlineDanger" style={styles.actionButton} onPress={handleDelete} />
        </View>
      </View>
    </SafeAreaView>
  )
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xxl,
    },
    header: {
      gap: spacing.md,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
      paddingBottom: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: radii.md,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    avatarText: {
      fontFamily: fonts.serifSemiBold,
      fontSize: 19,
      color: colors.primaryDark,
    },
    titleCopy: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontFamily: fonts.serif,
      fontSize: 21,
      color: colors.ink,
    },
    body: {
      padding: spacing.xl,
      gap: spacing.xl,
    },
    kvBlock: {
      gap: 6,
    },
    kvLabel: {
      fontFamily: fonts.mono,
      fontSize: 10.5,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: colors.mist,
    },
    kvValue: {
      fontFamily: fonts.sans,
      fontSize: 14.5,
      color: colors.ink,
    },
    errorText: {
      fontFamily: fonts.sans,
      color: colors.danger,
      fontSize: 14,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: 'auto',
    },
    actionButton: {
      flex: 1,
    },
  })
}
```

- [ ] **Step 9: Migrate `CredentialListScreen`**

Replace the full contents of `src/features/credentials/screens/CredentialListScreen.tsx`:

```tsx
import { isAxiosError } from 'axios'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useHasEncryptionKey, useIsDerivingKey } from '@/src/shared/lib/crypto/keyStore'
import { BackButton } from '@/src/shared/components/BackButton'
import { Button } from '@/src/shared/components/Button'
import { useTheme } from '@/src/shared/theme/ThemeProvider'
import { fonts, radii, spacing, type Colors } from '@/src/shared/theme/tokens'
import { CredentialCard } from '../components/CredentialCard'
import { UnlockVaultPrompt } from '../components/UnlockVaultPrompt'
import { useCredentials } from '../hooks/useCredentials'

export function CredentialListScreen() {
  const router = useRouter()
  const { t } = useTranslation('credentials')
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const { data, isLoading, isError, error, refetch, isRefetching } = useCredentials()
  const hasKey = useHasEncryptionKey()
  const isDerivingKey = useIsDerivingKey()

  if (!hasKey && isDerivingKey) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.emptyText}>{t('detail.preparingVault')}</Text>
      </SafeAreaView>
    )
  }

  if (!hasKey) {
    return (
      <SafeAreaView style={styles.container}>
        <UnlockVaultPrompt onUnlocked={() => {}} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <BackButton />
          <Pressable accessibilityRole="button" style={styles.addPill} onPress={() => router.push('/(protected)/credentials/new')}>
            <Text style={styles.addPillText}>{t('list.add')}</Text>
          </Pressable>
        </View>
        <Text style={styles.title}>{t('list.title')}</Text>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>
            {isAxiosError(error) && !error.response ? t('common:status.offline') : t('list.loadError')}
          </Text>
          <Button label={t('common:actions.retry')} variant="outline" onPress={() => refetch()} />
        </View>
      ) : (
        <FlatList
          data={data?.data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>{t('list.empty')}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <CredentialCard credential={item} onPress={(id) => router.push(`/(protected)/credentials/${id}`)} />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  )
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
      padding: spacing.xxl,
    },
    header: {
      gap: spacing.md,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    addPill: {
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
      borderRadius: radii.pill,
      paddingHorizontal: 12,
      paddingVertical: 5,
    },
    addPillText: {
      fontFamily: fonts.monoMedium,
      fontSize: 11.5,
      color: colors.primaryDark,
    },
    title: {
      fontFamily: fonts.serif,
      fontSize: 22,
      color: colors.ink,
    },
    listContent: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xxl,
      flexGrow: 1,
    },
    separator: {
      height: 10,
    },
    emptyText: {
      fontFamily: fonts.sans,
      color: colors.muted,
      fontSize: 14,
    },
    errorText: {
      fontFamily: fonts.sans,
      color: colors.danger,
      fontSize: 14,
      textAlign: 'center',
    },
  })
}
```

- [ ] **Step 10: Run the affected tests**

Run: `npx jest src/features/credentials`
Expected: PASS — no assertion changed.

- [ ] **Step 11: Commit**

```bash
git add src/features/credentials
git commit -m "refactor(mobile): migrate credentials feature to useTheme + i18n"
```

---

## Task 11: Migrate the Documents feature

**Files:**
- Modify: `src/features/documents/utils/documentValidation.ts`, `src/features/documents/components/DocumentTypeSelect.tsx`, `src/features/documents/components/DocumentPickerButton.tsx`, `src/features/documents/components/DocumentCard.tsx`, `src/features/documents/screens/DocumentListScreen.tsx`, `src/features/documents/screens/DocumentDetailScreen.tsx`, `src/features/documents/screens/DocumentUploadScreen.tsx`
- Create: `src/features/documents/hooks/useDocTypeLabel.ts`

**Interfaces:**
- Consumes: `useTheme` (Task 4), `documents`/`common` namespace resources (Task 5).
- Produces: `useDocTypeLabel(): (docType: string | null) => string`.
- No existing test files touch this feature (none exist yet for Documents), so no test updates are needed in this task.

**Design note:** `validatePickedFile` and the upload screen's server-error mapping used to return hardcoded English **messages** directly from a plain (non-React) utility function. A plain function can't call `t()`, so both now return an **error code** instead (`'unsupportedType' | 'tooLarge' | 'genericError' | null`), and the calling component (which already has `useTranslation('documents')`) translates the code via `t(\`upload.${code}\`)`. Similarly, `DOC_TYPE_CATEGORIES` (an array of `{ value, label }` with hardcoded English `label`s) becomes `DOC_TYPE_CATEGORY_VALUES` (just the fixed `value`s — these are the literal strings sent to the API per `API_SPEC.md` §7 and must never be translated); the display label is looked up via `t(\`docType.categories.${value}\`)` at render time in `DocumentTypeSelect`, and via the new `useDocTypeLabel()` hook (with `t(..., { defaultValue: docType })` so a user-typed free-text "Other" category still displays as-is) everywhere else `docTypeLabel()` used to be called.

- [ ] **Step 1: Refactor `documentValidation.ts` to return error codes and category values instead of hardcoded English**

Replace the full contents of `src/features/documents/utils/documentValidation.ts`:

```ts
import { ALLOWED_DOCUMENT_TYPES, MAX_FILE_SIZE_BYTES } from '@/src/config/constants'
import type { PickedFile } from '../types/document.types'

export interface FileValidationResult {
  isValid: boolean
  errorCode: 'unsupportedType' | 'tooLarge' | null
}

// On-device check for immediate feedback only — the backend's 415/413 response
// is the source of truth (a picker's reported mimeType/size can be wrong or missing).
export function validatePickedFile(file: PickedFile): FileValidationResult {
  if (!ALLOWED_DOCUMENT_TYPES.includes(file.mimeType as (typeof ALLOWED_DOCUMENT_TYPES)[number])) {
    return { isValid: false, errorCode: 'unsupportedType' }
  }

  if (typeof file.size === 'number' && file.size > MAX_FILE_SIZE_BYTES) {
    return { isValid: false, errorCode: 'tooLarge' }
  }

  return { isValid: true, errorCode: null }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Mirrors the docType picker categories in API_SPEC.md §3 — UI-only, not enforced by the backend.
// Only the `value` is fixed (sent to the API as-is, per API_SPEC.md §7); the display label is
// looked up via i18n at render time (see useDocTypeLabel / DocumentTypeSelect) so it stays translated.
export const DOC_TYPE_CATEGORY_VALUES = [
  'identity_civil_status',
  'education_qualifications',
  'employment_contracts',
  'medical_health',
  'finance_tax',
  'property_vehicles',
  'legal_misc',
] as const
```

- [ ] **Step 2: Add the `useDocTypeLabel` hook**

Create `src/features/documents/hooks/useDocTypeLabel.ts`:

```ts
import { useTranslation } from 'react-i18next'

export function useDocTypeLabel() {
  const { t } = useTranslation('documents')

  return (docType: string | null): string => {
    if (!docType) return t('docType.uncategorized')
    return t(`docType.categories.${docType}`, { defaultValue: docType })
  }
}
```

- [ ] **Step 3: Migrate `DocumentTypeSelect`**

Replace the full contents of `src/features/documents/components/DocumentTypeSelect.tsx`:

```tsx
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { TextField } from '@/src/shared/components/TextField'
import { useTheme } from '@/src/shared/theme/ThemeProvider'
import { fonts, radii, type Colors } from '@/src/shared/theme/tokens'
import { DOC_TYPE_CATEGORY_VALUES } from '../utils/documentValidation'

interface DocumentTypeSelectProps {
  value: string
  onChange: (value: string) => void
}

export function DocumentTypeSelect({ value, onChange }: DocumentTypeSelectProps) {
  const { t } = useTranslation('documents')
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const matchedValue = DOC_TYPE_CATEGORY_VALUES.find((categoryValue) => categoryValue === value)
  const [isOther, setIsOther] = useState(Boolean(value) && !matchedValue)

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('docType.label')}</Text>
      <View style={styles.chips}>
        {DOC_TYPE_CATEGORY_VALUES.map((categoryValue) => {
          const selected = !isOther && value === categoryValue
          return (
            <Pressable
              key={categoryValue}
              accessibilityRole="button"
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => {
                setIsOther(false)
                onChange(categoryValue)
              }}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {t(`docType.categories.${categoryValue}`)}
              </Text>
            </Pressable>
          )
        })}
        <Pressable
          accessibilityRole="button"
          style={[styles.chip, isOther && styles.chipSelected]}
          onPress={() => {
            setIsOther(true)
            onChange('')
          }}
        >
          <Text style={[styles.chipText, isOther && styles.chipTextSelected]}>{t('docType.other')}</Text>
        </Pressable>
      </View>

      {isOther ? (
        <TextField
          label={t('docType.customLabel')}
          placeholder={t('docType.customPlaceholder')}
          value={value}
          onChangeText={onChange}
        />
      ) : null}
    </View>
  )
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    container: {
      gap: 8,
    },
    label: {
      fontFamily: fonts.mono,
      fontSize: 10.5,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: colors.mist,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      borderRadius: radii.pill,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    chipSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    chipText: {
      fontFamily: fonts.sans,
      fontSize: 12.5,
      color: colors.muted,
    },
    chipTextSelected: {
      fontFamily: fonts.sansSemiBold,
      color: colors.primaryDark,
    },
  })
}
```

- [ ] **Step 4: Migrate `DocumentPickerButton`**

Replace the full contents of `src/features/documents/components/DocumentPickerButton.tsx`:

```tsx
import * as DocumentPicker from 'expo-document-picker'
import * as ImagePicker from 'expo-image-picker'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ALLOWED_DOCUMENT_TYPES } from '@/src/config/constants'
import { useTheme } from '@/src/shared/theme/ThemeProvider'
import { fonts, radii, type Colors } from '@/src/shared/theme/tokens'
import type { PickedFile } from '../types/document.types'

interface DocumentPickerButtonProps {
  onPicked: (file: PickedFile) => void
}

export function DocumentPickerButton({ onPicked }: DocumentPickerButtonProps) {
  const { t } = useTranslation('documents')
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  async function handlePickFile() {
    const result = await DocumentPicker.getDocumentAsync({
      type: [...ALLOWED_DOCUMENT_TYPES],
      copyToCacheDirectory: true,
      multiple: false,
    })

    if (result.canceled || result.assets.length === 0) return

    const asset = result.assets[0]
    onPicked({
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType ?? 'application/octet-stream',
      size: asset.size,
    })
  }

  async function handlePickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) return

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
    })

    if (result.canceled || result.assets.length === 0) return

    const asset = result.assets[0]
    const fileName = asset.fileName ?? `photo-${Date.now()}.jpg`
    onPicked({
      uri: asset.uri,
      name: fileName,
      mimeType: asset.mimeType ?? 'image/jpeg',
      size: asset.fileSize,
    })
  }

  return (
    <View style={styles.row}>
      <Pressable accessibilityRole="button" style={styles.button} onPress={handlePickFile}>
        <Text style={styles.buttonText}>{t('upload.chooseFile')}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" style={styles.button} onPress={handlePickPhoto}>
        <Text style={styles.buttonText}>{t('upload.choosePhoto')}</Text>
      </Pressable>
    </View>
  )
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: 10,
    },
    button: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
      borderRadius: radii.sm,
      paddingVertical: 12,
      alignItems: 'center',
    },
    buttonText: {
      fontFamily: fonts.sansSemiBold,
      fontSize: 13.5,
      color: colors.primaryDark,
    },
  })
}
```

- [ ] **Step 5: Migrate `DocumentCard`**

Replace the full contents of `src/features/documents/components/DocumentCard.tsx`:

```tsx
import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTheme } from '@/src/shared/theme/ThemeProvider'
import { fonts, radii, type Colors } from '@/src/shared/theme/tokens'
import type { DocumentRecord } from '../types/document.types'
import { useDocTypeLabel } from '../hooks/useDocTypeLabel'
import { formatFileSize } from '../utils/documentValidation'

interface DocumentCardProps {
  document: DocumentRecord
  onPress: (id: string) => void
}

// File-format acronyms (PDF/PNG/JPG) are international abbreviations, not natural-language UI
// copy — left untranslated on purpose, same as the mockup's own use of these terms.
function extensionLabel(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'PDF'
  if (mimeType === 'image/png') return 'PNG'
  if (mimeType === 'image/jpeg') return 'JPG'
  return 'FILE'
}

export function DocumentCard({ document, onPress }: DocumentCardProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const docTypeLabel = useDocTypeLabel()

  return (
    <Pressable accessibilityRole="button" style={styles.card} onPress={() => onPress(document.id)}>
      <View style={styles.icon}>
        <Text style={styles.iconText}>{extensionLabel(document.mimeType)}</Text>
      </View>
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={1}>
          {document.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {docTypeLabel(document.docType)} · {formatFileSize(document.fileSize)}
        </Text>
      </View>
    </Pressable>
  )
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radii.md,
      paddingHorizontal: 14,
      paddingVertical: 13,
    },
    icon: {
      width: 40,
      height: 40,
      borderRadius: radii.sm,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    iconText: {
      fontFamily: fonts.monoMedium,
      fontSize: 10,
      color: colors.primaryDark,
    },
    copy: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontFamily: fonts.sansSemiBold,
      fontSize: 14,
      color: colors.ink,
    },
    meta: {
      fontFamily: fonts.sans,
      fontSize: 12,
      color: colors.muted,
    },
  })
}
```

- [ ] **Step 6: Migrate `DocumentListScreen`**

Replace the full contents of `src/features/documents/screens/DocumentListScreen.tsx`:

```tsx
import { isAxiosError } from 'axios'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { BackButton } from '@/src/shared/components/BackButton'
import { Button } from '@/src/shared/components/Button'
import { useTheme } from '@/src/shared/theme/ThemeProvider'
import { fonts, radii, spacing, type Colors } from '@/src/shared/theme/tokens'
import { DocumentCard } from '../components/DocumentCard'
import { useDocuments } from '../hooks/useDocuments'

export function DocumentListScreen() {
  const router = useRouter()
  const { t } = useTranslation('documents')
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const { data, isLoading, isError, error, refetch, isRefetching } = useDocuments()

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <BackButton />
          <Pressable accessibilityRole="button" style={styles.addPill} onPress={() => router.push('/(protected)/documents/upload')}>
            <Text style={styles.addPillText}>{t('list.upload')}</Text>
          </Pressable>
        </View>
        <Text style={styles.title}>{t('list.title')}</Text>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>
            {isAxiosError(error) && !error.response ? t('common:status.offline') : t('list.loadError')}
          </Text>
          <Button label={t('common:actions.retry')} variant="outline" onPress={() => refetch()} />
        </View>
      ) : (
        <FlatList
          data={data?.data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>{t('list.empty')}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <DocumentCard document={item} onPress={(id) => router.push(`/(protected)/documents/${id}`)} />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  )
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
      padding: spacing.xxl,
    },
    header: {
      gap: spacing.md,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    addPill: {
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
      borderRadius: radii.pill,
      paddingHorizontal: 12,
      paddingVertical: 5,
    },
    addPillText: {
      fontFamily: fonts.monoMedium,
      fontSize: 11.5,
      color: colors.primaryDark,
    },
    title: {
      fontFamily: fonts.serif,
      fontSize: 22,
      color: colors.ink,
    },
    listContent: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xxl,
      flexGrow: 1,
    },
    separator: {
      height: 10,
    },
    emptyText: {
      fontFamily: fonts.sans,
      color: colors.muted,
      fontSize: 14,
    },
    errorText: {
      fontFamily: fonts.sans,
      color: colors.danger,
      fontSize: 14,
      textAlign: 'center',
    },
  })
}
```

- [ ] **Step 7: Migrate `DocumentDetailScreen`**

Replace the full contents of `src/features/documents/screens/DocumentDetailScreen.tsx`:

```tsx
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { BackButton } from '@/src/shared/components/BackButton'
import { Button } from '@/src/shared/components/Button'
import { useTheme } from '@/src/shared/theme/ThemeProvider'
import { fonts, spacing, type Colors } from '@/src/shared/theme/tokens'
import { useDeleteDocument } from '../hooks/useDeleteDocument'
import { useDocument } from '../hooks/useDocument'
import { useDownloadDocument } from '../hooks/useDownloadDocument'
import { useDocTypeLabel } from '../hooks/useDocTypeLabel'
import { formatFileSize } from '../utils/documentValidation'

interface DocumentDetailScreenProps {
  documentId: string
}

export function DocumentDetailScreen({ documentId }: DocumentDetailScreenProps) {
  const router = useRouter()
  const { t } = useTranslation('documents')
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const docTypeLabel = useDocTypeLabel()
  const { data: document, isLoading, isError } = useDocument(documentId)
  const deleteDocument = useDeleteDocument()
  const downloadDocument = useDownloadDocument()

  if (!documentId) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{t('detail.invalid')}</Text>
      </SafeAreaView>
    )
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    )
  }

  if (isError || !document) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{t('detail.notFound')}</Text>
      </SafeAreaView>
    )
  }

  function handleDelete() {
    Alert.alert(t('detail.deleteTitle'), t('detail.deleteMessage', { title: document!.title }), [
      { text: t('common:actions.cancel'), style: 'cancel' },
      {
        text: t('common:actions.delete'),
        style: 'destructive',
        onPress: () => deleteDocument.mutate(document!.id, { onSuccess: () => router.back() }),
      },
    ])
  }

  function handleDownload() {
    downloadDocument.mutate(
      { id: document!.id, fileName: document!.title },
      { onError: () => Alert.alert(t('detail.downloadFailedTitle'), t('detail.downloadFailedMessage')) },
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.title} numberOfLines={2}>
          {document.title}
        </Text>
      </View>

      <View style={styles.body}>
        <View style={styles.kvBlock}>
          <Text style={styles.kvLabel}>{t('detail.category')}</Text>
          <Text style={styles.kvValue}>{docTypeLabel(document.docType)}</Text>
        </View>

        <View style={styles.kvBlock}>
          <Text style={styles.kvLabel}>{t('detail.file')}</Text>
          <Text style={styles.kvValue}>
            {document.mimeType} · {formatFileSize(document.fileSize)}
          </Text>
        </View>

        <View style={styles.kvBlock}>
          <Text style={styles.kvLabel}>{t('detail.uploaded')}</Text>
          <Text style={styles.kvValue}>{new Date(document.createdAt).toLocaleDateString()}</Text>
        </View>

        <View style={styles.actions}>
          <Button
            label={t('detail.download')}
            variant="outline"
            style={styles.actionButton}
            isLoading={downloadDocument.isPending}
            onPress={handleDownload}
          />
          <Button label={t('common:actions.delete')} variant="outlineDanger" style={styles.actionButton} onPress={handleDelete} />
        </View>
      </View>
    </SafeAreaView>
  )
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xxl,
    },
    header: {
      gap: spacing.md,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
      paddingBottom: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    },
    title: {
      fontFamily: fonts.serif,
      fontSize: 21,
      color: colors.ink,
    },
    body: {
      padding: spacing.xl,
      gap: spacing.xl,
    },
    kvBlock: {
      gap: 6,
    },
    kvLabel: {
      fontFamily: fonts.mono,
      fontSize: 10.5,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: colors.mist,
    },
    kvValue: {
      fontFamily: fonts.sans,
      fontSize: 14.5,
      color: colors.ink,
    },
    errorText: {
      fontFamily: fonts.sans,
      color: colors.danger,
      fontSize: 14,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: 'auto',
    },
    actionButton: {
      flex: 1,
    },
  })
}
```

- [ ] **Step 8: Migrate `DocumentUploadScreen`**

Replace the full contents of `src/features/documents/screens/DocumentUploadScreen.tsx`:

```tsx
import { isAxiosError } from 'axios'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { BackButton } from '@/src/shared/components/BackButton'
import { Button } from '@/src/shared/components/Button'
import { TextField } from '@/src/shared/components/TextField'
import { useTheme } from '@/src/shared/theme/ThemeProvider'
import { fonts, spacing, type Colors } from '@/src/shared/theme/tokens'
import { DocumentPickerButton } from '../components/DocumentPickerButton'
import { DocumentTypeSelect } from '../components/DocumentTypeSelect'
import { useUploadDocument } from '../hooks/useUploadDocument'
import type { PickedFile } from '../types/document.types'
import { formatFileSize, validatePickedFile } from '../utils/documentValidation'

export function DocumentUploadScreen() {
  const router = useRouter()
  const { t } = useTranslation('documents')
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const uploadDocument = useUploadDocument()
  const [file, setFile] = useState<PickedFile | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [docType, setDocType] = useState('')

  function handlePicked(picked: PickedFile) {
    const validation = validatePickedFile(picked)
    setFileError(validation.errorCode ? t(`upload.${validation.errorCode}`) : null)
    setFile(picked)
    if (!title) {
      setTitle(picked.name.replace(/\.[^/.]+$/, ''))
    }
  }

  function handleSubmit() {
    if (!file || fileError || !title.trim()) return

    uploadDocument.mutate(
      { file, title: title.trim(), docType: docType || null },
      { onSuccess: () => router.back() },
    )
  }

  const serverErrorCode = serverErrorKey(uploadDocument.error)

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('upload.title')}</Text>

        <DocumentPickerButton onPicked={handlePicked} />

        {file ? (
          <View style={styles.filePreview}>
            <Text style={styles.fileName} numberOfLines={1}>
              {file.name}
            </Text>
            {typeof file.size === 'number' ? (
              <Text style={styles.fileMeta}>{formatFileSize(file.size)}</Text>
            ) : null}
          </View>
        ) : null}

        {fileError ? <Text style={styles.errorText}>{fileError}</Text> : null}

        <TextField label={t('upload.titleLabel')} placeholder={t('upload.titlePlaceholder')} value={title} onChangeText={setTitle} />

        <DocumentTypeSelect value={docType} onChange={setDocType} />

        {serverErrorCode ? <Text style={styles.errorText}>{t(`upload.${serverErrorCode}`)}</Text> : null}

        <Button
          label={t('upload.submit')}
          onPress={handleSubmit}
          isLoading={uploadDocument.isPending}
          disabled={!file || Boolean(fileError) || !title.trim()}
          style={styles.submitButton}
        />
      </ScrollView>
    </SafeAreaView>
  )
}

function serverErrorKey(error: unknown): 'tooLarge' | 'unsupportedType' | 'genericError' | null {
  if (!isAxiosError(error)) return error ? 'genericError' : null
  if (error.response?.status === 413) return 'tooLarge'
  if (error.response?.status === 415) return 'unsupportedType'
  return 'genericError'
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    header: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
    },
    content: {
      padding: spacing.xl,
      gap: spacing.lg,
    },
    title: {
      fontFamily: fonts.serif,
      fontSize: 21,
      color: colors.ink,
    },
    filePreview: {
      gap: 2,
    },
    fileName: {
      fontFamily: fonts.sansSemiBold,
      fontSize: 13.5,
      color: colors.ink,
    },
    fileMeta: {
      fontFamily: fonts.sans,
      fontSize: 12,
      color: colors.muted,
    },
    errorText: {
      fontFamily: fonts.sans,
      color: colors.danger,
      fontSize: 13,
    },
    submitButton: {
      marginTop: 4,
    },
  })
}
```

- [ ] **Step 9: Verify**

Run: `npx tsc --noEmit`
Expected: no errors from any file touched in this task (a full-repo pass will still show errors for Profile/Home — those are migrated in Tasks 12–14).

- [ ] **Step 10: Commit**

```bash
git add src/features/documents
git commit -m "refactor(mobile): migrate documents feature to useTheme + i18n"
```

---

## Task 12: Migrate the Profile feature

**Files:**
- Modify: `src/features/profile/components/BirthdayField.tsx`, `src/features/profile/components/ProfileForm.tsx`, `src/features/profile/screens/ProfileScreen.tsx`

**Interfaces:**
- Consumes: `useTheme` (Task 4), `profile`/`common` namespace resources (Task 5, extended by this task's Step 0).
- No existing test files touch this feature.

- [ ] **Step 0: Add the two `profile` namespace keys this task needs that Task 5 didn't anticipate**

Task 5's `profile.json` files were missing `fullNamePlaceholder` and the `role`/`status` badge label maps — added retroactively to the Task 5 content above (`fullNamePlaceholder`, `role.admin`/`role.member`, `status.active`/`status.locked`, both languages). If you're implementing Task 5 fresh, just include them the first time; if Task 5 already landed, add these keys to `src/shared/i18n/locales/vi/profile.json` and `src/shared/i18n/locales/en/profile.json` now before continuing.

- [ ] **Step 1: Migrate `BirthdayField`**

Replace the full contents of `src/features/profile/components/BirthdayField.tsx`:

```tsx
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { useTheme } from '@/src/shared/theme/ThemeProvider'
import { fonts, type Colors } from '@/src/shared/theme/tokens'

interface BirthdayFieldProps {
  value: Date | null
  onChange: (date: Date) => void
  error?: string
}

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function BirthdayField({ value, onChange, error }: BirthdayFieldProps) {
  const { t } = useTranslation('profile')
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [showIosPicker, setShowIosPicker] = useState(false)

  function openPicker() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: value ?? new Date(),
        mode: 'date',
        maximumDate: new Date(),
        onChange: (event, selectedDate) => {
          if (event.type === 'set' && selectedDate) {
            onChange(selectedDate)
          }
        },
      })
    } else {
      setShowIosPicker(true)
    }
  }

  return (
    <View style={{ gap: 5, alignSelf: 'stretch' }}>
      <Text style={styles.label}>{t('birthdayFieldLabel')}</Text>
      <Pressable accessibilityRole="button" onPress={openPicker} style={[styles.input, error && styles.inputError]}>
        <Text style={value ? styles.valueText : styles.placeholderText}>
          {value ? formatDate(value) : t('birthdaySelect')}
        </Text>
      </Pressable>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {Platform.OS === 'ios' && showIosPicker ? (
        <DateTimePicker
          value={value ?? new Date()}
          mode="date"
          display="spinner"
          maximumDate={new Date()}
          onChange={(event, selectedDate) => {
            if (event.type === 'set' && selectedDate) {
              onChange(selectedDate)
            }
            setShowIosPicker(false)
          }}
        />
      ) : null}
    </View>
  )
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    label: {
      fontFamily: fonts.mono,
      fontSize: 10.5,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: colors.mist,
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 9,
      paddingHorizontal: 13,
      paddingVertical: 12,
    },
    inputError: {
      borderColor: colors.danger,
    },
    valueText: {
      fontFamily: fonts.sans,
      fontSize: 14,
      color: colors.ink,
    },
    placeholderText: {
      fontFamily: fonts.sans,
      fontSize: 14,
      color: colors.muted,
    },
    errorText: {
      fontFamily: fonts.sans,
      fontSize: 13,
      color: colors.danger,
    },
  })
}

export { formatDate as formatBirthday }
```

- [ ] **Step 2: Migrate `ProfileForm`**

Replace the full contents of `src/features/profile/components/ProfileForm.tsx`:

```tsx
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { z } from 'zod'
import { Button } from '@/src/shared/components/Button'
import { TextField } from '@/src/shared/components/TextField'
import { useTheme } from '@/src/shared/theme/ThemeProvider'
import { fonts, type Colors } from '@/src/shared/theme/tokens'
import { BirthdayField } from './BirthdayField'

const profileShape = z.object({
  fullName: z.string().min(1),
  birthday: z.date().nullable(),
})

export type ProfileFormValues = z.infer<typeof profileShape>

interface ProfileFormProps {
  defaultValues: ProfileFormValues
  onSubmit: (values: ProfileFormValues) => void
  onCancel: () => void
  isSubmitting: boolean
  errorMessage: string | null
}

export function ProfileForm({ defaultValues, onSubmit, onCancel, isSubmitting, errorMessage }: ProfileFormProps) {
  const { t } = useTranslation('profile')
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const resolver = useMemo(
    () =>
      zodResolver(
        z.object({
          fullName: z.string().min(1, t('validation.fullNameRequired')),
          birthday: z.date().nullable(),
        }),
      ),
    [t],
  )
  const { control, handleSubmit, formState: { errors } } = useForm<ProfileFormValues>({
    resolver,
    defaultValues,
  })

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="fullName"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label={t('fullNameLabel')}
            placeholder={t('fullNamePlaceholder')}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.fullName?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="birthday"
        render={({ field: { onChange, value } }) => <BirthdayField value={value} onChange={onChange} />}
      />

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <View style={styles.actions}>
        <Button label={t('common:actions.cancel')} variant="outline" style={styles.actionButton} onPress={onCancel} />
        <Button
          label={t('common:actions.save')}
          onPress={handleSubmit(onSubmit)}
          isLoading={isSubmitting}
          style={styles.actionButton}
        />
      </View>
    </View>
  )
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    container: {
      gap: 14,
    },
    errorText: {
      fontFamily: fonts.sans,
      color: colors.danger,
      fontSize: 13,
    },
    actions: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 4,
    },
    actionButton: {
      flex: 1,
    },
  })
}
```

- [ ] **Step 3: Migrate `ProfileScreen`**

Replace the full contents of `src/features/profile/screens/ProfileScreen.tsx`:

```tsx
import { isAxiosError } from 'axios'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { BackButton } from '@/src/shared/components/BackButton'
import { Button } from '@/src/shared/components/Button'
import { useTheme } from '@/src/shared/theme/ThemeProvider'
import { fonts, radii, spacing, type Colors } from '@/src/shared/theme/tokens'
import { formatBirthday } from '../components/BirthdayField'
import { ProfileForm, type ProfileFormValues } from '../components/ProfileForm'
import { useProfile } from '../hooks/useProfile'
import { useUpdateProfile } from '../hooks/useUpdateProfile'

export function ProfileScreen() {
  const { t } = useTranslation('profile')
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const { data: profile, isLoading, isError, error, refetch } = useProfile()
  const updateProfile = useUpdateProfile()
  const [isEditing, setIsEditing] = useState(false)

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    )
  }

  if (isError || !profile) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>
          {isAxiosError(error) && !error.response ? t('common:status.offline') : t('loadError')}
        </Text>
        <Button label={t('common:actions.retry')} variant="outline" onPress={() => refetch()} />
      </SafeAreaView>
    )
  }

  function handleSubmit(values: ProfileFormValues) {
    updateProfile.mutate(
      { fullName: values.fullName, birthday: values.birthday ? formatBirthday(values.birthday) : null },
      { onSuccess: () => setIsEditing(false) },
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.title}>{t('title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {isEditing ? (
          <ProfileForm
            defaultValues={{
              fullName: profile.fullName,
              birthday: profile.birthday ? new Date(profile.birthday) : null,
            }}
            onSubmit={handleSubmit}
            onCancel={() => setIsEditing(false)}
            isSubmitting={updateProfile.isPending}
            errorMessage={updateProfile.error ? t('saveError') : null}
          />
        ) : (
          <>
            <View style={styles.kvBlock}>
              <Text style={styles.kvLabel}>{t('fullNameLabel')}</Text>
              <Text style={styles.kvValue}>{profile.fullName}</Text>
            </View>

            <View style={styles.kvBlock}>
              <Text style={styles.kvLabel}>{t('phone')}</Text>
              <Text style={styles.kvValue}>{profile.phone}</Text>
            </View>

            <View style={styles.kvBlock}>
              <Text style={styles.kvLabel}>{t('birthday')}</Text>
              <Text style={styles.kvValue}>{profile.birthday ?? t('birthdayNotSet')}</Text>
            </View>

            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{t(`role.${profile.role}`)}</Text>
              </View>
              <View style={[styles.badge, profile.status === 'locked' && styles.badgeDanger]}>
                <Text style={[styles.badgeText, profile.status === 'locked' && styles.badgeTextDanger]}>
                  {t(`status.${profile.status}`)}
                </Text>
              </View>
            </View>

            <Button label={t('editProfile')} style={styles.editButton} onPress={() => setIsEditing(true)} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
      padding: spacing.xxl,
    },
    header: {
      gap: spacing.md,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
      paddingBottom: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    },
    title: {
      fontFamily: fonts.serif,
      fontSize: 21,
      color: colors.ink,
    },
    body: {
      padding: spacing.xl,
      gap: spacing.xl,
    },
    kvBlock: {
      gap: 6,
    },
    kvLabel: {
      fontFamily: fonts.mono,
      fontSize: 10.5,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: colors.mist,
    },
    kvValue: {
      fontFamily: fonts.sans,
      fontSize: 14.5,
      color: colors.ink,
    },
    badgeRow: {
      flexDirection: 'row',
      gap: 8,
    },
    badge: {
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      borderRadius: radii.pill,
      paddingHorizontal: 12,
      paddingVertical: 5,
    },
    badgeDanger: {
      borderColor: colors.danger,
      backgroundColor: colors.dangerSoft,
    },
    badgeText: {
      fontFamily: fonts.monoMedium,
      fontSize: 11,
      textTransform: 'uppercase',
      color: colors.muted,
    },
    badgeTextDanger: {
      color: colors.dangerDark,
    },
    editButton: {
      marginTop: 4,
    },
    errorText: {
      fontFamily: fonts.sans,
      color: colors.danger,
      fontSize: 14,
      textAlign: 'center',
    },
  })
}
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: no errors from any file touched in this task (Home is migrated in Task 14 and will still show errors here until then).

- [ ] **Step 5: Commit**

```bash
git add src/features/profile
git commit -m "refactor(mobile): migrate profile feature to useTheme + i18n"
```

---

## Task 13: New Settings feature (Appearance + Language)

**Files:**
- Create: `src/features/settings/components/AppearancePicker.tsx`, `src/features/settings/components/LanguagePicker.tsx`, `src/features/settings/screens/SettingsScreen.tsx`, `app/(protected)/settings.tsx`
- Modify: `src/features/settings/index.ts`, `src/features/settings/CONTEXT.md`
- Test: `src/features/settings/components/__tests__/AppearancePicker.test.tsx`, `src/features/settings/components/__tests__/LanguagePicker.test.tsx`, `src/features/settings/screens/__tests__/SettingsScreen.test.tsx`

**Interfaces:**
- Consumes: `useTheme` (Task 4, for `mode`/`setMode`), `useThemeStore` (Task 3, for test setup), `setLanguage`/`SUPPORTED_LANGUAGES`/`SupportedLanguage` and the `i18next` default export (Task 5).
- Produces: `SettingsScreen` (exported from `src/features/settings/index.ts`), reachable at route `/(protected)/settings`.
- This is genuinely new behavior (unlike Tasks 9–12's mechanical migrations), so it follows full TDD: failing test, then implementation, per component.

- [ ] **Step 1: Write the failing test for `AppearancePicker`**

Create `src/features/settings/components/__tests__/AppearancePicker.test.tsx`:

```tsx
import { fireEvent, screen } from '@testing-library/react-native'
import { renderWithProviders } from '@/src/shared/testing/renderWithProviders'
import { useThemeStore } from '@/src/shared/theme/theme.store'
import { AppearancePicker } from '../AppearancePicker'

describe('AppearancePicker', () => {
  beforeEach(() => {
    useThemeStore.setState({ mode: 'light', hasHydrated: true })
  })

  it('marks the current mode as selected', async () => {
    await renderWithProviders(<AppearancePicker />)

    expect(screen.getByRole('button', { name: 'Light' }).props.accessibilityState).toEqual({ selected: true })
    expect(screen.getByRole('button', { name: 'Dark' }).props.accessibilityState).toEqual({ selected: false })
  })

  it('switches mode when a different option is pressed', async () => {
    await renderWithProviders(<AppearancePicker />)

    await fireEvent.press(screen.getByRole('button', { name: 'Dark' }))

    expect(useThemeStore.getState().mode).toBe('dark')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/features/settings/components/__tests__/AppearancePicker.test.tsx`
Expected: FAIL with "Cannot find module '../AppearancePicker'".

- [ ] **Step 3: Implement `AppearancePicker`**

Create `src/features/settings/components/AppearancePicker.tsx`:

```tsx
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTheme } from '@/src/shared/theme/ThemeProvider'
import type { ThemeMode } from '@/src/shared/theme/theme.store'
import { fonts, radii, type Colors } from '@/src/shared/theme/tokens'

const MODES: ThemeMode[] = ['light', 'dark', 'system']

export function AppearancePicker() {
  const { t } = useTranslation('settings')
  const { colors, mode, setMode } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <View style={styles.row}>
      {MODES.map((option) => {
        const selected = mode === option
        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={[styles.option, selected && styles.optionSelected]}
            onPress={() => setMode(option)}
          >
            <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{t(`appearance.${option}`)}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      backgroundColor: colors.mistSoft,
      borderRadius: radii.md - 2,
      padding: 3,
      gap: 3,
    },
    option: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 7,
      borderRadius: radii.sm - 2,
    },
    optionSelected: {
      backgroundColor: colors.surface,
    },
    optionText: {
      fontFamily: fonts.sansMedium,
      fontSize: 11.5,
      color: colors.muted,
    },
    optionTextSelected: {
      fontFamily: fonts.sansSemiBold,
      color: colors.ink,
    },
  })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/features/settings/components/__tests__/AppearancePicker.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Write the failing test for `LanguagePicker`**

Create `src/features/settings/components/__tests__/LanguagePicker.test.tsx`:

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage'
import { fireEvent, screen, waitFor } from '@testing-library/react-native'
import i18n from '@/src/shared/i18n'
import { renderWithProviders } from '@/src/shared/testing/renderWithProviders'
import { LanguagePicker } from '../LanguagePicker'

describe('LanguagePicker', () => {
  beforeEach(async () => {
    await AsyncStorage.clear()
    await i18n.changeLanguage('en')
  })

  it('shows the current language', async () => {
    await renderWithProviders(<LanguagePicker />)

    expect(screen.getByText('English')).toBeTruthy()
  })

  it('switches language and persists the choice when an option is selected', async () => {
    await renderWithProviders(<LanguagePicker />)

    await fireEvent.press(screen.getByTestId('language-row'))
    await fireEvent.press(screen.getByRole('button', { name: 'Tiếng Việt' }))

    await waitFor(() => expect(i18n.language).toBe('vi'))
    expect(await AsyncStorage.getItem('vault-language')).toBe('vi')
  })
})
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx jest src/features/settings/components/__tests__/LanguagePicker.test.tsx`
Expected: FAIL with "Cannot find module '../LanguagePicker'".

- [ ] **Step 7: Implement `LanguagePicker`**

Create `src/features/settings/components/LanguagePicker.tsx`:

```tsx
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { setLanguage, SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/src/shared/i18n'
import { useTheme } from '@/src/shared/theme/ThemeProvider'
import { fonts, radii, type Colors } from '@/src/shared/theme/tokens'

export function LanguagePicker() {
  const { t, i18n } = useTranslation('settings')
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [isOpen, setIsOpen] = useState(false)
  const currentLanguage = i18n.language as SupportedLanguage

  async function handleSelect(language: SupportedLanguage) {
    await setLanguage(language)
    setIsOpen(false)
  }

  return (
    <>
      <Pressable accessibilityRole="button" testID="language-row" style={styles.row} onPress={() => setIsOpen(true)}>
        <Text style={styles.rowLabel}>{t('language.rowLabel')}</Text>
        <Text style={styles.rowValue}>{t(`language.${currentLanguage}`)}</Text>
      </Pressable>

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setIsOpen(false)}>
          <View style={styles.sheet}>
            {SUPPORTED_LANGUAGES.map((language) => (
              <Pressable
                key={language}
                accessibilityRole="button"
                accessibilityState={{ selected: currentLanguage === language }}
                style={styles.sheetOption}
                onPress={() => handleSelect(language)}
              >
                <Text style={[styles.sheetOptionText, currentLanguage === language && styles.sheetOptionTextSelected]}>
                  {t(`language.${language}`)}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  )
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 4,
    },
    rowLabel: {
      fontFamily: fonts.sansMedium,
      fontSize: 13,
      color: colors.ink,
    },
    rowValue: {
      fontFamily: fonts.sans,
      fontSize: 13,
      color: colors.muted,
    },
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.35)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radii.lg,
      borderTopRightRadius: radii.lg,
      paddingVertical: 8,
      paddingHorizontal: 8,
    },
    sheetOption: {
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: radii.sm,
    },
    sheetOptionText: {
      fontFamily: fonts.sans,
      fontSize: 15,
      color: colors.ink,
    },
    sheetOptionTextSelected: {
      fontFamily: fonts.sansSemiBold,
      color: colors.primaryDark,
    },
  })
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx jest src/features/settings/components/__tests__/LanguagePicker.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 9: Write the failing test for `SettingsScreen`**

Create `src/features/settings/screens/__tests__/SettingsScreen.test.tsx`:

```tsx
import { screen } from '@testing-library/react-native'
import { renderWithProviders } from '@/src/shared/testing/renderWithProviders'
import { SettingsScreen } from '../SettingsScreen'

jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn() }) }))

describe('SettingsScreen', () => {
  it('renders the appearance and language sections', async () => {
    await renderWithProviders(<SettingsScreen />)

    expect(screen.getByText('Settings')).toBeTruthy()
    expect(screen.getByText('Appearance')).toBeTruthy()
    expect(screen.getByText('Language')).toBeTruthy()
  })
})
```

- [ ] **Step 10: Run test to verify it fails**

Run: `npx jest src/features/settings/screens/__tests__/SettingsScreen.test.tsx`
Expected: FAIL with "Cannot find module '../SettingsScreen'".

- [ ] **Step 11: Implement `SettingsScreen`, the route, and the feature's public export**

Create `src/features/settings/screens/SettingsScreen.tsx`:

```tsx
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { BackButton } from '@/src/shared/components/BackButton'
import { useTheme } from '@/src/shared/theme/ThemeProvider'
import { fonts, spacing, type Colors } from '@/src/shared/theme/tokens'
import { AppearancePicker } from '../components/AppearancePicker'
import { LanguagePicker } from '../components/LanguagePicker'

export function SettingsScreen() {
  const { t } = useTranslation('settings')
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.title}>{t('title')}</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.sectionLabel}>{t('appearance.sectionLabel')}</Text>
        <View style={styles.card}>
          <AppearancePicker />
        </View>

        <Text style={styles.sectionLabel}>{t('language.sectionLabel')}</Text>
        <View style={styles.card}>
          <LanguagePicker />
        </View>
      </View>
    </SafeAreaView>
  )
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    header: {
      gap: spacing.md,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
      paddingBottom: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    },
    title: {
      fontFamily: fonts.serif,
      fontSize: 21,
      color: colors.ink,
    },
    body: {
      padding: spacing.xl,
      gap: spacing.md,
    },
    sectionLabel: {
      fontFamily: fonts.mono,
      fontSize: 10.5,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: colors.mist,
      marginBottom: -2,
    },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 11,
      padding: 13,
    },
  })
}
```

Replace the full contents of `src/features/settings/index.ts`:

```ts
export { SettingsScreen } from './screens/SettingsScreen'
```

Create `app/(protected)/settings.tsx`:

```tsx
import { SettingsScreen } from '@/src/features/settings'

export default function Settings() {
  return <SettingsScreen />
}
```

- [ ] **Step 12: Run test to verify it passes**

Run: `npx jest src/features/settings/screens/__tests__/SettingsScreen.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 13: Update the feature's `CONTEXT.md`**

Replace the full contents of `src/features/settings/CONTEXT.md`:

```md
# Feature: settings

## Responsibility
Appearance (light/dark/system) and display language (vi default, en) preferences.

## Decisions
- Theme preference and language choice are pure client device preferences, persisted locally only — no server sync, no relation to `/profile`.
- Default language is always `vi` on first launch; never derived from device locale.
- App-lock/biometric settings are explicitly out of scope here (the Mẫu A visual mockup's rows for them were illustration-only) — see `docs/superpowers/specs/2026-09-05-theme-i18n-design.md` §2.
```

- [ ] **Step 14: Run the full settings test suite once more**

Run: `npx jest src/features/settings`
Expected: PASS (5 tests total across the 3 files).

- [ ] **Step 15: Commit**

```bash
git add src/features/settings app/\(protected\)/settings.tsx
git commit -m "feat(mobile): add Settings screen with Appearance and Language"
```

---

## Task 14: Migrate Home + protected layout, add the gear icon to Settings

**Files:**
- Modify: `app/(protected)/index.tsx`

**Interfaces:**
- Consumes: `useTheme` (Task 4), `home` namespace resources (Task 5).
- `app/(protected)/_layout.tsx` was already migrated in Task 6 (needed early since the theme/i18n gate lives at the root).

- [ ] **Step 1: Migrate Home and add the gear icon**

Replace the full contents of `app/(protected)/index.tsx`:

```tsx
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuthStore, useLogout } from '@/src/features/auth'
import { useTheme } from '@/src/shared/theme/ThemeProvider'
import { fonts, radii, spacing, type Colors } from '@/src/shared/theme/tokens'

interface NavCardProps {
  title: string
  subtitle: string
  onPress?: () => void
  comingSoon?: boolean
  styles: ReturnType<typeof createStyles>
}

function NavCard({ title, subtitle, onPress, comingSoon = false, styles }: NavCardProps) {
  const { t } = useTranslation('home')

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: comingSoon }}
      disabled={comingSoon}
      onPress={onPress}
      style={[styles.navCard, comingSoon && styles.navCardDim]}
    >
      <View style={[styles.navIcon, comingSoon && styles.navIconDim]} />
      <View style={styles.navCopy}>
        <Text style={styles.navTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.navSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      {comingSoon ? <Text style={styles.soonTag}>{t('soonTag')}</Text> : <Text style={styles.chevron}>›</Text>}
    </Pressable>
  )
}

export default function Home() {
  const router = useRouter()
  const { t } = useTranslation('home')
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const fullName = useAuthStore((state) => state.user?.fullName)
  const { mutate: logout, isPending: isLoggingOut } = useLogout()

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.eyebrow}>{t('welcome')}</Text>
            <Text style={styles.headerName} numberOfLines={1}>
              {fullName ?? t('defaultName')}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('settingsA11y')}
            style={styles.settingsButton}
            onPress={() => router.push('/(protected)/settings')}
          >
            <Ionicons name="settings-outline" size={20} color={colors.surface} />
          </Pressable>
        </View>
      </View>
      <View style={styles.body}>
        <Text style={styles.sectionLabel}>{t('vaultSection')}</Text>
        <NavCard
          title={t('credentialsTitle')}
          subtitle={t('credentialsSubtitle')}
          onPress={() => router.push('/(protected)/credentials')}
          styles={styles}
        />
        <NavCard
          title={t('documentsTitle')}
          subtitle={t('documentsSubtitle')}
          onPress={() => router.push('/(protected)/documents')}
          styles={styles}
        />
        <NavCard
          title={t('profileTitle')}
          subtitle={t('profileSubtitle')}
          onPress={() => router.push('/(protected)/profile')}
          styles={styles}
        />
        <Pressable accessibilityRole="button" style={styles.logoutButton} disabled={isLoggingOut} onPress={() => logout()}>
          <Text style={styles.logoutText}>{isLoggingOut ? t('loggingOut') : t('logout')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    header: {
      backgroundColor: colors.primaryDark,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xxl,
      paddingBottom: spacing.xxl,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    settingsButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.12)',
    },
    eyebrow: {
      fontFamily: fonts.mono,
      fontSize: 10.5,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: colors.primarySoft,
      marginBottom: 6,
    },
    headerName: {
      fontFamily: fonts.serif,
      fontSize: 24,
      color: colors.surface,
    },
    body: {
      flex: 1,
      padding: spacing.xl,
      gap: spacing.md,
    },
    sectionLabel: {
      fontFamily: fonts.mono,
      fontSize: 10.5,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: colors.mist,
      marginBottom: -2,
    },
    navCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radii.lg,
      padding: spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,
    },
    navCardDim: {
      opacity: 0.55,
    },
    navIcon: {
      width: 38,
      height: 38,
      borderRadius: radii.sm,
      backgroundColor: colors.primarySoft,
      flexShrink: 0,
    },
    navIconDim: {
      backgroundColor: colors.mistSoft,
    },
    navCopy: {
      flex: 1,
      minWidth: 0,
    },
    navTitle: {
      fontFamily: fonts.sansSemiBold,
      fontSize: 14.5,
      color: colors.ink,
    },
    navSubtitle: {
      fontFamily: fonts.sans,
      fontSize: 12,
      color: colors.muted,
    },
    chevron: {
      fontSize: 18,
      color: colors.mist,
    },
    soonTag: {
      fontFamily: fonts.mono,
      fontSize: 9.5,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: colors.mist,
      backgroundColor: colors.mistSoft,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: radii.pill,
      overflow: 'hidden',
    },
    logoutButton: {
      marginTop: 'auto',
      borderWidth: 1,
      borderColor: colors.danger,
      borderRadius: radii.sm,
      paddingVertical: 12,
      alignItems: 'center',
    },
    logoutText: {
      fontFamily: fonts.sansSemiBold,
      fontSize: 13.5,
      color: colors.danger,
    },
  })
}
```

- [ ] **Step 2: Remove the temporary `colors` alias from `tokens.ts` now that every file is migrated**

Run: `grep -rn "import { colors" app src --include="*.tsx" --include="*.ts" | grep -v __tests__`
Expected: no output — every one of the 27 files now imports `useTheme` instead.

Edit `src/shared/theme/tokens.ts`: delete the `colors` export block added in Task 2 Step 1 (the `// TEMPORARY compatibility alias...` comment and `export const colors = lightColors` line).

- [ ] **Step 3: Full verification**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm test`
Expected: PASS — full suite green.

- [ ] **Step 4: Commit**

```bash
git add "app/(protected)/index.tsx" src/shared/theme/tokens.ts
git commit -m "feat(mobile): migrate Home to useTheme + i18n, add Settings entry point, drop temporary colors alias"
```

---

## Task 15: Update `MOBILE-ARCHITECTURE.md`

**Files:**
- Modify: `docs/MOBILE-ARCHITECTURE.md`

**Interfaces:** none — documentation only.

- [ ] **Step 1: Fix the settings feature's responsibility line in §4's feature table**

In `docs/MOBILE-ARCHITECTURE.md` §4 ("Feature Anatomy and Responsibilities"), the `settings` row currently reads:

```
| `settings` | App lock, biometric preference, privacy and session settings |
```

Replace it with:

```
| `settings` | Appearance (light/dark/system) and display language (vi default, en) preferences |
```

- [ ] **Step 2: Commit**

```bash
git add docs/MOBILE-ARCHITECTURE.md
git commit -m "docs(mobile): correct settings feature responsibility to match what was built"
```

---

## Self-Review Notes

- **Spec coverage**: §3.1 theme system → Tasks 2–4, 6, 8–14. §3.2 i18n → Tasks 5, 8–14. §3.3 Settings screen → Task 13, 14. §4 data flow → covered by Task 3/5's store+setLanguage design. §5 testing → Task 7 (shared wrapper), Task 8 (updates the 8 tests that break first), Task 10 (the 1 test Task 8 couldn't have caught yet), Task 13 (new TDD tests). §6 rollout order → Tasks 1–14 follow it, split per-feature as required. §7 risks → the `docType` risk is handled in Task 11; the missing-mockup-file risk is a documentation note for the user, not an engineering task.
- **Type consistency checked**: `ThemeMode`, `Colors`, `SupportedLanguage`, `useTheme()`'s returned shape, and `renderWithProviders`' signature are each defined once (Tasks 3–5, 7) and referenced identically in every later task.
- **Sequencing fix beyond the spec**: the spec didn't anticipate that migrating shared components (`Button`/`TextField`/`BackButton`/`Logo`) would transitively break 8 existing tests before their own screens were migrated, or that removing the flat `colors` export outright would break the other 19 not-yet-migrated files' typecheck for 6 tasks running. Both are fixed by (a) Task 2's temporary `colors` alias, removed only in Task 14, and (b) Task 8 doing the shared-component migration and test-wrapper swap together instead of spreading it across Tasks 9–10.

