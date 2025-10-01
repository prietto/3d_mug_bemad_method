'use client'

import React, { Suspense, useRef, useEffect, useState, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, OrbitControls as OrbitControlsImpl } from '@react-three/drei'
import MugModel from './MugModel'
import Controls from './Controls'
import LoadingIndicator from './LoadingIndicator'
import PerformanceMonitorUI from './PerformanceMonitor'
import TouchHints from './TouchHints'
import ResetButton from './ResetButton'
import InteractionHints from './InteractionHints'
import { useDesignStore } from './store/designStore'
import { getAnalyticsIntegration } from '../../../lib/utils/analytics'

// Enhanced professional lighting component
function EnhancedLighting({ 
  deviceCapabilities, 
  isConstrainedViewport = false 
}: { 
  deviceCapabilities: any
  isConstrainedViewport?: boolean
}) {
  const { performanceConfig } = useDesignStore()
  
  const shadowMapSize = useMemo(() => {
    if (!performanceConfig.enableShadows || deviceCapabilities.isLowEnd || isConstrainedViewport) return 256
    switch (performanceConfig.qualityLevel) {
      case 'low': return 512
      case 'medium': return isConstrainedViewport ? 512 : 1024
      case 'high': return isConstrainedViewport ? 1024 : 2048
      case 'ultra': return isConstrainedViewport ? 1024 : 4096
      default: return isConstrainedViewport ? 512 : 1024
    }
  }, [performanceConfig.enableShadows, performanceConfig.qualityLevel, deviceCapabilities.isLowEnd, isConstrainedViewport])

  return (
    <>
      {/* Ambient light for overall scene illumination - Optimized for constrained viewport */}
      <ambientLight 
        intensity={isConstrainedViewport 
          ? (deviceCapabilities.isLowEnd ? 0.5 : 0.4) // Slightly brighter for constrained space
          : (deviceCapabilities.isLowEnd ? 0.4 : 0.3)
        } 
        color="#ffffff"
      />
      
      {/* Main directional light (key light) - Optimized positioning for constrained viewport */}
      <directionalLight
        position={isConstrainedViewport ? [6, 10, 6] : [8, 12, 8]} // Closer positioning for constrained space
        intensity={isConstrainedViewport 
          ? (deviceCapabilities.isLowEnd ? 0.9 : 1.0) // Slightly reduced intensity
          : (deviceCapabilities.isLowEnd ? 0.8 : 1.2)
        }
        color="#ffffff"
        castShadow={performanceConfig.enableShadows && !isConstrainedViewport} // Disable shadows in constrained mode
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-camera-far={isConstrainedViewport ? 30 : 50} // Reduced shadow camera range
        shadow-camera-left={isConstrainedViewport ? -10 : -15}
        shadow-camera-right={isConstrainedViewport ? 10 : 15}
        shadow-camera-top={isConstrainedViewport ? 10 : 15}
        shadow-camera-bottom={isConstrainedViewport ? -10 : -15}
        shadow-bias={-0.0005}
      />
      
      {/* Fill light (softer, opposite direction) - Optimized for constrained viewport */}
      <directionalLight
        position={isConstrainedViewport ? [-3, 6, -3] : [-4, 8, -4]}
        intensity={isConstrainedViewport 
          ? (deviceCapabilities.isLowEnd ? 0.4 : 0.6) // Slightly brighter fill
          : (deviceCapabilities.isLowEnd ? 0.3 : 0.5)
        }
        color="#f0f8ff"
        castShadow={false}
      />
      
      {/* Rim light for edge definition - Simplified for constrained viewport */}
      {!deviceCapabilities.isLowEnd && !isConstrainedViewport && (
        <directionalLight
          position={[0, 2, -8]}
          intensity={0.3}
          color="#fff8dc"
          castShadow={false}
        />
      )}
      
      {/* Point light for ceramic highlights - Reduced complexity in constrained mode */}
      {performanceConfig.qualityLevel !== 'low' && !isConstrainedViewport && (
        <pointLight
          position={[2, 4, 3]}
          intensity={0.4}
          color="#ffffff"
          distance={10}
          decay={2}
          castShadow={false}
        />
      )}
    </>
  )
}

