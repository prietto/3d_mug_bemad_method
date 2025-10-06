import { render, screen } from '@testing-library/react'
import SimpleMugTest from './SimpleMugTest'

// Mock Three.js and R3F
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="canvas">{children}</div>,
  extend: vi.fn(),
  useLoader: vi.fn(() => null),
}))

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => null,
  Environment: () => null,
}))

describe('SimpleMugTest', () => {
  it('renders mug color picker', () => {
    render(<SimpleMugTest />)
    expect(screen.getByText('Mug Color')).toBeInTheDocument()
  })

  it('renders custom text input', () => {
    render(<SimpleMugTest />)
    expect(screen.getByText('Custom Text')).toBeInTheDocument()
  })

  it('renders image upload section', () => {
    render(<SimpleMugTest />)
    expect(screen.getByText('Upload Image/Logo')).toBeInTheDocument()
  })

  it('renders reset button', () => {
    render(<SimpleMugTest />)
    expect(screen.getByText('Reset Color')).toBeInTheDocument()
  })

  it('renders without errors when no image is uploaded', () => {
    // This test verifies AC 1: Page loads successfully without runtime errors
    const { container } = render(<SimpleMugTest />)
    expect(container).toBeInTheDocument()
    // No console errors expected - Suspense handles null imageUrl gracefully
  })
})
