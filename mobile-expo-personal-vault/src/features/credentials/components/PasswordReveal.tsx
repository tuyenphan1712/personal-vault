import * as Clipboard from 'expo-clipboard'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { decryptCredential } from '@/src/shared/lib/crypto/cryptoAdapter'
import { getEncryptionKey } from '@/src/shared/lib/crypto/keyStore'

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
      <View style={styles.row}>
        <Text style={styles.value}>{revealed ?? '••••••••••••'}</Text>
        {revealed ? (
          <Pressable accessibilityRole="button" onPress={handleCopy} style={styles.button}>
            <Text>Copy</Text>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: revealed !== null }}
          onPress={handleToggle}
          style={styles.button}
        >
          <Text>{revealed ? 'Hide' : 'Show'}</Text>
        </Pressable>
      </View>
      {error ? (
        <View style={styles.errorRow}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable accessibilityRole="button" onPress={onUnlockNeeded}>
            <Text style={styles.unlockLink}>Unlock vault again</Text>
          </Pressable>
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
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#666',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  value: {
    flex: 1,
    fontFamily: 'monospace',
    fontSize: 16,
  },
  button: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
  },
  unlockLink: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '600',
  },
})
