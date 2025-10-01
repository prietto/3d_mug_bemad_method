'use client'

import React, { useRef, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { Vector3, Spherical } from 'three'
import { useDesignStore } from './store/designStore'
import { getAnalyticsIntegration } from '../../../lib/utils/analytics'

interface ControlsProps {
  enableDamping?: boolean
  dampingFactor?: number
  enableZoom?: boolean
  enablePan?: boolean
  enableRotate?: boolean
  minDistance?: number
  maxDistance?: number
  minPolarAngle?: number
  maxPolarAngle?: number
  autoReturn?: boolean
  transitionDuration?: number
}

export default function Controls({
  enableDamping = true,
  dampingFactor = 0.08, // Smoother for mobile
  enableZoom = true,
  enablePan = false,
  enableRotate = true,
  minDistance = 2.5, // Allow closer inspection  
  maxDistance = 12, // Extended range for better overview
  minPolarAngle = Math.PI / 8, // 22.5 degrees - more viewing angles
  maxPolarAngle = Math.PI - Math.PI / 8, // 22.5 degrees from bottom
  autoReturn = true,
  transitionDuration = 1000
}: ControlsProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const { camera, gl } = useThree()
  const { 
    setInteraction, 
    updateCamera, 
    animationConfig, 
    camera: cameraState,
    clearAutoReturnTimer,
    resetAutoReturnTimer
  } = useDesignStore()
  
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionStart, setTransitionStart] = useState<{
    position: Vector3
    target: Vector3
    time: number
  } | null>(null)

  // Enhanced interaction handling with auto-return timer and analytics
  useEffect(() => {
    const analytics = getAnalyticsIntegration();
    let interactionStartTime = 0;
    let lastPosition: Vector3 | null = null;
    let lastCameraDistance = 0;

    const handleInteractionStart = () => {
      setInteraction({ isDragging: true })
      clearAutoReturnTimer()
      interactionStartTime = Date.now()
      
      if (controlsRef.current) {
        lastPosition = controlsRef.current.target.clone()
        lastCameraDistance = camera.position.distanceTo(controlsRef.current.target)
      }
    }

    const handleInteractionEnd = () => {
      setInteraction({ isDragging: false, lastPointerPosition: null })
      if (autoReturn) {
        resetAutoReturnTimer()
      }
      
      // Track rotation analytics
      if (controlsRef.current && lastPosition && interactionStartTime > 0) {
        const currentPosition = controlsRef.current.target
        const angle = lastPosition.angleTo(currentPosition) * (180 / Math.PI)
        const duration = Date.now() - interactionStartTime
        
        if (angle > 1 && duration > 50) { // Minimum threshold for meaningful rotation
          analytics.trackRotation(angle, duration)
        }
      }
      
      interactionStartTime = 0
      lastPosition = null
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || event.buttons > 0) {
        setInteraction({
          lastPointerPosition: { x: event.clientX, y: event.clientY }
        })
      }
    }

    const handleWheel = (event: WheelEvent) => {
      clearAutoReturnTimer()
      setInteraction({ isZooming: true })
      
      // Track zoom analytics
      if (controlsRef.current) {
        const currentDistance = camera.position.distanceTo(controlsRef.current.target)
        const direction = event.deltaY > 0 ? 'out' : 'in'
        const scale = currentDistance / lastCameraDistance || 1
        
        analytics.trackZoom(scale, direction)
        lastCameraDistance = currentDistance
      }
      
      // Reset zoom state and restart auto-return timer
      setTimeout(() => {
        setInteraction({ isZooming: false })
        if (autoReturn) {
          resetAutoReturnTimer()
        }
      }, 100)
    }

    const canvas = gl.domElement
    canvas.addEventListener('pointerdown', handleInteractionStart)
    canvas.addEventListener('pointerup', handleInteractionEnd)
    canvas.addEventListener('pointermove', handlePointerMove)
    canvas.addEventListener('wheel', handleWheel)

    return () => {
      canvas.removeEventListener('pointerdown', handleInteractionStart)
      canvas.removeEventListener('pointerup', handleInteractionEnd)
      canvas.removeEventListener('pointermove', handlePointerMove)
      canvas.removeEventListener('wheel', handleWheel)
    }
  }, [gl.domElement, setInteraction, autoReturn, clearAutoReturnTimer, resetAutoReturnTimer])

  // Listen for auto-return trigger from store
  useEffect(() => {
    // This will be triggered by the store's auto-return timer
    const handleAutoReturn = () => {
      if (!isTransitioning && cameraState.autoReturnTimer) {
        returnToDefault()
      }
    }
    
    // Set up a listener for when the store wants to trigger auto-return
    // We'll check this in the next useFrame cycle
  }, [cameraState.autoReturnTimer, isTransitioning])

  // Smooth camera transition function
  const transitionToPosition = (targetPosition: Vector3, targetTarget: Vector3) => {
    if (!controlsRef.current) return
    
    setIsTransitioning(true)
    setTransitionStart({
      position: camera.position.clone(),
      target: controlsRef.current.target.clone(),
      time: Date.now()
    })
  }

  // Auto-return to default position
  const returnToDefault = () => {
    const defaultPosition = new Vector3(3, 2, 5)
    const defaultTarget = new Vector3(0, 0, 0)
    transitionToPosition(defaultPosition, defaultTarget)
  }

  // Enhanced frame update with smooth transitions
  useFrame(() => {
    if (controlsRef.current) {
      const controls = controlsRef.current
      
      // Handle smooth camera transitions
      if (isTransitioning && transitionStart) {
        const elapsed = Date.now() - transitionStart.time
        const progress = Math.min(elapsed / animationConfig.cameraTransitionDuration, 1)
        
        // Easing function (easeInOutCubic)
        const easedProgress = progress < 0.5 
          ? 4 * progress * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 3) / 2
        
        // Interpolate camera position
        const newPosition = transitionStart.position.clone().lerp(
          new Vector3(3, 2, 5), // Default position
          easedProgress
        )
        
        // Interpolate target
        const newTarget = transitionStart.target.clone().lerp(
          new Vector3(0, 0, 0), // Default target
          easedProgress
        )
        
        // Apply positions
        camera.position.copy(newPosition)
        controls.target.copy(newTarget)
        controls.update()
        
        // End transition
        if (progress >= 1) {
          setIsTransitioning(false)
          setTransitionStart(null)
        }
      }
      
      // Update camera state in store
      updateCamera(
        [camera.position.x, camera.position.y, camera.position.z],
        [controls.target.x, controls.target.y, controls.target.z],
        isTransitioning
      )
    }
  })

  // Detect mobile device for touch-optimized settings
  const isMobile = typeof window !== 'undefined' && 
    ('ontouchstart' in window || navigator.maxTouchPoints > 0)

  return (
    <OrbitControls
      ref={controlsRef}
      args={[camera, gl.domElement]}
      enableDamping={enableDamping}
      dampingFactor={dampingFactor}
      enableZoom={enableZoom}
      enablePan={enablePan}
      enableRotate={enableRotate}
      minDistance={minDistance}
      maxDistance={maxDistance}
      minPolarAngle={minPolarAngle}
      maxPolarAngle={maxPolarAngle}
      target={[0, 0, 0]}
      // Mobile-optimized settings
      rotateSpeed={isMobile ? 0.6 : 0.5} // Slightly faster for thumb navigation
      zoomSpeed={isMobile ? 1.0 : 0.8} // More responsive zoom on mobile
      panSpeed={isMobile ? 0.8 : 1.0}
      // Enhanced momentum and damping for natural touch feel
      autoRotate={false}
      autoRotateSpeed={0}
      // Prevent context menu on right-click/long press
      onContextMenu={(e) => e.nativeEvent.preventDefault()}
      // Touch gesture mapping optimized for mobile
      touches={{
        ONE: 2, // Single finger rotate (TOUCH.ROTATE)
        TWO: 1  // Two finger zoom (TOUCH.DOLLY_PAN) 
      }}
      // Mouse button mapping for desktop
      mouseButtons={{
        LEFT: 2, // Rotate
        MIDDLE: 1, // Zoom
        RIGHT: 0 // Pan (disabled)
      }}
    />
  )
}
