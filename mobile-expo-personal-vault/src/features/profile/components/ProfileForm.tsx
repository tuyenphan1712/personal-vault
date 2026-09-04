import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { StyleSheet, Text, View } from 'react-native'
import { z } from 'zod'
import { Button } from '@/src/shared/components/Button'
import { TextField } from '@/src/shared/components/TextField'
import { colors, fonts } from '@/src/shared/theme/tokens'
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
  const { control, handleSubmit, formState: { errors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  })

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="fullName"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Full name"
            placeholder="Nguyen Van A"
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
        <Button label="Cancel" variant="outline" style={styles.actionButton} onPress={onCancel} />
        <Button
          label="Save"
          onPress={handleSubmit(onSubmit)}
          isLoading={isSubmitting}
          style={styles.actionButton}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
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
})
