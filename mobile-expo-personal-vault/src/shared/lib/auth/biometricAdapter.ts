import * as LocalAuthentication from 'expo-local-authentication'

export type BiometricAvailability = 'available' | 'no-hardware' | 'not-enrolled'

/** Capability check only — the actual biometric prompt happens as a side effect of reading the
 *  wrapped credential from SecureStore with `requireAuthentication: true` (see
 *  `biometricCredentialStore.ts`), so this adapter never triggers a prompt itself. */
export async function getBiometricAvailability(): Promise<BiometricAvailability> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync()
  if (!hasHardware) {
    return 'no-hardware'
  }

  const isEnrolled = await LocalAuthentication.isEnrolledAsync()
  return isEnrolled ? 'available' : 'not-enrolled'
}
