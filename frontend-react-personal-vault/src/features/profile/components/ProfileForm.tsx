import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { useUpdateProfile } from '../hooks/useUpdateProfile'
import type { Profile } from '../types/profile.types'

const profileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  birthday: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

interface ProfileFormProps {
  profile: Profile
  onSuccess: () => void
  onCancel: () => void
}

export function ProfileForm({ profile, onSuccess, onCancel }: ProfileFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profile.fullName,
      birthday: profile.birthday ?? '',
    },
  })
  const updateProfile = useUpdateProfile()

  const onSubmit = handleSubmit(async (values) => {
    await updateProfile.mutateAsync({
      fullName: values.fullName,
      birthday: values.birthday ? values.birthday : null,
    })
    onSuccess()
  })

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Input label="Full name" {...register('fullName')} error={errors.fullName?.message} />
      <Input label="Birthday" type="date" {...register('birthday')} error={errors.birthday?.message} />
      <div className="flex gap-2">
        <Button type="submit" isLoading={updateProfile.isPending}>
          Save changes
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
