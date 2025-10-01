'use client'

import React from 'react'

export interface TextPosition {
  x: number
  y: number
  z: number
}

interface TextPositionControlsProps {
  position: TextPosition
  onPositionChange: (position: TextPosition) => void
  step?: number
  className?: string
}

// Arrow SVG components for consistent styling
const ArrowUp = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
)

const ArrowDown = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
)

const ArrowLeft = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
)

const ArrowRight = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)

const ResetIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357 2m15.357-2H15" />
  </svg>
)

export default function TextPositionControls({
  position,
  onPositionChange,
  step = 0.1,
  className = ""
}: TextPositionControlsProps) {
  
  const handlePositionUpdate = (axis: keyof TextPosition, delta: number) => {
    const newPosition = {
      ...position,
      [axis]: Number((position[axis] + delta).toFixed(2))
    }
    onPositionChange(newPosition)
  }

  const handleReset = () => {
    onPositionChange({ x: 0, y: 0, z: 0 })
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">Text Position</h4>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-200 min-h-[32px]"
          aria-label="Reset text position to center"
        >
          <ResetIcon className="w-3 h-3" />
          Reset
        </button>
      </div>

      {/* Vertical Controls */}
      <div className="flex flex-col items-center">
        <button
          onClick={() => handlePositionUpdate('y', step)}
          className="p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Move text up"
        >
          <ArrowUp className="w-5 h-5 text-gray-600" />
        </button>
        
        <div className="py-2 text-xs text-gray-500 font-mono">
          Y: {position.y.toFixed(2)}
        </div>
        
        <button
          onClick={() => handlePositionUpdate('y', -step)}
          className="p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Move text down"
        >
          <ArrowDown className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Horizontal Controls */}
      <div className="flex items-center justify-center">
        <button
          onClick={() => handlePositionUpdate('x', -step)}
          className="p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Move text left"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        
        <div className="px-4 text-xs text-gray-500 font-mono">
          X: {position.x.toFixed(2)}
        </div>
        
        <button
          onClick={() => handlePositionUpdate('x', step)}
          className="p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Move text right"
        >
          <ArrowRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Depth Controls (Z-axis) */}
      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
        <span className="text-xs font-medium text-gray-700">Depth</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePositionUpdate('z', -step)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 active:bg-gray-100 transition-colors duration-200 min-h-[32px] text-xs font-medium"
            aria-label="Move text backward"
          >
            −
          </button>
          <span className="text-xs text-gray-500 font-mono min-w-[40px] text-center">
            {position.z.toFixed(2)}
          </span>
          <button
            onClick={() => handlePositionUpdate('z', step)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 active:bg-gray-100 transition-colors duration-200 min-h-[32px] text-xs font-medium"
            aria-label="Move text forward"
          >
            +
          </button>
        </div>
      </div>

      {/* Position Summary */}
      <div className="text-xs text-gray-400 text-center font-mono">
        Position: ({position.x.toFixed(2)}, {position.y.toFixed(2)}, {position.z.toFixed(2)})
      </div>
    </div>
  )
}
