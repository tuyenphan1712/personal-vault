// In-memory only — the derived encryption key must never be written to
// localStorage/sessionStorage, and never sent to the backend.
let encryptionKey: CryptoKey | null = null

export function getEncryptionKey(): CryptoKey | null {
  return encryptionKey
}

export function setEncryptionKey(key: CryptoKey | null): void {
  encryptionKey = key
}
