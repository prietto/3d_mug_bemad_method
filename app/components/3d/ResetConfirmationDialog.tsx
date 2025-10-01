'use client'

import React, { useEffect } from 'react'

interface ResetConfirmationDialogProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  resetType: 'all' | 'image' | 'color' | 'text'
}

const resetMessages = {
  all: {
    title: 'Reset All Design',
    message: 'Are you sure you want to reset all customizations? This will clear your color, image, and text changes.'
  },
  image: {
    title: 'Reset Image',
    message: 'Are you sure you want to remove the uploaded image? Your color and text customizations will remain.'
  },
  color: {
    title: 'Reset Color',
    message: 'Are you sure you want to reset the mug color to white? Your image and text customizations will remain.'
  },
  text: {
    title: 'Reset Text',
    message: 'Are you sure you want to remove all text customizations? Your image and color will remain.'
  }
}

export default function ResetConfirmationDialog({
  isOpen,
  onConfirm,
  onCancel,
  resetType
}: ResetConfirmationDialogProps) {
  const { title, message } = resetMessages[resetType]

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/25 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />
      
      {/* Dialog */}
      <div 
        className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <h3
          id="dialog-title"
          className="text-lg font-medium leading-6 text-gray-900 mb-4"
        >
          {title}
        </h3>
        
        <div className="mb-6">
          <p className="text-sm text-gray-500">
            {message}
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            className="inline-flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors min-h-[44px] min-w-[80px]"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="inline-flex justify-center rounded-lg border border-transparent bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors min-h-[44px] min-w-[80px]"
            onClick={onConfirm}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}
