import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Pressable, StyleSheet } from 'react-native'
import { colors } from '../theme/tokens'

export function BackButton() {
  const router = useRouter()

  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.button}>
      <Ionicons name="chevron-back" size={18} color={colors.ink} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
