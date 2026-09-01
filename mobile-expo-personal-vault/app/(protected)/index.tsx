import { useRouter } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuthStore, useLogout } from '@/src/features/auth'
import { colors, fonts, radii, spacing } from '@/src/shared/theme/tokens'

interface NavCardProps {
  title: string
  subtitle: string
  onPress?: () => void
  comingSoon?: boolean
}

function NavCard({ title, subtitle, onPress, comingSoon = false }: NavCardProps) {
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
        <Text style={styles.soonTag}>Soon</Text>
      ) : (
        <Text style={styles.chevron}>›</Text>
      )}
    </Pressable>
  )
}

export default function Home() {
  const router = useRouter()
  const fullName = useAuthStore((state) => state.user?.fullName)
  const { mutate: logout, isPending: isLoggingOut } = useLogout()

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Welcome back</Text>
        <Text style={styles.headerName} numberOfLines={1}>
          {fullName ?? 'there'}
        </Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.sectionLabel}>Your vault</Text>
        <NavCard
          title="Credentials"
          subtitle="Saved platform passwords"
          onPress={() => router.push('/(protected)/credentials')}
        />
        <NavCard title="Documents" subtitle="Personal files & scans" comingSoon />
        <NavCard title="Profile" subtitle="Account & settings" comingSoon />
        <Pressable
          accessibilityRole="button"
          style={styles.logoutButton}
          disabled={isLoggingOut}
          onPress={() => logout()}
        >
          <Text style={styles.logoutText}>{isLoggingOut ? 'Logging out…' : 'Log out'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
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
