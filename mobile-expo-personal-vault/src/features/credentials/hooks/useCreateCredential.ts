import { useMutation, useQueryClient } from '@tanstack/react-query'
import { credentialService } from '../services/credential.service'
import { credentialKeys } from './credentialKeys'

export function useCreateCredential() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: credentialService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: credentialKeys.all }),
  })
}
