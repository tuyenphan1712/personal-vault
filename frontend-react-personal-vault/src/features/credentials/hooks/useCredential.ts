import { useQuery } from '@tanstack/react-query'
import { credentialService } from '../services/credential.service'
import { credentialKeys } from './credentialKeys'

export function useCredential(id: string) {
  return useQuery({
    queryKey: credentialKeys.detail(id),
    queryFn: () => credentialService.getById(id),
  })
}
