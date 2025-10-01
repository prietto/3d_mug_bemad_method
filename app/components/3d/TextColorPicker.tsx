'use client'

import React from 'react'

interface TextColorPickerProps {
  selectedColor: string
  mugColor: string
  onColorChange: (color: string) => void
  className?: string
}

const textColors = [
  { name: 'Auto Contrast', value: 'auto', color: 'transparent' },
  { name: 'Black', value: '#000000', color: '#000000' },
  { name: 'White', value: '#ffffff', color: '#ffffff' },
  { name: 'Red', value: '#dc2626', color: '#dc2626' },
  { name: 'Blue', value: '#2563eb', color: '#2563eb' },
  { name: 'Green', value: '#16a34a', color: '#16a34a' },
  { name: 'Purple', value: '#9333ea', color: '#9333ea' },
  { name: 'Orange', value: '#ea580c', color: '#ea580c' },
  { name: 'Yellow', value: '#ca8a04', color: '#ca8a04' }
]

export default function TextColorPicker({
  selectedColor,
  mugColor,
  onColorChange,
  className = ""
}: TextColorPickerProps) {
  
  const isAutoMode = selectedColor === 'auto' || selectedColor === '#000000'

  return (
    <div className={`space-y-3 ${className}`}>
      <h4 className="text-sm font-medium text-gray-700">Text Color</h4>
      
      <div className="grid grid-cols-3 gap-2">
        {textColors.map((color) => (
          <button
            key={color.value}
            onClick={() => onColorChange(color.value === 'auto' ? '#000000' : color.value)}
            className={`
              relative flex flex-col items-center p-3 rounded-lg border-2 transition-all duration-200 min-h-[60px] min-w-[44px]
              ${selectedColor === color.value || (color.value === 'auto' && isAutoMode)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }
            `}
            aria-label={`Select ${color.name} text color`}
            aria-pressed={selectedColor === color.value || (color.value === 'auto' && isAutoMode)}
          >
            {color.value === 'auto' ? (
              <div className="w-6 h-6 rounded-full border-2 border-gray-300 relative overflow-hidden">
                <div 
                  className="w-1/2 h-full absolute left-0 top-0" 
                  style={{ backgroundColor: mugColor }}
                />
                <div className="w-1/2 h-full absolute right-0 top-0 bg-black" />
              </div>
            ) : (
              <div 
                className={`w-6 h-6 rounded-full border-2 ${
                  color.value === '#ffffff' ? 'border-gray-300' : 'border-gray-200'
                }`}
                style={{ backgroundColor: color.color }}
              />
            )}
            <span className="text-xs font-medium mt-1 text-center leading-tight">
              {color.name === 'Auto Contrast' ? 'Auto' : color.name}
            </span>
            
            {(selectedColor === color.value || (color.value === 'auto' && isAutoMode)) && (
              <div className="absolute top-1 right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
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
      
      {isAutoMode && (
        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
          <span className="font-medium">Auto Contrast:</span> Text color automatically adjusts based on mug color for optimal readability.
        </div>
      )}
    </div>
  )
}
