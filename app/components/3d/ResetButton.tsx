'use client'

import React, { useRef, useState } from 'react'
import { useDesignStore } from './store/designStore'
import ResetConfirmationDialog from './ResetConfirmationDialog'
import VisualFeedback from './VisualFeedback'

interface ResetButtonProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'ghost'
  resetType?: 'all' | 'camera' | 'image' | 'color' | 'text'
  showConfirmation?: boolean
}

export default function ResetButton({ 
  className = '',
  size = 'md',
  variant = 'secondary',
  resetType = 'camera',
  showConfirmation = false
}: ResetButtonProps) {
  const { 
    resetCameraToDefault, 
    resetToDefault, 
    resetImage, 
    resetColor, 
    resetText
  } = useDesignStore()
  const animationRef = useRef<number | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [feedback, setFeedback] = useState<{
    message: string
    type: 'success' | 'error' | 'info'
  } | null>(null)

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  }

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600',
    secondary: 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300 shadow-sm',
    ghost: 'bg-black/20 hover:bg-black/30 text-white border-transparent backdrop-blur-sm'
  }

  const handleReset = () => {
    if (showConfirmation && resetType !== 'camera') {
      setShowDialog(true)
      return
    }
    
    performReset()
  }

  const performReset = () => {
    try {
      switch (resetType) {
        case 'camera':
          handleCameraReset()
          break
        case 'all':
          resetToDefault()
          setFeedback({
            message: 'Design reset successfully',
            type: 'success'
          })
          break
        case 'image':
          resetImage()
          setFeedback({
            message: 'Image removed successfully',
            type: 'success'
          })
          break
        case 'color':
          resetColor()
          setFeedback({
            message: 'Color reset to white',
            type: 'success'
          })
          break
        case 'text':
          resetText()
          setFeedback({
            message: 'Text removed successfully',
            type: 'success'
          })
          break
      }
    } catch (error) {
      setFeedback({
        message: 'Reset failed. Please try again.',
        type: 'error'
      })
    }
    
    setShowDialog(false)
  }

  const handleCameraReset = () => {
    // Directly call the store reset function which will handle the smooth animation
    // The animation logic will be handled in the Controls component
    resetCameraToDefault()
    
    setFeedback({
      message: 'Camera view reset',
      type: 'success'
    })
  }

  const getButtonText = () => {
    switch (resetType) {
      case 'all': return 'Reset All Design'
      case 'camera': return 'Reset Camera View'
      case 'image': return 'Reset Image'
      case 'color': return 'Reset Color'
      case 'text': return 'Reset Text'
      default: return 'Reset'
    }
  }

  const getButtonShortText = () => {
    switch (resetType) {
      case 'image': return 'Image'
      case 'color': return 'Color'
      case 'text': return 'Text'
      default: return getButtonText()
    }
  }

  const getAriaLabel = () => {
    switch (resetType) {
      case 'all': return 'Reset all design customizations'
      case 'camera': return 'Reset camera to default position'
      case 'image': return 'Remove uploaded image'
      case 'color': return 'Reset mug color to white'
      case 'text': return 'Remove custom text'
      default: return 'Reset'
    }
  }

  const showTextLabel = className.includes('w-full') || size === 'lg'

  return (
    <>
      <button
        onClick={handleReset}
        className={`
          inline-flex items-center justify-center gap-2
          ${className.includes('rounded-lg') ? '' : 'rounded-full'} border
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          active:scale-95
          ${showTextLabel ? '' : sizeClasses[size]}
          ${variantClasses[variant]}
          ${className}
        `}
        title={getButtonText()}
        aria-label={getAriaLabel()}
      >
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className={showTextLabel ? "w-4 h-4" : "w-4 h-4"}
        >
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
          <path d="M21 3v5h-5"/>
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
          <path d="M3 21v-5h5"/>
        </svg>
        {showTextLabel && (
          <span className="text-sm font-medium">
            {size === 'sm' ? getButtonShortText() : getButtonText()}
          </span>
        )}
      </button>

      {/* Confirmation Dialog */}
      {resetType !== 'camera' && (
        <ResetConfirmationDialog
          isOpen={showDialog}
          onConfirm={performReset}
          onCancel={() => setShowDialog(false)}
          resetType={resetType as 'all' | 'image' | 'color' | 'text'}
        />
      )}

      {/* Visual Feedback */}
      {feedback && (
        <VisualFeedback
          message={feedback.message}
          type={feedback.type}
          onDismiss={() => setFeedback(null)}
        />
      )}
    </>
  )
}
