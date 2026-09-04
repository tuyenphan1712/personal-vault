import { create } from 'zustand'
import type { CredentialKey } from './cryptoAdapter'

// In-memory only — the derived encryption key must never be written to AsyncStorage/SecureStore,
// and never sent to the backend. Lost on app restart/lock, same trade-off as the web client.
interface KeyState {
  key: CredentialKey | null
  isDeriving: boolean
}

const useKeyStore = create<KeyState>(() => ({ key: null, isDeriving: false }))

export function getEncryptionKey(): CredentialKey | null {
  return useKeyStore.getState().key
}

export function setEncryptionKey(key: CredentialKey | null): void {
  useKeyStore.setState({ key })
}

// Set while useLogin derives the key in the background after the session is already active, so
// credentials screens can tell "still deriving from the password just entered at login" (isDeriving)
// apart from "key missing after a cold restart" (neither key nor isDeriving) — the former should
// show a passive wait state, the latter should prompt for the password via UnlockVaultPrompt.
export function setIsDerivingKey(isDeriving: boolean): void {
  useKeyStore.setState({ isDeriving })
}

export function useHasEncryptionKey(): boolean {
  return useKeyStore((state) => state.key !== null)
}

export function useIsDerivingKey(): boolean {
  return useKeyStore((state) => state.isDeriving)
}
