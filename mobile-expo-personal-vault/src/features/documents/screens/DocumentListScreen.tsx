import { isAxiosError } from 'axios'
import { useRouter } from 'expo-router'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { BackButton } from '@/src/shared/components/BackButton'
import { Button } from '@/src/shared/components/Button'
import { colors, fonts, radii, spacing } from '@/src/shared/theme/tokens'
import { DocumentCard } from '../components/DocumentCard'
import { useDocuments } from '../hooks/useDocuments'

export function DocumentListScreen() {
  const router = useRouter()
  const { data, isLoading, isError, error, refetch, isRefetching } = useDocuments()

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <BackButton />
          <Pressable accessibilityRole="button" style={styles.addPill} onPress={() => router.push('/(protected)/documents/upload')}>
            <Text style={styles.addPillText}>+ Upload</Text>
          </Pressable>
        </View>
        <Text style={styles.title}>Documents</Text>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>
            {isAxiosError(error) && !error.response
              ? "You're offline. Check your connection and try again."
              : 'Could not load documents.'}
          </Text>
          <Button label="Retry" variant="outline" onPress={() => refetch()} />
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
              <Text style={styles.emptyText}>No documents uploaded yet.</Text>
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
