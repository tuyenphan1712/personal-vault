import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useToast } from './useToast'

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with no message', () => {
    const { result } = renderHook(() => useToast())

    expect(result.current.message).toBeNull()
  })

  it('sets the message when notify is called', () => {
    const { result } = renderHook(() => useToast())

    act(() => result.current.notify('Saved'))

    expect(result.current.message).toBe('Saved')
  })

  it('clears the message automatically after the timeout', () => {
    const { result } = renderHook(() => useToast())

    act(() => result.current.notify('Saved'))
    expect(result.current.message).toBe('Saved')

    act(() => vi.advanceTimersByTime(2600))

    expect(result.current.message).toBeNull()
  })
})