// Smooth camera controls with auto-return functionality
function SmoothControls({ 
  deviceCapabilities, 
  isConstrainedViewport = false 
}: { 
  deviceCapabilities: any
  isConstrainedViewport?: boolean
}) {
  const controlsRef = useRef<any>(null)
  const { animationConfig, camera, setInteraction, resetAutoReturnTimer, clearAutoReturnTimer } = useDesignStore()
  const [isInteracting, setIsInteracting] = useState(false)
  
  // Auto-return timer management
  useEffect(() => {
    if (isInteracting) {
      clearAutoReturnTimer()
    } else {
      resetAutoReturnTimer()
    }
  }, [isInteracting, clearAutoReturnTimer, resetAutoReturnTimer])

  return (
    <Controls 
      dampingFactor={isConstrainedViewport ? animationConfig.dampingFactor * 1.2 : animationConfig.dampingFactor}
      minDistance={isConstrainedViewport 
        ? (deviceCapabilities.isMobile ? 1.8 : 2.0) // Closer minimum for constrained viewport
        : (deviceCapabilities.isMobile ? 2 : 2.5)
      }
      maxDistance={isConstrainedViewport 
        ? (deviceCapabilities.isMobile ? 8 : 10) // Reduced maximum for constrained viewport
        : (deviceCapabilities.isMobile ? 10 : 12)
      }
    />
  )
}

// Performance monitor component
function PerformanceMonitor() {
  const { updatePerformance, performance: performanceMetrics } = useDesignStore()
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  const lastPerformanceCheck = useRef(0)

  useFrame(() => {
    frameCountRef.current++
    const currentTime = performance.now()
    
    // Calculate FPS every second
    if (currentTime - lastTimeRef.current >= 1000) {
      const fps = frameCountRef.current
      updatePerformance(fps, currentTime - lastTimeRef.current)
      
      // Analytics tracking for performance issues
      if (currentTime - lastPerformanceCheck.current >= 10000) { // Every 10 seconds
        const analytics = getAnalyticsIntegration()
        analytics.trackPerformanceIssue(fps, performanceMetrics.memoryUsage || 0)
        lastPerformanceCheck.current = currentTime
      }
      
      frameCountRef.current = 0
      lastTimeRef.current = currentTime
    }
  })

  return null
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <span className="ml-3 text-gray-600">Loading 3D model...</span>
    </div>
  )
}

// Error boundary fallback
function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="text-red-500 mb-4">
        <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.96-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">3D Viewer Unavailable</h3>
      <p className="text-gray-600 mb-4">Your browser doesn&apos;t support WebGL or 3D graphics.</p>
      <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-32 bg-gray-300 rounded-lg mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Static Mug Preview</p>
        </div>
      </div>
    </div>
  )
}

interface SceneProps {
  className?: string
  isConstrainedViewport?: boolean // New prop for split-screen optimization
}

