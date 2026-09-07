import * as DocumentPicker from 'expo-document-picker'
import * as ImagePicker from 'expo-image-picker'
import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { ALLOWED_DOCUMENT_TYPES } from '@/src/config/constants'
import { useTheme } from '@/src/shared/theme/ThemeProvider'
import type { PickedFile } from '../types/document.types'

interface DocumentPickerButtonProps {
  onPicked: (file: PickedFile) => void
}

export function DocumentPickerButton({ onPicked }: DocumentPickerButtonProps) {
  const { colors, fonts, radii } = useTheme()
  const { t } = useTranslation('documents')

  async function handlePickFile() {
    const result = await DocumentPicker.getDocumentAsync({
      type: [...ALLOWED_DOCUMENT_TYPES],
      copyToCacheDirectory: true,
      multiple: false,
    })

    if (result.canceled || result.assets.length === 0) return

    const asset = result.assets[0]
    onPicked({
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType ?? 'application/octet-stream',
      size: asset.size,
    })
  }

  async function handlePickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) return

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
    })

    if (result.canceled || result.assets.length === 0) return

    const asset = result.assets[0]
    const fileName = asset.fileName ?? `photo-${Date.now()}.jpg`
    onPicked({
      uri: asset.uri,
      name: fileName,
      mimeType: asset.mimeType ?? 'image/jpeg',
      size: asset.fileSize,
    })
  }

  const styles = useMemo(
    () =>
      StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: 10,
    },
    button: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
      borderRadius: radii.sm,
      paddingVertical: 12,
      alignItems: 'center',
    },
    buttonText: {
      fontFamily: fonts.sansSemiBold,
      fontSize: 13.5,
      color: colors.primaryDark,
    },
  }),
  [colors, fonts, radii],
  )

  return (
    <View style={styles.row}>
      <Pressable accessibilityRole="button" style={styles.button} onPress={handlePickFile}>
        <Text style={styles.buttonText}>{t('upload.chooseFile')}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" style={styles.button} onPress={handlePickPhoto}>
        <Text style={styles.buttonText}>{t('upload.choosePhoto')}</Text>
      </Pressable>
    </View>
  )
}
