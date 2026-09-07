import { QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions, type RenderResult } from '@testing-library/react-native'
import type { ReactElement, ReactNode } from 'react'
import { ThemeProvider } from '@/src/shared/theme/ThemeProvider'
import { createTestQueryClient } from './queryClient'

// Drop-in replacement for RTL's `render` that also wraps `ThemeProvider` and a fresh,
// retry-free `QueryClientProvider` (via the existing `createTestQueryClient`), so any
// component under test can call `useTheme()` and/or React Query hooks without every
// test file re-wiring the same providers.
export function renderWithProviders(ui: ReactElement, options?: RenderOptions): Promise<RenderResult> {
  const queryClient = createTestQueryClient()
  const InnerWrapper = options?.wrapper

  function Wrapper({ children }: { children: ReactNode }) {
    const content = InnerWrapper ? <InnerWrapper>{children}</InnerWrapper> : children
    return (
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>{content}</QueryClientProvider>
      </ThemeProvider>
    )
  }

  return render(ui, { ...options, wrapper: Wrapper })
}
