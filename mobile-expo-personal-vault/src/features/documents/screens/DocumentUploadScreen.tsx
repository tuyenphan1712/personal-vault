import { isAxiosError } from 'axios'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { BackButton } from '@/src/shared/components/BackButton'
import { Button } from '@/src/shared/components/Button'
import { TextField } from '@/src/shared/components/TextField'
import { useTheme } from '@/src/shared/theme/ThemeProvider'
import { DocumentPickerButton } from '../components/DocumentPickerButton'
import { DocumentTypeSelect } from '../components/DocumentTypeSelect'
import { useUploadDocument } from '../hooks/useUploadDocument'
import type { PickedFile } from '../types/document.types'
import { formatFileSize, validatePickedFile, type FileValidationErrorCode } from '../utils/documentValidation'

export function DocumentUploadScreen() {
  const router = useRouter()
  const { colors, fonts, spacing } = useTheme()
  const { t } = useTranslation('documents')
  const uploadDocument = useUploadDocument()
  const [file, setFile] = useState<PickedFile | null>(null)
  const [fileErrorCode, setFileErrorCode] = useState<FileValidationErrorCode | null>(null)
  const [title, setTitle] = useState('')
  const [docType, setDocType] = useState('')

  function handlePicked(picked: PickedFile) {
    const validation = validatePickedFile(picked)
    setFileErrorCode(validation.errorCode)
    setFile(picked)
    if (!title) {
      setTitle(picked.name.replace(/\.[^/.]+$/, ''))
    }
  }

  function handleSubmit() {
    if (!file || fileErrorCode || !title.trim()) return

    uploadDocument.mutate(
      { file, title: title.trim(), docType: docType || null },
      { onSuccess: () => router.back() },
    )
  }

  const serverErrorCode = getServerErrorCode(uploadDocument.error)

  const styles = useMemo(
    () =>
      StyleSheet.create({
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
  }),
  [colors, fonts, spacing],
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('upload.title')}</Text>

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

        {fileErrorCode ? <Text style={styles.errorText}>{t(`upload.${fileErrorCode}`)}</Text> : null}

        <TextField label={t('upload.titleLabel')} placeholder={t('upload.titlePlaceholder')} value={title} onChangeText={setTitle} />

        <DocumentTypeSelect value={docType} onChange={setDocType} />

        {serverErrorCode ? <Text style={styles.errorText}>{t(`upload.${serverErrorCode}`)}</Text> : null}

        <Button
          label={t('upload.submit')}
          onPress={handleSubmit}
          isLoading={uploadDocument.isPending}
          disabled={!file || Boolean(fileErrorCode) || !title.trim()}
          style={styles.submitButton}
        />
      </ScrollView>
    </SafeAreaView>
  )
}

type ServerErrorCode = FileValidationErrorCode | 'genericError'

function getServerErrorCode(error: unknown): ServerErrorCode | null {
  if (!isAxiosError(error)) return error ? 'genericError' : null
  if (error.response?.status === 413) return 'tooLarge'
  if (error.response?.status === 415) return 'unsupportedType'
  return 'genericError'
}
