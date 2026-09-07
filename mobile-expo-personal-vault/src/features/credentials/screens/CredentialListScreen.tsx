import { isAxiosError } from 'axios'
import { useRouter } from 'expo-router'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useHasEncryptionKey, useIsDerivingKey } from '@/src/shared/lib/crypto/keyStore'
import { BackButton } from '@/src/shared/components/BackButton'
import { Button } from '@/src/shared/components/Button'
import { useTheme } from '@/src/shared/theme/ThemeProvider'
import { CredentialCard } from '../components/CredentialCard'
import { UnlockVaultPrompt } from '../components/UnlockVaultPrompt'
import { useCredentials } from '../hooks/useCredentials'

export function CredentialListScreen() {
  const router = useRouter()
  const { colors, fonts, radii, spacing } = useTheme()
  const { t } = useTranslation(['credentials', 'common'])
  const { data, isLoading, isError, error, refetch, isRefetching } = useCredentials()
  const hasKey = useHasEncryptionKey()
  const isDerivingKey = useIsDerivingKey()

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
      padding: spacing.xxl,
    },
    header: {
      gap: spacing.md,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    addPill: {
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
      borderRadius: radii.pill,
      paddingHorizontal: 12,
      paddingVertical: 5,
    },
    addPillText: {
      fontFamily: fonts.monoMedium,
      fontSize: 11.5,
      color: colors.primaryDark,
    },
    title: {
      fontFamily: fonts.serif,
      fontSize: 22,
      color: colors.ink,
    },
    listContent: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xxl,
      flexGrow: 1,
    },
    separator: {
      height: 10,
    },
    emptyText: {
      fontFamily: fonts.sans,
      color: colors.muted,
      fontSize: 14,
    },
    errorText: {
      fontFamily: fonts.sans,
      color: colors.danger,
      fontSize: 14,
      textAlign: 'center',
    },
  })

  if (!hasKey && isDerivingKey) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.emptyText}>{t('detail.preparingVault')}</Text>
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <BackButton />
          <Pressable accessibilityRole="button" style={styles.addPill} onPress={() => router.push('/(protected)/credentials/new')}>
            <Text style={styles.addPillText}>{t('list.add')}</Text>
          </Pressable>
        </View>
        <Text style={styles.title}>{t('list.title')}</Text>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>
            {isAxiosError(error) && !error.response ? t('common:status.offline') : t('list.loadError')}
          </Text>
          <Button label={t('common:actions.retry')} variant="outline" onPress={() => refetch()} />
        </View>
      ) : (
        <FlatList
          data={data?.data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>{t('list.empty')}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <CredentialCard credential={item} onPress={(id) => router.push(`/(protected)/credentials/${id}`)} />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  )
}
