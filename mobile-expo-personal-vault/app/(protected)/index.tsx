import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useAuthStore, useLogout } from '@/src/features/auth'
import { useTheme } from '@/src/shared/theme/ThemeProvider'
import type { Colors } from '@/src/shared/theme/tokens'
import { fonts, radii, spacing } from '@/src/shared/theme/tokens'

interface NavCardProps {
  title: string
  subtitle: string
  onPress?: () => void
  comingSoon?: boolean
  colors: Colors
  soonTagLabel: string
}

function NavCard({ title, subtitle, onPress, comingSoon = false, colors, soonTagLabel }: NavCardProps) {
  const styles = StyleSheet.create({
    navCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radii.lg,
      padding: spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,
    },
    navCardDim: {
      opacity: 0.55,
    },
    navIcon: {
      width: 38,
      height: 38,
      borderRadius: radii.sm,
      backgroundColor: colors.primarySoft,
      flexShrink: 0,
    },
    navIconDim: {
      backgroundColor: colors.mistSoft,
    },
    navCopy: {
      flex: 1,
      minWidth: 0,
    },
    navTitle: {
      fontFamily: fonts.sansSemiBold,
      fontSize: 14.5,
      color: colors.ink,
    },
    navSubtitle: {
      fontFamily: fonts.sans,
      fontSize: 12,
      color: colors.muted,
    },
    chevron: {
      fontSize: 18,
      color: colors.mist,
    },
    soonTag: {
      fontFamily: fonts.mono,
      fontSize: 9.5,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: colors.mist,
      backgroundColor: colors.mistSoft,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: radii.pill,
      overflow: 'hidden',
    },
  })

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: comingSoon }}
      disabled={comingSoon}
      onPress={onPress}
      style={[styles.navCard, comingSoon && styles.navCardDim]}
    >
      <View style={[styles.navIcon, comingSoon && styles.navIconDim]} />
      <View style={styles.navCopy}>
        <Text style={styles.navTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.navSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      {comingSoon ? (
        <Text style={styles.soonTag}>{soonTagLabel}</Text>
      ) : (
        <Text style={styles.chevron}>›</Text>
      )}
    </Pressable>
  )
}

export default function Home() {
  const router = useRouter()
  const { colors } = useTheme()
  const { t } = useTranslation('home')
  const fullName = useAuthStore((state) => state.user?.fullName)
  const { mutate: logout, isPending: isLoggingOut } = useLogout()

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      backgroundColor: colors.primaryDark,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xxl,
      paddingBottom: spacing.xxl,
    },
    headerCopy: {
      flex: 1,
      minWidth: 0,
    },
    eyebrow: {
      fontFamily: fonts.mono,
      fontSize: 10.5,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: colors.primarySoft,
      marginBottom: 6,
    },
    headerName: {
      fontFamily: fonts.serif,
      fontSize: 24,
      color: colors.surface,
    },
    settingsButton: {
      width: 34,
      height: 34,
      borderRadius: radii.circle,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    body: {
      flex: 1,
      padding: spacing.xl,
      gap: spacing.md,
    },
    sectionLabel: {
      fontFamily: fonts.mono,
      fontSize: 10.5,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: colors.mist,
      marginBottom: -2,
    },
    logoutButton: {
      marginTop: 'auto',
      borderWidth: 1,
      borderColor: colors.danger,
      borderRadius: radii.sm,
      paddingVertical: 12,
      alignItems: 'center',
    },
    logoutText: {
      fontFamily: fonts.sansSemiBold,
      fontSize: 13.5,
      color: colors.danger,
    },
  })

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>{t('welcome')}</Text>
          <Text style={styles.headerName} numberOfLines={1}>
            {fullName ?? t('defaultName')}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('settingsA11y')}
          onPress={() => router.push('/(protected)/settings')}
          style={styles.settingsButton}
        >
          <Ionicons name="settings-outline" size={22} color={colors.surface} />
        </Pressable>
      </View>
      <View style={styles.body}>
        <Text style={styles.sectionLabel}>{t('vaultSection')}</Text>
        <NavCard
          title={t('credentialsTitle')}
          subtitle={t('credentialsSubtitle')}
          onPress={() => router.push('/(protected)/credentials')}
          colors={colors}
          soonTagLabel={t('soonTag')}
        />
        <NavCard
          title={t('documentsTitle')}
          subtitle={t('documentsSubtitle')}
          onPress={() => router.push('/(protected)/documents')}
          colors={colors}
          soonTagLabel={t('soonTag')}
        />
        <NavCard
          title={t('profileTitle')}
          subtitle={t('profileSubtitle')}
          onPress={() => router.push('/(protected)/profile')}
          colors={colors}
          soonTagLabel={t('soonTag')}
        />
        <Pressable
          accessibilityRole="button"
          style={styles.logoutButton}
          disabled={isLoggingOut}
          onPress={() => logout()}
        >
          <Text style={styles.logoutText}>{isLoggingOut ? t('loggingOut') : t('logout')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
