'use client'

import React, { useEffect, useState } from 'react'
import { useDesignStore } from './store/designStore'

interface TouchHintsProps {
  showOnboarding?: boolean
  className?: string
}

export default function TouchHints({ 
  showOnboarding = false,
  className = ''
}: TouchHintsProps) {
  const { interaction } = useDesignStore()
  const [showHints, setShowHints] = useState(showOnboarding)
  const [hasInteracted, setHasInteracted] = useState(false)

  // Hide hints after first interaction
  useEffect(() => {
    if (interaction.isDragging || interaction.isZooming) {
      if (!hasInteracted) {
        setHasInteracted(true)
        // Hide hints after a delay
        setTimeout(() => setShowHints(false), 2000)
      }
    }
  }, [interaction.isDragging, interaction.isZooming, hasInteracted])

  // Show hints again if user hasn't interacted for a while
  useEffect(() => {
    if (!hasInteracted) return

    const timer = setTimeout(() => {
      if (!interaction.isDragging && !interaction.isZooming) {
        setShowHints(true)
        // Auto-hide again
        setTimeout(() => setShowHints(false), 3000)
      }
    }, 10000) // Show hints again after 10 seconds of inactivity

    return () => clearTimeout(timer)
  }, [interaction.isDragging, interaction.isZooming, hasInteracted])

  if (!showHints && !interaction.isDragging && !interaction.isZooming) {
    return null
  }

  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`}>
      {/* Interactive area boundary indicator */}
      <div className="absolute inset-2 rounded-lg border-2 border-dashed border-white/30 opacity-50 transition-opacity duration-300" />
      
      {/* Touch feedback during interaction */}
      {(interaction.isDragging || interaction.isZooming) && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
            {interaction.isDragging && '🔄 Rotating'}
            {interaction.isZooming && '🔍 Zooming'}
          </div>
        </div>
      )}

      {/* Onboarding hints */}
      {showHints && !interaction.isDragging && !interaction.isZooming && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/70 backdrop-blur-sm text-white p-4 rounded-xl max-w-xs text-center">
            <div className="space-y-2">
              <div className="text-sm font-semibold">Explore the 3D Mug</div>
              <div className="text-xs space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <span>👆 Drag to rotate</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span>🤏 Pinch to zoom</span>
                </div>
              </div>
            </div>
            
            {/* Animated gesture indicators */}
            <div className="mt-3 flex justify-center space-x-4">
              <div className="relative">
                <div className="w-8 h-8 bg-white/20 rounded-full animate-pulse" />
                <div className="absolute inset-0 w-8 h-8 bg-white/10 rounded-full animate-ping" />
              </div>
              <div className="relative">
                <div className="w-6 h-6 bg-white/20 rounded-full animate-pulse animation delay-200" />
                <div className="absolute top-1 left-1 w-6 h-6 bg-white/10 rounded-full animate-ping animation-delay-200" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Corner indicators for interactive area */}
      {showHints && (
        <>
          <div className="absolute top-2 left-2 w-4 h-4">
            <div className="w-full h-0.5 bg-white/40" />
            <div className="w-0.5 h-full bg-white/40" />
          </div>
          <div className="absolute top-2 right-2 w-4 h-4">
            <div className="w-full h-0.5 bg-white/40" />
            <div className="absolute right-0 w-0.5 h-full bg-white/40" />
          </div>
          <div className="absolute bottom-2 left-2 w-4 h-4">
            <div className="absolute bottom-0 w-full h-0.5 bg-white/40" />
            <div className="w-0.5 h-full bg-white/40" />
          </div>
          <div className="absolute bottom-2 right-2 w-4 h-4">
            <div className="absolute bottom-0 w-full h-0.5 bg-white/40" />
            <div className="absolute right-0 w-0.5 h-full bg-white/40" />
          </div>
        </>
      )}
    </div>
  )
}
