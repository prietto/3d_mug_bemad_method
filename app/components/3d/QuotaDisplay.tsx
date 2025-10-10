'use client'

import React from 'react'
import { useDesignStore } from './store/designStore'

export default function QuotaDisplay() {
  const rateLimit = useDesignStore(state => state.rateLimit)

  // Layer 3: Global limit reached
  if (rateLimit.globalReached && rateLimit.retryAfter) {
    const retryDate = new Date(rateLimit.retryAfter)
    return (
      <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-lg">
        <div className="flex items-start space-x-2">
          <svg
            className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5"
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
          <div className="flex-1">
            <p className="font-semibold">Service temporarily at capacity</p>
            <p className="text-sm mt-1">
              Try again at {retryDate.toLocaleTimeString()}
            </p>
            <p className="text-sm mt-2">
              Or{' '}
              <button className="underline font-medium hover:text-red-900">
                upload your own image
              </button>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Layer 2: IP-based limit (after 5 generations)
  if (rateLimit.ipUsed !== undefined && rateLimit.ipLimit !== undefined) {
    const remaining = rateLimit.ipLimit - rateLimit.ipUsed
    const isLow = remaining <= 2
    const isVeryLow = remaining === 0

    if (isVeryLow) {
      return (
        <div className="bg-yellow-50 border border-yellow-300 text-yellow-900 px-4 py-3 rounded-lg">
          <div className="flex items-start space-x-2">
            <svg
              className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5"
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
            <div className="flex-1">
              <p className="font-semibold">Daily limit reached</p>
              <p className="text-sm mt-1">
                You&apos;ve used all {rateLimit.ipLimit} daily generations. Resets at midnight UTC.
              </p>
              <p className="text-sm mt-2">
                Or{' '}
                <button className="underline font-medium hover:text-yellow-950">
                  upload your own image
                </button>
              </p>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className={`px-4 py-2 rounded-lg ${isLow ? 'bg-yellow-50 border border-yellow-200' : 'bg-blue-50 border border-blue-200'}`}>
        <div className="flex items-center justify-between">
          <p className={`text-sm ${isLow ? 'text-yellow-900' : 'text-blue-900'}`}>
            <span className="font-semibold">{remaining}</span> of {rateLimit.ipLimit} generations remaining today
            {isLow && ' ⚠️'}
          </p>
        </div>
      </div>
    )
  }

  // Layer 1: Session-based (first 5 generations)
  const remaining = rateLimit.sessionLimit - rateLimit.sessionUsed
  const isLow = remaining <= 1
  const isVeryLow = remaining === 0

  if (isVeryLow) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 px-4 py-3 rounded-lg">
        <div className="flex items-start space-x-2">
          <svg
            className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <p className="font-semibold">Free generations used</p>
            <p className="text-sm mt-1">
              You&apos;ve used your {rateLimit.sessionLimit} free generations. You can continue with IP-based quota.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`px-4 py-2 rounded-lg ${isLow ? 'bg-yellow-50 border border-yellow-200' : 'bg-blue-50 border border-blue-200'}`}>
      <p className={`text-sm ${isLow ? 'text-yellow-900' : 'text-blue-900'}`}>
        <span className="font-semibold">{rateLimit.sessionUsed}</span> of {rateLimit.sessionLimit} free generations used
        {isLow && ' ⚠️ (1 left)'}
      </p>
    </div>
  )
}
