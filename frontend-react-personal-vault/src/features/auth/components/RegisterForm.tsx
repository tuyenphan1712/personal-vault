import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { useRegister } from '../hooks/useRegister'

// Kept in sync with backend RegisterRequest (Jakarta Bean Validation) per API_SPEC.md §7.
const registerSchema = z.object({
  phone: z.string().regex(/^[0-9]{9,15}$/, 'Phone number is invalid'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(255),
  fullName: z.string().min(1, 'Full name is required').max(255),
})

type RegisterFormValues = z.infer<typeof registerSchema>

interface RegisterFormProps {
  onSuccess: () => void
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) })
  const registerUser = useRegister()

  const onSubmit = handleSubmit((values) => {
    registerUser.mutate(values, { onSuccess })
  })

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Input label="Full name" {...register('fullName')} error={errors.fullName?.message} />
      <Input label="Phone number" type="tel" {...register('phone')} error={errors.phone?.message} />
      <Input label="Password" type="password" {...register('password')} error={errors.password?.message} />
      {registerUser.isError ? (
        <p className="text-sm text-danger">This phone number is already registered.</p>
      ) : null}
      <Button type="submit" isLoading={registerUser.isPending}>
        Create account
      </Button>
    </form>
  )
}
