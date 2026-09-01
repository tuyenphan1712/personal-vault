import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { StyleSheet, Text, View } from 'react-native'
import { z } from 'zod'
import { Button } from '@/src/shared/components/Button'
import { TextField } from '@/src/shared/components/TextField'
import { colors, fonts } from '@/src/shared/theme/tokens'

const credentialSchema = z.object({
  platformName: z.string().min(1, 'Platform is required'),
  account: z.string().min(1, 'Account is required'),
  password: z.string().min(1, 'Password is required'),
  note: z.string().optional(),
})

export type CredentialFormValues = z.infer<typeof credentialSchema>

interface CredentialFormProps {
  defaultValues?: Partial<CredentialFormValues>
  onSubmit: (values: CredentialFormValues) => void
  isSubmitting: boolean
  errorMessage: string | null
  submitLabel: string
}

export function CredentialForm({ defaultValues, onSubmit, isSubmitting, errorMessage, submitLabel }: CredentialFormProps) {
  const { control, handleSubmit, formState: { errors } } = useForm<CredentialFormValues>({
    resolver: zodResolver(credentialSchema),
    defaultValues: {
      platformName: defaultValues?.platformName ?? '',
      account: defaultValues?.account ?? '',
      password: '',
      note: defaultValues?.note ?? '',
    },
  })

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="platformName"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Platform"
            placeholder="Gmail"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.platformName?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="account"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Account"
            placeholder="user@gmail.com"
            autoCapitalize="none"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.account?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Password"
            placeholder="••••••••••"
            secureTextEntry
            autoCapitalize="none"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.password?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="note"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Note (optional)"
            placeholder="Personal account"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <Button label={submitLabel} onPress={handleSubmit(onSubmit)} isLoading={isSubmitting} style={styles.button} />
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
  button: {
    marginTop: 4,
  },
})
