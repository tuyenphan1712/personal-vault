import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth'
import { profileService } from '../services/profile.service'
import type { UpdateProfileRequest } from '../types/profile.types'
import { profileKeys } from './profileKeys'

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const setSession = useAuthStore((state) => state.setSession)
  const user = useAuthStore((state) => state.user)

  return useMutation({
    mutationFn: (payload: UpdateProfileRequest) => profileService.update(payload),
    onSuccess: (profile) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all })
      if (user) {
        setSession({ ...user, fullName: profile.fullName })
      }
    },
  })
}
