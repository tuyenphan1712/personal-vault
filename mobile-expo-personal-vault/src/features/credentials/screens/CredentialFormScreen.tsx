import { useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { decryptCredential, encryptCredential } from '@/src/shared/lib/crypto/cryptoAdapter'
import { getEncryptionKey } from '@/src/shared/lib/crypto/keyStore'
import { BackButton } from '@/src/shared/components/BackButton'
import { useTheme } from '@/src/shared/theme/ThemeProvider'
import { CredentialForm, type CredentialFormValues } from '../components/CredentialForm'
import { useCredential } from '../hooks/useCredential'
import { useCreateCredential } from '../hooks/useCreateCredential'
import { useUpdateCredential } from '../hooks/useUpdateCredential'

interface CredentialFormScreenProps {
  credentialId?: string
}

export function CredentialFormScreen({ credentialId }: CredentialFormScreenProps) {
  const router = useRouter()
  const { colors, fonts, spacing } = useTheme()
  const { t } = useTranslation('credentials')
  const isEditing = Boolean(credentialId)
  const { data: existingCredential, isLoading } = useCredential(credentialId ?? '')
  const createCredential = useCreateCredential()
  const updateCredential = useUpdateCredential()
  const isSubmitting = createCredential.isPending || updateCredential.isPending
  const mutationError = createCredential.error ?? updateCredential.error
  const [decryptedValues, setDecryptedValues] = useState<{ password: string; pin: string } | null>(null)
  const [decryptError, setDecryptError] = useState<string | null>(null)

  useEffect(() => {
    const credential = existingCredential
    if (!credential) {
      setDecryptedValues(null)
      return
    }
    const key = getEncryptionKey()
    if (!key) {
      return
    }

    let cancelled = false

    const decryptExisting = async () => {
      try {
        const password = await decryptCredential(credential.encryptedPassword, key)
        const pin = credential.encryptedPin ? await decryptCredential(credential.encryptedPin, key) : ''
        if (!cancelled) {
          setDecryptedValues({ password, pin })
        }
      } catch {
        if (!cancelled) {
          setDecryptError(t('form.decryptError'))
        }
      }
    }

    decryptExisting()

    return () => {
      cancelled = true
    }
  }, [existingCredential, t])

  async function handleSubmit(values: CredentialFormValues) {
    const key = getEncryptionKey()
    if (!key) {
      return
    }

    const encryptedPassword = await encryptCredential(values.password, key)
    const encryptedPin = values.pin ? await encryptCredential(values.pin, key) : null
    const payload = {
      platformName: values.platformName,
      account: values.account,
      encryptedPassword,
      encryptedPin,
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

  const styles = useMemo(
    () =>
      StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    header: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
    },
    content: {
      padding: spacing.xl,
      gap: spacing.lg,
    },
    title: {
      fontFamily: fonts.serif,
      fontSize: 21,
      color: colors.ink,
    },
    errorText: {
      fontFamily: fonts.sans,
      color: colors.danger,
      fontSize: 13,
    },
  }),
  [colors, fonts, spacing],
  )

  const isDecrypting = isEditing && Boolean(existingCredential) && !decryptedValues && !decryptError

  if (isEditing && (isLoading || isDecrypting)) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{isEditing ? t('form.editTitle') : t('form.addTitle')}</Text>
        {decryptError ? <Text style={styles.errorText}>{decryptError}</Text> : null}
        <CredentialForm
          defaultValues={
            existingCredential
              ? {
                  ...existingCredential,
                  password: decryptedValues?.password ?? '',
                  pin: decryptedValues?.pin ?? '',
                  note: existingCredential.note ?? undefined,
                }
              : undefined
          }
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          errorMessage={mutationError ? t('form.saveError') : null}
          submitLabel={isEditing ? t('form.saveChanges') : t('form.addSubmit')}
        />
      </View>
    </SafeAreaView>
  )
}
