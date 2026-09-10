# Plan: Password strength indicator

## Goal
While the user is typing a *new* password (register, or the "new password" field
in change-password), show a small line of feedback text below the field
indicating whether the password is weak / medium / strong, color-coded
(red / orange / green), with friendlier wording than a blunt label. Purely
client-side UX — no API or validation-blocking change.

Out of scope: `LoginForm` (existing password, nothing to strengthen),
`CredentialForm` (vault-stored ciphertext for other platforms' passwords, not
the account password).

## Where it applies
- `RegisterForm.tsx` — `password` field
- `ChangePasswordForm.tsx` — `newPassword` field

## Design

### 1. Strength heuristic (pure function, no new dependency)
`src/shared/lib/passwordStrength.ts`
```ts
export type PasswordStrength = 'weak' | 'medium' | 'strong'
export function getPasswordStrength(password: string): PasswordStrength
```
Based on password length + count of character classes present (lowercase,
uppercase, digit, special char). Implemented and pinned via table-driven
unit tests (TDD):

| Classes | Length | Result |
|---|---|---|
| 0–1 | any | weak |
| 2 | < 10 | weak |
| 2 | 10–15 | medium |
| 2 | >= 16 | strong |
| 3–4 | < 12 | medium |
| 3–4 | >= 12 | strong |

Returns `'weak'` for an empty string too; the component decides whether to
render anything (hidden when empty).

### 2. Component
`src/shared/components/PasswordStrengthMeter.tsx`
- Props: `{ password: string }`
- Renders nothing when `password === ''`.
- Otherwise renders one `<p>` styled per level, text from i18n.

### 3. Colors (new semantic tokens, following the existing `--color-danger` pattern)
Add to `src/index.css` `@theme`:
```css
--color-warning: #b8792a;
--color-warning-dark: #8f5c1f;
--color-success: #3f7d4b;
--color-success-dark: #2c5936;
```
Weak → `text-danger` (existing), Medium → `text-warning`, Strong → `text-success`.

### 4. Wording (i18n — `auth.passwordStrength.*` in en/ja/vi)
Friendlier than a flat label, still short enough for a one-line hint:

| Level | vi | en | ja |
|---|---|---|---|
| weak | Mật khẩu còn yếu, hãy thêm chữ hoa, số hoặc ký tự đặc biệt | Weak password — try adding uppercase letters, numbers, or symbols | パスワードが弱いです。大文字・数字・記号を加えてみましょう |
| medium | Mật khẩu khá ổn, có thể mạnh hơn nữa | Decent password — could still be stronger | まずまずの強さです。もう少し強化できます |
| strong | Mật khẩu rất mạnh, an toàn! | Strong password — well secured! | とても強力なパスワードです! |

(Open to tweaking wording on review.)

### 5. Wiring into forms
Each form already uses RHF; add `const password = watch('password')` (or
`watch('newPassword')`) and render `<PasswordStrengthMeter password={password} />`
directly under the existing `<PasswordInput ... />`, above/alongside the Zod
error message. Does not affect submission — Zod's existing `min(8)` rule is
unchanged and still gates submit.

## Acceptance criteria
1. Typing into `RegisterForm`'s password field or `ChangePasswordForm`'s
   `newPassword` field shows a one-line strength hint below the input,
   updating on every keystroke.
2. Hint is hidden entirely when the field is empty (no flash on initial render).
3. Exactly three levels, color-coded: weak = red (`text-danger`), medium =
   orange (`text-warning`, new token), strong = green (`text-success`, new token).
4. Copy matches the table above (vi/en/ja), pulled from i18n, not hardcoded.
5. `getPasswordStrength` is a pure, exported, unit-tested function — no new
   npm dependency (no zxcvbn).
6. Does not change or block existing Zod validation/submit behavior.
7. Login form and CredentialForm are untouched.

## Slices
Single vertical slice, single PR — small, self-contained, one trunk-based PR.

- **Class**: behavior change (new client-only UI feature) → `tdd` + `testing`
  skills.
- Tests: table-driven unit tests for `getPasswordStrength`; component test for
  `PasswordStrengthMeter` (hidden on empty, correct text/color per level);
  lightweight integration check that `RegisterForm`/`ChangePasswordForm`
  render it and update on typing.
- Evidence gate: mutation testing run once at the end (or `N/A` with test
  coverage reasoning if mutation harness isn't wired for this frontend yet).
