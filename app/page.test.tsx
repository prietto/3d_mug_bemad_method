import { render, screen } from '@testing-library/react'
import Home from './page'

// Mock the heavy lazy-loaded components
vi.mock('./components/MugDesigner', () => ({
  default: () => <div data-testid="mug-designer">Mug Designer Component</div>
}))

vi.mock('./components/LeadCaptureForm', () => ({
  default: () => <div data-testid="lead-form">Lead Capture Form Component</div>
}))

// Mock the layout components
vi.mock('./components/Navigation', () => ({
  default: () => <div data-testid="navigation">Navigation Component</div>
}))

vi.mock('./components/MinimalHeader', () => ({
  default: ({ tagline }: { tagline: string }) => (
    <div data-testid="minimal-header">{tagline}</div>
  )
}))

vi.mock('./components/SplitScreenLayout', () => ({
  default: ({ leftComponent, rightComponent }: { leftComponent: React.ReactNode, rightComponent: React.ReactNode }) => (
    <div data-testid="split-screen-layout">
      <div data-testid="left-panel">{leftComponent}</div>
      <div data-testid="right-panel">{rightComponent}</div>
    </div>
  )
}))

vi.mock('./components/Footer', () => ({
  default: () => <div data-testid="footer">Footer Component</div>
}))

// Mock analytics hook
vi.mock('@/lib/hooks/useAnalyticsIntegration', () => ({
  useAnalyticsIntegration: () => ({
    trackLeadCapture: vi.fn(),
  })
}))

describe('Home Page', () => {
  it('renders all main components in new layout', () => {
    render(<Home />)

    expect(screen.getByTestId('navigation')).toBeInTheDocument()
    expect(screen.getByTestId('minimal-header')).toBeInTheDocument()
    expect(screen.getByTestId('split-screen-layout')).toBeInTheDocument()
    expect(screen.getByTestId('footer')).toBeInTheDocument()
  })

  it('renders MinimalHeader with correct tagline', () => {
    render(<Home />)

    expect(screen.getByText('Design Your Perfect Mug in 3D Reality')).toBeInTheDocument()
  })

  it('renders SplitScreenLayout with MugDesigner and LeadCaptureForm', () => {
    render(<Home />)

    expect(screen.getByTestId('mug-designer')).toBeInTheDocument()
    expect(screen.getByTestId('lead-form')).toBeInTheDocument()
  })

  it('has proper page structure', () => {
    render(<Home />)

    const container = screen.getByTestId('navigation').parentElement
    expect(container).toHaveClass('min-h-screen', 'flex', 'flex-col')
  })

  it('has main content area with flex-grow', () => {
    render(<Home />)

    const main = screen.getByRole('main')
    expect(main).toHaveClass('flex-grow')
  })

  it('preserves Navigation and Footer in layout', () => {
    render(<Home />)

    const navigation = screen.getByTestId('navigation')
    const footer = screen.getByTestId('footer')

    // Navigation should be at top
    expect(navigation).toBeInTheDocument()
    // Footer should be at bottom
    expect(footer).toBeInTheDocument()
  })

  it('both designer and form are visible on initial page load', () => {
    render(<Home />)

    // Both components should be present in split-screen layout
    expect(screen.getByTestId('mug-designer')).toBeInTheDocument()
    expect(screen.getByTestId('lead-form')).toBeInTheDocument()

    // No modal state - both visible simultaneously
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})