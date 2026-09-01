import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { StyleSheet, Text, View } from 'react-native'
import { z } from 'zod'
import { Button } from '@/src/shared/components/Button'
import { TextField } from '@/src/shared/components/TextField'
import { colors, fonts } from '@/src/shared/theme/tokens'

const loginSchema = z.object({
  phone: z.string().min(1, 'Phone number is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export type LoginFormValues = z.infer<typeof loginSchema>

interface LoginFormProps {
  onSubmit: (values: LoginFormValues) => void
  isSubmitting: boolean
  errorMessage: string | null
}

export function LoginForm({ onSubmit, isSubmitting, errorMessage }: LoginFormProps) {
  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: '', password: '' },
  })

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="phone"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Phone number"
            placeholder="0900 000 000"
            keyboardType="phone-pad"
            autoCapitalize="none"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.phone?.message}
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

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <Button label="Log in" onPress={handleSubmit(onSubmit)} isLoading={isSubmitting} style={styles.button} />
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
