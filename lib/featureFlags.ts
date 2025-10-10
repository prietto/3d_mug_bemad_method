// Feature Flag Utility Module
// Story 9.4: Simplified Refinement Controls & Feature Flag

/**
 * Feature flag configuration interface
 */
export interface FeatureFlagConfig {
  aiModeEnabled: boolean
  legacy3DModeEnabled: boolean
  aiModeRolloutPercent: number // 0-100
}

/**
 * Get current feature flag configuration from environment variables
 */
export function getFeatureFlags(): FeatureFlagConfig {
  return {
    aiModeEnabled: process.env.NEXT_PUBLIC_ENABLE_AI_MODE === 'true',
    legacy3DModeEnabled: process.env.NEXT_PUBLIC_ENABLE_LEGACY_3D_MODE === 'true',
    aiModeRolloutPercent: parseInt(process.env.AI_MODE_ROLLOUT_PERCENT || '100', 10)
  }
}

/**
 * Check if AI mode is enabled globally
 */
export function isAIModeEnabled(): boolean {
  return getFeatureFlags().aiModeEnabled
}

/**
 * Check if Legacy 3D mode is enabled globally
 */
export function isLegacy3DModeEnabled(): boolean {
  return getFeatureFlags().legacy3DModeEnabled
}

/**
 * Determine if a specific user should see AI mode based on rollout percentage
 * Uses deterministic hashing for consistent user experience
 *
 * @param userId - Unique user identifier
 * @returns true if user should see AI mode, false otherwise
 */
export function shouldShowAIMode(userId: string): boolean {
  const flags = getFeatureFlags()

  // If AI mode not enabled globally, return false
  if (!flags.aiModeEnabled) return false

  // If 100% rollout, show to everyone
  if (flags.aiModeRolloutPercent >= 100) return true

  // If 0% rollout, show to nobody
  if (flags.aiModeRolloutPercent <= 0) return false

  // Percentage-based rollout using deterministic hashing
  const userHash = hashUserId(userId)
  return (userHash % 100) < flags.aiModeRolloutPercent
}

/**
 * Simple hash function for deterministic user bucketing
 * Same user ID will always produce same hash value
 *
 * @param userId - User identifier to hash
 * @returns Positive integer hash value
 */
function hashUserId(userId: string): number {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i)
    hash |= 0 // Convert to 32bit integer
  }
  return Math.abs(hash)
}

/**
 * Get the rollout bucket (0-99) for a user
 * Useful for analytics and debugging
 *
 * @param userId - User identifier
 * @returns Bucket number from 0 to 99
 */
export function getUserRolloutBucket(userId: string): number {
  return hashUserId(userId) % 100
}
