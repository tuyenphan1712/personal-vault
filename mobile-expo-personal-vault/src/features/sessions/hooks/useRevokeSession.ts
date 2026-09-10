import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sessionService } from '../services/session.service'
import { sessionKeys } from './sessionKeys'

export function useRevokeSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => sessionService.revoke(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionKeys.all }),
  })
}
