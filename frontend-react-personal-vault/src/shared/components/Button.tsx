import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  isLoading?: boolean
  children: ReactNode
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-slate-900 text-white hover:bg-slate-700 focus-visible:outline-slate-900',
  secondary: 'bg-white text-slate-900 border border-slate-300 hover:bg-slate-50 focus-visible:outline-slate-400',
  danger: 'bg-red-600 text-white hover:bg-red-500 focus-visible:outline-red-600',
}

export function Button({
  variant = 'primary',
  isLoading = false,
  disabled,
  children,
  className = '',
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    >
      {isLoading ? 'Loading…' : children}
    </button>
  )
}
