import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ImageCarousel, { type MultiViewImage } from './ImageCarousel'

const mockViews: MultiViewImage[] = [
  { angle: 'front', url: 'data:image/jpeg;base64,front', generatedAt: '2025-01-08T12:00:00Z' },
  { angle: 'side', url: 'data:image/jpeg;base64,side', generatedAt: '2025-01-08T12:00:03Z' },
  { angle: 'handle', url: 'data:image/jpeg;base64,handle', generatedAt: '2025-01-08T12:00:06Z' }
]

describe('ImageCarousel', () => {
  const mockOnNavigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(window as any).gtag = vi.fn()
  })

  it('renders with all views', () => {
    render(<ImageCarousel views={mockViews} currentIndex={0} onNavigate={mockOnNavigate} />)

    expect(screen.getByAltText(/Front View/i)).toBeInTheDocument()
  })

  it('displays current view label', () => {
    render(<ImageCarousel views={mockViews} currentIndex={0} onNavigate={mockOnNavigate} />)

    expect(screen.getByText('Front View')).toBeInTheDocument()
  })

  it('displays all thumbnails', () => {
    render(<ImageCarousel views={mockViews} currentIndex={0} onNavigate={mockOnNavigate} />)

    const thumbnails = screen.getAllByRole('button', { name: /View .*/i })
    expect(thumbnails.length).toBe(3)
  })

  it('highlights current thumbnail', () => {
    render(<ImageCarousel views={mockViews} currentIndex={1} onNavigate={mockOnNavigate} />)

    const sideThumbnail = screen.getByRole('button', { name: /View Side View/i })
    expect(sideThumbnail).toHaveClass('border-blue-500')
    expect(sideThumbnail).toHaveAttribute('aria-current', 'true')
  })

  it('calls onNavigate when next arrow is clicked', () => {
    render(<ImageCarousel views={mockViews} currentIndex={0} onNavigate={mockOnNavigate} />)

    const nextButton = screen.getByLabelText(/Next view/i)
    fireEvent.click(nextButton)

    expect(mockOnNavigate).toHaveBeenCalledWith(1)
  })

  it('calls onNavigate when previous arrow is clicked', () => {
    render(<ImageCarousel views={mockViews} currentIndex={1} onNavigate={mockOnNavigate} />)

    const prevButton = screen.getByLabelText(/Previous view/i)
    fireEvent.click(prevButton)

    expect(mockOnNavigate).toHaveBeenCalledWith(0)
  })

  it('disables previous arrow on first view', () => {
    render(<ImageCarousel views={mockViews} currentIndex={0} onNavigate={mockOnNavigate} />)

    const prevButton = screen.getByLabelText(/Previous view/i)
    expect(prevButton).toBeDisabled()
  })

  it('disables next arrow on last view', () => {
    render(<ImageCarousel views={mockViews} currentIndex={2} onNavigate={mockOnNavigate} />)

    const nextButton = screen.getByLabelText(/Next view/i)
    expect(nextButton).toBeDisabled()
  })

  it('calls onNavigate when thumbnail is clicked', () => {
    render(<ImageCarousel views={mockViews} currentIndex={0} onNavigate={mockOnNavigate} />)

    const handleThumbnail = screen.getByRole('button', { name: /View Handle Close-Up/i })
    fireEvent.click(handleThumbnail)

    expect(mockOnNavigate).toHaveBeenCalledWith(2)
  })

  it('does not call onNavigate when clicking current thumbnail', () => {
    render(<ImageCarousel views={mockViews} currentIndex={0} onNavigate={mockOnNavigate} />)

    const frontThumbnail = screen.getByRole('button', { name: /View Front View/i })
    fireEvent.click(frontThumbnail)

    expect(mockOnNavigate).not.toHaveBeenCalled()
  })

  it('displays dot indicators', () => {
    render(<ImageCarousel views={mockViews} currentIndex={0} onNavigate={mockOnNavigate} />)

    const dots = screen.getAllByRole('button', { name: /Go to .*/i })
    expect(dots.length).toBe(3)
  })

  it('highlights current dot indicator', () => {
    const { container } = render(<ImageCarousel views={mockViews} currentIndex={1} onNavigate={mockOnNavigate} />)

    const dots = container.querySelectorAll('.w-2.h-2')
    expect(dots[1]).toHaveClass('bg-blue-500')
    expect(dots[1]).toHaveClass('w-8') // Active dot is wider
  })

  it('displays keyboard navigation hint', () => {
    render(<ImageCarousel views={mockViews} currentIndex={0} onNavigate={mockOnNavigate} />)

    expect(screen.getByText(/Use arrow keys/i)).toBeInTheDocument()
    expect(screen.getByText(/1 of 3/i)).toBeInTheDocument()
  })

  it('handles keyboard navigation - ArrowRight', () => {
    render(<ImageCarousel views={mockViews} currentIndex={0} onNavigate={mockOnNavigate} />)

    fireEvent.keyDown(window, { key: 'ArrowRight' })

    expect(mockOnNavigate).toHaveBeenCalledWith(1)
  })

  it('handles keyboard navigation - ArrowLeft', () => {
    render(<ImageCarousel views={mockViews} currentIndex={1} onNavigate={mockOnNavigate} />)

    fireEvent.keyDown(window, { key: 'ArrowLeft' })

    expect(mockOnNavigate).toHaveBeenCalledWith(0)
  })

  it('handles keyboard navigation - Home key', () => {
    render(<ImageCarousel views={mockViews} currentIndex={2} onNavigate={mockOnNavigate} />)

    fireEvent.keyDown(window, { key: 'Home' })

    expect(mockOnNavigate).toHaveBeenCalledWith(0)
  })

  it('handles keyboard navigation - End key', () => {
    render(<ImageCarousel views={mockViews} currentIndex={0} onNavigate={mockOnNavigate} />)

    fireEvent.keyDown(window, { key: 'End' })

    expect(mockOnNavigate).toHaveBeenCalledWith(2)
  })

  it('does not navigate beyond first view with ArrowLeft', () => {
    render(<ImageCarousel views={mockViews} currentIndex={0} onNavigate={mockOnNavigate} />)

    fireEvent.keyDown(window, { key: 'ArrowLeft' })

    expect(mockOnNavigate).not.toHaveBeenCalled()
  })

  it('does not navigate beyond last view with ArrowRight', () => {
    render(<ImageCarousel views={mockViews} currentIndex={2} onNavigate={mockOnNavigate} />)

    fireEvent.keyDown(window, { key: 'ArrowRight' })

    expect(mockOnNavigate).not.toHaveBeenCalled()
  })

  it('tracks analytics event when navigating with arrows', () => {
    render(<ImageCarousel views={mockViews} currentIndex={0} onNavigate={mockOnNavigate} />)

    const nextButton = screen.getByLabelText(/Next view/i)
    fireEvent.click(nextButton)

    expect((window as any).gtag).toHaveBeenCalledWith('event', 'multi_view_navigation', {
      event_category: 'ai_generation',
      from_angle: 'front',
      to_angle: 'side',
      navigation_method: 'arrow'
    })
  })

  it('tracks analytics event when clicking thumbnail', () => {
    render(<ImageCarousel views={mockViews} currentIndex={0} onNavigate={mockOnNavigate} />)

    const handleThumbnail = screen.getByRole('button', { name: /View Handle Close-Up/i })
    fireEvent.click(handleThumbnail)

    expect((window as any).gtag).toHaveBeenCalledWith('event', 'multi_view_navigation', {
      event_category: 'ai_generation',
      from_angle: 'front',
      to_angle: 'handle',
      navigation_method: 'thumbnail'
    })
  })

  it('tracks analytics event for keyboard navigation', () => {
    render(<ImageCarousel views={mockViews} currentIndex={1} onNavigate={mockOnNavigate} />)

    fireEvent.keyDown(window, { key: 'Home' })

    expect((window as any).gtag).toHaveBeenCalledWith('event', 'multi_view_navigation', {
      event_category: 'ai_generation',
      from_angle: 'side',
      to_angle: 'front',
      navigation_method: 'keyboard'
    })
  })

  it('renders nothing when views array is empty', () => {
    const { container } = render(<ImageCarousel views={[]} currentIndex={0} onNavigate={mockOnNavigate} />)

    expect(container.firstChild).toBeNull()
  })

  it('applies custom className', () => {
    const customClass = 'custom-test-class'
    const { container } = render(
      <ImageCarousel views={mockViews} currentIndex={0} onNavigate={mockOnNavigate} className={customClass} />
    )

    expect(container.firstChild).toHaveClass(customClass)
  })

  it('updates view label when current index changes', () => {
    const { rerender } = render(<ImageCarousel views={mockViews} currentIndex={0} onNavigate={mockOnNavigate} />)

    expect(screen.getByText('Front View')).toBeInTheDocument()

    rerender(<ImageCarousel views={mockViews} currentIndex={1} onNavigate={mockOnNavigate} />)

    expect(screen.getByText('Side View')).toBeInTheDocument()
  })
})
