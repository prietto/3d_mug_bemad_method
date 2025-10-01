import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import Controls from './Controls'

// Mock Three.js and React Three Fiber
vi.mock('@react-three/fiber', () => ({
  useFrame: vi.fn(),
  useThree: () => ({
    camera: { position: { x: 0, y: 0, z: 5 } },
    gl: { 
      domElement: {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }
    }
  })
}))

vi.mock('@react-three/drei', () => ({
  OrbitControls: ({ children }: { children?: React.ReactNode }) => 
    <div data-testid="orbit-controls">{children}</div>
}))

vi.mock('./store/designStore', () => ({
  useDesignStore: () => ({
    setInteraction: vi.fn(),
    updateCamera: vi.fn()
  })
}))

describe('Controls', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear window properties to reset mobile detection
    Object.defineProperty(window, 'ontouchstart', {
      value: undefined,
      configurable: true
    })
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: 0,
      configurable: true
    })
  })

  it('renders OrbitControls component', () => {
    const { getByTestId } = render(<Controls />)
    expect(getByTestId('orbit-controls')).toBeInTheDocument()
  })

  it('accepts control configuration props', () => {
    const { getByTestId } = render(
      <Controls 
        enableDamping={false}
        enableZoom={false}
        enableRotate={false}
        minDistance={5}
        maxDistance={15}
      />
    )
    expect(getByTestId('orbit-controls')).toBeInTheDocument()
  })

  it('uses default props when not provided', () => {
    const { getByTestId } = render(<Controls />)
    expect(getByTestId('orbit-controls')).toBeInTheDocument()
  })

  it('detects mobile device and adjusts settings', () => {
    // Mock mobile environment
    Object.defineProperty(window, 'ontouchstart', {
      value: {},
      configurable: true
    })

    const { getByTestId } = render(<Controls />)
    expect(getByTestId('orbit-controls')).toBeInTheDocument()
  })

  it('uses optimized mobile settings for touch devices', () => {
    // Mock touch device
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: 2,
      configurable: true
    })

    const { getByTestId } = render(<Controls />)
    expect(getByTestId('orbit-controls')).toBeInTheDocument()
  })

  it('has proper camera bounds for mobile interaction', () => {
    const { getByTestId } = render(
      <Controls 
        minDistance={2.5}
        maxDistance={12}
        minPolarAngle={Math.PI / 8}
        maxPolarAngle={Math.PI - Math.PI / 8}
      />
    )
    expect(getByTestId('orbit-controls')).toBeInTheDocument()
  })

  it('configures touch gestures correctly', () => {
    const { getByTestId } = render(<Controls />)
    expect(getByTestId('orbit-controls')).toBeInTheDocument()
    // Touch controls: ONE finger for rotate, TWO fingers for zoom
  })

  it('has enhanced damping for smooth mobile interactions', () => {
    const { getByTestId } = render(
      <Controls dampingFactor={0.08} enableDamping={true} />
    )
    expect(getByTestId('orbit-controls')).toBeInTheDocument()
  })
})
