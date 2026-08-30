import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { PasswordInput } from '@/shared/components/PasswordInput'
import { useLogin } from '../hooks/useLogin'

const loginSchema = z.object({
  phone: z.string().min(1, 'Phone number is required'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormValues = z.infer<typeof loginSchema>

interface LoginFormProps {
  onSuccess: () => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })
  const login = useLogin()

  const onSubmit = handleSubmit((values) => {
    login.mutate(values, { onSuccess })
  })

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-4 text-left">
      <Input label="Phone number" type="tel" {...register('phone')} error={errors.phone?.message} />
      <PasswordInput label="Password" {...register('password')} error={errors.password?.message} />
      {login.isError ? (
        <p className="text-sm text-danger">Invalid phone number or password.</p>
      ) : null}
      <Button type="submit" isLoading={login.isPending}>
        Log in
      </Button>
    </form>
  )
}
