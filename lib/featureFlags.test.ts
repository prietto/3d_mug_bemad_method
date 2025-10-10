import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  getFeatureFlags,
  isAIModeEnabled,
  isLegacy3DModeEnabled,
  shouldShowAIMode,
  getUserRolloutBucket
} from './featureFlags'

describe('featureFlags', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv
  })

  describe('getFeatureFlags', () => {
    it('returns correct flags when all enabled', () => {
      process.env.NEXT_PUBLIC_ENABLE_AI_MODE = 'true'
      process.env.NEXT_PUBLIC_ENABLE_LEGACY_3D_MODE = 'true'
      process.env.AI_MODE_ROLLOUT_PERCENT = '75'

      const flags = getFeatureFlags()

      expect(flags.aiModeEnabled).toBe(true)
      expect(flags.legacy3DModeEnabled).toBe(true)
      expect(flags.aiModeRolloutPercent).toBe(75)
    })

    it('returns false when flags not set', () => {
      delete process.env.NEXT_PUBLIC_ENABLE_AI_MODE
      delete process.env.NEXT_PUBLIC_ENABLE_LEGACY_3D_MODE

      const flags = getFeatureFlags()

      expect(flags.aiModeEnabled).toBe(false)
      expect(flags.legacy3DModeEnabled).toBe(false)
    })

    it('defaults rollout to 100 when not specified', () => {
      delete process.env.AI_MODE_ROLLOUT_PERCENT

      const flags = getFeatureFlags()

      expect(flags.aiModeRolloutPercent).toBe(100)
    })

    it('handles invalid rollout percentage', () => {
      process.env.AI_MODE_ROLLOUT_PERCENT = 'invalid'

      const flags = getFeatureFlags()

      expect(flags.aiModeRolloutPercent).toBeNaN()
    })
  })

  describe('isAIModeEnabled', () => {
    it('returns true when AI mode enabled', () => {
      process.env.NEXT_PUBLIC_ENABLE_AI_MODE = 'true'

      expect(isAIModeEnabled()).toBe(true)
    })

    it('returns false when AI mode disabled', () => {
      process.env.NEXT_PUBLIC_ENABLE_AI_MODE = 'false'

      expect(isAIModeEnabled()).toBe(false)
    })

    it('returns false when AI mode not set', () => {
      delete process.env.NEXT_PUBLIC_ENABLE_AI_MODE

      expect(isAIModeEnabled()).toBe(false)
    })
  })

  describe('isLegacy3DModeEnabled', () => {
    it('returns true when legacy mode enabled', () => {
      process.env.NEXT_PUBLIC_ENABLE_LEGACY_3D_MODE = 'true'

      expect(isLegacy3DModeEnabled()).toBe(true)
    })

    it('returns false when legacy mode disabled', () => {
      process.env.NEXT_PUBLIC_ENABLE_LEGACY_3D_MODE = 'false'

      expect(isLegacy3DModeEnabled()).toBe(false)
    })

    it('returns false when legacy mode not set', () => {
      delete process.env.NEXT_PUBLIC_ENABLE_LEGACY_3D_MODE

      expect(isLegacy3DModeEnabled()).toBe(false)
    })
  })

  describe('shouldShowAIMode', () => {
    it('returns false when AI mode disabled globally', () => {
      process.env.NEXT_PUBLIC_ENABLE_AI_MODE = 'false'
      process.env.AI_MODE_ROLLOUT_PERCENT = '100'

      expect(shouldShowAIMode('user-123')).toBe(false)
    })

    it('returns true for all users at 100% rollout', () => {
      process.env.NEXT_PUBLIC_ENABLE_AI_MODE = 'true'
      process.env.AI_MODE_ROLLOUT_PERCENT = '100'

      const userIds = Array.from({ length: 20 }, (_, i) => `user-${i}`)
      const results = userIds.map(id => shouldShowAIMode(id))

      expect(results.every(r => r === true)).toBe(true)
    })

    it('returns false for all users at 0% rollout', () => {
      process.env.NEXT_PUBLIC_ENABLE_AI_MODE = 'true'
      process.env.AI_MODE_ROLLOUT_PERCENT = '0'

      const userIds = Array.from({ length: 20 }, (_, i) => `user-${i}`)
      const results = userIds.map(id => shouldShowAIMode(id))

      expect(results.every(r => r === false)).toBe(true)
    })

    it('respects 50% rollout approximately', () => {
      process.env.NEXT_PUBLIC_ENABLE_AI_MODE = 'true'
      process.env.AI_MODE_ROLLOUT_PERCENT = '50'

      // Test with 100 different user IDs
      const userIds = Array.from({ length: 100 }, (_, i) => `user-${i}`)
      const shownAIMode = userIds.filter(id => shouldShowAIMode(id))

      // Allow 40-60% range for variance
      expect(shownAIMode.length).toBeGreaterThanOrEqual(40)
      expect(shownAIMode.length).toBeLessThanOrEqual(60)
    })

    it('is deterministic for same user', () => {
      process.env.NEXT_PUBLIC_ENABLE_AI_MODE = 'true'
      process.env.AI_MODE_ROLLOUT_PERCENT = '50'

      const userId = 'user-123'
      const result1 = shouldShowAIMode(userId)
      const result2 = shouldShowAIMode(userId)
      const result3 = shouldShowAIMode(userId)

      expect(result1).toBe(result2)
      expect(result2).toBe(result3)
    })

    it('produces different results for different users', () => {
      process.env.NEXT_PUBLIC_ENABLE_AI_MODE = 'true'
      process.env.AI_MODE_ROLLOUT_PERCENT = '50'

      const userIds = Array.from({ length: 10 }, (_, i) => `user-${i}`)
      const results = userIds.map(id => shouldShowAIMode(id))

      // Not all users should get same result
      const uniqueResults = new Set(results)
      expect(uniqueResults.size).toBeGreaterThan(1)
    })

    it('handles edge case rollout percentages', () => {
      process.env.NEXT_PUBLIC_ENABLE_AI_MODE = 'true'

      // 1% rollout - very few users
      process.env.AI_MODE_ROLLOUT_PERCENT = '1'
      const userIds1 = Array.from({ length: 100 }, (_, i) => `user-${i}`)
      const shown1 = userIds1.filter(id => shouldShowAIMode(id))
      expect(shown1.length).toBeLessThan(5)

      // 99% rollout - almost all users
      process.env.AI_MODE_ROLLOUT_PERCENT = '99'
      const userIds99 = Array.from({ length: 100 }, (_, i) => `user-${i}`)
      const shown99 = userIds99.filter(id => shouldShowAIMode(id))
      expect(shown99.length).toBeGreaterThan(95)
    })
  })

  describe('getUserRolloutBucket', () => {
    it('returns a number between 0 and 99', () => {
      const bucket = getUserRolloutBucket('user-123')

      expect(bucket).toBeGreaterThanOrEqual(0)
      expect(bucket).toBeLessThanOrEqual(99)
    })

    it('is deterministic for same user', () => {
      const userId = 'user-abc'
      const bucket1 = getUserRolloutBucket(userId)
      const bucket2 = getUserRolloutBucket(userId)
      const bucket3 = getUserRolloutBucket(userId)

      expect(bucket1).toBe(bucket2)
      expect(bucket2).toBe(bucket3)
    })

    it('produces different buckets for different users', () => {
      const buckets = [
        getUserRolloutBucket('user-1'),
        getUserRolloutBucket('user-2'),
        getUserRolloutBucket('user-3'),
        getUserRolloutBucket('user-4'),
        getUserRolloutBucket('user-5')
      ]

      // Not all users should be in same bucket
      const uniqueBuckets = new Set(buckets)
      expect(uniqueBuckets.size).toBeGreaterThan(1)
    })

    it('distributes users across all buckets', () => {
      const userIds = Array.from({ length: 1000 }, (_, i) => `user-${i}`)
      const buckets = userIds.map(id => getUserRolloutBucket(id))
      const uniqueBuckets = new Set(buckets)

      // With 1000 users, should hit most buckets
      expect(uniqueBuckets.size).toBeGreaterThan(90)
    })
  })

  describe('integration tests', () => {
    it('rollout percentage controls shouldShowAIMode', () => {
      process.env.NEXT_PUBLIC_ENABLE_AI_MODE = 'true'
      const userId = 'test-user-456'

      // Get user's bucket
      const bucket = getUserRolloutBucket(userId)

      // If bucket is 25, user should see AI mode at 30% rollout but not at 20%
      process.env.AI_MODE_ROLLOUT_PERCENT = String(bucket + 5)
      expect(shouldShowAIMode(userId)).toBe(true)

      process.env.AI_MODE_ROLLOUT_PERCENT = String(bucket - 5)
      expect(shouldShowAIMode(userId)).toBe(false)
    })

    it('handles all flags combinations', () => {
      const userId = 'user-test'

      // Both enabled
      process.env.NEXT_PUBLIC_ENABLE_AI_MODE = 'true'
      process.env.NEXT_PUBLIC_ENABLE_LEGACY_3D_MODE = 'true'
      process.env.AI_MODE_ROLLOUT_PERCENT = '100'
      expect(isAIModeEnabled()).toBe(true)
      expect(isLegacy3DModeEnabled()).toBe(true)
      expect(shouldShowAIMode(userId)).toBe(true)

      // Only AI enabled
      process.env.NEXT_PUBLIC_ENABLE_LEGACY_3D_MODE = 'false'
      expect(isAIModeEnabled()).toBe(true)
      expect(isLegacy3DModeEnabled()).toBe(false)
      expect(shouldShowAIMode(userId)).toBe(true)

      // Only legacy enabled
      process.env.NEXT_PUBLIC_ENABLE_AI_MODE = 'false'
      process.env.NEXT_PUBLIC_ENABLE_LEGACY_3D_MODE = 'true'
      expect(isAIModeEnabled()).toBe(false)
      expect(isLegacy3DModeEnabled()).toBe(true)
      expect(shouldShowAIMode(userId)).toBe(false)

      // Both disabled
      process.env.NEXT_PUBLIC_ENABLE_AI_MODE = 'false'
      process.env.NEXT_PUBLIC_ENABLE_LEGACY_3D_MODE = 'false'
      expect(isAIModeEnabled()).toBe(false)
      expect(isLegacy3DModeEnabled()).toBe(false)
      expect(shouldShowAIMode(userId)).toBe(false)
    })
  })
})
