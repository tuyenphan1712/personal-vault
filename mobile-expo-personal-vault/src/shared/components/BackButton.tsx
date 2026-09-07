import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { Pressable, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../theme/ThemeProvider'

export function BackButton() {
  const router = useRouter()
  const { colors } = useTheme()
  const { t } = useTranslation('common')

  const styles = useMemo(
    () =>
      StyleSheet.create({
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
  }),
  [colors],
  )

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={t('a11y.goBack')} onPress={() => router.back()} style={styles.button}>
      <Ionicons name="chevron-back" size={18} color={colors.ink} />
    </Pressable>
  )
}
