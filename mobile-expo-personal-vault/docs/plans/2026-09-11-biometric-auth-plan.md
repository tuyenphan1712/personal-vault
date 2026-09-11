# Plan: Biometric login + vault unlock (mobile)

## Goal

Let a user enable fingerprint/Face ID (device biometrics) once in Settings, then use it in two places instead of typing the password:

1. **Login screen** — a small fingerprint button next to the Login button logs the user back in without retyping phone/password.
2. **Unlock Vault prompt** (credentials) — the same fingerprint button re-derives the client-side encryption key without retyping the password.

Both surfaces are driven by one Settings toggle and one underlying secret.

## Key design decision (confirmed with user)

Biometrics gates a **wrapped copy of the plaintext password**, stored in `expo-secure-store` with `requireAuthentication: true` (iOS Keychain / Android Keystore biometric-bound entry). This is required because:
- Login re-authenticates against the server (`POST /auth/login`), which needs the real password.
- Vault unlock needs `deriveEncryptionKey(password, userId)`, which also needs the real password.

One wrapped secret serves both call sites — no separate mechanism per surface.

**Trade-off accepted**: the plaintext password persists on-device (OS-protected + biometric-gated), rather than only the derived key. This is the standard "biometric login" pattern (matches `MOBILE-PROJECT-RULES.md` §5's "biometrics may unlock a locally protected session/key").

## Non-goals / edge cases folded into slice acceptance criteria (not separate slices)

- Changing the account password (`useChangePassword`) invalidates the wrapped secret — otherwise a stale password would silently produce a wrong derived key / failed login. Handled in Slice 1 (clear-on-change).
- Devices with no biometric hardware or no enrolled biometrics never see the toggle enabled or the fingerprint buttons — capability check is part of Slice 1's adapter.
- No new library beyond `expo-local-authentication` (capability check + prompt orchestration) — `expo-secure-store`'s own `requireAuthentication` handles the OS-level gate on the stored item. Project already ships `expo-dev-client` + native `ios`/`android` folders, so adding this native module is a normal dev-client rebuild, not a new constraint.

## Slices

### Slice 1 — Settings: biometric adapter + enable/disable toggle
**Class**: behavior change (TDD)
**Delivery**: independent PR (trunk)

- New `src/shared/lib/auth/biometricAdapter.ts`: typed interface over `expo-local-authentication` — `isAvailable()` (hardware + enrollment check), `authenticate(promptMessage)`. Testable fallback: returns `unavailable` on unsupported devices/simulators instead of throwing.
- New `src/shared/lib/auth/biometricCredentialStore.ts`: wraps `expo-secure-store` access to a single item (`vault-biometric-credential`, JSON `{ phone, password }`) written with `requireAuthentication: true`; `save`, `read` (triggers OS biometric prompt), `clear`.
- New Zustand `persist` store `src/features/settings/stores/biometric.store.ts` (AsyncStorage-backed boolean `enabled`, mirrors `theme.store.ts` pattern) — this is the non-secret preference flag; the actual secret lives only in SecureStore.
- Settings UI: new toggle row (first `Switch` component in the codebase — plain RN `Switch`) in `SettingsScreen.tsx`, hidden entirely if `biometricAdapter.isAvailable()` is false.
  - Turning ON: prompts for current password in a small confirm modal, calls `deriveEncryptionKey(password, userId)` and compares to the in-memory key from `keyStore` (if the vault happens to be unlocked) to give immediate feedback on a wrong password; otherwise stores directly (no server round trip — same "fails later at usage time" pattern already used by `UnlockVaultPrompt`). On success, `biometricCredentialStore.save({phone, password})` + `enabled = true`.
  - Turning OFF: `biometricCredentialStore.clear()` + `enabled = false`. No confirmation needed.
- `useChangePassword` success handler: also calls `biometricCredentialStore.clear()` + sets `enabled = false`, so a changed password never leaves a stale wrapped secret. Settings row shows biometric as off again after a password change (user must re-enable).

**Acceptance criteria**:
- Toggle is not rendered when the device has no biometric hardware or no enrolled biometrics.
- Enabling requires typing the current password; wrapped secret is only written to SecureStore, never AsyncStorage.
- Disabling clears the SecureStore item immediately.
- A successful password change clears the wrapped secret and flips the preference back off.

### Slice 2 — Login screen: remembered phone + fingerprint button
**Class**: behavior change (TDD)
**Delivery**: independent PR (trunk, depends on Slice 1 merged)

**2a. Remember last logged-in phone**
- New AsyncStorage-backed field (non-secret) — either its own tiny Zustand `persist` store (`src/features/auth/stores/lastAccount.store.ts`, `{ phone: string | null }`) or a field added to an existing auth preference store. On every successful login (biometric or manual), `lastAccount.phone` is set to that account's phone.
- `LoginForm`'s phone input initializes from `lastAccount.phone` when present (manual `defaultValue`/`reset()` on mount, not a controlled forced value — user can still edit it).
- If biometric is enabled, the remembered phone is always the biometric account's phone (they're set together — see below), so the two never disagree.

