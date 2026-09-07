import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useHasEncryptionKey, useIsDerivingKey } from '@/src/shared/lib/crypto/keyStore'
import { BackButton } from '@/src/shared/components/BackButton'
import { Button } from '@/src/shared/components/Button'
import { useTheme } from '@/src/shared/theme/ThemeProvider'
import { CopyableField } from '../components/CopyableField'
import { PasswordReveal } from '../components/PasswordReveal'
import { UnlockVaultPrompt } from '../components/UnlockVaultPrompt'
import { useCredential } from '../hooks/useCredential'
import { useDeleteCredential } from '../hooks/useDeleteCredential'

interface CredentialDetailScreenProps {
  credentialId: string
}

export function CredentialDetailScreen({ credentialId }: CredentialDetailScreenProps) {
  const router = useRouter()
  const { colors, fonts, radii, spacing } = useTheme()
  const { t } = useTranslation(['credentials', 'common'])
  const { data: credential, isLoading, isError } = useCredential(credentialId)
  const deleteCredential = useDeleteCredential()
  const hasKey = useHasEncryptionKey()
  const isDerivingKey = useIsDerivingKey()

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
      padding: spacing.xxl,
    },
    header: {
      gap: spacing.md,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
      paddingBottom: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: radii.md,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    avatarText: {
      fontFamily: fonts.serifSemiBold,
      fontSize: 19,
      color: colors.primaryDark,
    },
    titleCopy: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontFamily: fonts.serif,
      fontSize: 21,
      color: colors.ink,
    },
    body: {
      padding: spacing.xl,
      gap: spacing.xl,
    },
    kvBlock: {
      gap: 6,
    },
    kvLabel: {
      fontFamily: fonts.mono,
      fontSize: 10.5,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: colors.mist,
    },
    kvValue: {
      fontFamily: fonts.sans,
      fontSize: 14.5,
      color: colors.ink,
    },
    errorText: {
      fontFamily: fonts.sans,
      color: colors.danger,
      fontSize: 14,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: 'auto',
    },
    actionButton: {
      flex: 1,
    },
  }),
  [colors, fonts, radii, spacing],
  )

  if (!credentialId) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{t('detail.invalid')}</Text>
      </SafeAreaView>
    )
  }

  if (!hasKey && isDerivingKey) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.errorText}>{t('detail.preparingVault')}</Text>
      </SafeAreaView>
    )
  }

  if (!hasKey) {
    return (
      <SafeAreaView style={styles.container}>
        <UnlockVaultPrompt onUnlocked={() => {}} />
      </SafeAreaView>
    )
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    )
  }

  if (isError || !credential) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{t('detail.notFound')}</Text>
      </SafeAreaView>
    )
  }

  function handleDelete() {
    Alert.alert(
      t('detail.deleteTitle'),
      t('detail.deleteMessage', { platform: credential!.platformName }),
      [
        { text: t('common:actions.cancel'), style: 'cancel' },
        {
          text: t('common:actions.delete'),
          style: 'destructive',
          onPress: () => deleteCredential.mutate(credential!.id, { onSuccess: () => router.back() }),
        },
      ],
    )
  }

  const initial = credential.platformName.trim().charAt(0).toUpperCase() || '?'

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton />
        <View style={styles.titleRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.titleCopy}>
            <Text style={styles.title} numberOfLines={1}>
              {credential.platformName}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        <CopyableField
          label={t('detail.account')}
          value={credential.account}
          onCopied={() => Alert.alert(t('detail.copiedTitle'), t('detail.accountCopied'))}
        />

        <PasswordReveal
          encryptedPassword={credential.encryptedPassword}
          onUnlockNeeded={() => {}}
          onCopied={() => Alert.alert(t('detail.copiedTitle'), t('detail.passwordCopied'))}
        />

        {credential.note ? (
          <View style={styles.kvBlock}>
            <Text style={styles.kvLabel}>{t('detail.note')}</Text>
            <Text style={styles.kvValue}>{credential.note}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Button
            label={t('common:actions.edit')}
            variant="outline"
            style={styles.actionButton}
            onPress={() => router.push({ pathname: '/(protected)/credentials/new', params: { id: credential.id } })}
          />
          <Button label={t('common:actions.delete')} variant="outlineDanger" style={styles.actionButton} onPress={handleDelete} />
        </View>
      </View>
    </SafeAreaView>
  )
}
