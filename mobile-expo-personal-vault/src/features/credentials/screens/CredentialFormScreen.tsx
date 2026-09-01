import { useRouter } from 'expo-router'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { encryptCredential } from '@/src/shared/lib/crypto/cryptoAdapter'
import { getEncryptionKey } from '@/src/shared/lib/crypto/keyStore'
import { CredentialForm, type CredentialFormValues } from '../components/CredentialForm'
import { useCredential } from '../hooks/useCredential'
import { useCreateCredential } from '../hooks/useCreateCredential'
import { useUpdateCredential } from '../hooks/useUpdateCredential'

interface CredentialFormScreenProps {
  credentialId?: string
}

export function CredentialFormScreen({ credentialId }: CredentialFormScreenProps) {
  const router = useRouter()
  const isEditing = Boolean(credentialId)
  const { data: existingCredential, isLoading } = useCredential(credentialId ?? '')
  const createCredential = useCreateCredential()
  const updateCredential = useUpdateCredential()
  const isSubmitting = createCredential.isPending || updateCredential.isPending
  const mutationError = createCredential.error ?? updateCredential.error

  async function handleSubmit(values: CredentialFormValues) {
    const key = getEncryptionKey()
    if (!key) {
      return
    }

    const encryptedPassword = await encryptCredential(values.password, key)
    const payload = {
      platformName: values.platformName,
      account: values.account,
      encryptedPassword,
      note: values.note || null,
    }

    if (isEditing && existingCredential) {
      updateCredential.mutate(
        { id: existingCredential.id, payload },
        { onSuccess: () => router.back() },
      )
    } else {
      createCredential.mutate(payload, { onSuccess: () => router.back() })
    }
  }

  if (isEditing && isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{isEditing ? 'Edit credential' : 'Add credential'}</Text>
        <CredentialForm
          defaultValues={
            existingCredential
              ? { ...existingCredential, note: existingCredential.note ?? undefined }
              : undefined
          }
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          errorMessage={mutationError ? 'Could not save this credential.' : null}
          submitLabel={isEditing ? 'Save changes' : 'Add credential'}
        />
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
  },
  content: {
    padding: 24,
    gap: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
})
