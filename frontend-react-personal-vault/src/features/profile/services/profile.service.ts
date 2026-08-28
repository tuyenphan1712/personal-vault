import { apiClient } from '@/shared/lib/axios'
import type { ApiSuccessResponse } from '@/shared/types/api.types'
import type { Profile, UpdateProfileRequest } from '../types/profile.types'

export const profileService = {
  get: async () => {
    const res = await apiClient.get<ApiSuccessResponse<Profile>>('/profile')
    return res.data.data
  },
  update: async (payload: UpdateProfileRequest) => {
    const res = await apiClient.patch<ApiSuccessResponse<Profile>>('/profile', payload)
    return res.data.data
  },
}
