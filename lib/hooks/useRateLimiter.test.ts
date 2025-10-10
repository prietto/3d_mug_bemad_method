import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRateLimiter } from './useRateLimiter'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    clear: () => {
      store = {}
    }
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('useRateLimiter Hook', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useRateLimiter())

    expect(result.current.sessionUsed).toBe(0)
    expect(result.current.sessionLimit).toBe(5)
    expect(result.current.canGenerate).toBe(true)
    expect(result.current.remaining).toBe(5)
  })

  it('should increment count correctly', () => {
    const { result } = renderHook(() => useRateLimiter())

    act(() => {
      result.current.incrementCount()
    })

    expect(result.current.sessionUsed).toBe(1)
    expect(result.current.remaining).toBe(4)
    expect(result.current.canGenerate).toBe(true)
  })

  it('should block generation after 5 uses', () => {
    const { result } = renderHook(() => useRateLimiter())

    // Use all 5 generations
    act(() => {
      for (let i = 0; i < 5; i++) {
        result.current.incrementCount()
      }
    })

    expect(result.current.sessionUsed).toBe(5)
    expect(result.current.remaining).toBe(0)
    expect(result.current.canGenerate).toBe(false)
  })

  it('should persist count to localStorage', () => {
    const { result } = renderHook(() => useRateLimiter())

    act(() => {
      result.current.incrementCount()
    })

    const stored = localStorage.getItem('ai_generation_limit')
    expect(stored).toBeTruthy()

    const data = JSON.parse(stored!)
    expect(data.count).toBe(1)
    expect(data.date).toBeTruthy()
  })

  it('should load count from localStorage on mount', () => {
    const today = new Date().toISOString().split('T')[0]
    localStorage.setItem('ai_generation_limit', JSON.stringify({
      count: 3,
      date: today
    }))

    const { result } = renderHook(() => useRateLimiter())

    expect(result.current.sessionUsed).toBe(3)
    expect(result.current.remaining).toBe(2)
  })

  it('should reset count on new day', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]

    localStorage.setItem('ai_generation_limit', JSON.stringify({
      count: 5,
      date: yesterday
    }))

    const { result } = renderHook(() => useRateLimiter())

    expect(result.current.sessionUsed).toBe(0)
    expect(result.current.canGenerate).toBe(true)
    expect(result.current.remaining).toBe(5)
  })

  it('should handle reset action', () => {
    const { result } = renderHook(() => useRateLimiter())

    act(() => {
      result.current.incrementCount()
      result.current.incrementCount()
    })

    expect(result.current.sessionUsed).toBe(2)

    act(() => {
      result.current.reset()
    })

    expect(result.current.sessionUsed).toBe(0)
    expect(result.current.canGenerate).toBe(true)
  })

  it('should calculate remaining correctly', () => {
    const { result } = renderHook(() => useRateLimiter())

    expect(result.current.getRemaining()).toBe(5)

    act(() => {
      result.current.incrementCount()
      result.current.incrementCount()
    })

    expect(result.current.getRemaining()).toBe(3)
  })

  it('should handle localStorage errors gracefully', () => {
    // Mock localStorage to throw error
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('localStorage error')
    })

    const { result } = renderHook(() => useRateLimiter())

    // Should still initialize with defaults
    expect(result.current.sessionUsed).toBe(0)
    expect(result.current.canGenerate).toBe(true)
  })
})
