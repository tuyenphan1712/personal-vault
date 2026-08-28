import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, id, className = '', ...rest },
  ref,
) {
  const inputId = id ?? rest.name
  const errorId = error ? `${inputId}-error` : undefined

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        className={`rounded-md border px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline focus:outline-2 focus:outline-offset-1 ${
          error ? 'border-red-500 focus:outline-red-500' : 'border-slate-300 focus:outline-slate-400'
        } ${className}`}
        {...rest}
      />
      {error ? (
        <p id={errorId} className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  )
})
