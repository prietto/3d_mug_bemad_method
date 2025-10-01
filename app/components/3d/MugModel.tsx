'use client'

import React, { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame, useLoader, extend, useThree } from '@react-three/fiber'
import { 
  Mesh, 
  CylinderGeometry, 
  MeshPhysicalMaterial, 
  MeshStandardMaterial, 
  DoubleSide, 
  TextureLoader, 
  Texture, 
  Color, 
  Raycaster, 
  Vector2, 
  Vector3,
  RepeatWrapping,
  LinearFilter,
  RGBAFormat,
  BufferGeometry,
  LOD,
  Group
} from 'three'
import { Text } from 'troika-three-text'
import { useDesignStore } from './store/designStore'

// Extend R3F to recognize Text component
extend({ Text })

interface TextMeshProps {
  text: string
  font: string
  position: { x: number; y: number; z: number }
  size: number
  color: string
  mugColor: string
}

function TextMesh({ text, font, position, size, color, mugColor }: TextMeshProps) {
  const textRef = useRef<Text>(null)
  
  // Calculate text color with contrast against mug color
  const textColor = useMemo(() => {
    // If manual color override is provided (not default black), use it
    if (color !== '#000000') return color
    
    // Auto-calculate contrast against mug color for default/auto mode
    const mugColorObj = new Color(mugColor)
    const brightness = (mugColorObj.r * 299 + mugColorObj.g * 587 + mugColorObj.b * 114) / 1000
    return brightness > 0.5 ? '#000000' : '#ffffff'
  }, [color, mugColor])

  useEffect(() => {
    if (textRef.current) {
      textRef.current.sync()
    }
  }, [text, font, size, textColor])

  return (
    <primitive
      ref={textRef}
      object={new Text()}
      text={text}
      font={font}
      fontSize={0.3 * size}
      color={textColor}
      anchorX="center"
      anchorY="middle"
      position={[
        position.x * 1.1, // Scale to mug surface
        position.y, 
        1.2 + position.z // Position on mug surface
      ]}
      rotation={[0, 0, 0]}
      maxWidth={2}
      whiteSpace="nowrap"
    />
  )
}

interface MugModelProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
  isConstrainedViewport?: boolean
}

