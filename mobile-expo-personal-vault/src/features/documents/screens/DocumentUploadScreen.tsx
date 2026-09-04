import { isAxiosError } from 'axios'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { BackButton } from '@/src/shared/components/BackButton'
import { Button } from '@/src/shared/components/Button'
import { TextField } from '@/src/shared/components/TextField'
import { colors, fonts, spacing } from '@/src/shared/theme/tokens'
import { DocumentPickerButton } from '../components/DocumentPickerButton'
import { DocumentTypeSelect } from '../components/DocumentTypeSelect'
import { useUploadDocument } from '../hooks/useUploadDocument'
import type { PickedFile } from '../types/document.types'
import { formatFileSize, validatePickedFile } from '../utils/documentValidation'

export function DocumentUploadScreen() {
  const router = useRouter()
  const uploadDocument = useUploadDocument()
  const [file, setFile] = useState<PickedFile | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [docType, setDocType] = useState('')

  function handlePicked(picked: PickedFile) {
    const validation = validatePickedFile(picked)
    setFileError(validation.errorMessage)
    setFile(picked)
    if (!title) {
      setTitle(picked.name.replace(/\.[^/.]+$/, ''))
    }
  }

  function handleSubmit() {
    if (!file || fileError || !title.trim()) return

    uploadDocument.mutate(
      { file, title: title.trim(), docType: docType || null },
      { onSuccess: () => router.back() },
    )
  }

  const serverErrorMessage = isServerRejection(uploadDocument.error)

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Upload document</Text>

        <DocumentPickerButton onPicked={handlePicked} />

        {file ? (
          <View style={styles.filePreview}>
            <Text style={styles.fileName} numberOfLines={1}>
              {file.name}
            </Text>
            {typeof file.size === 'number' ? (
              <Text style={styles.fileMeta}>{formatFileSize(file.size)}</Text>
            ) : null}
          </View>
        ) : null}

        {fileError ? <Text style={styles.errorText}>{fileError}</Text> : null}

        <TextField label="Title" placeholder="Passport front page" value={title} onChangeText={setTitle} />

        <DocumentTypeSelect value={docType} onChange={setDocType} />

        {serverErrorMessage ? <Text style={styles.errorText}>{serverErrorMessage}</Text> : null}

        <Button
          label="Upload"
          onPress={handleSubmit}
          isLoading={uploadDocument.isPending}
          disabled={!file || Boolean(fileError) || !title.trim()}
          style={styles.submitButton}
        />
      </ScrollView>
    </SafeAreaView>
  )
}

function isServerRejection(error: unknown): string | null {
  if (!isAxiosError(error)) return error ? 'Could not upload this document.' : null
  if (error.response?.status === 413) return 'File is larger than 10MB.'
  if (error.response?.status === 415) return 'Only JPEG, PNG, or PDF files are supported.'
  return 'Could not upload this document.'
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
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
  filePreview: {
    gap: 2,
  },
  fileName: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13.5,
    color: colors.ink,
  },
  fileMeta: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.muted,
  },
  errorText: {
    fontFamily: fonts.sans,
    color: colors.danger,
    fontSize: 13,
  },
  submitButton: {
    marginTop: 4,
  },
})
