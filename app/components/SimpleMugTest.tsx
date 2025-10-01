'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Canvas, extend, useLoader } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Text } from 'troika-three-text'
import * as THREE from 'three'

// Extend R3F to recognize Text component
extend({ Text })

// Create curved plane geometry for wrapping image around cylinder
function createCurvedPlaneGeometry(width: number, height: number, curveSegments: number = 32) {
  const geometry = new THREE.BufferGeometry()
  const vertices: number[] = []
  const uvs: number[] = []
  const indices: number[] = []

  const radius = 1.23
  const arcAngle = Math.PI * 0.5 // 90 degrees

  // Create vertices
  for (let i = 0; i <= curveSegments; i++) {
    for (let j = 0; j <= 1; j++) {
      const u = i / curveSegments
      const v = j

      // Calculate angle for this vertex
      const angle = (u - 0.5) * arcAngle
      const x = Math.sin(angle) * radius
      const z = Math.cos(angle) * radius
      const y = (v - 0.5) * height

      vertices.push(x, y, z)
      uvs.push(u, v)
    }
  }

  // Create indices
  for (let i = 0; i < curveSegments; i++) {
    const a = i * 2
    const b = a + 1
    const c = a + 2
    const d = a + 3

    indices.push(a, b, c)
    indices.push(b, d, c)
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()

  return geometry
}

interface MugProps {
  color: string
  text: string
  textColor: string
  textSize: number
  imageUrl: string | null
  imageScale: number
  imagePositionY: number
}

function Mug({ color, text, textColor, textSize, imageUrl, imageScale, imagePositionY }: MugProps) {
  const textRef = useRef<Text>(null)
  const texture = imageUrl ? useLoader(THREE.TextureLoader, imageUrl) : null

  const curvedGeometry = useMemo(() => {
    return createCurvedPlaneGeometry(2, imageScale, 48)
  }, [imageScale])

  useEffect(() => {
    if (textRef.current) {
      textRef.current.sync()
    }
  }, [text, textColor, textSize])

  return (
    <group position={[0, 0, 0]}>
      {/* Mug body */}
      <mesh>
        <cylinderGeometry args={[1.2, 1.0, 2.5, 32]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Handle */}
      <mesh position={[1.4, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.4, 0.15, 16, 32]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Image/Logo on mug - curved using custom geometry */}
      {texture && (
        <mesh position={[0, imagePositionY, 0]} geometry={curvedGeometry}>
          <meshBasicMaterial
            map={texture}
            transparent={true}
            alphaTest={0.1}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Text on mug */}
      {text && (
        <primitive
          ref={textRef}
          object={new Text()}
          text={text}
          fontSize={0.5 * textSize}
          color={textColor}
          anchorX="center"
          anchorY="middle"
          position={[0, 0, 1.21]}
          maxWidth={2.2}
        />
      )}
    </group>
  )
}

export default function SimpleMugTest() {
  const DEFAULT_COLOR = '#3b82f6'
  const [mugColor, setMugColor] = useState(DEFAULT_COLOR)
  const [customText, setCustomText] = useState('')
  const [textColor, setTextColor] = useState('#ffffff')
  const [textSize, setTextSize] = useState(1.0)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageScale, setImageScale] = useState(1.0)
  const [imagePositionY, setImagePositionY] = useState(0.5)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const colors = [
    { name: 'Black', value: '#000000' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Green', value: '#10b981' },
    { name: 'White', value: '#ffffff' },
  ]

  const textColors = [
    { name: 'Black', value: '#000000' },
    { name: 'White', value: '#ffffff' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Gold', value: '#fbbf24' },
  ]

  const handleResetColor = () => {
    setMugColor(DEFAULT_COLOR)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, etc.)')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB')
      return
    }

    // Create object URL for the image
    const url = URL.createObjectURL(file)
    setImageUrl(url)
  }

  const handleRemoveImage = () => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl)
      setImageUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '600px', background: '#f3f4f6', display: 'flex', flexDirection: 'column' }}>
      {/* 3D Canvas */}
      <div style={{ flex: 1, minHeight: '400px' }}>
        <Canvas camera={{ position: [3, 2, 5], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <Mug
            color={mugColor}
            text={customText}
            textColor={textColor}
            textSize={textSize}
            imageUrl={imageUrl}
            imageScale={imageScale}
            imagePositionY={imagePositionY}
          />
          <OrbitControls />
        </Canvas>
      </div>

      {/* Color Picker */}
      <div style={{ padding: '20px', background: 'white', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Mug Color</h3>
          <button
            onClick={handleResetColor}
            disabled={mugColor === DEFAULT_COLOR}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              color: mugColor === DEFAULT_COLOR ? '#9ca3af' : '#3b82f6',
              background: 'transparent',
              border: `1px solid ${mugColor === DEFAULT_COLOR ? '#e5e7eb' : '#3b82f6'}`,
              borderRadius: '6px',
              cursor: mugColor === DEFAULT_COLOR ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: mugColor === DEFAULT_COLOR ? 0.5 : 1,
            }}
          >
            Reset Color
          </button>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {colors.map((color) => (
            <button
              key={color.value}
              onClick={() => setMugColor(color.value)}
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '8px',
                border: mugColor === color.value ? '3px solid #3b82f6' : '2px solid #e5e7eb',
                background: color.value,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: mugColor === color.value ? '0 4px 6px rgba(59, 130, 246, 0.3)' : 'none',
              }}
              title={color.name}
            />
          ))}
        </div>
        <p style={{ marginTop: '12px', fontSize: '14px', color: '#6b7280' }}>
          Selected: {colors.find(c => c.value === mugColor)?.name || 'Custom'}
        </p>
      </div>

      {/* Custom Text Section */}
      <div style={{ padding: '20px', background: 'white', borderTop: '1px solid #e5e7eb' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>Custom Text</h3>
        <input
          type="text"
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          placeholder="Add your custom text..."
          maxLength={30}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '14px',
            border: '2px solid #e5e7eb',
            borderRadius: '6px',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
        />
        {customText && (
          <p style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
            {customText.length}/30 characters
          </p>
        )}

        {/* Text Controls - Only show when text exists */}
        {customText && (
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Text Size Slider */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Size: {textSize.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={textSize}
                onChange={(e) => setTextSize(parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  cursor: 'pointer',
                }}
              />
            </div>

            {/* Text Color Picker */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Text Color</label>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {textColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setTextColor(color.value)}
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '6px',
                      border: textColor === color.value ? '3px solid #3b82f6' : '2px solid #e5e7eb',
                      background: color.value,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: textColor === color.value ? '0 4px 6px rgba(59, 130, 246, 0.3)' : 'none',
                    }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Image Upload Section */}
      <div style={{ padding: '20px', background: 'white', borderTop: '1px solid #e5e7eb' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>Upload Image/Logo</h3>

        {!imageUrl ? (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#ffffff',
                background: '#3b82f6',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
            >
              Choose Image
            </label>
            <p style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
              PNG, JPG, or GIF (max 5MB)
            </p>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <img
                src={imageUrl}
                alt="Preview"
                style={{
                  width: '80px',
                  height: '80px',
                  objectFit: 'contain',
                  border: '2px solid #e5e7eb',
                  borderRadius: '6px',
                  background: '#f9fafb'
                }}
              />
              <button
                onClick={handleRemoveImage}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#ef4444',
                  background: 'transparent',
                  border: '1px solid #ef4444',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#ef4444'
                  e.currentTarget.style.color = '#ffffff'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#ef4444'
                }}
              >
                Remove Image
              </button>
            </div>

            {/* Image Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Scale Control */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                  Size: {imageScale.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.3"
                  max="2.0"
                  step="0.1"
                  value={imageScale}
                  onChange={(e) => setImageScale(parseFloat(e.target.value))}
                  style={{
                    width: '100%',
                    cursor: 'pointer',
                  }}
                />
              </div>

              {/* Position Y Control */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                  Position: {imagePositionY.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="-0.8"
                  max="0.8"
                  step="0.1"
                  value={imagePositionY}
                  onChange={(e) => setImagePositionY(parseFloat(e.target.value))}
                  style={{
                    width: '100%',
                    cursor: 'pointer',
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
