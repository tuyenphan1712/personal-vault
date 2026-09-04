// Jest runs on Node, not on-device, so the native JSI binding has nothing to link against.
// react-native-quick-crypto's pbkdf2 is a thin wrapper over the same OpenSSL PBKDF2-HMAC
// implementation Node's own `crypto` module uses, so delegating to Node's `crypto.pbkdf2`
// here keeps unit tests exercising real PBKDF2 output instead of a stub that always
// "succeeds" without proving anything about the derived key.
import { pbkdf2 as nodePbkdf2 } from 'crypto'

type Pbkdf2Callback = (err: Error | null, derivedKey?: Buffer) => void

export function pbkdf2(
  password: string,
  salt: string,
  iterations: number,
  keylen: number,
  digest: string,
  callback: Pbkdf2Callback,
): void {
  nodePbkdf2(password, salt, iterations, keylen, digest, callback)
}
