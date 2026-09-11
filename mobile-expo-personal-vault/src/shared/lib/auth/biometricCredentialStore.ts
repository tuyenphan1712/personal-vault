import * as SecureStore from 'expo-secure-store'

const BIOMETRIC_CREDENTIAL_KEY = 'auth.biometricCredential'

export interface BiometricCredential {
  phone: string
  password: string
}

// `requireAuthentication: true` makes the OS gate this entry behind the device's biometric
// prompt (Keychain biometryCurrentSet on iOS, Keystore user-authentication-required key on
// Android) — reading it *is* the biometric authentication step, so callers never need a
// separate `authenticateAsync()` call before reading.
export async function saveBiometricCredential(credential: BiometricCredential): Promise<void> {
  await SecureStore.setItemAsync(BIOMETRIC_CREDENTIAL_KEY, JSON.stringify(credential), {
    requireAuthentication: true,
  })
}

export async function readBiometricCredential(): Promise<BiometricCredential | null> {
  const raw = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIAL_KEY, { requireAuthentication: true })
  return raw ? (JSON.parse(raw) as BiometricCredential) : null
}

export async function clearBiometricCredential(): Promise<void> {
  await SecureStore.deleteItemAsync(BIOMETRIC_CREDENTIAL_KEY)
}
