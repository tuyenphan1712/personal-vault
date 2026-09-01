import { AxiosError, AxiosHeaders } from 'axios'
import { extractAuthErrorMessage } from '../extractAuthErrorMessage'

function makeAxiosError(status: number, data: unknown): AxiosError {
  const error = new AxiosError('Request failed', undefined, undefined, undefined, {
    status,
    statusText: 'Error',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data,
  })
  return error
}

describe('extractAuthErrorMessage', () => {
  it('returns the backend message for a plain error code', () => {
    const error = makeAxiosError(401, {
      success: false,
      error: { code: 'AUTH_001', message: 'Invalid phone or password', details: null },
    })

    expect(extractAuthErrorMessage(error)).toBe('Invalid phone or password')
  })

  it('formats a retry-after message for AUTH_004 lockout', () => {
    const error = makeAxiosError(429, {
      success: false,
      error: { code: 'AUTH_004', message: 'Too many failed attempts', details: { retryAfterSeconds: 120 } },
    })

    expect(extractAuthErrorMessage(error)).toBe('Too many failed attempts. Try again in 120s.')
  })

  it('falls back to a generic message for a non-axios error', () => {
    expect(extractAuthErrorMessage(new Error('network down'))).toBe('Something went wrong. Please try again.')
  })

  it('falls back to a generic message when the axios error has no response body', () => {
    const error = new AxiosError('Network Error')
    expect(extractAuthErrorMessage(error)).toBe('Something went wrong. Please try again.')
  })
})
