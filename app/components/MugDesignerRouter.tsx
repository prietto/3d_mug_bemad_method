'use client'

import { useEffect, useState } from 'react'
import { isAIModeEnabled, isLegacy3DModeEnabled, shouldShowAIMode } from '@/lib/featureFlags'
import { trackEvent } from '@/lib/utils/analytics'
import AIMugDesigner from './3d/AIMugDesigner'

interface MugDesignerRouterProps {
  userId?: string
  className?: string
}

type DesignMode = 'ai' | 'legacy' | 'none'

/**
 * MugDesignerRouter - Routes between AI and Legacy 3D design modes based on feature flags
 * Story 9.4: Simplified Refinement Controls & Feature Flag
 */
export default function MugDesignerRouter({ userId, className = '' }: MugDesignerRouterProps) {
  const [mode, setMode] = useState<DesignMode>('none')
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Determine which mode to show
    const aiEnabled = isAIModeEnabled()
    const legacyEnabled = isLegacy3DModeEnabled()

    let selectedMode: DesignMode = 'none'

    if (aiEnabled && (!userId || shouldShowAIMode(userId))) {
      selectedMode = 'ai'
    } else if (legacyEnabled) {
      selectedMode = 'legacy'
    }

    setMode(selectedMode)
    setIsInitialized(true)

    // Track mode shown
    if (selectedMode === 'ai') {
      trackEvent('ai_mode_shown', {
        event_category: 'feature_flags',
        user_id: userId || 'anonymous',
        legacy_available: legacyEnabled
      })
    } else if (selectedMode === 'legacy') {
      trackEvent('legacy_3d_accessed', {
        event_category: 'feature_flags',
        reason: aiEnabled ? 'rollout_excluded' : 'fallback',
        ai_mode_available: aiEnabled
      })
    }
  }, [userId])

  const handleToggleToLegacy = () => {
    trackEvent('ai_mode_toggled', {
      event_category: 'feature_flags',
      from_mode: 'ai',
      to_mode: 'legacy',
      user_initiated: true
    })

    setMode('legacy')
  }

  const handleToggleToAI = () => {
    trackEvent('ai_mode_toggled', {
      event_category: 'feature_flags',
      from_mode: 'legacy',
      to_mode: 'ai',
      user_initiated: true
    })

    setMode('ai')
  }

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // AI Mode
  if (mode === 'ai') {
    return (
      <div className={`h-full w-full flex flex-col ${className}`}>
        <AIMugDesigner className="flex-1 overflow-y-auto" />

        {/* Toggle to Legacy Mode (if available) */}
        {isLegacy3DModeEnabled() && (
          <div className="mt-6 text-center pb-6">
            <button
              onClick={handleToggleToLegacy}
              className="text-sm text-gray-600 hover:text-gray-900 underline transition-colors"
            >
              Need more control? Switch to Advanced 3D Mode →
            </button>
          </div>
        )}
      </div>
    )
  }

  // Legacy 3D Mode
  if (mode === 'legacy') {
    return (
      <div className={className}>
        {/* Legacy 3D Designer would go here */}
        <div className="p-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Advanced 3D Mode
          </h3>
          <p className="text-gray-600 mb-4">
            The legacy Three.js 3D designer will be available here.
          </p>
          <p className="text-sm text-gray-500">
            This mode provides full manual control over mug design with 3D manipulation.
          </p>
        </div>

        {/* Toggle to AI Mode (if available) */}
        {isAIModeEnabled() && (
          <div className="mt-6 text-center">
            <button
              onClick={handleToggleToAI}
              className="text-sm text-gray-600 hover:text-gray-900 underline transition-colors"
            >
              ← Try our new AI-powered design experience
            </button>
          </div>
        )}
      </div>
    )
  }

  // Fallback - Both modes disabled
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="max-w-md mx-auto p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <svg
          className="w-12 h-12 text-yellow-600 mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Design Features Temporarily Unavailable
        </h3>
        <p className="text-gray-600 text-sm">
          Please try again later or contact support if the issue persists.
        </p>
      </div>
    </div>
  )
}
