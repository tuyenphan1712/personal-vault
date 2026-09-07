import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/src/shared/theme/ThemeProvider'
import type { ThemeMode } from '@/src/shared/theme/theme.store'

const APPEARANCE_MODES: ThemeMode[] = ['light', 'dark', 'system']

export function AppearancePicker() {
  const { colors, fonts, radii, mode, setMode } = useTheme()
  const { t } = useTranslation('settings')

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radii.md,
      overflow: 'hidden',
    },
    option: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      backgroundColor: colors.surface,
      borderLeftWidth: 1,
      borderLeftColor: colors.line,
    },
    optionFirst: {
      borderLeftWidth: 0,
    },
    optionSelected: {
      backgroundColor: colors.primarySoft,
    },
    optionText: {
      fontFamily: fonts.sans,
      fontSize: 13,
      color: colors.muted,
    },
    optionTextSelected: {
      fontFamily: fonts.sansSemiBold,
      color: colors.primaryDark,
    },
  })

  return (
    <View style={styles.container}>
      {APPEARANCE_MODES.map((option, index) => {
        const selected = mode === option
        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityLabel={t(`appearance.${option}`)}
            accessibilityState={{ selected }}
            style={[styles.option, index === 0 && styles.optionFirst, selected && styles.optionSelected]}
            onPress={() => setMode(option)}
          >
            <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{t(`appearance.${option}`)}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}
