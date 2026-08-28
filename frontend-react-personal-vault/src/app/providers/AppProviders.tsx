import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useSessionBootstrap } from '../../features/auth'
import { queryClient } from '../../shared/lib/queryClient'

interface AppProvidersProps {
  children: ReactNode
}

function SessionBootstrap({ children }: { children: ReactNode }) {
  useSessionBootstrap()
  return children
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionBootstrap>{children}</SessionBootstrap>
    </QueryClientProvider>
  )
}
