import { useMutation, useQueryClient } from '@tanstack/react-query'
import { auditLogKeys } from '@/src/features/audit-log'
import { credentialService } from '../services/credential.service'
import type { UpdateCredentialRequest } from '../types/credential.types'
import { credentialKeys } from './credentialKeys'

export function useUpdateCredential() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCredentialRequest }) =>
      credentialService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: credentialKeys.all })
      queryClient.invalidateQueries({ queryKey: auditLogKeys.all })
    },
  })
}
