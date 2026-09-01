import * as Clipboard from 'expo-clipboard'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { decryptCredential } from '@/src/shared/lib/crypto/cryptoAdapter'
import { getEncryptionKey } from '@/src/shared/lib/crypto/keyStore'
import { Button } from '@/src/shared/components/Button'
import { colors, fonts, radii } from '@/src/shared/theme/tokens'

interface PasswordRevealProps {
  encryptedPassword: string
  onUnlockNeeded: () => void
  onCopied: () => void
}

export function PasswordReveal({ encryptedPassword, onUnlockNeeded, onCopied }: PasswordRevealProps) {
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
      setError('Vault is locked')
      return
    }
    try {
      setRevealed(await decryptCredential(encryptedPassword, key))
    } catch {
      setError('Could not decrypt this password')
    }
  }

  async function handleCopy() {
    if (!revealed) {
      return
    }
    await Clipboard.setStringAsync(revealed)
    onCopied()
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Password</Text>
      <View style={styles.card}>
        <Text style={styles.value} numberOfLines={1}>
          {revealed ?? '••••••••••••'}
        </Text>
        <View style={styles.actions}>
          {revealed ? (
            <Pressable accessibilityRole="button" onPress={handleCopy} style={styles.pill}>
              <Text style={styles.pillText}>Copy</Text>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: revealed !== null }}
            onPress={handleToggle}
            style={styles.pill}
          >
            <Text style={styles.pillText}>{revealed ? 'Hide' : 'Show'}</Text>
          </Pressable>
        </View>
      </View>
      {error ? (
        <View style={styles.errorRow}>
          <Text style={styles.errorText}>{error}</Text>
          <Button label="Unlock vault again" variant="outline" onPress={onUnlockNeeded} style={styles.unlockButton} />
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
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
})
