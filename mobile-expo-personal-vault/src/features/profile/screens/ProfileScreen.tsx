import { isAxiosError } from 'axios'
import { useMemo, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { ChangePasswordForm } from '@/src/features/auth'
import { BackButton } from '@/src/shared/components/BackButton'
import { Button } from '@/src/shared/components/Button'
import { useTheme } from '@/src/shared/theme/ThemeProvider'
import { formatBirthday } from '../components/BirthdayField'
import { ProfileForm, type ProfileFormValues } from '../components/ProfileForm'
import { useProfile } from '../hooks/useProfile'
import { useUpdateProfile } from '../hooks/useUpdateProfile'

export function ProfileScreen() {
  const { colors, fonts, radii, spacing } = useTheme()
  const { t } = useTranslation(['profile', 'common', 'auth'])
  const { data: profile, isLoading, isError, error, refetch } = useProfile()
  const updateProfile = useUpdateProfile()
  const [isEditing, setIsEditing] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const styles = useMemo(
    () =>
      StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
      padding: spacing.xxl,
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
    kvBlock: {
      gap: 6,
    },
    kvLabel: {
      fontFamily: fonts.mono,
      fontSize: 10.5,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: colors.mist,
    },
    kvValue: {
      fontFamily: fonts.sans,
      fontSize: 14.5,
      color: colors.ink,
    },
    badgeRow: {
      flexDirection: 'row',
      gap: 8,
    },
    badge: {
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      borderRadius: radii.pill,
      paddingHorizontal: 12,
      paddingVertical: 5,
    },
    badgeDanger: {
      borderColor: colors.danger,
      backgroundColor: colors.dangerSoft,
    },
    badgeText: {
      fontFamily: fonts.monoMedium,
      fontSize: 11,
      textTransform: 'uppercase',
      color: colors.muted,
    },
    badgeTextDanger: {
      color: colors.dangerDark,
    },
    editButton: {
      marginTop: 4,
    },
    securitySection: {
      marginTop: spacing.xl,
      gap: 12,
    },
    errorText: {
      fontFamily: fonts.sans,
      color: colors.danger,
      fontSize: 14,
      textAlign: 'center',
    },
  }),
  [colors, fonts, radii, spacing],
  )

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    )
  }

  if (isError || !profile) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>
          {isAxiosError(error) && !error.response ? t('common:status.offline') : t('loadError')}
        </Text>
        <Button label={t('common:actions.retry')} variant="outline" onPress={() => refetch()} />
      </SafeAreaView>
    )
  }

  function handleSubmit(values: ProfileFormValues) {
    updateProfile.mutate(
      { fullName: values.fullName, birthday: values.birthday ? formatBirthday(values.birthday) : null },
      { onSuccess: () => setIsEditing(false) },
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.title}>{t('title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {isEditing ? (
          <ProfileForm
            defaultValues={{
              fullName: profile.fullName,
              birthday: profile.birthday ? new Date(profile.birthday) : null,
            }}
            onSubmit={handleSubmit}
            onCancel={() => setIsEditing(false)}
            isSubmitting={updateProfile.isPending}
            errorMessage={updateProfile.error ? t('saveError') : null}
          />
        ) : (
          <>
            <View style={styles.kvBlock}>
              <Text style={styles.kvLabel}>{t('fullNameLabel')}</Text>
              <Text style={styles.kvValue}>{profile.fullName}</Text>
            </View>

            <View style={styles.kvBlock}>
              <Text style={styles.kvLabel}>{t('phone')}</Text>
              <Text style={styles.kvValue}>{profile.phone}</Text>
            </View>

            <View style={styles.kvBlock}>
              <Text style={styles.kvLabel}>{t('birthday')}</Text>
              <Text style={styles.kvValue}>{profile.birthday ?? t('birthdayNotSet')}</Text>
            </View>

            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{t(`role.${profile.role}`)}</Text>
              </View>
              <View style={[styles.badge, profile.status === 'locked' && styles.badgeDanger]}>
                <Text style={[styles.badgeText, profile.status === 'locked' && styles.badgeTextDanger]}>
                  {t(`status.${profile.status}`)}
                </Text>
              </View>
            </View>

            <Button label={t('editProfile')} style={styles.editButton} onPress={() => setIsEditing(true)} />
          </>
        )}

        {isChangingPassword ? (
          <View style={styles.securitySection}>
            <ChangePasswordForm onSuccess={() => setIsChangingPassword(false)} />
            <Button
              label={t('common:actions.cancel')}
              variant="outline"
              style={styles.editButton}
              onPress={() => setIsChangingPassword(false)}
            />
          </View>
        ) : (
          <Button
            label={t('auth:changePassword.submit')}
            variant="outline"
            style={styles.securitySection}
            onPress={() => setIsChangingPassword(true)}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
