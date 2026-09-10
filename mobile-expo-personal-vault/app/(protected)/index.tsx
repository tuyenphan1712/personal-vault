import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useAuthStore, useLogout } from '@/src/features/auth'
import { useUnreadCount } from '@/src/features/audit-log'
import { useTheme } from '@/src/shared/theme/ThemeProvider'

interface NavCardProps {
  title: string
  subtitle: string
  icon: keyof typeof Ionicons.glyphMap
  onPress?: () => void
  comingSoon?: boolean
  soonTagLabel: string
}

function NavCard({ title, subtitle, icon, onPress, comingSoon = false, soonTagLabel }: NavCardProps) {
  const { colors, fonts, radii, spacing } = useTheme()

  const styles = useMemo(
    () =>
      StyleSheet.create({
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
          alignItems: 'center',
          justifyContent: 'center',
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
      }),
    [colors, fonts, radii, spacing],
  )

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: comingSoon }}
      disabled={comingSoon}
      onPress={onPress}
      style={[styles.navCard, comingSoon && styles.navCardDim]}
    >
      <View style={[styles.navIcon, comingSoon && styles.navIconDim]}>
        <Ionicons name={icon} size={19} color={comingSoon ? colors.mist : colors.primaryDark} />
      </View>
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
  const { colors, fonts, radii, spacing } = useTheme()
  const { t } = useTranslation(['home', 'notifications'])
  const fullName = useAuthStore((state) => state.user?.fullName)
  const { mutate: logout, isPending: isLoggingOut } = useLogout()
  const { data: unreadCount } = useUnreadCount()
  const badgeLabel = (unreadCount?.count ?? 0) > 9 ? '9+' : String(unreadCount?.count ?? 0)

  const styles = useMemo(
    () =>
      StyleSheet.create({
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
        headerButtons: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          flexShrink: 0,
        },
        settingsButton: {
          width: 34,
          height: 34,
          borderRadius: radii.circle,
          alignItems: 'center',
          justifyContent: 'center',
        },
        badge: {
          position: 'absolute',
          top: -2,
          right: -2,
          minWidth: 16,
          height: 16,
          borderRadius: radii.pill,
          paddingHorizontal: 3,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.danger,
        },
        badgeText: {
          fontFamily: fonts.monoMedium,
          fontSize: 9,
          color: colors.surface,
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
      }),
    [colors, fonts, radii, spacing],
  )

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>{t('welcome')}</Text>
          <Text style={styles.headerName} numberOfLines={1}>
            {fullName ?? t('defaultName')}
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('notifications:bellA11y')}
            onPress={() => router.push('/(protected)/notifications')}
            style={styles.settingsButton}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.surface} />
            {(unreadCount?.count ?? 0) > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{badgeLabel}</Text>
              </View>
            ) : null}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('home:settingsA11y')}
            onPress={() => router.push('/(protected)/settings')}
            style={styles.settingsButton}
          >
            <Ionicons name="settings-outline" size={22} color={colors.surface} />
          </Pressable>
        </View>
      </View>
      <View style={styles.body}>
        <Text style={styles.sectionLabel}>{t('vaultSection')}</Text>
        <NavCard
          title={t('credentialsTitle')}
          subtitle={t('credentialsSubtitle')}
          icon="key-outline"
          onPress={() => router.push('/(protected)/credentials')}
          soonTagLabel={t('soonTag')}
        />
        <NavCard
          title={t('documentsTitle')}
          subtitle={t('documentsSubtitle')}
          icon="document-text-outline"
          onPress={() => router.push('/(protected)/documents')}
          soonTagLabel={t('soonTag')}
        />
        <NavCard
          title={t('profileTitle')}
          subtitle={t('profileSubtitle')}
          icon="person-outline"
          onPress={() => router.push('/(protected)/profile')}
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
