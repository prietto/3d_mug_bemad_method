'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

export default function SimpleMugTest() {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: '600px', background: '#f3f4f6' }}>
      <Canvas camera={{ position: [3, 2, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />

        {/* Simple Mug Shape */}
        <group position={[0, 0, 0]}>
          {/* Mug body */}
          <mesh>
            <cylinderGeometry args={[1.2, 1.0, 2.5, 32]} />
            <meshStandardMaterial color="#3b82f6" />
          </mesh>

          {/* Handle */}
          <mesh position={[1.4, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.4, 0.15, 16, 32]} />
            <meshStandardMaterial color="#3b82f6" />
          </mesh>
        </group>

        <OrbitControls />
      </Canvas>
    </div>
  )
}
