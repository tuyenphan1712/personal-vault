import { useLocalSearchParams } from 'expo-router'
import { CredentialDetailScreen } from '@/src/features/credentials'

export default function CredentialDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <CredentialDetailScreen credentialId={id ?? ''} />
}
