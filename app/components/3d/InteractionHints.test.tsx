import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import InteractionHints from './InteractionHints'
import { useDesignStore } from './store/designStore'

// Mock the design store
vi.mock('./store/designStore', () => ({
  useDesignStore: vi.fn()
}))

const mockUseDesignStore = vi.mocked(useDesignStore)

describe('InteractionHints', () => {
  beforeEach(() => {
    mockUseDesignStore.mockReturnValue({
      interaction: {
        isDragging: false,
        isZooming: false,
        lastPointerPosition: null,
        lastInteractionTime: Date.now()
      },
      currentDesign: {
        id: 'test-design',
        mugColor: '#ffffff',
        customText: '',
        uploadedImageUrl: '',
        textFont: 'Arial',
        textPosition: '{"x":0,"y":0,"z":0}',
        textSize: 1.0,
        textColor: '#000000',
        createdAt: '2023-01-01T00:00:00.000Z',
        lastModified: '2023-01-01T00:00:00.000Z',
        isComplete: false
      }
    } as any)
  })

  it('renders rotation hint when user has not interacted', () => {
    render(<InteractionHints />)
    
    expect(screen.getByText(/Drag to rotate • Scroll to zoom/)).toBeInTheDocument()
  })

  it('renders customization hint when design is default', () => {
    render(<InteractionHints />)
    
    expect(screen.getByText(/Use the controls to customize your mug/)).toBeInTheDocument()
  })

  it('hides rotation hint when user is dragging', () => {
    mockUseDesignStore.mockReturnValue({
      interaction: {
        isDragging: true,
        isZooming: false,
        lastPointerPosition: { x: 100, y: 100 },
        lastInteractionTime: Date.now()
      },
      currentDesign: {
        id: 'test-design',
        mugColor: '#ffffff',
        customText: '',
        uploadedImageUrl: '',
        textFont: 'Arial',
        textPosition: '{"x":0,"y":0,"z":0}',
        textSize: 1.0,
        textColor: '#000000',
        createdAt: '2023-01-01T00:00:00.000Z',
        lastModified: '2023-01-01T00:00:00.000Z',
        isComplete: false
      }
    } as any)

    render(<InteractionHints />)
    
    expect(screen.queryByText(/Drag to rotate • Scroll to zoom/)).not.toBeInTheDocument()
  })

  it('hides customization hint when design has been modified', () => {
    mockUseDesignStore.mockReturnValue({
      interaction: {
        isDragging: false,
        isZooming: false,
        lastPointerPosition: null,
        lastInteractionTime: Date.now()
      },
      currentDesign: {
        id: 'test-design',
        mugColor: '#ff0000', // Modified color
        customText: '',
        uploadedImageUrl: '',
        textFont: 'Arial',
        textPosition: '{"x":0,"y":0,"z":0}',
        textSize: 1.0,
        textColor: '#000000',
        createdAt: '2023-01-01T00:00:00.000Z',
        lastModified: '2023-01-01T00:00:00.000Z',
        isComplete: false
      }
    } as any)

    render(<InteractionHints />)
    
    expect(screen.queryByText(/Use the controls to customize your mug/)).not.toBeInTheDocument()
  })

  it('shows interactive area indicators', () => {
    render(<InteractionHints />)
    
    // Check for the circular interaction area
    const interactionArea = document.querySelector('.w-64.h-64.rounded-full')
    expect(interactionArea).toBeInTheDocument()
  })

  it('shows cursor indicators when text is present', () => {
    mockUseDesignStore.mockReturnValue({
      interaction: {
        isDragging: false,
        isZooming: false,
        lastPointerPosition: null,
        lastInteractionTime: Date.now()
      },
      currentDesign: {
        id: 'test-design',
        mugColor: '#ffffff',
        customText: 'Test text',
        uploadedImageUrl: '',
        textFont: 'Arial',
        textPosition: '{"x":0,"y":0,"z":0}',
        textSize: 1.0,
        textColor: '#000000',
        createdAt: '2023-01-01T00:00:00.000Z',
        lastModified: '2023-01-01T00:00:00.000Z',
        isComplete: false
      }
    } as any)

    render(<InteractionHints />)
    
    // Check for cursor indicator (animate-ping element)
    const cursorIndicator = document.querySelector('.animate-ping')
    expect(cursorIndicator).toBeInTheDocument()
  })

  it('respects showHints prop', () => {
    render(<InteractionHints showHints={false} />)
    
    expect(screen.queryByText(/Drag to rotate • Scroll to zoom/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Use the controls to customize your mug/)).not.toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<InteractionHints className="custom-class" />)
    
    expect(container.firstChild).toHaveClass('custom-class')
  })
})
