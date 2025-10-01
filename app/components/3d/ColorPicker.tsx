'use client'

import React from 'react'

interface ColorPickerProps {
  selectedColor: string
  onColorChange: (color: string) => void
  colors?: string[]
  className?: string
}

const defaultColors = ['#ffffff', '#000000', '#3b82f6', '#ef4444', '#10b981']

export default function ColorPicker({ 
  selectedColor, 
  onColorChange, 
  colors = defaultColors,
  className = ""
}: ColorPickerProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900">Mug Color</h3>
      <div className="grid grid-cols-5 gap-3">
        {colors.map((color) => (
          <button
            key={color}
            onClick={() => onColorChange(color)}
            className={`
              w-12 h-12 rounded-xl border-3 transition-all duration-200 transform
              hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${selectedColor === color 
                ? 'border-blue-600 shadow-lg ring-2 ring-blue-500 ring-offset-2' 
                : 'border-gray-300 hover:border-gray-400 shadow-sm hover:shadow-md'
              }
            `}
            style={{ backgroundColor: color }}
            aria-label={`Select ${getColorName(color)} mug color`}
            type="button"
          >
            {/* Selection indicator */}
            {selectedColor === color && (
              <div className="w-full h-full flex items-center justify-center">
                <svg 
                  className={`w-6 h-6 ${color === '#ffffff' ? 'text-gray-600' : 'text-white'}`} 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
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
      
      {/* Selected color name */}
      <p className="text-sm text-gray-600 text-center">
        Selected: <span className="font-medium">{getColorName(selectedColor)}</span>
      </p>
    </div>
  )
}

function getColorName(color: string): string {
  const colorNames: Record<string, string> = {
    '#ffffff': 'White',
    '#000000': 'Black', 
    '#3b82f6': 'Blue',
    '#ef4444': 'Red',
    '#10b981': 'Green'
  }
  return colorNames[color] || color
}
