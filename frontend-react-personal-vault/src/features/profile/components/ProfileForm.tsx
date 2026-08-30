import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation, type TFunction } from 'react-i18next'
import { z } from 'zod'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { useUpdateProfile } from '../hooks/useUpdateProfile'
import type { Profile } from '../types/profile.types'

function createProfileSchema(t: TFunction) {
  return z.object({
    fullName: z.string().min(1, t('profile.errors.fullNameRequired')),
    birthday: z.string().optional(),
  })
}

type ProfileFormValues = z.infer<ReturnType<typeof createProfileSchema>>

interface ProfileFormProps {
  profile: Profile
  onSuccess: () => void
  onCancel: () => void
}

export function ProfileForm({ profile, onSuccess, onCancel }: ProfileFormProps) {
  const { t } = useTranslation()
  const profileSchema = useMemo(() => createProfileSchema(t), [t])
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
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Input label={t('profile.fields.fullName')} {...register('fullName')} error={errors.fullName?.message} />
      <Input label={t('profile.fields.birthday')} type="date" {...register('birthday')} error={errors.birthday?.message} />
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">{t('profile.phone')}</span>
        <div className="flex items-center justify-between gap-2 rounded-md border border-line bg-bg px-3 py-2.5">
          <span className="font-mono text-sm text-muted">{profile.phone}</span>
          <span className="font-mono text-[11px] uppercase tracking-wide text-muted">{t('profile.phoneImmutable')}</span>
        </div>
      </div>
      <div className="mt-1 flex gap-2">
        <Button type="submit" isLoading={updateProfile.isPending}>
          {t('common.saveChanges')}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
      </div>
    </form>
  )
}
