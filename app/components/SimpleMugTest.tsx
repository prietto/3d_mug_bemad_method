'use client'

import { useState, useRef, useEffect } from 'react'
import { Canvas, extend } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Text } from 'troika-three-text'

// Extend R3F to recognize Text component
extend({ Text })

interface MugProps {
  color: string
  text: string
  textColor: string
  textSize: number
}

function Mug({ color, text, textColor, textSize }: MugProps) {
  const textRef = useRef<Text>(null)

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

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '600px', background: '#f3f4f6', display: 'flex', flexDirection: 'column' }}>
      {/* 3D Canvas */}
      <div style={{ flex: 1, minHeight: '400px' }}>
        <Canvas camera={{ position: [3, 2, 5], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <Mug color={mugColor} text={customText} textColor={textColor} textSize={textSize} />
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
    </div>
  )
}