export default function Scene({ 
  className = "",
  isConstrainedViewport = false 
}: SceneProps) {
  const [hasWebGL, setHasWebGL] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [deviceCapabilities, setDeviceCapabilities] = useState({
    isMobile: false,
    isLowEnd: false,
    pixelRatio: 1,
    maxTextureSize: 1024
  })
  const { isLoading, setLoading, setError: setStoreError } = useDesignStore()

  // Detect device capabilities and WebGL support
  useEffect(() => {
    setLoading(true) // Start loading
    
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null
      
      if (!gl) {
        setHasWebGL(false)
        setStoreError('WebGL not supported')
        setLoading(false)
        return
      }

      // Detect device capabilities
      const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2) // Cap at 2x for performance
      
      // Get max texture size for quality scaling
      const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number
      
      // Detect low-end devices based on various factors
      const memory = (navigator as any).deviceMemory || 4 // Default to 4GB if unknown
      const hardwareConcurrency = navigator.hardwareConcurrency || 4
      const isLowEnd = memory < 4 || hardwareConcurrency < 4 || maxTextureSize < 2048

      setDeviceCapabilities({
        isMobile,
        isLowEnd,
        pixelRatio: isLowEnd ? 1 : pixelRatio,
        maxTextureSize: Math.min(maxTextureSize, isLowEnd ? 1024 : 2048)
      })

      // Device capabilities detected successfully, allow Canvas to render
      // The actual loading will be handled by Canvas onCreated callback
      setLoading(false)

    } catch (e) {
      setHasWebGL(false)
      setStoreError('WebGL initialization failed')
      setLoading(false)
    }
  }, [setStoreError, setLoading])

  // Handle Canvas errors
  const handleCanvasError = (error: Error) => {
    console.error('Canvas error:', error)
    setError(error)
    setStoreError(error.message)
  }

  if (!hasWebGL) {
    return (
      <div className={`w-full h-full ${className}`}>
        <ErrorFallback error={new Error('WebGL not supported')} />
      </div>
    )
  }

  if (error) {
    return (
      <div className={`w-full h-full ${className}`}>
        <ErrorFallback error={error} />
      </div>
    )
  }

  return (
    <div className={`w-full h-full relative ${className}`}>
      <LoadingIndicator isLoading={isLoading} />
      <PerformanceMonitorUI showDebugInfo={process.env.NODE_ENV === 'development'} />
      
      {/* Interactive visual feedback hints */}
      <InteractionHints showHints={!isLoading} />
      
      {/* Touch hints overlay */}
      <TouchHints showOnboarding={true} />
      
      {/* Reset button positioned for mobile accessibility */}
      <div className="absolute top-4 right-4 z-10">
        <ResetButton 
          size={deviceCapabilities.isMobile ? 'lg' : 'md'} 
          variant="ghost" 
        />
      </div>

      <Canvas
        style={{ background: '#e5e7eb' }} // Gray background to see canvas bounds
        camera={{
          position: isConstrainedViewport
            ? [2.5, 1.8, 4] // Closer position for constrained viewport
            : [3, 2, 5],
          fov: isConstrainedViewport
            ? (deviceCapabilities.isMobile ? 65 : 55) // Slightly wider FOV for constrained space
            : (deviceCapabilities.isMobile ? 60 : 50),
          near: 0.1,
          far: 1000,
          // Adjust aspect ratio handling for constrained viewport
          aspect: isConstrainedViewport ? undefined : undefined // Let Three.js auto-calculate
        }}
        shadows={!deviceCapabilities.isLowEnd && !isConstrainedViewport} // Disable shadows in constrained mode for performance
        dpr={isConstrainedViewport ? Math.min(deviceCapabilities.pixelRatio, 1.5) : deviceCapabilities.pixelRatio} // Reduced DPR in constrained mode
        performance={{ 
          min: isConstrainedViewport 
            ? (deviceCapabilities.isLowEnd ? 0.4 : 0.7) // Lower thresholds for constrained viewport
            : (deviceCapabilities.isLowEnd ? 0.5 : 0.8),
          debounce: isConstrainedViewport 
            ? (deviceCapabilities.isMobile ? 250 : 150) // Longer debounce in constrained mode
            : (deviceCapabilities.isMobile ? 200 : 100)
        }}
        gl={{
          antialias: !deviceCapabilities.isLowEnd && !isConstrainedViewport, // Disable AA in constrained mode
          alpha: true,
          powerPreference: isConstrainedViewport 
            ? 'low-power' // Always use low-power in split-screen mode
            : (deviceCapabilities.isMobile ? 'low-power' : 'high-performance')
        }}
        onCreated={(state) => {
          // Mobile-optimized WebGL settings
          if (deviceCapabilities.isMobile) {
            // Reduce precision on mobile for better performance
            state.gl.getContext().getShaderPrecisionFormat = () => ({
              precision: 16,
              rangeMin: -2,
              rangeMax: 2
            })
          }
          
          // Set up error handling
          state.gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault()
            setError(new Error('WebGL context lost'))
          })
          
          // Prevent touch events from scrolling the page
          state.gl.domElement.addEventListener('touchstart', (e) => {
            e.preventDefault()
          }, { passive: false })
          
          state.gl.domElement.addEventListener('touchmove', (e) => {
            e.preventDefault()
          }, { passive: false })
        }}
      >
        <Suspense fallback={null}>
          {/* Enhanced Professional Lighting System - Optimized for constrained viewport */}
          <EnhancedLighting
            deviceCapabilities={deviceCapabilities}
            isConstrainedViewport={isConstrainedViewport}
          />

          {/* Environment for reflections with quality adjustment */}
          <Environment
            preset={isConstrainedViewport || deviceCapabilities.isLowEnd ? "warehouse" : "studio"}
            background={false}
          />

          {/* 3D Mug Model with enhanced materials */}
          <MugModel isConstrainedViewport={isConstrainedViewport} />

          {/* Enhanced Camera Controls with smooth transitions */}
          <SmoothControls
            deviceCapabilities={deviceCapabilities}
            isConstrainedViewport={isConstrainedViewport}
          />

          {/* Performance monitoring */}
          <PerformanceMonitor />
        </Suspense>
      </Canvas>
    </div>
  )
}
