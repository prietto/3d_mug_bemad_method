'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useDesignStore } from './store/designStore'
import PromptInput from './PromptInput'
import ImagePreview from './ImagePreview'
import QuotaDisplay from './QuotaDisplay'
import TemplateGallery from './TemplateGallery'
import ImageCarousel from './ImageCarousel'

interface AIMugDesignerProps {
  className?: string
  onDesignComplete?: (imageUrl: string) => void
}

export default function AIMugDesigner({
  className = '',
  onDesignComplete
}: AIMugDesignerProps) {
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null)
  const [currentViewIndex, setCurrentViewIndex] = useState(0)

  const {
    aiPrompt,
    generatedMugRenderUrl,
    isGenerating,
    generationError,
    selectedTemplate,
    multiViewUrls,
    isGeneratingMultiView,
    multiViewError,
    isEditingPrompt,
    isApplyingDesign,
    currentDesign,
    setAIPrompt,
    generateFromPrompt,
    selectTemplate,
    clearGenerationError,
    generateMultiView,
    clearMultiViewError,
    regenerateDesign,
    adjustPrompt,
    applyDesign,
    updateDesign
  } = useDesignStore()

  // Estimate time remaining during generation
  useEffect(() => {
    if (isGenerating) {
      setEstimatedTimeRemaining(3) // Start with 3 seconds estimate

      const interval = setInterval(() => {
        setEstimatedTimeRemaining((prev) => {
          if (prev === null || prev <= 0) return null
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(interval)
    } else {
      setEstimatedTimeRemaining(null)
    }
  }, [isGenerating])

  const handlePromptChange = useCallback((value: string) => {
    setAIPrompt(value)
    // Clear any previous errors when user types
    if (generationError) {
      clearGenerationError()
    }
  }, [setAIPrompt, generationError, clearGenerationError])

  const handleGenerate = useCallback(async () => {
    if (!aiPrompt || aiPrompt.length < 3) {
      return
    }

    await generateFromPrompt(aiPrompt)
  }, [aiPrompt, generateFromPrompt])

  const handleApplyToDesign = useCallback(async () => {
    await applyDesign()

    // Notify parent component
    if (onDesignComplete && generatedMugRenderUrl) {
      onDesignComplete(generatedMugRenderUrl)
    }
  }, [applyDesign, onDesignComplete, generatedMugRenderUrl])

  const handleRegenerate = useCallback(async () => {
    await regenerateDesign()
  }, [regenerateDesign])

  const handleAdjustPrompt = useCallback(() => {
    adjustPrompt()
  }, [adjustPrompt])

  const handleSelectTemplate = useCallback((templateId: string, prompt: string) => {
    selectTemplate(templateId, prompt)
  }, [selectTemplate])

  const handleGenerateMultiView = useCallback(async () => {
    if (currentDesign.id) {
      await generateMultiView(currentDesign.id)
    }
  }, [currentDesign.id, generateMultiView])

  const handleNavigateView = useCallback((index: number) => {
    setCurrentViewIndex(index)
  }, [])

  return (
    <div className={`h-full w-full p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-gray-900">
          AI-Powered Mug Design
        </h2>
        <p className="text-sm text-gray-600">
          Describe your dream mug design in plain English, and our AI will create a professional render for you.
        </p>
      </div>

      {/* Quota Display */}
      <QuotaDisplay />

      {/* Template Gallery */}
      <TemplateGallery
        onSelectTemplate={handleSelectTemplate}
        selectedTemplateId={selectedTemplate}
        disabled={isGenerating}
      />

      {/* Prompt Input */}
      <PromptInput
        value={aiPrompt}
        onChange={handlePromptChange}
        onGenerate={handleGenerate}
        disabled={isGenerating}
      />

      {/* Loading State */}
      {isGenerating && (
        <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div className="text-center">
              <p className="text-sm font-medium text-blue-900">
                Generating your design...
              </p>
              {estimatedTimeRemaining !== null && estimatedTimeRemaining > 0 && (
                <p className="text-xs text-blue-700 mt-1">
                  ~{estimatedTimeRemaining} second{estimatedTimeRemaining !== 1 ? 's' : ''} remaining
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {generationError && !isGenerating && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-3">
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
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-900">
                Generation Failed
              </h3>
              <p className="text-sm text-red-800 mt-1">
                {generationError}
              </p>
              <p className="text-xs text-red-700 mt-2">
                Don't worry - you can try again or use the manual upload option below.
              </p>
            </div>
            <button
              onClick={clearGenerationError}
              className="text-red-600 hover:text-red-800 transition-colors"
              aria-label="Dismiss error"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Success Message After Apply - Show before preview */}
      {currentDesign.isComplete && !isApplyingDesign && generatedMugRenderUrl && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <svg
              className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-green-900">
                Design Applied Successfully!
              </h3>
              <p className="text-sm text-green-800 mt-1">
                Your design has been saved. Please fill out the form on the right to continue.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Preview Section - Always show if we have a generated image */}
      {generatedMugRenderUrl && !isGenerating && !isEditingPrompt && (
        <ImagePreview
          imageUrl={generatedMugRenderUrl}
          onApply={handleApplyToDesign}
          onRegenerate={handleRegenerate}
          isRegenerating={isGenerating}
          isApplying={isApplyingDesign}
          onGenerateMultiView={handleGenerateMultiView}
          isGeneratingMultiView={isGeneratingMultiView}
          hasMultiView={multiViewUrls.length > 0}
          onAdjustPrompt={handleAdjustPrompt}
        />
      )}

      {/* Multi-View Error Display */}
      {multiViewError && !isGeneratingMultiView && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-3">
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
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-900">
                Multi-View Generation Failed
              </h3>
              <p className="text-sm text-red-800 mt-1">
                {multiViewError}
              </p>
            </div>
            <button
              onClick={clearMultiViewError}
              className="text-red-600 hover:text-red-800 transition-colors"
              aria-label="Dismiss error"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Multi-View Carousel */}
      {multiViewUrls.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              View Your Mug From All Angles
            </h3>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {multiViewUrls.length} Views
            </span>
          </div>
          <ImageCarousel
            views={multiViewUrls}
            currentIndex={currentViewIndex}
            onNavigate={handleNavigateView}
          />
        </div>
      )}

      {/* Duplicate Success Message removed - now only shows once above preview */}
      {currentDesign.isComplete && !isApplyingDesign && !generatedMugRenderUrl && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <svg
              className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-green-900">
                Design Applied Successfully!
              </h3>
              <p className="text-sm text-green-800 mt-1">
                Your design has been saved. Please fill out the form on the right to continue.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Manual Upload Fallback Notice */}
      {!isGenerating && !generatedMugRenderUrl && !currentDesign.isComplete && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Prefer to upload your own design?</span> You can always use the manual upload option to add your own images.
          </p>
        </div>
      )}
    </div>
  )
}
