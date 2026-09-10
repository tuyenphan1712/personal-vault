import { renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { API_BASE_URL } from '@/config/constants'
import { createQueryClientWrapper } from '@/test/QueryClientWrapper'
import { server } from '@/test/msw/server'
import { useRevokeSession } from './useRevokeSession'

describe('useRevokeSession', () => {
  it('calls DELETE /sessions/:id and succeeds', async () => {
    let revokedId: string | undefined
    server.use(
      http.delete(`${API_BASE_URL}/sessions/:id`, ({ params }) => {
        revokedId = params.id as string
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const { result } = renderHook(() => useRevokeSession(), { wrapper: createQueryClientWrapper() })

    result.current.mutate('s1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(revokedId).toBe('s1')
  })
})
