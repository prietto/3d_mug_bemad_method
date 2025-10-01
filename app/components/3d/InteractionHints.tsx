'use client'

import React, { useState, useEffect } from 'react'
import { useDesignStore } from './store/designStore'

interface InteractionHintsProps {
  showHints?: boolean
  className?: string
}

export default function InteractionHints({ 
  showHints = true, 
  className = '' 
}: InteractionHintsProps) {
  const { interaction, currentDesign } = useDesignStore()
  const [showRotateHint, setShowRotateHint] = useState(true)
  const [showCustomizeHint, setShowCustomizeHint] = useState(true)
  const [pulseAnimation, setPulseAnimation] = useState(true)

  // Hide rotate hint after user starts interacting
  useEffect(() => {
    if (interaction.isDragging || interaction.isZooming) {
      setShowRotateHint(false)
    }
  }, [interaction.isDragging, interaction.isZooming])

  // Hide customize hint once user has made changes
  useEffect(() => {
    if (currentDesign.customText || currentDesign.uploadedImageUrl || currentDesign.mugColor !== '#ffffff') {
      setShowCustomizeHint(false)
    }
  }, [currentDesign.customText, currentDesign.uploadedImageUrl, currentDesign.mugColor])

  // Disable pulse after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => setPulseAnimation(false), 10000)
    return () => clearTimeout(timer)
  }, [])

  if (!showHints) return null

  return (
    <div className={`absolute inset-0 pointer-events-none z-20 ${className}`}>
      {/* Rotation hint - bottom center */}
      {showRotateHint && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className={`
            bg-black/80 text-white px-4 py-2 rounded-full text-sm
            flex items-center space-x-2 backdrop-blur-sm
            transition-all duration-300
            ${pulseAnimation ? 'animate-pulse' : ''}
          `}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Drag to rotate • Scroll to zoom</span>
          </div>
        </div>
      )}

      {/* Customization hint - top left */}
      {showCustomizeHint && (
        <div className="absolute top-8 left-8">
          <div className={`
            bg-blue-600/90 text-white px-4 py-2 rounded-lg text-sm
            flex items-center space-x-2 backdrop-blur-sm max-w-xs
            transition-all duration-300
            ${pulseAnimation ? 'animate-pulse' : ''}
          `}>
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <span>Use the controls to customize your mug</span>
          </div>
        </div>
      )}

      {/* Interactive area indicators */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Mug interaction area indicator */}
        <div className={`
          w-64 h-64 rounded-full border-2 border-white/20 border-dashed
          transition-all duration-500
          ${interaction.isDragging ? 'scale-110 border-blue-400/40' : 'scale-100'}
          ${currentDesign.customText ? 'border-green-400/30' : ''}
        `}>
          {/* Center dot to indicate focal point */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className={`
              w-2 h-2 rounded-full bg-white/40
              transition-all duration-300
              ${interaction.isDragging ? 'scale-150 bg-blue-400/60' : ''}
            `} />
          </div>
        </div>
      </div>

      {/* Cursor change indicators */}
      {currentDesign.customText && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className={`
            absolute top-0 left-0 w-8 h-8 rounded-full
            border-2 border-yellow-400/50 animate-ping
            ${interaction.isDragging ? 'border-yellow-400/80' : ''}
          `} />
        </div>
      )}
    </div>
  )
}
