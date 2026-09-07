import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTheme } from '@/src/shared/theme/ThemeProvider'
import type { DocumentRecord } from '../types/document.types'
import { useDocTypeLabel } from '../hooks/useDocTypeLabel'
import { formatFileSize } from '../utils/documentValidation'

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
  const { colors, fonts, radii } = useTheme()
  const docTypeLabel = useDocTypeLabel()

  const styles = useMemo(
    () =>
      StyleSheet.create({
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
      }),
    [colors, fonts, radii],
  )

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
