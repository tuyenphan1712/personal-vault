import { isAxiosError } from 'axios'
import { useRouter } from 'expo-router'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { BackButton } from '@/src/shared/components/BackButton'
import { Button } from '@/src/shared/components/Button'
import { useTheme } from '@/src/shared/theme/ThemeProvider'
import { DocumentCard } from '../components/DocumentCard'
import { useDocuments } from '../hooks/useDocuments'

export function DocumentListScreen() {
  const router = useRouter()
  const { colors, fonts, radii, spacing } = useTheme()
  const { t } = useTranslation(['documents', 'common'])
  const { data, isLoading, isError, error, refetch, isRefetching } = useDocuments()

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <BackButton />
          <Pressable accessibilityRole="button" style={styles.addPill} onPress={() => router.push('/(protected)/documents/upload')}>
            <Text style={styles.addPillText}>{t('list.upload')}</Text>
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
            <DocumentCard document={item} onPress={(id) => router.push(`/(protected)/documents/${id}`)} />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  )
}
