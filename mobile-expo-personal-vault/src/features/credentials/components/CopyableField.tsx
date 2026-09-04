import * as Clipboard from 'expo-clipboard'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, fonts, radii } from '@/src/shared/theme/tokens'

interface CopyableFieldProps {
  label: string
  value: string
  onCopied: () => void
}

export function CopyableField({ label, value, onCopied }: CopyableFieldProps) {
  async function handleCopy() {
    await Clipboard.setStringAsync(value)
    onCopied()
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.card}>
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" onPress={handleCopy} style={styles.pill}>
            <Text style={styles.pillText}>Copy</Text>
          </Pressable>
        </View>
      </View>
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
    color: colors.ink,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
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
})
