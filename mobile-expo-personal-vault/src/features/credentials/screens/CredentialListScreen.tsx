import { isAxiosError } from 'axios'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { getEncryptionKey } from '@/src/shared/lib/crypto/keyStore'
import { BackButton } from '@/src/shared/components/BackButton'
import { Button } from '@/src/shared/components/Button'
import { colors, fonts, radii, spacing } from '@/src/shared/theme/tokens'
import { CredentialCard } from '../components/CredentialCard'
import { UnlockVaultPrompt } from '../components/UnlockVaultPrompt'
import { useCredentials } from '../hooks/useCredentials'

export function CredentialListScreen() {
  const router = useRouter()
  const { data, isLoading, isError, error, refetch, isRefetching } = useCredentials()
  const [isUnlocked, setIsUnlocked] = useState(() => getEncryptionKey() !== null)

  if (!isUnlocked) {
    return (
      <SafeAreaView style={styles.container}>
        <UnlockVaultPrompt onUnlocked={() => setIsUnlocked(true)} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <BackButton />
          <Pressable accessibilityRole="button" style={styles.addPill} onPress={() => router.push('/(protected)/credentials/new')}>
            <Text style={styles.addPillText}>+ Add</Text>
          </Pressable>
        </View>
        <Text style={styles.title}>Credentials</Text>
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
              : 'Could not load credentials.'}
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
              <Text style={styles.emptyText}>No credentials saved yet.</Text>
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
