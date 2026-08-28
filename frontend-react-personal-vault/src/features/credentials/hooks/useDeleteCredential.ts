import { useMutation, useQueryClient } from '@tanstack/react-query'
import { credentialService } from '../services/credential.service'
import { credentialKeys } from './credentialKeys'

export function useDeleteCredential() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => credentialService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: credentialKeys.all }),
  })
}
