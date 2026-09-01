import { useRouter } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { getEncryptionKey } from '@/src/shared/lib/crypto/keyStore'
import { PasswordReveal } from '../components/PasswordReveal'
import { UnlockVaultPrompt } from '../components/UnlockVaultPrompt'
import { useCredential } from '../hooks/useCredential'
import { useDeleteCredential } from '../hooks/useDeleteCredential'

interface CredentialDetailScreenProps {
  credentialId: string
}

export function CredentialDetailScreen({ credentialId }: CredentialDetailScreenProps) {
  const router = useRouter()
  const { data: credential, isLoading, isError } = useCredential(credentialId)
  const deleteCredential = useDeleteCredential()
  const [isUnlocked, setIsUnlocked] = useState(() => getEncryptionKey() !== null)

  if (!credentialId) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Invalid credential.</Text>
      </SafeAreaView>
    )
  }

  if (!isUnlocked) {
    return (
      <SafeAreaView style={styles.container}>
        <UnlockVaultPrompt onUnlocked={() => setIsUnlocked(true)} />
      </SafeAreaView>
    )
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator />
      </SafeAreaView>
    )
  }

  if (isError || !credential) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Credential not found.</Text>
      </SafeAreaView>
    )
  }

  function handleDelete() {
    Alert.alert('Delete credential', `Delete "${credential!.platformName}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteCredential.mutate(credential!.id, { onSuccess: () => router.back() }),
      },
    ])
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{credential.platformName}</Text>
        <Text style={styles.account}>{credential.account}</Text>

        <PasswordReveal
          encryptedPassword={credential.encryptedPassword}
          onUnlockNeeded={() => setIsUnlocked(false)}
          onCopied={() => Alert.alert('Copied', 'Password copied to clipboard.')}
        />

        {credential.note ? <Text style={styles.note}>{credential.note}</Text> : null}

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            style={styles.editButton}
            onPress={() => router.push({ pathname: '/(protected)/credentials/new', params: { id: credential.id } })}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Delete</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  account: {
    fontSize: 16,
    color: '#666',
  },
  note: {
    fontSize: 14,
    color: '#444',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  editButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#2563eb',
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#dc2626',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#dc2626',
    fontWeight: '600',
  },
})
