import { useMemo } from 'react'
import { isAxiosError } from 'axios'
import { Alert, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Button } from '@/src/shared/components/Button'
import { useTheme } from '@/src/shared/theme/ThemeProvider'
import { useRevokeSession } from '../hooks/useRevokeSession'
import { useSessions } from '../hooks/useSessions'
import type { Session } from '../types/session.types'
import { SessionRow } from './SessionRow'

export function SessionList() {
  const { colors, fonts, spacing } = useTheme()
  const { t } = useTranslation(['sessions', 'common'])
  const { data: sessions, isLoading, isError, error, refetch } = useSessions()
  const revokeSession = useRevokeSession()

  const styles = useMemo(
    () =>
      StyleSheet.create({
        list: {
          gap: 8,
        },
        emptyText: {
          fontFamily: fonts.sans,
          color: colors.muted,
          fontSize: 13,
        },
        errorText: {
          fontFamily: fonts.sans,
          color: colors.danger,
          fontSize: 13,
        },
        errorBlock: {
          gap: spacing.sm,
          alignItems: 'flex-start',
        },
      }),
    [colors, fonts, spacing],
  )

  function handleRevoke(session: Session) {
    Alert.alert(t('revokeDialog.title'), t('revokeDialog.body', { device: session.deviceInfo ?? t(`clientType.${session.clientType}`) }), [
      { text: t('common:actions.cancel'), style: 'cancel' },
      {
        text: t('revokeDialog.confirm'),
        style: 'destructive',
        onPress: () => revokeSession.mutate(session.id),
      },
    ])
  }

  if (isLoading) {
    return <Text style={styles.emptyText}>{t('loading')}</Text>
  }

  if (isError || !sessions) {
    return (
      <View style={styles.errorBlock}>
        <Text style={styles.errorText}>
          {isAxiosError(error) && !error.response ? t('common:status.offline') : t('loadError')}
        </Text>
        <Button label={t('common:actions.retry')} variant="outline" onPress={() => refetch()} />
      </View>
    )
  }

  if (sessions.length === 0) {
    return <Text style={styles.emptyText}>{t('empty')}</Text>
  }

  return (
    <View style={styles.list}>
      {sessions.map((session) => (
        <SessionRow key={session.id} session={session} onRevoke={handleRevoke} />
      ))}
    </View>
  )
}