export default function MugModel({ 
  position = [0, 0, 0], 
  rotation = [0, 0, 0],
  isConstrainedViewport = false 
}: MugModelProps) {
  const meshRef = useRef<Mesh>(null)
  const handleRef = useRef<Mesh>(null)
  const groupRef = useRef<Group>(null)
  const lodRef = useRef<LOD>(null)
  const { currentDesign, setTextPosition, performanceConfig, animationConfig } = useDesignStore()
  const [uploadedTexture, setUploadedTexture] = useState<Texture | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const { camera, gl, scene } = useThree()

  // Create multiple LOD levels for mug geometry
  const mugGeometries = useMemo(() => {
    const geometries = {
      high: new CylinderGeometry(1.2, 1.0, 2.5, 64, 1), // High detail: 64 segments
      medium: new CylinderGeometry(1.2, 1.0, 2.5, 32, 1), // Medium: 32 segments
      low: new CylinderGeometry(1.2, 1.0, 2.5, 16, 1) // Low detail: 16 segments
    }
    return geometries
  }, [])

  // Handle geometries with LOD support
  const handleGeometries = useMemo(() => {
    const geometries = {
      high: new CylinderGeometry(0.15, 0.15, 0.1, 32),
      medium: new CylinderGeometry(0.15, 0.15, 0.1, 16),
      low: new CylinderGeometry(0.15, 0.15, 0.1, 8)
    }
    return geometries
  }, [])

  // Get current geometry based on performance settings
  const currentMugGeometry = useMemo(() => {
    if (!performanceConfig.lodEnabled) return mugGeometries.high
    
    switch (performanceConfig.qualityLevel) {
      case 'ultra': return mugGeometries.high
      case 'high': return mugGeometries.high
      case 'medium': return mugGeometries.medium
      case 'low': return mugGeometries.low
      default: return mugGeometries.medium
    }
  }, [mugGeometries, performanceConfig.lodEnabled, performanceConfig.qualityLevel])

  const currentHandleGeometry = useMemo(() => {
    if (!performanceConfig.lodEnabled) return handleGeometries.high
    
    switch (performanceConfig.qualityLevel) {
      case 'ultra': return handleGeometries.high
      case 'high': return handleGeometries.high
      case 'medium': return handleGeometries.medium
      case 'low': return handleGeometries.low
      default: return handleGeometries.medium
    }
  }, [handleGeometries, performanceConfig.lodEnabled, performanceConfig.qualityLevel])

  // Enhanced texture loading with compression and optimization
  useEffect(() => {
    if (currentDesign.uploadedImageUrl) {
      const loader = new TextureLoader()
      loader.load(
        currentDesign.uploadedImageUrl,
        (texture) => {
          // Configure texture for optimal display on cylinder with quality adjustment
          texture.wrapS = texture.wrapT = RepeatWrapping
          texture.repeat.set(1, 1)
          texture.offset.set(0, 0)
          
          // Apply texture quality settings based on performance config
          const maxSize = performanceConfig.qualityLevel === 'low' ? 512 :
                         performanceConfig.qualityLevel === 'medium' ? 1024 :
                         performanceConfig.qualityLevel === 'high' ? 2048 : 4096
          
          // Optimize texture based on device capabilities
          if (texture.image) {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            
            if (ctx && (texture.image.width > maxSize || texture.image.height > maxSize)) {
              // Calculate optimal size maintaining aspect ratio
              const aspectRatio = texture.image.width / texture.image.height
              const targetWidth = Math.min(texture.image.width, maxSize)
              const targetHeight = Math.min(texture.image.height, maxSize / aspectRatio)
              
              canvas.width = targetWidth
              canvas.height = targetHeight
              
              // Draw resized image
              ctx.drawImage(texture.image, 0, 0, targetWidth, targetHeight)
              
              // Create new texture from resized canvas
              const resizedTexture = new TextureLoader().load(canvas.toDataURL('image/webp', 0.8))
              resizedTexture.wrapS = resizedTexture.wrapT = RepeatWrapping
              resizedTexture.minFilter = LinearFilter
              resizedTexture.magFilter = LinearFilter
              resizedTexture.format = RGBAFormat
              resizedTexture.repeat.set(1, 1)
              resizedTexture.offset.set(0, 0)
              
              setUploadedTexture(resizedTexture)
              texture.dispose() // Clean up original texture
            } else {
              // Use original texture with optimized settings
              texture.minFilter = LinearFilter
              texture.magFilter = LinearFilter
              texture.format = RGBAFormat
              setUploadedTexture(texture)
            }
          } else {
            setUploadedTexture(texture)
          }
        },
        undefined,
        (error) => {
          console.error('Failed to load texture:', error)
          setUploadedTexture(null)
        }
      )
    } else {
      // Clean up texture when image is removed
      if (uploadedTexture) {
        uploadedTexture.dispose()
      }
      setUploadedTexture(null)
    }
  }, [currentDesign.uploadedImageUrl, performanceConfig.qualityLevel, uploadedTexture])

  // Enhanced materials with PBR properties for professional rendering
  const mugMaterial = useMemo(() => {
    const material = new MeshPhysicalMaterial({
      color: uploadedTexture ? '#ffffff' : currentDesign.mugColor,
      roughness: 0.15, // Slightly rough for ceramic feel
      metalness: 0.0, // Non-metallic ceramic
      clearcoat: 0.1, // Subtle ceramic gloss
      clearcoatRoughness: 0.05,
      reflectivity: 0.2, // Ceramic reflectivity
      ior: 1.5, // Index of refraction for ceramic
      side: DoubleSide,
      transparent: false,
      opacity: 1.0
    })
    
    // Apply uploaded texture if available with enhanced properties
    if (uploadedTexture) {
      material.map = uploadedTexture
      material.roughness = 0.2 // Slightly more rough with texture
      material.clearcoat = 0.05 // Reduce clearcoat when textured
      material.needsUpdate = true
    }
    
    // Adjust material properties based on performance settings
    if (performanceConfig.qualityLevel === 'low') {
      material.clearcoat = 0
      material.clearcoatRoughness = 0
    } else if (performanceConfig.qualityLevel === 'medium') {
      material.clearcoat *= 0.5
    }
    
    return material
  }, [currentDesign.mugColor, uploadedTexture, performanceConfig.qualityLevel])

  // Add color transition animation
  const [targetColor, setTargetColor] = useState(currentDesign.mugColor)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    if (targetColor !== currentDesign.mugColor) {
      setTargetColor(currentDesign.mugColor)
      setIsTransitioning(true)
    }
  }, [currentDesign.mugColor, targetColor])

  const handleMaterial = useMemo(() => {
    const material = new MeshPhysicalMaterial({
      color: currentDesign.mugColor,
      roughness: 0.15,
      metalness: 0.0,
      clearcoat: 0.1,
      clearcoatRoughness: 0.05,
      reflectivity: 0.2,
      ior: 1.5
    })
    
    // Performance-based adjustments
    if (performanceConfig.qualityLevel === 'low') {
      material.clearcoat = 0
      material.clearcoatRoughness = 0
    } else if (performanceConfig.qualityLevel === 'medium') {
      material.clearcoat *= 0.5
    }
    
    return material
  }, [currentDesign.mugColor, performanceConfig.qualityLevel])

  // Drag-and-drop functionality for desktop text positioning
  const handleMouseDown = (event: any) => {
    // Only enable drag if we have text and are not on mobile
    if (!currentDesign.customText || 'ontouchstart' in window) return
    
    event.stopPropagation()
    setIsDragging(true)
    gl.domElement.style.cursor = 'grabbing'
  }

  const handleMouseMove = (event: any) => {
    if (!isDragging || !meshRef.current) return

    // Create raycaster for mouse position
    const raycaster = new Raycaster()
    const mouse = new Vector2(
      (event.clientX / gl.domElement.clientWidth) * 2 - 1,
      -(event.clientY / gl.domElement.clientHeight) * 2 + 1
    )
    
    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObject(meshRef.current)
    
    if (intersects.length > 0) {
      const point = intersects[0].point
      // Convert world position to local mug surface coordinates
      const localX = point.x / 1.1 // Scale back from mug surface
      const localY = point.y
      const localZ = 0 // Keep on surface
      
      // Clamp to reasonable bounds
      const clampedX = Math.max(-1, Math.min(1, localX))
      const clampedY = Math.max(-1, Math.min(1, localY))
      
      setTextPosition({ x: clampedX, y: clampedY, z: localZ })
    }
  }

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false)
      gl.domElement.style.cursor = 'grab'
    }
  }

  // Add global mouse event listeners for drag functionality
  useEffect(() => {
    const handleGlobalMouseMove = (event: MouseEvent) => handleMouseMove(event)
    const handleGlobalMouseUp = () => handleMouseUp()

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [isDragging])

  // Set cursor style when hovering over mug with text
  useEffect(() => {
    if (currentDesign.customText && !('ontouchstart' in window)) {
      gl.domElement.style.cursor = isDragging ? 'grabbing' : 'grab'
    } else {
      gl.domElement.style.cursor = 'default'
    }
  }, [currentDesign.customText, isDragging, gl.domElement])

  // Cleanup texture on unmount
  useEffect(() => {
    return () => {
      if (uploadedTexture) {
        uploadedTexture.dispose()
      }
    }
  }, [uploadedTexture])

  // Enhanced animation with smooth transitions and hover effects
  useFrame((state) => {
    if (meshRef.current && groupRef.current) {
      // Subtle idle animation with easing
      const idleIntensity = isHovered ? 1.5 : 1.0
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.02 * idleIntensity
      
      // Smooth rotation on hover
      if (isHovered) {
        groupRef.current.rotation.y += 0.005
      }
      
      // Smooth color transition animation with easing
      if (isTransitioning && !uploadedTexture) {
        const material = meshRef.current.material as MeshPhysicalMaterial
        const handleMat = handleRef.current?.material as MeshPhysicalMaterial
        
        if (material && handleMat) {
          // Create target color object
          const targetColorObj = new Color(targetColor)
          
          // Enhanced smooth transitions with configurable easing
          const lerpFactor = animationConfig.easingFunction === 'easeInOutCubic' ? 0.12 : 0.15
          material.color.lerp(targetColorObj, lerpFactor)
          handleMat.color.lerp(targetColorObj, lerpFactor)
          
          // Check if transition is complete
          const diff = Math.abs(material.color.r - targetColorObj.r) + 
                      Math.abs(material.color.g - targetColorObj.g) + 
                      Math.abs(material.color.b - targetColorObj.b)
          
          if (diff < 0.02) {
            setIsTransitioning(false)
          }
        }
      }
      
      // Enhanced hover effect with material property changes
      if (meshRef.current.material) {
        const material = meshRef.current.material as MeshPhysicalMaterial
        const targetClearcoat = isHovered ? 0.15 : (performanceConfig.qualityLevel === 'low' ? 0 : 0.1)
        material.clearcoat += (targetClearcoat - material.clearcoat) * 0.1
      }
    }
  })

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Main mug body with enhanced materials */}
      <mesh
        ref={meshRef}
        geometry={currentMugGeometry}
        material={mugMaterial}
        castShadow={performanceConfig.enableShadows}
        receiveShadow={performanceConfig.enableShadows}
        onPointerDown={handleMouseDown}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
      />
      
      {/* Mug handle with matching material */}
      <mesh
        ref={handleRef}
        position={[1.4, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        geometry={currentHandleGeometry}
        material={handleMaterial}
        castShadow={performanceConfig.enableShadows}
        receiveShadow={performanceConfig.enableShadows}
      />
      
      {/* Enhanced inner rim with PBR material */}
      <mesh
        position={[0, 1.25, 0]}
        rotation={[0, 0, 0]}
        castShadow={performanceConfig.enableShadows}
        receiveShadow={performanceConfig.enableShadows}
      >
        <cylinderGeometry args={[
          1.1, 
          1.1, 
          0.1, 
          performanceConfig.qualityLevel === 'low' ? 16 : 32
        ]} />
        <meshPhysicalMaterial 
          color={currentDesign.mugColor} 
          roughness={0.2}
          metalness={0.0}
          clearcoat={performanceConfig.qualityLevel === 'low' ? 0 : 0.05}
          clearcoatRoughness={0.1}
        />
      </mesh>

      {/* 3D Text Rendering with enhanced materials */}
      {currentDesign.customText && (
        <TextMesh 
          text={currentDesign.customText}
          font={currentDesign.textFont || 'Arial, sans-serif'}
          position={JSON.parse(currentDesign.textPosition || '{"x":0,"y":0,"z":0}')}
          size={currentDesign.textSize || 1.0}
          color={currentDesign.textColor || '#000000'}
          mugColor={currentDesign.mugColor}
        />
      )}
    </group>
  )
}
