import * as Crypto from 'expo-crypto'
import { decryptCredential, deriveEncryptionKey, encryptCredential } from '../cryptoAdapter'

const consoleLogSpy = jest.spyOn(console, 'log')
const consoleWarnSpy = jest.spyOn(console, 'warn')
const consoleErrorSpy = jest.spyOn(console, 'error')

afterEach(() => {
  consoleLogSpy.mockClear()
  consoleWarnSpy.mockClear()
  consoleErrorSpy.mockClear()
})

describe('deriveEncryptionKey', () => {
  it('matches the known PBKDF2-SHA256 test vector (100k iterations, salt = user id)', async () => {
    const key = await deriveEncryptionKey('correct horse battery staple', 'user-42')

    // Fixed vector, cross-checked against Node's crypto.pbkdf2Sync and Python's hashlib.pbkdf2_hmac:
    // PBKDF2-HMAC-SHA256('correct horse battery staple', 'user-42', 100_000, 32 bytes).
    expect(Buffer.from(key).toString('hex')).toBe(
      '8f3ea7def4707e96f599a1b5a02fbd89eea28f0faf94b77081491914bca677ef',
    )
  })

  it('is deterministic for the same password and user id', async () => {
    const key1 = await deriveEncryptionKey('hunter2', 'user-1')
    const key2 = await deriveEncryptionKey('hunter2', 'user-1')

    expect(key1).toEqual(key2)
  })

  it('derives a different key for a different user id (salt)', async () => {
    const key1 = await deriveEncryptionKey('hunter2', 'user-1')
    const key2 = await deriveEncryptionKey('hunter2', 'user-2')

    expect(key1).not.toEqual(key2)
  })

  it('derives a 32-byte key', async () => {
    const key = await deriveEncryptionKey('hunter2', 'user-1')
    expect(key).toHaveLength(32)
  })
})

describe('encryptCredential / decryptCredential', () => {
  it('round-trips a plaintext password', async () => {
    const key = await deriveEncryptionKey('hunter2', 'user-1')
    const encoded = await encryptCredential('my-gmail-password', key)

    expect(await decryptCredential(encoded, key)).toBe('my-gmail-password')
  })

  it('encodes as base64(iv):base64(ciphertext+authTag) with a 12-byte iv', async () => {
    const key = await deriveEncryptionKey('hunter2', 'user-1')
    const encoded = await encryptCredential('my-gmail-password', key)

    const [ivPart, ciphertextPart] = encoded.split(':')
    expect(ivPart).toBeTruthy()
    expect(ciphertextPart).toBeTruthy()
    expect(Buffer.from(ivPart, 'base64')).toHaveLength(12)
    // ciphertext (plaintext length) + 16-byte GCM auth tag
    expect(Buffer.from(ciphertextPart, 'base64')).toHaveLength('my-gmail-password'.length + 16)
  })

  it('draws a fresh iv from the CSPRNG on every call, even for the same plaintext', async () => {
    // jest-expo auto-mocks expo-crypto's native module with a fixed all-zero return, which would make
    // every IV identical under Jest regardless of whether the adapter re-requests bytes each call — so
    // this test controls the RNG directly to prove getRandomBytesAsync is invoked fresh per encryption,
    // not cached/reused. Real randomness on-device is the CSPRNG's responsibility, not this adapter's.
    const getRandomBytesSpy = jest.spyOn(Crypto, 'getRandomBytesAsync')
    getRandomBytesSpy.mockResolvedValueOnce(new Uint8Array(12).fill(1))
    getRandomBytesSpy.mockResolvedValueOnce(new Uint8Array(12).fill(2))

    const key = await deriveEncryptionKey('hunter2', 'user-1')
    const first = await encryptCredential('same-password', key)
    const second = await encryptCredential('same-password', key)

    expect(getRandomBytesSpy).toHaveBeenCalledTimes(2)
    expect(first).not.toBe(second)
    expect(first.split(':')[0]).not.toBe(second.split(':')[0])

    getRandomBytesSpy.mockRestore()
  })

  it('throws when decrypting with the wrong key', async () => {
    const key = await deriveEncryptionKey('hunter2', 'user-1')
    const wrongKey = await deriveEncryptionKey('wrong-password', 'user-1')
    const encoded = await encryptCredential('my-gmail-password', key)

    await expect(decryptCredential(encoded, wrongKey)).rejects.toThrow()
  })

  it('throws on a malformed encoded value', async () => {
    const key = await deriveEncryptionKey('hunter2', 'user-1')

    await expect(decryptCredential('not-a-valid-encoded-value', key)).rejects.toThrow('Malformed encrypted value')
  })

  it('never logs the plaintext or the key during encrypt/decrypt', async () => {
    const key = await deriveEncryptionKey('hunter2', 'user-1')
    const plaintext = 'super-secret-password-12345'
    const encoded = await encryptCredential(plaintext, key)
    await decryptCredential(encoded, key)

    const allLoggedArgs = [...consoleLogSpy.mock.calls, ...consoleWarnSpy.mock.calls, ...consoleErrorSpy.mock.calls]
      .flat()
      .map((arg) => JSON.stringify(arg))
      .join('\n')

    expect(allLoggedArgs).not.toContain(plaintext)
    expect(allLoggedArgs).not.toContain(Buffer.from(key).toString('hex'))
  })
})
