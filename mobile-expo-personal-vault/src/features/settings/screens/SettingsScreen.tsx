import { useMemo } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { BackButton } from '@/src/shared/components/BackButton'
import { useTheme } from '@/src/shared/theme/ThemeProvider'
import { AppearancePicker } from '../components/AppearancePicker'
import { LanguagePicker } from '../components/LanguagePicker'

export function SettingsScreen() {
  const { colors, fonts, spacing } = useTheme()
  const { t } = useTranslation('settings')

  const styles = useMemo(
    () =>
      StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    header: {
      gap: spacing.md,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
      paddingBottom: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    },
    title: {
      fontFamily: fonts.serif,
      fontSize: 21,
      color: colors.ink,
    },
    body: {
      padding: spacing.xl,
      gap: spacing.xl,
    },
    section: {
      gap: spacing.md,
    },
    sectionLabel: {
      fontFamily: fonts.mono,
      fontSize: 10.5,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: colors.mist,
    },
  }),
  [colors, fonts, spacing],
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.title}>{t('title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('appearance.sectionLabel')}</Text>
          <AppearancePicker />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('language.sectionLabel')}</Text>
          <LanguagePicker />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
