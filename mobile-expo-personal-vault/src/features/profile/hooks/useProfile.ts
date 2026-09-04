import { useQuery } from '@tanstack/react-query'
import { profileService } from '../services/profile.service'
import { profileKeys } from './profileKeys'

export function useProfile() {
  return useQuery({
    queryKey: profileKeys.detail(),
    queryFn: profileService.get,
  })
}
