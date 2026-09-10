import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/src/shared/theme/ThemeProvider'
import type { AuditLogEntry } from '../types/auditLog.types'

interface AuditLogItemProps {
  entry: AuditLogEntry
}

export function AuditLogItem({ entry }: AuditLogItemProps) {
  const { colors, fonts, spacing } = useTheme()
  const { t } = useTranslation('notifications')
  const isUnread = entry.readAt === null

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 10,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.line,
          borderRadius: 11,
          paddingHorizontal: 14,
          paddingVertical: 13,
        },
        dot: {
          width: 8,
          height: 8,
          borderRadius: 4,
          marginTop: 5,
          backgroundColor: isUnread ? colors.primary : 'transparent',
        },
        copy: {
          flex: 1,
          minWidth: 0,
        },
        action: {
          fontFamily: fonts.sans,
          fontSize: 14,
          color: colors.ink,
        },
        target: {
          fontFamily: fonts.sansSemiBold,
        },
        date: {
          fontFamily: fonts.mono,
          fontSize: 11,
          color: colors.muted,
          marginTop: spacing.xs,
        },
      }),
    [colors, fonts, spacing, isUnread],
  )

  return (
    <View style={styles.row}>
      <View style={styles.dot} />
      <View style={styles.copy}>
        <Text style={styles.action}>
          {t(`actions.${entry.action}`)}
          {entry.targetLabel ? <Text style={styles.target}> · {entry.targetLabel}</Text> : null}
        </Text>
        <Text style={styles.date}>{new Date(entry.createdAt).toLocaleString()}</Text>
      </View>
    </View>
  )
}
