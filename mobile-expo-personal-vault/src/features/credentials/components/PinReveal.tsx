import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { decryptCredential } from '@/src/shared/lib/crypto/cryptoAdapter'
import { getEncryptionKey } from '@/src/shared/lib/crypto/keyStore'
import { Button } from '@/src/shared/components/Button'
import { useTheme } from '@/src/shared/theme/ThemeProvider'

interface PinRevealProps {
  encryptedPin: string
  onUnlockNeeded: () => void
}

export function PinReveal({ encryptedPin, onUnlockNeeded }: PinRevealProps) {
  const { colors, fonts, radii } = useTheme()
  const { t } = useTranslation(['credentials', 'common'])
  const [revealed, setRevealed] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleToggle() {
    if (revealed) {
      setRevealed(null)
      return
    }
    setError(null)
    const key = getEncryptionKey()
    if (!key) {
      setError(t('pin.locked'))
      return
    }
    try {
      setRevealed(await decryptCredential(encryptedPin, key))
    } catch {
      setError(t('pin.decryptError'))
    }
  }

  const styles = useMemo(
    () =>
      StyleSheet.create({
    container: {
      gap: 6,
    },
    label: {
      fontFamily: fonts.mono,
      fontSize: 10.5,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: colors.mist,
    },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radii.md,
      padding: 14,
      gap: 10,
    },
    value: {
      fontFamily: fonts.mono,
      fontSize: 15,
      letterSpacing: 1,
      color: colors.ink,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
    },
    pill: {
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
      borderRadius: radii.pill,
      paddingHorizontal: 11,
      paddingVertical: 5,
    },
    pillText: {
      fontFamily: fonts.monoMedium,
      fontSize: 10.5,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: colors.primaryDark,
    },
    errorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 2,
    },
    errorText: {
      fontFamily: fonts.sans,
      color: colors.danger,
      fontSize: 13,
      flexShrink: 1,
    },
    unlockButton: {
      paddingVertical: 6,
      paddingHorizontal: 10,
    },
  }),
  [colors, fonts, radii],
  )

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('pin.label')}</Text>
      <View style={styles.card}>
        <Text style={styles.value} numberOfLines={1}>
          {revealed ?? '••••'}
        </Text>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: revealed !== null }}
            onPress={handleToggle}
            style={styles.pill}
          >
            <Text style={styles.pillText}>{revealed ? t('common:actions.hide') : t('common:actions.show')}</Text>
          </Pressable>
        </View>
      </View>
      {error ? (
        <View style={styles.errorRow}>
          <Text style={styles.errorText}>{error}</Text>
          <Button label={t('pin.unlockAgain')} variant="outline" onPress={onUnlockNeeded} style={styles.unlockButton} />
        </View>
      ) : null}
    </View>
  )
}
