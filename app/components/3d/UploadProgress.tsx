'use client'

import React from 'react'

interface UploadProgressProps {
  progress: number
  isUploading: boolean
  fileName?: string
  error?: string
  className?: string
}

export default function UploadProgress({
  progress,
  isUploading,
  fileName,
  error,
  className = ""
}: UploadProgressProps) {
  if (!isUploading && !error) {
    return null
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 shadow-sm ${className}`}>
      {error ? (
        // Error State
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.96-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-800">Upload Failed</p>
            <p className="text-sm text-red-600 mt-1 break-words">{error}</p>
          </div>
        </div>
      ) : isUploading ? (
        // Uploading State
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {progress < 80 ? 'Uploading' : progress < 100 ? 'Processing' : 'Completing'}...
              </p>
              {fileName && (
                <p className="text-xs text-gray-500 mt-1 truncate">{fileName}</p>
              )}
            </div>
            <div className="flex-shrink-0">
              <span className="text-sm font-medium text-gray-900">{progress}%</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                progress < 80 
                  ? 'bg-blue-600' 
                  : progress < 100 
                    ? 'bg-yellow-500' 
                    : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>

          {/* Status Messages */}
          <div className="text-xs text-gray-500">
            {progress < 20 && "Validating file..."}
            {progress >= 20 && progress < 50 && "Uploading to cloud storage..."}
            {progress >= 50 && progress < 80 && "Optimizing for 3D rendering..."}
            {progress >= 80 && progress < 100 && "Applying to mug surface..."}
            {progress >= 100 && "Upload complete!"}
          </div>
        </div>
      ) : (
        // Success State (brief display)
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-800">Upload Successful</p>
            <p className="text-sm text-green-600 mt-1">Your image has been applied to the mug</p>
          </div>
        </div>
      )}
    </div>
  )
}
