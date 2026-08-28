export interface Credential {
  id: string
  platformName: string
  account: string
  encryptedPassword: string
  ciphertextVersion: number
  note: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateCredentialRequest {
  platformName: string
  account: string
  encryptedPassword: string
  ciphertextVersion?: number
  note?: string | null
}

export type UpdateCredentialRequest = Partial<CreateCredentialRequest>

export interface CredentialListParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
}
