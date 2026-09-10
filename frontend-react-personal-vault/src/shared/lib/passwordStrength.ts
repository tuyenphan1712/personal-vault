export type PasswordStrength = 'weak' | 'medium' | 'strong'

const CHARACTER_CLASS_PATTERNS = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/]

function countCharacterClasses(password: string): number {
  return CHARACTER_CLASS_PATTERNS.filter((pattern) => pattern.test(password)).length
}

export function getPasswordStrength(password: string): PasswordStrength {
  const length = password.length
  const classes = countCharacterClasses(password)

  if (classes <= 1) return 'weak'

  if (classes === 2) {
    if (length < 10) return 'weak'
    if (length >= 16) return 'strong'
    return 'medium'
  }

  return length >= 12 ? 'strong' : 'medium'
}
