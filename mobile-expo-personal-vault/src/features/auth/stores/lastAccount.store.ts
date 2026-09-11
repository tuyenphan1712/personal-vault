import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface LastAccountState {
  phone: string | null
  hasHydrated: boolean
  setPhone: (phone: string) => void
}

// Non-secret — remembers only the phone number of the most recently logged-in account, so the
// Login screen can pre-fill it. Never stores a password/token; see biometricCredentialStore.ts
// for the actual biometric secret.
export const useLastAccountStore = create<LastAccountState>()(
  persist(
    (set) => ({
      phone: null,
      hasHydrated: false,
      setPhone: (phone) => set({ phone }),
    }),
    {
      name: 'vault-last-account',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ phone: state.phone }),
      onRehydrateStorage: () => () => {
        useLastAccountStore.setState({ hasHydrated: true })
      },
    },
  ),
)
