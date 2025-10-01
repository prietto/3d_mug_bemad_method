'use client'

import React, { useState } from 'react'

// Simple X icon component
const XIcon = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

interface TextInputProps {
  value: string
  onChange: (text: string) => void
  maxLength?: number
  placeholder?: string
  className?: string
}

export default function TextInput({
  value,
  onChange,
  maxLength = 50,
  placeholder = "Add custom text...",
  className = ""
}: TextInputProps) {
  const [showClearDialog, setShowClearDialog] = useState(false)
  const remainingChars = maxLength - value.length

  const handleClear = () => {
    if (value.length > 0) {
      setShowClearDialog(true)
    }
  }

  const confirmClear = () => {
    onChange('')
    setShowClearDialog(false)
  }

  const cancelClear = () => {
    setShowClearDialog(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.slice(0, maxLength)
    onChange(newValue)
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          maxLength={maxLength}
          className="w-full px-4 py-3 pr-12 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
          aria-label="Custom text input"
          aria-describedby="char-count"
        />
        {value.length > 0 && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center -m-2"
            aria-label="Clear text"
          >
            <XIcon className="w-5 h-5" />
          </button>
        )}
      </div>
      
      <div className="flex justify-between items-center text-xs">
        <span 
          id="char-count"
          className={`${remainingChars < 10 ? 'text-orange-600' : 'text-gray-500'}`}
        >
          {remainingChars} characters remaining
        </span>
        <span className="text-gray-400">
          {value.length}/{maxLength}
        </span>
      </div>

      {/* Clear Confirmation Dialog */}
      {showClearDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Clear Text?
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to clear all your custom text? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={cancelClear}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={confirmClear}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-200 min-h-[44px]"
              >
                Clear Text
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
