import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/src/features/auth'
import { profileService } from '../services/profile.service'
import { profileKeys } from './profileKeys'

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: profileService.update,
    onSuccess: (profile) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all })

      // Home screen's greeting reads fullName from the session, not from this
      // feature's query cache, so keep it in sync after a successful edit.
      const currentUser = useAuthStore.getState().user
      if (currentUser) {
        useAuthStore.getState().setSession({ ...currentUser, fullName: profile.fullName })
      }
    },
  })
}
