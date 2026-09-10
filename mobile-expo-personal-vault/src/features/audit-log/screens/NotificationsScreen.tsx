import { isAxiosError } from 'axios'
import { useEffect, useMemo } from 'react'
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { BackButton } from '@/src/shared/components/BackButton'
import { Button } from '@/src/shared/components/Button'
import { useTheme } from '@/src/shared/theme/ThemeProvider'
import { AuditLogItem } from '../components/AuditLogItem'
import { useAuditLogs } from '../hooks/useAuditLogs'
import { useMarkAllRead } from '../hooks/useMarkAllRead'

export function NotificationsScreen() {
  const { colors, fonts, spacing } = useTheme()
  const { t } = useTranslation(['notifications', 'common'])
  const { data, isLoading, isError, error, refetch, isRefetching } = useAuditLogs()
  const markAllRead = useMarkAllRead()

  useEffect(() => {
    markAllRead.mutate()
    // Mark-all-read fires once when the screen mounts, mirroring the web dropdown's
    // "opening it marks everything read" behavior — intentionally not re-run on refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      }),
    [colors, fonts, spacing],
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.title}>{t('notifications:title')}</Text>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>
            {isAxiosError(error) && !error.response ? t('common:status.offline') : t('notifications:loadError')}
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
              <Text style={styles.emptyText}>{t('notifications:empty')}</Text>
            </View>
          }
          renderItem={({ item }) => <AuditLogItem entry={item} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  )
}
