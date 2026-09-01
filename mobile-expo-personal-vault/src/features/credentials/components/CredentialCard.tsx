import { Pressable, StyleSheet, Text } from 'react-native'
import type { Credential } from '../types/credential.types'

interface CredentialCardProps {
  credential: Credential
  onPress: (id: string) => void
}

export function CredentialCard({ credential, onPress }: CredentialCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      style={styles.card}
      onPress={() => onPress(credential.id)}
    >
      <Text style={styles.platform}>{credential.platformName}</Text>
      <Text style={styles.account}>{credential.account}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 4,
  },
  platform: {
    fontSize: 16,
    fontWeight: '600',
  },
  account: {
    fontSize: 14,
    color: '#666',
  },
})
