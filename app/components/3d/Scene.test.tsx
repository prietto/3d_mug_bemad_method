import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import Scene from './Scene'

// Mock Three.js and React Three Fiber
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children, onCreated }: { children: React.ReactNode; onCreated?: Function }) => {
    // Simulate successful WebGL context creation
    if (onCreated) {
      onCreated({
        gl: {
          domElement: {
            addEventListener: vi.fn(),
            removeEventListener: vi.fn()
          }
        }
      })
    }
    return <div data-testid="three-canvas">{children}</div>
  },
  useFrame: vi.fn()
}))

vi.mock('@react-three/drei', () => ({
  Environment: () => <div data-testid="environment" />
}))

vi.mock('./MugModel', () => ({
  default: () => <div data-testid="mug-model" />
}))

vi.mock('./Controls', () => ({
  default: () => <div data-testid="controls" />
}))

vi.mock('./store/designStore', () => ({
  useDesignStore: () => ({
    setLoading: vi.fn(),
    setError: vi.fn(),
    updatePerformance: vi.fn()
  })
}))

describe('Scene', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock WebGL support
    const mockGetContext = vi.fn(() => ({
      getParameter: vi.fn(),
      getExtension: vi.fn()
    }))
    HTMLCanvasElement.prototype.getContext = mockGetContext as any
  })

  it('renders the 3D scene with all components', () => {
    render(<Scene />)
    
    expect(screen.getByTestId('three-canvas')).toBeInTheDocument()
    expect(screen.getByTestId('environment')).toBeInTheDocument()
    expect(screen.getByTestId('mug-model')).toBeInTheDocument()
    expect(screen.getByTestId('controls')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<Scene className="custom-class" />)
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('shows error fallback when WebGL is not supported', () => {
    // Mock WebGL as not supported
    HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as any
    
    render(<Scene />)
    
    expect(screen.getByText('3D Viewer Unavailable')).toBeInTheDocument()
    expect(screen.getByText('Your browser doesn\'t support WebGL or 3D graphics.')).toBeInTheDocument()
    expect(screen.getByText('Static Mug Preview')).toBeInTheDocument()
  })

  it('handles WebGL context creation errors gracefully', () => {
    // Mock WebGL context creation to throw an error
    HTMLCanvasElement.prototype.getContext = vi.fn(() => {
      throw new Error('WebGL not available')
    }) as any
    
    render(<Scene />)
    
    expect(screen.getByText('3D Viewer Unavailable')).toBeInTheDocument()
  })
})