**2b. "Switch account" affordance**
- A small text+icon control ("Đổi tài khoản" with a small rotate/switch icon) rendered only when a remembered phone exists, positioned between the password field and the Login-button row, right-aligned (per user's UI direction: "ở giữa góc phải của mật khẩu và nút login").
- Tapping it clears the phone field (and any prefilled state) so the user can type a different account's phone number; it does not clear `lastAccount.phone` in storage until a *different* account successfully logs in (so cancelling the switch just leaves the form blank, not stuck).

**2c. Fingerprint button**
- `LoginForm.tsx` layout: replace the single full-width `Button` row with a row containing the Login button (~3.5/5 width) and a new icon-only fingerprint `IconButton` (~1.5/5 width). Fingerprint button renders only when `biometric.store.enabled === true` **and** a wrapped credential currently exists **and** `biometricAdapter.isAvailable()`.
- Press handler: `biometricAdapter.authenticate(...)` → on success, `biometricCredentialStore.read()` → call the existing `useLogin().mutate({phone, password})` (same mutation, no new login path) → normal login/key-derivation flow proceeds unchanged. On success also refresh `lastAccount.phone` (already covered by 2a's "every successful login" rule).
- On biometric failure/cancel: inline error text, no crash, form still usable manually.
- On missing/corrupted SecureStore item (edge case): silently fall back to hiding the button and reset `enabled` to false (self-healing, avoids a permanently broken button).

**Acceptance criteria**:
- After any successful login, the next time the Login screen is shown (e.g. after logout, or app restart with no valid session) the phone field is pre-filled with that account's phone number.
- The "switch account" control appears only when a phone is remembered, sits right-aligned between the password field and the Login/fingerprint row, and clearing it lets the user type a different phone number without touching stored biometric/account data until a new login succeeds.
- Fingerprint button hidden unless enabled + wrapped secret present + device capable.
- Successful biometric prompt logs the user in exactly as typing the password would (server call + key derivation both happen), using the remembered phone.
- Cancelling the OS biometric prompt leaves the login form untouched and shows a non-blocking error.

### Slice 3 — Unlock Vault prompt: fingerprint button
**Class**: behavior change (TDD)
**Delivery**: independent PR (trunk, depends on Slice 1 merged; independent of Slice 2)

- `UnlockVaultPrompt.tsx` gets the identical split layout (Unlock button ~3.5/5 + fingerprint button ~1.5/5), same visibility condition as Slice 2.
- Press handler: `biometricAdapter.authenticate(...)` → `biometricCredentialStore.read()` → feed the retrieved password into the existing `useUnlockVault().unlock(password)` (same derive-and-set-key path as manual entry — no new crypto path).

**Acceptance criteria**:
- Button hidden unless enabled + wrapped secret present + device capable.
- Successful biometric prompt unlocks the vault exactly as typing the password would.
- Cancelling leaves the manual password field usable.

## Testing approach (per slice, via `tdd` + `mobile-test` conventions)

- New Jest mock for `expo-local-authentication` (`hasHardwareAsync`/`isEnrolledAsync`/`authenticateAsync`) following the existing MSW/`jest.spyOn` patterns in `useLogin.test.tsx`.
- Slice 1: adapter unit tests (available/unavailable/error paths), SecureStore wrapper tests (save/read/clear, `requireAuthentication` option asserted), settings toggle component test, change-password-clears-secret integration test.
- Slice 2 & 3: component tests for button visibility conditions + press-flow tests (success, cancel, missing-secret fallback), reusing `renderWithProviders`/`renderHook` patterns already in the auth/credentials test suites.

## PR-readiness gate

`mutation-testing` run once per slice at its own end-of-slice gate (not after every RED/GREEN step), scoped to the new adapter/store/component files for that slice.
