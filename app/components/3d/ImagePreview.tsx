'use client'

import React, { useCallback } from 'react'

interface ImagePreviewProps {
  imageUrl: string
  onApply: () => void
  onRegenerate?: () => void
  isRegenerating?: boolean
  isApplying?: boolean
  onGenerateMultiView?: () => void
  isGeneratingMultiView?: boolean
  hasMultiView?: boolean
  onAdjustPrompt?: () => void
  className?: string
}

export default function ImagePreview({
  imageUrl,
  onApply,
  onRegenerate,
  isRegenerating = false,
  isApplying = false,
  onGenerateMultiView,
  isGeneratingMultiView = false,
  hasMultiView = false,
  onAdjustPrompt,
  className = ''
}: ImagePreviewProps) {
  const handleApply = useCallback(() => {
    onApply()
  }, [onApply])

  const handleRegenerate = useCallback(() => {
    if (onRegenerate) {
      onRegenerate()
    }
  }, [onRegenerate])

  const handleGenerateMultiView = useCallback(() => {
    if (onGenerateMultiView) {
      onGenerateMultiView()
    }
  }, [onGenerateMultiView])

  const handleAdjustPrompt = useCallback(() => {
    if (onAdjustPrompt) {
      onAdjustPrompt()
    }
  }, [onAdjustPrompt])

  return (
    <div className={`space-y-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          Your Generated Mug Design
        </h3>
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          ✓ Ready
        </span>
      </div>

      <p className="text-xs text-gray-600">
        Preview your AI-generated mug design. Click "Apply to Design" to use it in your order.
      </p>

      {/* Preview Image */}
      <div className="relative rounded-lg overflow-hidden bg-white shadow-md">
        <img
          src={imageUrl}
          alt="Generated mug design preview"
          className="w-full h-auto object-contain"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleApply}
          disabled={isRegenerating || isGeneratingMultiView || isApplying}
          className={`
            flex-1 px-4 py-3 text-sm font-semibold rounded-lg transition-all shadow-sm
            ${isRegenerating || isGeneratingMultiView || isApplying
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800 hover:shadow-md'
            }
          `}
        >
          {isApplying ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Applying...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Apply to Design
            </span>
          )}
        </button>

        {onRegenerate && (
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating || isGeneratingMultiView}
            className={`
              px-4 py-3 text-sm font-medium rounded-lg transition-all border shadow-sm
              ${isRegenerating || isGeneratingMultiView
                ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
              }
            `}
          >
            {isRegenerating ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                Regenerating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Regenerate
              </span>
            )}
          </button>
        )}

        {onAdjustPrompt && (
          <button
            onClick={handleAdjustPrompt}
            disabled={isRegenerating || isGeneratingMultiView}
            className={`
              px-4 py-3 text-sm font-medium rounded-lg transition-all border shadow-sm
              ${isRegenerating || isGeneratingMultiView
                ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
              }
            `}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Adjust Prompt
            </span>
          </button>
        )}
      </div>

      {/* Multi-View Button */}
      {onGenerateMultiView && !hasMultiView && (
        <button
          onClick={handleGenerateMultiView}
          disabled={isRegenerating || isGeneratingMultiView}
          className={`
            w-full px-4 py-3 text-sm font-semibold rounded-lg transition-all border-2 border-dashed
            ${isRegenerating || isGeneratingMultiView
              ? 'bg-gray-50 text-gray-400 border-gray-300 cursor-not-allowed'
              : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50 hover:border-blue-500'
            }
          `}
        >
          {isGeneratingMultiView ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              Generating Additional Views...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Generate More Views (Side + Handle)
            </span>
          )}
        </button>
      )}

      {hasMultiView && (
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">Multi-view renders generated! Scroll down to see all angles.</span>
        </div>
      )}

      {/* Help Text */}
      <p className="text-xs text-gray-500 italic">
        Not happy with the result? Try regenerating or adjust your prompt for different results.
      </p>
    </div>
  )
}
