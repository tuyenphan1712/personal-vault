import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { StyleSheet, Text, View } from 'react-native'
import { z } from 'zod'
import { Button } from '@/src/shared/components/Button'
import { Logo } from '@/src/shared/components/Logo'
import { TextField } from '@/src/shared/components/TextField'
import { colors, fonts, radii } from '@/src/shared/theme/tokens'
import { useUnlockVault } from '../hooks/useUnlockVault'

const unlockSchema = z.object({
  password: z.string().min(1, 'Password is required'),
})

type UnlockFormValues = z.infer<typeof unlockSchema>

interface UnlockVaultPromptProps {
  onUnlocked: () => void
}

export function UnlockVaultPrompt({ onUnlocked }: UnlockVaultPromptProps) {
  const { control, handleSubmit, formState: { errors } } = useForm<UnlockFormValues>({
    resolver: zodResolver(unlockSchema),
    defaultValues: { password: '' },
  })
  const { unlock, isUnlocking } = useUnlockVault()

  const onSubmit = handleSubmit(async (values) => {
    await unlock(values.password)
    onUnlocked()
  })

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Logo showWordmark={false} height={44} />
        <Text style={styles.title}>Vault locked</Text>
        <Text style={styles.subtitle}>Enter your password to view and edit your saved credentials.</Text>
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
        <Button label="Unlock" onPress={onSubmit} isLoading={isUnlocking} style={styles.button} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    padding: 24,
    gap: 12,
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.serifLight,
    fontSize: 24,
    color: colors.ink,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 13.5,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 4,
  },
  button: {
    width: '100%',
    marginTop: 4,
  },
})
