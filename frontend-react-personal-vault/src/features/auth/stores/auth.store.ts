import { create } from 'zustand'
import type { CurrentUser } from '../types/Session.types'

interface AuthState {
  user: CurrentUser | null
  isAuthenticated: boolean
  isSessionLoading: boolean
  setSession: (user: CurrentUser) => void
  clearSession: () => void
  setSessionLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isSessionLoading: true,
  setSession: (user) => set({ user, isAuthenticated: true }),
  clearSession: () => set({ user: null, isAuthenticated: false }),
  setSessionLoading: (loading) => set({ isSessionLoading: loading }),
}))
