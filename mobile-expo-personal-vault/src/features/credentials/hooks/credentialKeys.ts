import type { CredentialListParams } from '../types/credential.types'

export const credentialKeys = {
  all: ['credentials'] as const,
  list: (params?: CredentialListParams) => [...credentialKeys.all, 'list', params] as const,
  detail: (id: string) => [...credentialKeys.all, 'detail', id] as const,
}
