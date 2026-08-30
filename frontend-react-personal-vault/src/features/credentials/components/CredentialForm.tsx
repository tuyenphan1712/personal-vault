import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation, type TFunction } from 'react-i18next'
import { z } from 'zod'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { encryptValue } from '@/shared/lib/crypto'
import { getEncryptionKey } from '@/shared/lib/keyStore'
import { useCreateCredential } from '../hooks/useCreateCredential'
import { useUpdateCredential } from '../hooks/useUpdateCredential'
import type { Credential } from '../types/credential.types'

function createCredentialSchema(t: TFunction) {
  return z.object({
    platformName: z.string().min(1, t('credentials.errors.platformRequired')),
    account: z.string().min(1, t('credentials.errors.accountRequired')),
    password: z.string().min(1, t('credentials.errors.passwordRequired')),
    note: z.string().optional(),
  })
}

type CredentialFormValues = z.infer<ReturnType<typeof createCredentialSchema>>

interface CredentialFormProps {
  credential?: Credential
  onSuccess: (message: string) => void
}

export function CredentialForm({ credential, onSuccess }: CredentialFormProps) {
  const { t } = useTranslation()
  const credentialSchema = useMemo(() => createCredentialSchema(t), [t])
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CredentialFormValues>({
    resolver: zodResolver(credentialSchema),
    defaultValues: {
      platformName: credential?.platformName ?? '',
      account: credential?.account ?? '',
      note: credential?.note ?? '',
    },
  })
  const createCredential = useCreateCredential()
  const updateCredential = useUpdateCredential()
  const isPending = createCredential.isPending || updateCredential.isPending

  const onSubmit = handleSubmit(async (values) => {
    const key = getEncryptionKey()
    if (!key) {
      return
    }

    const encryptedPassword = await encryptValue(values.password, key)

    if (credential) {
      await updateCredential.mutateAsync({
        id: credential.id,
        payload: { platformName: values.platformName, account: values.account, encryptedPassword, note: values.note ?? null },
      })
      onSuccess(t('credentials.savedToastEdit'))
    } else {
      await createCredential.mutateAsync({
        platformName: values.platformName,
        account: values.account,
        encryptedPassword,
        note: values.note ?? null,
      })
      onSuccess(t('credentials.savedToastCreate'))
    }
  })

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Input label={t('credentials.fields.platform')} {...register('platformName')} error={errors.platformName?.message} />
      <Input label={t('credentials.fields.account')} {...register('account')} error={errors.account?.message} />
      <Input label={t('credentials.fields.password')} type="password" {...register('password')} error={errors.password?.message} />
      <Input label={t('credentials.fields.note')} {...register('note')} error={errors.note?.message} />
      <Button type="submit" isLoading={isPending}>
        {credential ? t('common.saveChanges') : t('credentials.addButton')}
      </Button>
    </form>
  )
}
