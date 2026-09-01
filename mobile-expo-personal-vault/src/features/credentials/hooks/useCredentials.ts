import { useQuery } from '@tanstack/react-query'
import { credentialService } from '../services/credential.service'
import type { CredentialListParams } from '../types/credential.types'
import { credentialKeys } from './credentialKeys'

export function useCredentials(params?: CredentialListParams) {
  return useQuery({
    queryKey: credentialKeys.list(params),
    queryFn: () => credentialService.getAll(params),
  })
}
