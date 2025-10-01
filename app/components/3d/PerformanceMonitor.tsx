'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useDesignStore } from './store/designStore'

interface PerformanceMonitorProps {
  showDebugInfo?: boolean
  targetFPS?: number
  onPerformanceChange?: (metrics: any) => void
}

export default function PerformanceMonitor({ 
  showDebugInfo = false, 
  targetFPS = 60,
  onPerformanceChange 
}: PerformanceMonitorProps) {
  const { 
    performance, 
    performanceConfig, 
    updatePerformanceConfig 
  } = useDesignStore()
  const [isLowPerformance, setIsLowPerformance] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [adaptiveQuality, setAdaptiveQuality] = useState(performanceConfig.qualityLevel)
  const consecutiveLowFramesRef = useRef(0)
  const lastQualityChangeRef = useRef(Date.now())

  // Enhanced performance monitoring with adaptive quality for constrained viewport
  useEffect(() => {
    const currentTime = Date.now()
    const timeSinceLastChange = currentTime - lastQualityChangeRef.current
    
    // Only adjust quality if enough time has passed since last change (prevent oscillation)
    if (timeSinceLastChange < 3000) return
    
    // Use constrained target FPS if in constrained viewport mode
    const effectiveTargetFPS = performanceConfig.isConstrainedViewport 
      ? performanceConfig.constrainedModeTargetFPS 
      : targetFPS
    
    // Track consecutive low frame rate measurements
    if (performance.fps > 0 && performance.fps < effectiveTargetFPS * 0.8) {
      consecutiveLowFramesRef.current++
      setIsLowPerformance(true)
    } else {
      consecutiveLowFramesRef.current = 0
      setIsLowPerformance(false)
    }

    // Adaptive quality adjustment based on performance
    if (consecutiveLowFramesRef.current >= 5) {
      // Reduce quality after 5 consecutive low frame measurements
      let newQuality = adaptiveQuality
      
      switch (adaptiveQuality) {
        case 'ultra':
          newQuality = 'high'
          break
        case 'high':
          newQuality = 'medium'
          break
        case 'medium':
          newQuality = 'low'
          break
        case 'low':
          // Already at lowest quality, disable shadows if not already
          if (performanceConfig.enableShadows) {
            updatePerformanceConfig({ enableShadows: false })
            setShowWarning(true)
          }
          break
      }
      
      if (newQuality !== adaptiveQuality) {
        setAdaptiveQuality(newQuality)
        updatePerformanceConfig({ qualityLevel: newQuality })
        lastQualityChangeRef.current = currentTime
        consecutiveLowFramesRef.current = 0
        setShowWarning(true)
      }
    } else if (performance.averageFPS > targetFPS * 1.2 && consecutiveLowFramesRef.current === 0) {
      // Increase quality if performance is consistently good
      let newQuality = adaptiveQuality
      
      switch (adaptiveQuality) {
        case 'low':
          newQuality = 'medium'
          break
        case 'medium':
          newQuality = 'high'
          break
        case 'high':
          newQuality = 'ultra'
          break
      }
      
      if (newQuality !== adaptiveQuality && timeSinceLastChange > 10000) {
        setAdaptiveQuality(newQuality)
        updatePerformanceConfig({ qualityLevel: newQuality })
        lastQualityChangeRef.current = currentTime
      }
    }

    // Call performance change callback
    if (onPerformanceChange) {
      onPerformanceChange({
        fps: performance.fps,
        averageFPS: performance.averageFPS,
        isThrottling: performance.isThrottling,
        qualityLevel: adaptiveQuality
      })
    }

    // Show warning for persistent low performance
    if (consecutiveLowFramesRef.current >= 3) {
      setShowWarning(true)
      const timeout = setTimeout(() => setShowWarning(false), 5000)
      return () => clearTimeout(timeout)
    }
  }, [
    performance.fps, 
    performance.averageFPS, 
    performance.isThrottling,
    targetFPS, 
    adaptiveQuality,
    performanceConfig.enableShadows,
    updatePerformanceConfig,
    onPerformanceChange
  ])

  return (
    <>
      {/* Enhanced debug performance info */}
      {showDebugInfo && process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 right-4 bg-black/80 text-white p-3 rounded text-xs font-mono z-40 min-w-48">
          <div>FPS: {performance.fps} / {targetFPS}</div>
          <div>Avg FPS: {performance.averageFPS.toFixed(1)}</div>
          <div>Frame: {performance.lastFrameTime.toFixed(1)}ms</div>
          <div>Memory: {(performance.memoryUsage / 1024 / 1024).toFixed(1)}MB</div>
          <div>Quality: {adaptiveQuality}</div>
          <div>Shadows: {performanceConfig.enableShadows ? 'ON' : 'OFF'}</div>
          <div>LOD: {performanceConfig.lodEnabled ? 'ON' : 'OFF'}</div>
          <div className={isLowPerformance ? 'text-red-400' : 'text-green-400'}>
            Status: {performance.isThrottling ? 'Throttling' : isLowPerformance ? 'Low Performance' : 'Optimal'}
          </div>
        </div>
      )}

      {/* Enhanced performance warning */}
      {showWarning && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg z-40 max-w-md text-center text-sm shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-left">
                <div className="font-medium">Quality adjusted to {adaptiveQuality}</div>
                <div className="text-xs text-blue-600 mt-1">
                  Optimizing 3D experience for your device
                </div>
              </div>
            </div>
            <button 
              onClick={() => setShowWarning(false)}
              className="ml-3 text-blue-400 hover:text-blue-600 text-lg leading-none"
              aria-label="Dismiss performance notification"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  )
}
