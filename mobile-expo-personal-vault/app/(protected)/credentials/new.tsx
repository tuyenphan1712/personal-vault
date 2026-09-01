import { useLocalSearchParams } from 'expo-router'
import { CredentialFormScreen } from '@/src/features/credentials'

export default function NewCredential() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  return <CredentialFormScreen credentialId={id} />
}
