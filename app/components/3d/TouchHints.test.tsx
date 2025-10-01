import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import TouchHints from './TouchHints'
import { useDesignStore } from './store/designStore'

// Mock the design store
vi.mock('./store/designStore', () => ({
  useDesignStore: vi.fn()
}))

describe('TouchHints', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders onboarding hints when showOnboarding is true', () => {
    ;(useDesignStore as any).mockReturnValue({
      interaction: {
        isDragging: false,
        isZooming: false
      }
    })

    render(<TouchHints showOnboarding={true} />)
    
    expect(screen.getByText('Explore the 3D Mug')).toBeInTheDocument()
    expect(screen.getByText('👆 Drag to rotate')).toBeInTheDocument()
    expect(screen.getByText('🤏 Pinch to zoom')).toBeInTheDocument()
  })

  it('does not render when showOnboarding is false and no interaction', () => {
    ;(useDesignStore as any).mockReturnValue({
      interaction: {
        isDragging: false,
        isZooming: false
      }
    })

    render(<TouchHints showOnboarding={false} />)
    
    expect(screen.queryByText('Explore the 3D Mug')).not.toBeInTheDocument()
  })

  it('shows rotation feedback during dragging', () => {
    ;(useDesignStore as any).mockReturnValue({
      interaction: {
        isDragging: true,
        isZooming: false
      }
    })

    render(<TouchHints />)
    
    expect(screen.getByText('🔄 Rotating')).toBeInTheDocument()
  })

  it('shows zoom feedback during zooming', () => {
    ;(useDesignStore as any).mockReturnValue({
      interaction: {
        isDragging: false,
        isZooming: true
      }
    })

    render(<TouchHints />)
    
    expect(screen.getByText('🔍 Zooming')).toBeInTheDocument()
  })

  it('shows interactive area boundary indicators', () => {
    ;(useDesignStore as any).mockReturnValue({
      interaction: {
        isDragging: false,
        isZooming: false
      }
    })

    render(<TouchHints showOnboarding={true} />)
    
    const boundary = document.querySelector('.border-dashed')
    expect(boundary).toBeInTheDocument()
    expect(boundary).toHaveClass('border-white/30')
  })

  it('shows corner indicators when hints are visible', () => {
    ;(useDesignStore as any).mockReturnValue({
      interaction: {
        isDragging: false,
        isZooming: false
      }
    })

    render(<TouchHints showOnboarding={true} />)
    
    const corners = document.querySelectorAll('.absolute[class*="w-4 h-4"]')
    expect(corners.length).toBeGreaterThan(0)
  })

  it('renders animated gesture indicators', () => {
    ;(useDesignStore as any).mockReturnValue({
      interaction: {
        isDragging: false,
        isZooming: false
      }
    })

    render(<TouchHints showOnboarding={true} />)
    
    const animatedElements = document.querySelectorAll('.animate-pulse')
    expect(animatedElements.length).toBeGreaterThan(0)
    
    const pingElements = document.querySelectorAll('.animate-ping')
    expect(pingElements.length).toBeGreaterThan(0)
  })

  it('hides hints after interaction with delay', () => {
    const mockStore = {
      interaction: {
        isDragging: false,
        isZooming: false
      }
    }
    
    ;(useDesignStore as any).mockReturnValue(mockStore)

    const { rerender } = render(<TouchHints showOnboarding={true} />)
    
    // Simulate interaction start
    mockStore.interaction.isDragging = true
    rerender(<TouchHints showOnboarding={true} />)
    
    // Simulate interaction end
    mockStore.interaction.isDragging = false
    rerender(<TouchHints showOnboarding={true} />)
    
    // Fast-forward time to trigger hiding
    vi.advanceTimersByTime(2000)
    
    expect(screen.queryByText('Explore the 3D Mug')).not.toBeInTheDocument()
  })

  it('applies custom className', () => {
    ;(useDesignStore as any).mockReturnValue({
      interaction: {
        isDragging: false,
        isZooming: false
      }
    })

    const { container } = render(<TouchHints showOnboarding={true} className="custom-class" />)
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('has pointer-events-none to not interfere with 3D interaction', () => {
    ;(useDesignStore as any).mockReturnValue({
      interaction: {
        isDragging: false,
        isZooming: false
      }
    })

    const { container } = render(<TouchHints showOnboarding={true} />)
    
    expect(container.firstChild).toHaveClass('pointer-events-none')
  })
})
