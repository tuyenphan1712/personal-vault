import { useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/src/shared/theme/ThemeProvider'
import { setLanguage, SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/src/shared/i18n'

export function LanguagePicker() {
  const { colors, fonts, radii } = useTheme()
  const { t, i18n } = useTranslation('settings')
  const [isOpen, setIsOpen] = useState(false)
  const currentLanguage = i18n.language as SupportedLanguage

  const styles = StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    rowLabel: {
      fontFamily: fonts.sans,
      fontSize: 14,
      color: colors.ink,
    },
    rowValue: {
      fontFamily: fonts.sans,
      fontSize: 14,
      color: colors.muted,
    },
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radii.lg,
      borderTopRightRadius: radii.lg,
      paddingVertical: 8,
    },
    option: {
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    optionSelected: {
      backgroundColor: colors.primarySoft,
    },
    optionText: {
      fontFamily: fonts.sans,
      fontSize: 15,
      color: colors.ink,
    },
    optionTextSelected: {
      fontFamily: fonts.sansSemiBold,
      color: colors.primaryDark,
    },
  })

  async function handleSelect(language: SupportedLanguage) {
    setIsOpen(false)
    await setLanguage(language)
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('language.rowLabel')}
        style={styles.row}
        onPress={() => setIsOpen(true)}
      >
        <Text style={styles.rowLabel}>{t('language.rowLabel')}</Text>
        <Text style={styles.rowValue}>{t(`language.${currentLanguage}`)}</Text>
      </Pressable>

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setIsOpen(false)}>
          <View style={styles.sheet}>
            {SUPPORTED_LANGUAGES.map((language) => {
              const selected = language === currentLanguage
              return (
                <Pressable
                  key={language}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={[styles.option, selected && styles.optionSelected]}
                  onPress={() => handleSelect(language)}
                >
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                    {t(`language.${language}`)}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  )
}
