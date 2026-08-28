interface ToastProps {
  message: string | null
}

export function Toast({ message }: ToastProps) {
  if (!message) {
    return null
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-7 z-50 flex justify-center">
      <div className="rounded-lg bg-ink px-4 py-3 text-sm text-surface shadow-lg">{message}</div>
    </div>
  )
}
