'use client'

import React from 'react'
import { Design } from '../../lib/types'

interface DesignPreviewProps {
  design: Design
  compact?: boolean
  className?: string
}

export default function DesignPreview({ 
  design, 
  compact = false, 
  className = '' 
}: DesignPreviewProps) {
  const hasCustomization = design.uploadedImageUrl || design.customText || design.mugColor !== '#ffffff'

  return (
    <div className={`${compact ? 'space-y-2' : 'space-y-4'} ${className}`}>
      {/* Mug Preview */}
      <div className={`
        ${compact ? 'w-16 h-16' : 'w-24 h-24'} 
        mx-auto bg-gray-100 rounded-lg border-2 border-gray-200
        flex items-center justify-center relative overflow-hidden
      `}>
        {/* Mug Color Background */}
        <div 
          className="absolute inset-0 opacity-80"
          style={{ backgroundColor: design.mugColor }}
        />
        
        {/* Image Preview */}
        {design.uploadedImageUrl && (
          <img
            src={design.uploadedImageUrl}
            alt="Custom design"
            className="absolute inset-1 object-cover rounded opacity-90"
          />
        )}
        
        {/* Text Preview */}
        {design.customText && (
          <div 
            className={`
              absolute inset-0 flex items-center justify-center 
              ${compact ? 'text-xs' : 'text-sm'} font-medium
              ${design.uploadedImageUrl ? 'text-white drop-shadow-lg' : ''}
            `}
            style={{ 
              color: design.uploadedImageUrl ? '#ffffff' : design.textColor,
              fontFamily: design.textFont || 'Arial, sans-serif'
            }}
          >
            <span className="truncate px-1 text-center">
              {design.customText}
            </span>
          </div>
        )}
        
        {/* Default Mug Icon */}
        {!hasCustomization && (
          <div className="text-gray-400">
            <svg 
              className={compact ? 'w-8 h-8' : 'w-12 h-12'} 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M2 19h20v2H2v-2zm1.15-12.05L4 9l-.85-2.05L1.1 6l2.05-.95L4 3l.85 2.05L6.9 6l-2.05.95zM8.5 12.5c0 2.49 2.01 4.5 4.5 4.5s4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5-4.5 2.01-4.5 4.5zm2.5 0c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2z"/>
            </svg>
          </div>
        )}
      </div>
      
      {/* Design Details */}
      {!compact && (
        <div className="space-y-1 text-center">
          <h4 className="text-sm font-medium text-gray-900">
            Your Custom Design
          </h4>
          <div className="space-y-1 text-xs text-gray-600">
            {design.customText && (
              <p>Text: &quot;{design.customText}&quot;</p>
            )}
            {design.mugColor !== '#ffffff' && (
              <p>Color: {design.mugColor}</p>
            )}
            {design.uploadedImageUrl && (
              <p>✓ Custom Image Added</p>
            )}
            {!hasCustomization && (
              <p className="text-gray-400">No customizations yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
