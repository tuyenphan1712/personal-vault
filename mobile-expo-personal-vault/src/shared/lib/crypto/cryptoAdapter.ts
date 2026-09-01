import { gcm } from '@noble/ciphers/aes.js'
import { pbkdf2Async } from '@noble/hashes/pbkdf2.js'
import { sha256 } from '@noble/hashes/sha2.js'
import * as Crypto from 'expo-crypto'

// AES-GCM encryption for credential passwords — contract defined in API_SPEC.md §7 and mirrored
// from the web client's shared/lib/crypto.ts so a credential encrypted on one platform decrypts
// on the other: PBKDF2-SHA256 (salt = userId, 100k iterations) -> AES-256-GCM key, 12-byte random
// IV per value, encoded as base64(iv):base64(ciphertext+authTag). The key never leaves the device
// and this module never sends anything to the backend.
const PBKDF2_ITERATIONS = 100_000
const KEY_LENGTH_BYTES = 32
const IV_LENGTH_BYTES = 12

// Opaque in-memory key handle produced by deriveEncryptionKey; never persisted or logged.
export type CredentialKey = Uint8Array

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function bytesToBase64(bytes: Uint8Array): string {
  let result = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i]
    const b1 = bytes[i + 1]
    const b2 = bytes[i + 2]
    result += BASE64_CHARS[b0 >> 2]
    result += BASE64_CHARS[((b0 & 0x03) << 4) | (b1 === undefined ? 0 : b1 >> 4)]
    result += b1 === undefined ? '=' : BASE64_CHARS[((b1 & 0x0f) << 2) | (b2 === undefined ? 0 : b2 >> 6)]
    result += b2 === undefined ? '=' : BASE64_CHARS[b2 & 0x3f]
  }
  return result
}

function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/=+$/, '')
  const bytes: number[] = []
  let buffer = 0
  let bitsCollected = 0
  for (const char of clean) {
    const value = BASE64_CHARS.indexOf(char)
    if (value === -1) continue
    buffer = (buffer << 6) | value
    bitsCollected += 6
    if (bitsCollected >= 8) {
      bitsCollected -= 8
      bytes.push((buffer >> bitsCollected) & 0xff)
    }
  }
  return new Uint8Array(bytes)
}

/** Derives an AES-256-GCM key from the login password. Same password + userId always yields the
 *  same key, so nothing needs to be persisted for the key to be recoverable across sessions —
 *  matches the web client's deriveEncryptionKey exactly. */
export async function deriveEncryptionKey(password: string, userId: string): Promise<CredentialKey> {
  return pbkdf2Async(sha256, password, userId, { c: PBKDF2_ITERATIONS, dkLen: KEY_LENGTH_BYTES })
}

export async function encryptCredential(plaintext: string, key: CredentialKey): Promise<string> {
  const iv = await Crypto.getRandomBytesAsync(IV_LENGTH_BYTES)
  const ciphertext = gcm(key, iv).encrypt(new TextEncoder().encode(plaintext))
  return `${bytesToBase64(iv)}:${bytesToBase64(ciphertext)}`
}

export async function decryptCredential(encoded: string, key: CredentialKey): Promise<string> {
  const [ivPart, ciphertextPart] = encoded.split(':')
  if (!ivPart || !ciphertextPart) {
    throw new Error('Malformed encrypted value')
  }

  const iv = base64ToBytes(ivPart)
  const ciphertext = base64ToBytes(ciphertextPart)
  const plaintext = gcm(key, iv).decrypt(ciphertext)
  return new TextDecoder().decode(plaintext)
}
