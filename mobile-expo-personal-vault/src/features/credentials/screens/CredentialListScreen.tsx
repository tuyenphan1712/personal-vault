import { isAxiosError } from 'axios'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { getEncryptionKey } from '@/src/shared/lib/crypto/keyStore'
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

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator />
      </SafeAreaView>
    )
  }

  if (isError) {
    const isOffline = isAxiosError(error) && !error.response
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>
          {isOffline ? "You're offline. Check your connection and try again." : 'Could not load credentials.'}
        </Text>
        <Pressable accessibilityRole="button" style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </SafeAreaView>
    )
  }

  const credentials = data?.data ?? []

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Credentials</Text>
        <Pressable accessibilityRole="button" onPress={() => router.push('/(protected)/credentials/new')}>
          <Text style={styles.addButton}>Add</Text>
        </Pressable>
      </View>
      <FlatList
        data={credentials}
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
    gap: 12,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  addButton: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  separator: {
    height: 10,
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
})
