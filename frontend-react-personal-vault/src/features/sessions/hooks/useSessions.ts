import { useQuery } from '@tanstack/react-query'
import { sessionService } from '../services/session.service'
import { sessionKeys } from './sessionKeys'

export function useSessions() {
  return useQuery({
    queryKey: sessionKeys.all,
    queryFn: sessionService.getAll,
  })
}
