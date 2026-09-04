import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, fonts, radii } from '@/src/shared/theme/tokens'
import type { DocumentRecord } from '../types/document.types'
import { docTypeLabel, formatFileSize } from '../utils/documentValidation'

interface DocumentCardProps {
  document: DocumentRecord
  onPress: (id: string) => void
}

function extensionLabel(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'PDF'
  if (mimeType === 'image/png') return 'PNG'
  if (mimeType === 'image/jpeg') return 'JPG'
  return 'FILE'
}

export function DocumentCard({ document, onPress }: DocumentCardProps) {
  return (
    <Pressable accessibilityRole="button" style={styles.card} onPress={() => onPress(document.id)}>
      <View style={styles.icon}>
        <Text style={styles.iconText}>{extensionLabel(document.mimeType)}</Text>
      </View>
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={1}>
          {document.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {docTypeLabel(document.docType)} · {formatFileSize(document.fileSize)}
        </Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconText: {
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    color: colors.primaryDark,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.ink,
  },
  meta: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.muted,
  },
})
