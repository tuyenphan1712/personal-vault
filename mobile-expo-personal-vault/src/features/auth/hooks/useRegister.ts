import { useMutation } from '@tanstack/react-query'
import { authService } from '../services/auth.service'
import type { RegisterRequest } from '../types/auth.types'

export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterRequest) => authService.register(payload),
  })
}
