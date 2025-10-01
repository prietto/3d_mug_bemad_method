'use client'

import React from 'react'

export interface FontOption {
  name: string
  value: string
  label: string
  preview: string
}

interface FontSelectorProps {
  selectedFont: string
  onFontChange: (font: string) => void
  fonts?: FontOption[]
  className?: string
}

const defaultFonts: FontOption[] = [
  {
    name: 'Arial',
    value: 'Arial, sans-serif',
    label: 'Modern',
    preview: 'Aa'
  },
  {
    name: 'Times',
    value: 'Times, serif',
    label: 'Classic',
    preview: 'Aa'
  },
  {
    name: 'Impact',
    value: 'Impact, fantasy',
    label: 'Bold',
    preview: 'Aa'
  }
]

export default function FontSelector({
  selectedFont,
  onFontChange,
  fonts = defaultFonts,
  className = ""
}: FontSelectorProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <h4 className="text-sm font-medium text-gray-700">Font Style</h4>
      <div className="grid grid-cols-3 gap-3">
        {fonts.map((font) => (
          <button
            key={font.name}
            onClick={() => onFontChange(font.value)}
            className={`
              relative flex flex-col items-center p-4 rounded-lg border-2 transition-all duration-200 min-h-[80px] min-w-[44px]
              ${selectedFont === font.value
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }
            `}
            aria-label={`Select ${font.label} font`}
            aria-pressed={selectedFont === font.value}
          >
            <div 
              className={`text-2xl font-medium mb-1 ${selectedFont === font.value ? 'text-blue-600' : 'text-gray-800'}`}
              style={{ fontFamily: font.value }}
            >
              {font.preview}
            </div>
            <span className="text-xs font-medium">{font.label}</span>
            {selectedFont === font.value && (
              <div className="absolute top-2 right-2 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                <svg 
                  className="w-2 h-2 text-white" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                    clipRule="evenodd" 
                  />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
