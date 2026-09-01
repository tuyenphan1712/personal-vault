import type { CredentialKey } from './cryptoAdapter'

// In-memory only — the derived encryption key must never be written to AsyncStorage/SecureStore,
// and never sent to the backend. Lost on app restart/lock, same trade-off as the web client.
let encryptionKey: CredentialKey | null = null

export function getEncryptionKey(): CredentialKey | null {
  return encryptionKey
}

export function setEncryptionKey(key: CredentialKey | null): void {
  encryptionKey = key
}
