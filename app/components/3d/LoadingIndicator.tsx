'use client'

import React, { useState, useEffect } from 'react'

interface LoadingIndicatorProps {
  isLoading: boolean
  loadingText?: string
  className?: string
}

export default function LoadingIndicator({ 
  isLoading, 
  loadingText = "Loading 3D model...",
  className = ""
}: LoadingIndicatorProps) {
  const [dots, setDots] = useState(1)

  useEffect(() => {
    if (!isLoading) return

    const interval = setInterval(() => {
      setDots(prev => prev >= 3 ? 1 : prev + 1)
    }, 500)

    return () => clearInterval(interval)
  }, [isLoading])

  if (!isLoading) return null

  return (
    <div className={`absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50 ${className}`}>
      <div className="text-center">
        {/* Animated 3D loading icon */}
        <div className="relative mb-4">
          <div className="w-16 h-16 mx-auto">
            {/* Rotating mug outline */}
            <div className="absolute inset-0 border-4 border-blue-200 rounded-lg animate-spin">
              <div className="absolute top-1/2 -right-2 w-3 h-6 border-2 border-blue-200 rounded-r-lg transform -translate-y-1/2"></div>
            </div>
            {/* Inner rotating element */}
            <div className="absolute inset-2 border-2 border-blue-600 rounded-lg animate-pulse"></div>
          </div>
        </div>
        
        {/* Loading text with animated dots */}
        <div className="text-lg font-medium text-gray-800 mb-2">
          {loadingText}{'.'.repeat(dots)}
        </div>
        
        {/* Progress indicator */}
        <div className="w-48 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-pulse"></div>
        </div>
        
        <p className="text-sm text-gray-600 mt-3">
          Initializing WebGL renderer
        </p>
      </div>
    </div>
  )
}
