// AES-GCM encryption for credential passwords — contract defined in API_SPEC.md §7:
// algorithm AES-GCM/256-bit, 12-byte random IV per value, encoded as
// base64(iv):base64(ciphertext+authTag). The key never leaves the browser (see auth/CONTEXT.md
// for how it's derived) and this module never sends anything to the backend.

const PBKDF2_ITERATIONS = 100_000
const IV_LENGTH_BYTES = 12

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value)
  const bytes = new Uint8Array(new ArrayBuffer(binary.length))
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

/** Derives an AES-256-GCM key from the login password. Same password + userId always yields the
 *  same key, so nothing needs to be persisted for the key to be recoverable across sessions. */
export async function deriveEncryptionKey(password: string, userId: string): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const passwordKey = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveKey',
  ])

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(userId),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encryptValue(plaintext: string, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES))
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext),
  )
  return `${toBase64(iv)}:${toBase64(new Uint8Array(ciphertext))}`
}

export async function decryptValue(encoded: string, key: CryptoKey): Promise<string> {
  const [ivPart, ciphertextPart] = encoded.split(':')
  if (!ivPart || !ciphertextPart) {
    throw new Error('Malformed encrypted value')
  }

  const iv = fromBase64(ivPart)
  const ciphertext = fromBase64(ciphertextPart)
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  return new TextDecoder().decode(plaintext)
}
