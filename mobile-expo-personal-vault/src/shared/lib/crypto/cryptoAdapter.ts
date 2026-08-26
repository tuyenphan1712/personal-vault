import { CIPHERTEXT_VERSION } from '../../../config/constants'

export interface EncryptedPayload {
  ciphertextVersion: typeof CIPHERTEXT_VERSION
  ciphertext: string
  iv: string
}

// Opaque in-memory key handle — shape depends on the native AES-GCM library chosen for this adapter.
export type CredentialKey = unknown

// Placeholder boundary for the shared AES-GCM credential encryption format (see MOBILE-ARCHITECTURE.md §7).
// Wire an Expo-compatible AES-GCM implementation here before the credentials feature ships;
// screens/components must never encrypt or decrypt directly.
export async function encryptCredential(_plaintext: string, _key: CredentialKey): Promise<EncryptedPayload> {
  throw new Error('encryptCredential is not implemented yet')
}

export async function decryptCredential(_payload: EncryptedPayload, _key: CredentialKey): Promise<string> {
  throw new Error('decryptCredential is not implemented yet')
}
