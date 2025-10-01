'use client'

import React from 'react'

interface TextSizeControlsProps {
  size: number
  onSizeChange: (size: number) => void
  min?: number
  max?: number
  step?: number
  className?: string
}

export default function TextSizeControls({
  size,
  onSizeChange,
  min = 0.5,
  max = 3.0,
  step = 0.1,
  className = ""
}: TextSizeControlsProps) {
  
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseFloat(e.target.value)
    onSizeChange(Number(newSize.toFixed(1)))
  }

  const handleDecrease = () => {
    const newSize = Math.max(min, size - step)
    onSizeChange(Number(newSize.toFixed(1)))
  }

  const handleIncrease = () => {
    const newSize = Math.min(max, size + step)
    onSizeChange(Number(newSize.toFixed(1)))
  }

  const getSizeLabel = (size: number): string => {
    if (size <= 0.8) return 'Small'
    if (size <= 1.2) return 'Medium'
    if (size <= 1.8) return 'Large'
    return 'Extra Large'
  }

  const percentage = ((size - min) / (max - min)) * 100

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">Text Size</h4>
        <span className="text-xs text-gray-500 font-medium">
          {getSizeLabel(size)}
        </span>
      </div>

      {/* Button Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={handleDecrease}
          disabled={size <= min}
          className={`
            flex items-center justify-center w-10 h-10 rounded-lg border-2 font-bold text-lg transition-all duration-200
            ${size <= min 
              ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 active:scale-95'
            }
          `}
          aria-label="Decrease text size"
          aria-disabled={size <= min}
        >
          −
        </button>

        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold text-gray-800 mb-1">
            {size.toFixed(1)}×
          </span>
          <span className="text-xs text-gray-500">
            Size
          </span>
        </div>

        <button
          onClick={handleIncrease}
          disabled={size >= max}
          className={`
            flex items-center justify-center w-10 h-10 rounded-lg border-2 font-bold text-lg transition-all duration-200
            ${size >= max 
              ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 active:scale-95'
            }
          `}
          aria-label="Increase text size"
          aria-disabled={size >= max}
        >
          +
        </button>
      </div>

      {/* Slider Control */}
      <div className="space-y-2">
        <div className="relative">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={size}
            onChange={handleSliderChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`
            }}
            aria-label="Text size slider"
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={size}
            aria-valuetext={`${size.toFixed(1)} times normal size, ${getSizeLabel(size)}`}
          />
          
          {/* Custom slider thumb styling */}
          <style jsx>{`
            input[type="range"]::-webkit-slider-thumb {
              appearance: none;
              height: 20px;
              width: 20px;
              border-radius: 50%;
              background: #3b82f6;
              border: 2px solid white;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              cursor: pointer;
            }
            
            input[type="range"]::-moz-range-thumb {
              height: 20px;
              width: 20px;
              border-radius: 50%;
              background: #3b82f6;
              border: 2px solid white;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              cursor: pointer;
              border: none;
            }
            
            input[type="range"]:focus::-webkit-slider-thumb {
              box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
            
            input[type="range"]:focus::-moz-range-thumb {
              box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
          `}</style>
        </div>

        {/* Scale Reference */}
        <div className="flex justify-between text-xs text-gray-400">
          <span>Small</span>
          <span>Medium</span>
          <span>Large</span>
          <span>XL</span>
        </div>
      </div>

      {/* Size Preview */}
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <div className="text-gray-600 text-xs mb-2">Preview</div>
        <div 
          className="text-gray-800 font-medium transition-all duration-200"
          style={{ fontSize: `${0.75 + (size - min) * 0.5}rem` }}
        >
          Sample Text
        </div>
      </div>
    </div>
  )
}
