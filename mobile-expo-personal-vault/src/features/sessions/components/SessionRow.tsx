import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Button } from '@/src/shared/components/Button'
import { useTheme } from '@/src/shared/theme/ThemeProvider'
import type { Session } from '../types/session.types'

interface SessionRowProps {
  session: Session
  onRevoke: (session: Session) => void
}

export function SessionRow({ session, onRevoke }: SessionRowProps) {
  const { colors, fonts, spacing } = useTheme()
  const { t } = useTranslation('sessions')

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.line,
          borderRadius: 11,
          paddingHorizontal: 14,
          paddingVertical: 12,
        },
        copy: {
          flex: 1,
          minWidth: 0,
        },
        clientType: {
          fontFamily: fonts.sansSemiBold,
          fontSize: 13.5,
          color: colors.ink,
        },
        deviceInfo: {
          fontFamily: fonts.sans,
          fontSize: 12,
          color: colors.muted,
        },
        status: {
          fontFamily: fonts.mono,
          fontSize: 11,
          color: colors.muted,
          marginTop: spacing.xs,
        },
      }),
    [colors, fonts, spacing],
  )

  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text style={styles.clientType} numberOfLines={1}>
          {t(`clientType.${session.clientType}`)}
        </Text>
        {session.deviceInfo ? (
          <Text style={styles.deviceInfo} numberOfLines={1}>
            {session.deviceInfo}
          </Text>
        ) : null}
        <Text style={styles.status}>
          {session.isCurrent ? t('currentDevice') : t('lastActive', { date: new Date(session.createdAt).toLocaleString() })}
        </Text>
      </View>
      {session.isCurrent ? null : <Button label={t('revokeButton')} variant="outlineDanger" onPress={() => onRevoke(session)} />}
    </View>
  )
}
