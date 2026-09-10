import { useTranslation } from 'react-i18next'
import { getPasswordStrength, type PasswordStrength } from '@/shared/lib/passwordStrength'

interface PasswordStrengthMeterProps {
  password: string
}

const STRENGTH_STYLES: Record<PasswordStrength, string> = {
  weak: 'text-danger',
  medium: 'text-warning',
  strong: 'text-success',
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const { t } = useTranslation()

  if (password === '') return null

  const strength = getPasswordStrength(password)

  return <p className={`text-sm ${STRENGTH_STYLES[strength]}`}>{t(`auth.passwordStrength.${strength}`)}</p>
}
