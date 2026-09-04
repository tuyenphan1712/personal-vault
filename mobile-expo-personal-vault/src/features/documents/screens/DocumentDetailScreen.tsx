import { useRouter } from 'expo-router'
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { BackButton } from '@/src/shared/components/BackButton'
import { Button } from '@/src/shared/components/Button'
import { colors, fonts, spacing } from '@/src/shared/theme/tokens'
import { useDeleteDocument } from '../hooks/useDeleteDocument'
import { useDocument } from '../hooks/useDocument'
import { useDownloadDocument } from '../hooks/useDownloadDocument'
import { docTypeLabel, formatFileSize } from '../utils/documentValidation'

interface DocumentDetailScreenProps {
  documentId: string
}

export function DocumentDetailScreen({ documentId }: DocumentDetailScreenProps) {
  const router = useRouter()
  const { data: document, isLoading, isError } = useDocument(documentId)
  const deleteDocument = useDeleteDocument()
  const downloadDocument = useDownloadDocument()

  if (!documentId) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Invalid document.</Text>
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

  if (isError || !document) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Document not found.</Text>
      </SafeAreaView>
    )
  }

  function handleDelete() {
    Alert.alert('Delete document', `Delete "${document!.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteDocument.mutate(document!.id, { onSuccess: () => router.back() }),
      },
    ])
  }

  function handleDownload() {
    downloadDocument.mutate(
      { id: document!.id, fileName: document!.title },
      { onError: () => Alert.alert('Download failed', 'Could not download this document.') },
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.title} numberOfLines={2}>
          {document.title}
        </Text>
      </View>

      <View style={styles.body}>
        <View style={styles.kvBlock}>
          <Text style={styles.kvLabel}>Category</Text>
          <Text style={styles.kvValue}>{docTypeLabel(document.docType)}</Text>
        </View>

        <View style={styles.kvBlock}>
          <Text style={styles.kvLabel}>File</Text>
          <Text style={styles.kvValue}>
            {document.mimeType} · {formatFileSize(document.fileSize)}
          </Text>
        </View>

        <View style={styles.kvBlock}>
          <Text style={styles.kvLabel}>Uploaded</Text>
          <Text style={styles.kvValue}>{new Date(document.createdAt).toLocaleDateString()}</Text>
        </View>

        <View style={styles.actions}>
          <Button
            label="Download"
            variant="outline"
            style={styles.actionButton}
            isLoading={downloadDocument.isPending}
            onPress={handleDownload}
          />
          <Button label="Delete" variant="outlineDanger" style={styles.actionButton} onPress={handleDelete} />
        </View>
      </View>
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
})
