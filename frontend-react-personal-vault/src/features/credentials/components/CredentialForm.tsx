import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { encryptValue } from '@/shared/lib/crypto'
import { getEncryptionKey } from '@/shared/lib/keyStore'
import { useCreateCredential } from '../hooks/useCreateCredential'
import { useUpdateCredential } from '../hooks/useUpdateCredential'
import type { Credential } from '../types/credential.types'

const credentialSchema = z.object({
  platformName: z.string().min(1, 'Platform name is required'),
  account: z.string().min(1, 'Account is required'),
  password: z.string().min(1, 'Password is required'),
  note: z.string().optional(),
})

type CredentialFormValues = z.infer<typeof credentialSchema>

interface CredentialFormProps {
  credential?: Credential
  onSuccess: () => void
}

export function CredentialForm({ credential, onSuccess }: CredentialFormProps) {
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
    } else {
      await createCredential.mutateAsync({
        platformName: values.platformName,
        account: values.account,
        encryptedPassword,
        note: values.note ?? null,
      })
    }

    onSuccess()
  })

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Input label="Platform" {...register('platformName')} error={errors.platformName?.message} />
      <Input label="Account" {...register('account')} error={errors.account?.message} />
      <Input label="Password" type="password" {...register('password')} error={errors.password?.message} />
      <Input label="Note (optional)" {...register('note')} error={errors.note?.message} />
      <Button type="submit" isLoading={isPending}>
        {credential ? 'Save changes' : 'Add credential'}
      </Button>
    </form>
  )
}
