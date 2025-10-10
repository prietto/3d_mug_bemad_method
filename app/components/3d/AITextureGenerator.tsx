'use client'

import React, { useState, useCallback, useRef } from 'react'
import { useDesignStore } from './store/designStore'
import QuotaDisplay from './QuotaDisplay'

interface AITextureGeneratorProps {
  className?: string
  onGenerationStart?: () => void
  onGenerationComplete?: (imageUrl: string) => void
  onGenerationError?: (error: string) => void
}

export default function AITextureGenerator({
  className = "",
  onGenerationStart,
  onGenerationComplete,
  onGenerationError
}: AITextureGeneratorProps) {
  const [prompt, setPrompt] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { 
    isGenerating, 
    generationError, 
    generationMode,
    baseImageForEnhancement,
    previewImageUrl,
    generateFromText, 
    generateFromImage,
    setBaseImageForEnhancement,
    applyPreviewToMug,
    setPreviewImage,
    setGenerationMode,
    clearGenerationError 
  } = useDesignStore()

  const MAX_PROMPT_LENGTH = 500
  const MIN_PROMPT_LENGTH = 3
  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
  const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg']
  
  const characterCount = prompt.length
  const isPromptValid = characterCount >= MIN_PROMPT_LENGTH && characterCount <= MAX_PROMPT_LENGTH
  const canGenerate = isPromptValid && !isGenerating && 
    (generationMode === 'text-to-image' || (generationMode === 'image-to-image' && baseImageForEnhancement))

  const handlePromptChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    if (value.length <= MAX_PROMPT_LENGTH) {
      setPrompt(value)
      // Clear error when user starts typing
      if (generationError) {
        clearGenerationError()
      }
    }
  }, [generationError, clearGenerationError])

  const handleModeChange = useCallback((mode: 'manual' | 'text-to-image' | 'image-to-image') => {
    setGenerationMode(mode)
    clearGenerationError()
  }, [setGenerationMode, clearGenerationError])

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Please upload a PNG or JPG image file.'
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 5MB.'
    }
    return null
  }, [])

  const optimizeBaseImage = useCallback(async (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!

        // Calculate new dimensions maintaining aspect ratio
        const maxSize = 1024
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1)
        canvas.width = img.width * scale
        canvas.height = img.height * scale

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = base64
    })
  }, [])

  const handleBaseImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validationError = validateFile(file)
    if (validationError) {
      clearGenerationError()
      setTimeout(() => {
        // Use a custom error state for base image errors
        setGenerationMode(generationMode) // trigger re-render
      }, 0)
      return
    }

    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const base64 = event.target?.result as string
        if (base64) {
          const optimizedImage = await optimizeBaseImage(base64)
          setBaseImageForEnhancement(optimizedImage)
          clearGenerationError()
        }
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error processing base image:', error)
    }
  }, [validateFile, optimizeBaseImage, setBaseImageForEnhancement, clearGenerationError, generationMode, setGenerationMode])

  const handleBaseImageClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleRemoveBaseImage = useCallback(() => {
    setBaseImageForEnhancement('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [setBaseImageForEnhancement])

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) {
      return
    }

    onGenerationStart?.()

    try {
      if (generationMode === 'text-to-image') {
        await generateFromText(prompt)

        // If successful (no error in store), call success callback
        const state = useDesignStore.getState()
        if (!state.generationError && state.currentDesign.uploadedImageUrl) {
          onGenerationComplete?.(state.currentDesign.uploadedImageUrl)
        }
      } else if (generationMode === 'image-to-image' && baseImageForEnhancement) {
        await generateFromImage(baseImageForEnhancement, prompt)

        // For image-to-image, success means preview is set
        const state = useDesignStore.getState()
        if (!state.generationError && state.previewImageUrl) {
          // Don't call onGenerationComplete yet - wait for user to apply preview
        }
      }
    } catch (error) {
      // Error is handled in the store
      const errorMessage = error instanceof Error ? error.message : 'Generation failed'
      onGenerationError?.(errorMessage)
    }
  }, [canGenerate, generationMode, prompt, baseImageForEnhancement, generateFromText, generateFromImage, onGenerationStart, onGenerationComplete, onGenerationError])

  const handleApplyPreview = useCallback(() => {
    applyPreviewToMug()
    const state = useDesignStore.getState()
    if (state.currentDesign.uploadedImageUrl) {
      onGenerationComplete?.(state.currentDesign.uploadedImageUrl)
    }
  }, [applyPreviewToMug, onGenerationComplete])

  const handleRegenerateFromSameImage = useCallback(async () => {
    if (generationMode === 'image-to-image' && baseImageForEnhancement && isPromptValid) {
      onGenerationStart?.()
      try {
        await generateFromImage(baseImageForEnhancement, prompt)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Regeneration failed'
        onGenerationError?.(errorMessage)
      }
    }
  }, [generationMode, baseImageForEnhancement, isPromptValid, prompt, generateFromImage, onGenerationStart, onGenerationError])

  const handleCancelPreview = useCallback(() => {
    setPreviewImage('')
  }, [setPreviewImage])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Allow Cmd/Ctrl + Enter to submit
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleGenerate()
    }
  }, [handleGenerate])

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-900">
          Design Generation Mode
        </label>
        <p className="text-xs text-gray-600">
          Choose how you want to create your mug design
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-gray-100 rounded-lg">
        <button
          onClick={() => handleModeChange('manual')}
          className={`px-3 py-2 text-xs font-medium rounded-md transition-all ${
            generationMode === 'manual'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Manual Upload
        </button>
        <button
          onClick={() => handleModeChange('text-to-image')}
          className={`px-3 py-2 text-xs font-medium rounded-md transition-all ${
            generationMode === 'text-to-image'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Text-to-Image
        </button>
        <button
          onClick={() => handleModeChange('image-to-image')}
          className={`px-3 py-2 text-xs font-medium rounded-md transition-all ${
            generationMode === 'image-to-image'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Image-to-Image
        </button>
      </div>

      {/* Manual Mode - Show Nothing (other components handle this) */}
      {generationMode === 'manual' && (
        <div className="text-center py-4 text-sm text-gray-600">
          Use the image upload component to directly upload your design.
        </div>
      )}

      {/* AI Generation Modes */}
      {(generationMode === 'text-to-image' || generationMode === 'image-to-image') && (
        <>
          {/* Quota Display */}
          <QuotaDisplay />

          {/* Base Image Upload for Image-to-Image Mode */}
          {generationMode === 'image-to-image' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900">
                Base Image
              </label>
              <p className="text-xs text-gray-600">
                Upload an image to enhance with AI
              </p>
              
              {!baseImageForEnhancement ? (
                <button
                  onClick={handleBaseImageClick}
                  className="w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                >
                  <div className="text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600">
                      Click to upload base image
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG up to 5MB
                    </p>
                  </div>
                </button>
              ) : (
                <div className="relative">
                  <img
                    src={baseImageForEnhancement}
                    alt="Base image"
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <div className="absolute top-2 right-2 flex space-x-1">
                    <button
                      onClick={handleBaseImageClick}
                      className="p-1 bg-white rounded-full shadow-sm hover:bg-gray-50"
                      title="Change image"
                    >
                      <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={handleRemoveBaseImage}
                      className="p-1 bg-white rounded-full shadow-sm hover:bg-gray-50"
                      title="Remove image"
                    >
                      <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleBaseImageUpload}
                className="hidden"
              />
            </div>
          )}

          {/* Prompt Input */}
          <div className="space-y-2">
            <label htmlFor="ai-prompt" className="block text-sm font-medium text-gray-900">
              {generationMode === 'text-to-image' ? 'Design Description' : 'Enhancement Instructions'}
            </label>
            <p className="text-xs text-gray-600">
              {generationMode === 'text-to-image' 
                ? 'Describe the design you want to see on your mug'
                : 'Describe how you want to enhance your base image'
              }
            </p>
            <div className="relative">
              <textarea
                id="ai-prompt"
                value={prompt}
                onChange={handlePromptChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  generationMode === 'text-to-image'
                    ? "e.g., watercolor flowers on white background, abstract geometric patterns, mountain landscape at sunset..."
                    : "e.g., make this image more vibrant and artistic, add vintage film effect, enhance colors and contrast..."
                }
                disabled={isGenerating}
                className={`
                  w-full px-4 py-3 border rounded-lg resize-none transition-all
                  ${isGenerating ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
                  ${generationError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}
                  focus:outline-none focus:ring-2
                `}
                rows={3}
              />

              {/* Character Counter */}
              <div className={`
                absolute bottom-2 right-2 text-xs
                ${characterCount > MAX_PROMPT_LENGTH ? 'text-red-600' : 'text-gray-500'}
              `}>
                {characterCount}/{MAX_PROMPT_LENGTH}
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className={`
              w-full px-4 py-3 text-sm font-medium rounded-lg transition-all
              ${!canGenerate
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
              }
            `}
          >
            {isGenerating ? (
              <span className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>
                  {generationMode === 'text-to-image' ? 'Generating...' : 'Enhancing...'}
                </span>
              </span>
            ) : (
              generationMode === 'text-to-image' ? 'Generate Design' : 'Enhance Image'
            )}
          </button>

          {/* Preview Section for Image-to-Image */}
          {generationMode === 'image-to-image' && previewImageUrl && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900">Enhanced Preview</h4>
                <span className="text-xs text-gray-600">Generated from your base image</span>
              </div>
              
              <div className="relative">
                <img
                  src={previewImageUrl}
                  alt="Enhanced preview"
                  className="w-full h-40 object-cover rounded-lg border"
                />
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleApplyPreview}
                  className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  Apply to Mug
                </button>
                <button
                  onClick={handleRegenerateFromSameImage}
                  disabled={isGenerating || !canGenerate}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
                >
                  {isGenerating ? 'Enhancing...' : 'Regenerate'}
                </button>
                <button
                  onClick={handleCancelPreview}
                  className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {generationError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
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
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm text-red-800">{generationError}</p>
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

          {/* Helper Text */}
          {!generationError && (
            <p className="text-xs text-gray-500">
              Tip: Be specific about {generationMode === 'text-to-image' ? 'colors, style, and mood' : 'the changes you want'} for best results. Press Cmd/Ctrl + Enter to generate.
            </p>
          )}
        </>
      )}
    </div>
  )
}
