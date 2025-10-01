'use client'

import React, { useState, useEffect } from 'react'
import Scene from './3d/Scene'
import ImageUpload from './3d/ImageUpload'
import ColorPicker from './3d/ColorPicker'
import TextInput from './3d/TextInput'
import FontSelector from './3d/FontSelector'
import TextPositionControls from './3d/TextPositionControls'
import TextSizeControls from './3d/TextSizeControls'
import TextColorPicker from './3d/TextColorPicker'
import ResetButton from './3d/ResetButton'
import { useDesignStore } from './3d/store/designStore'
import { getAnalyticsIntegration } from '../../lib/utils/analytics'

interface MugDesignerProps {
  className?: string
  showControls?: boolean
  isConstrainedViewport?: boolean // New prop to indicate split-screen mode
}

export default function MugDesigner({
  className = "",
  showControls = true,
  isConstrainedViewport = true // Default to constrained for Story 4.3
}: MugDesignerProps) {
  const { 
    isLoading, 
    error, 
    performance,
    engagement,
    resetToDefault,
    currentDesign,
    setMugColor,
    setCustomText,
    setTextFont,
    setTextPosition,
    setTextSize,
    setTextColor,
    trackColorChange,
    trackTextCustomization,
    trackInteraction,
    setConstrainedViewportMode
  } = useDesignStore()

  // Set constrained viewport mode on mount
  useEffect(() => {
    setConstrainedViewportMode(isConstrainedViewport)
  }, [isConstrainedViewport, setConstrainedViewportMode])


  const handleReset = () => {
    resetToDefault()
  }

  const handleColorChange = (color: string) => {
    setMugColor(color)
    trackColorChange()
    
    // Analytics tracking
    const analytics = getAnalyticsIntegration()
    const customizationPath = []
    if (engagement.hasChangedColor) customizationPath.push('color')
    if (engagement.hasUploadedImage) customizationPath.push('image')
    if (engagement.hasCustomizedText) customizationPath.push('text')
    analytics.trackColorChange(color, customizationPath)
  }

  // Text control handlers
  const handleTextChange = (text: string) => {
    setCustomText(text)
    if (text.trim()) {
      trackTextCustomization()
      
      // Analytics tracking
      const analytics = getAnalyticsIntegration()
      const customizationPath = []
      if (engagement.hasChangedColor) customizationPath.push('color')
      if (engagement.hasUploadedImage) customizationPath.push('image')
      if (engagement.hasCustomizedText) customizationPath.push('text')
      analytics.trackTextCustomization(text.length, customizationPath)
    }
  }

  const handleFontChange = (font: string) => {
    setTextFont(font)
  }

  const handlePositionChange = (position: { x: number; y: number; z: number }) => {
    setTextPosition(position)
  }

  const handleSizeChange = (size: number) => {
    setTextSize(size)
  }

  const handleTextColorChange = (color: string) => {
    setTextColor(color)
  }

  return (
    <div className={`w-full h-full bg-white flex flex-col ${className}`}>
      {/* Header - Optimized for split-screen */}
      <div className={`flex items-center justify-between border-b border-gray-200 ${
        isConstrainedViewport ? 'p-3 md:p-4' : 'p-4 md:p-6'
      }`}>
        <div>
          <h2 className={`font-bold text-gray-900 ${
            isConstrainedViewport ? 'text-lg md:text-xl' : 'text-xl md:text-2xl'
          }`}>
            3D Mug Designer
          </h2>
          <p className="text-xs md:text-sm text-gray-600 mt-1">
            Rotate and customize your mug in real-time
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Performance indicator */}
          {performance.fps < 30 && (
            <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
              Performance: {Math.round(performance.fps)} FPS
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area - Optimized for constrained viewport */}
      <div className={`flex-1 flex min-h-0 ${
        isConstrainedViewport 
          ? 'flex-col' // Always vertical layout in split-screen for better mobile experience  
          : 'flex-col lg:flex-row'
      }`}>
          {/* 3D Viewport - Enhanced for split-screen constraints and mobile optimization */}
          <div className={`relative bg-gradient-to-br from-gray-50 to-gray-100 ${
            isConstrainedViewport 
              ? 'flex-1 min-h-[400px] lg:min-h-0' // Ensure minimum 400px height on mobile, but allow flexible height on desktop
              : 'flex-1'
          }`}>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-3 text-gray-600">Loading 3D model...</p>
                </div>
              </div>
            )}
            
            {error && (
              <div className="absolute top-4 left-4 right-4 bg-red-50 border border-red-200 rounded-lg p-3 z-10">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.96-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-sm text-red-800">{error}</span>
                </div>
              </div>
            )}
            
            <Scene 
              className="w-full h-full" 
              isConstrainedViewport={isConstrainedViewport}
            />
          </div>

          {/* Control Panel - Optimized for split-screen */}
          {showControls && (
            <div className={`w-full border-t border-gray-200 bg-white ${
              isConstrainedViewport 
                ? 'p-3 md:p-4' // Reduced padding in split-screen mode
                : 'lg:w-80 lg:border-t-0 lg:border-l p-4 md:p-6'
            }`}>
              <div className={`${isConstrainedViewport ? 'space-y-4' : 'space-y-6'}`}>
                {/* Image Upload */}
                <div>
                  <h3 className={`font-semibold text-gray-900 mb-3 ${
                    isConstrainedViewport ? 'text-base md:text-lg' : 'text-lg'
                  }`}>Upload Design</h3>
                  <ImageUpload
                    onUploadStart={() => console.log('Upload started')}
                    onUploadComplete={(imageUrl: string) => {
                      console.log('Upload complete:', imageUrl)
                      
                      // Analytics tracking for image upload - using estimated values since we don't have file info
                      const analytics = getAnalyticsIntegration()
                      const customizationPath = []
                      if (engagement.hasChangedColor) customizationPath.push('color')
                      if (engagement.hasUploadedImage) customizationPath.push('image')
                      if (engagement.hasCustomizedText) customizationPath.push('text')
                      
                      // Estimate file size and type from URL if possible
                      const estimatedSize = 1024 * 500 // Estimate 500KB average
                      const imageType = imageUrl.includes('.png') ? 'image/png' : 'image/jpeg'
                      analytics.trackImageUpload(estimatedSize, imageType, customizationPath)
                    }}
                    onUploadError={(error) => console.error('Upload error:', error)}
                  />
                </div>

                {/* Color Selection */}
                <ColorPicker
                  selectedColor={currentDesign.mugColor}
                  onColorChange={handleColorChange}
                />

                {/* Text Customization */}
                <div>
                  <h3 className={`font-semibold text-gray-900 mb-3 ${
                    isConstrainedViewport ? 'text-base md:text-lg' : 'text-lg'
                  }`}>Add Custom Text</h3>
                  <div className="space-y-4">
                    <TextInput
                      value={currentDesign.customText || ''}
                      onChange={handleTextChange}
                      placeholder="Add your custom text..."
                    />
                    
                    {currentDesign.customText && (
                      <>
                        <FontSelector
                          selectedFont={currentDesign.textFont || 'Arial, sans-serif'}
                          onFontChange={handleFontChange}
                        />
                        
                        <TextSizeControls
                          size={currentDesign.textSize || 1.0}
                          onSizeChange={handleSizeChange}
                        />
                        
                        <TextPositionControls
                          position={JSON.parse(currentDesign.textPosition || '{"x":0,"y":0,"z":0}')}
                          onPositionChange={handlePositionChange}
                        />
                        
                        <TextColorPicker
                          selectedColor={currentDesign.textColor || '#000000'}
                          mugColor={currentDesign.mugColor}
                          onColorChange={handleTextColorChange}
                        />
                      </>
                    )}
                  </div>
                </div>

                {/* Reset Options */}
                <div>
                  <h3 className={`font-semibold text-gray-900 mb-3 ${
                    isConstrainedViewport ? 'text-base md:text-lg' : 'text-lg'
                  }`}>Reset Options</h3>
                  <div className="space-y-3">
                    {/* Individual Reset Buttons */}
                    <div className="grid grid-cols-3 gap-2">
                      <ResetButton
                        resetType="image"
                        showConfirmation={true}
                        size="sm"
                        variant="secondary"
                        className="w-full px-2 py-2 rounded-lg min-h-[44px]"
                      />
                      <ResetButton
                        resetType="color"
                        showConfirmation={true}
                        size="sm"
                        variant="secondary"
                        className="w-full px-2 py-2 rounded-lg min-h-[44px]"
                      />
                      <ResetButton
                        resetType="text"
                        showConfirmation={true}
                        size="sm"
                        variant="secondary"
                        className="w-full px-2 py-2 rounded-lg min-h-[44px]"
                      />
                    </div>
                    
                    {/* Full Reset Button */}
                    <ResetButton
                      resetType="all"
                      showConfirmation={true}
                      size="md"
                      variant="secondary"
                      className="w-full px-4 py-2 rounded-lg min-h-[44px]"
                    />
                    
                    {/* Camera Reset Button */}
                    <ResetButton
                      resetType="camera"
                      showConfirmation={false}
                      size="md"
                      variant="ghost"
                      className="w-full px-4 py-2 rounded-lg min-h-[44px]"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      // Track lead capture in conversion funnel
                      const analytics = getAnalyticsIntegration()
                      analytics.trackConversionFunnel('lead_capture', {
                        design_completed: currentDesign.isComplete,
                        customization_count: engagement.interactionCount,
                        engagement_score: engagement.engagementScore,
                        has_image: engagement.hasUploadedImage,
                        has_text: engagement.hasCustomizedText,
                        has_color: engagement.hasChangedColor,
                      })
                      
                      // TODO: Implement actual lead capture form
                      alert('Lead capture form coming soon! Analytics tracked.')
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors min-h-[44px]"
                  >
                    Get Quote
                  </button>
                </div>

                {/* Info */}
                <div className="text-xs text-gray-500 space-y-1">
                  <p>• Drag to rotate the mug</p>
                  <p>• Scroll or pinch to zoom</p>
                  <p>• Professional quality sublimation printing</p>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  )
}
