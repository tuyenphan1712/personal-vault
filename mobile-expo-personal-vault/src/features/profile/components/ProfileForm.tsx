import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { Button } from '@/src/shared/components/Button'
import { TextField } from '@/src/shared/components/TextField'
import { useTheme } from '@/src/shared/theme/ThemeProvider'
import { BirthdayField } from './BirthdayField'

const profileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  birthday: z.date().nullable(),
})

export type ProfileFormValues = z.infer<typeof profileSchema>

interface ProfileFormProps {
  defaultValues: ProfileFormValues
  onSubmit: (values: ProfileFormValues) => void
  onCancel: () => void
  isSubmitting: boolean
  errorMessage: string | null
}

export function ProfileForm({ defaultValues, onSubmit, onCancel, isSubmitting, errorMessage }: ProfileFormProps) {
  const { colors, fonts } = useTheme()
  const { t } = useTranslation(['profile', 'common'])

  const resolver = useMemo(
    () =>
      zodResolver(
        z.object({
          fullName: z.string().min(1, t('validation.fullNameRequired')),
          birthday: z.date().nullable(),
        }),
      ),
    [t],
  )

  const { control, handleSubmit, formState: { errors } } = useForm<ProfileFormValues>({
    resolver,
    defaultValues,
  })

  const styles = useMemo(
    () =>
      StyleSheet.create({
    container: {
      gap: 14,
    },
    errorText: {
      fontFamily: fonts.sans,
      color: colors.danger,
      fontSize: 13,
    },
    actions: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 4,
    },
    actionButton: {
      flex: 1,
    },
  }),
  [colors, fonts],
  )

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="fullName"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label={t('fullNameLabel')}
            placeholder={t('fullNamePlaceholder')}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.fullName?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="birthday"
        render={({ field: { onChange, value } }) => <BirthdayField value={value} onChange={onChange} />}
      />

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <View style={styles.actions}>
        <Button label={t('common:actions.cancel')} variant="outline" style={styles.actionButton} onPress={onCancel} />
        <Button
          label={t('common:actions.save')}
          onPress={handleSubmit(onSubmit)}
          isLoading={isSubmitting}
          style={styles.actionButton}
        />
      </View>
    </View>
  )
}
