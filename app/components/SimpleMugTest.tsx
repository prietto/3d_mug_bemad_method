'use client'

import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

function Mug({ color }: { color: string }) {
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
    </group>
  )
}

export default function SimpleMugTest() {
  const DEFAULT_COLOR = '#3b82f6'
  const [mugColor, setMugColor] = useState(DEFAULT_COLOR)

  const colors = [
    { name: 'Black', value: '#000000' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Green', value: '#10b981' },
    { name: 'White', value: '#ffffff' },
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
          <Mug color={mugColor} />
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
    </div>
  )
}
