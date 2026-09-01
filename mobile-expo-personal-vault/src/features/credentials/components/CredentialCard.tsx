import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, fonts, radii } from '@/src/shared/theme/tokens'
import type { Credential } from '../types/credential.types'

interface CredentialCardProps {
  credential: Credential
  onPress: (id: string) => void
}

export function CredentialCard({ credential, onPress }: CredentialCardProps) {
  const initial = credential.platformName.trim().charAt(0).toUpperCase() || '?'

  return (
    <Pressable accessibilityRole="button" style={styles.card} onPress={() => onPress(credential.id)}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <View style={styles.copy}>
        <Text style={styles.platform} numberOfLines={1}>
          {credential.platformName}
        </Text>
        <Text style={styles.account} numberOfLines={1}>
          {credential.account}
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
  avatar: {
    width: 34,
    height: 34,
    borderRadius: radii.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontFamily: fonts.serifSemiBold,
    fontSize: 15,
    color: colors.primaryDark,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  platform: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.ink,
  },
  account: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.muted,
  },
})
