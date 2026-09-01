import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { z } from 'zod'

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
          <TextInput
            accessibilityLabel="Platform"
            placeholder="Platform (e.g. Gmail)"
            style={styles.input}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      {errors.platformName ? <Text style={styles.errorText}>{errors.platformName.message}</Text> : null}

      <Controller
        control={control}
        name="account"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            accessibilityLabel="Account"
            placeholder="Account (e.g. user@gmail.com)"
            style={styles.input}
            autoCapitalize="none"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      {errors.account ? <Text style={styles.errorText}>{errors.account.message}</Text> : null}

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            accessibilityLabel="Password"
            placeholder="Password"
            style={styles.input}
            secureTextEntry
            autoCapitalize="none"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      {errors.password ? <Text style={styles.errorText}>{errors.password.message}</Text> : null}

      <Controller
        control={control}
        name="note"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            accessibilityLabel="Note"
            placeholder="Note (optional)"
            style={styles.input}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <Pressable
        accessibilityRole="button"
        style={styles.button}
        onPress={handleSubmit(onSubmit)}
        disabled={isSubmitting}
      >
        {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{submitLabel}</Text>}
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
