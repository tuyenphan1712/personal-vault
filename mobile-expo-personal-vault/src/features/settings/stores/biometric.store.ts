import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface BiometricState {
  enabled: boolean
  setEnabled: (enabled: boolean) => void
}

// Non-secret preference flag only — the actual wrapped password lives in SecureStore
// (`biometricCredentialStore.ts`) and is kept in lockstep with this flag by its callers.
export const useBiometricStore = create<BiometricState>()(
  persist(
    (set) => ({
      enabled: false,
      setEnabled: (enabled) => set({ enabled }),
    }),
    {
      name: 'vault-biometric-login',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ enabled: state.enabled }),
    },
  ),
)
