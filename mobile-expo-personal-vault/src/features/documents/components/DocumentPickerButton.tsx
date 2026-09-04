import * as DocumentPicker from 'expo-document-picker'
import * as ImagePicker from 'expo-image-picker'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ALLOWED_DOCUMENT_TYPES } from '@/src/config/constants'
import { colors, fonts, radii } from '@/src/shared/theme/tokens'
import type { PickedFile } from '../types/document.types'

interface DocumentPickerButtonProps {
  onPicked: (file: PickedFile) => void
}

export function DocumentPickerButton({ onPicked }: DocumentPickerButtonProps) {
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

  return (
    <View style={styles.row}>
      <Pressable accessibilityRole="button" style={styles.button} onPress={handlePickFile}>
        <Text style={styles.buttonText}>Choose file</Text>
      </Pressable>
      <Pressable accessibilityRole="button" style={styles.button} onPress={handlePickPhoto}>
        <Text style={styles.buttonText}>Choose photo</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
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
})
