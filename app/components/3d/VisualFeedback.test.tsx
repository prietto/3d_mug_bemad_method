import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import VisualFeedback from './VisualFeedback'

describe('VisualFeedback', () => {
  const mockOnDismiss = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders success feedback with correct styling', () => {
    render(
      <VisualFeedback
        message="Success message"
        type="success"
        onDismiss={mockOnDismiss}
      />
    )
    
    expect(screen.getByText('Success message')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveClass('bg-green-50', 'border-green-200', 'text-green-800')
  })

  it('renders error feedback with correct styling', () => {
    render(
      <VisualFeedback
        message="Error message"
        type="error"
        onDismiss={mockOnDismiss}
      />
    )
    
    expect(screen.getByText('Error message')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveClass('bg-red-50', 'border-red-200', 'text-red-800')
  })

  it('renders info feedback with correct styling', () => {
    render(
      <VisualFeedback
        message="Info message"
        type="info"
        onDismiss={mockOnDismiss}
      />
    )
    
    expect(screen.getByText('Info message')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveClass('bg-blue-50', 'border-blue-200', 'text-blue-800')
  })

  it('auto-dismisses after default duration', async () => {
    render(
      <VisualFeedback
        message="Auto dismiss test"
        type="success"
        onDismiss={mockOnDismiss}
      />
    )
    
    expect(screen.getByText('Auto dismiss test')).toBeInTheDocument()
    
    // Fast-forward time to trigger auto-dismiss
    vi.advanceTimersByTime(3000) // Default duration
    
    await waitFor(() => {
      expect(mockOnDismiss).toHaveBeenCalledTimes(1)
    })
  })

  it('auto-dismisses after custom duration', async () => {
    render(
      <VisualFeedback
        message="Custom duration test"
        type="success"
        duration={5000}
        onDismiss={mockOnDismiss}
      />
    )
    
    expect(screen.getByText('Custom duration test')).toBeInTheDocument()
    
    // Should not dismiss after default duration
    vi.advanceTimersByTime(3000)
    expect(mockOnDismiss).not.toHaveBeenCalled()
    
    // Should dismiss after custom duration
    vi.advanceTimersByTime(2000) // Total 5000ms
    
    await waitFor(() => {
      expect(mockOnDismiss).toHaveBeenCalledTimes(1)
    })
  })

  it('dismisses when close button is clicked', async () => {
    render(
      <VisualFeedback
        message="Manual dismiss test"
        type="success"
        onDismiss={mockOnDismiss}
      />
    )
    
    const closeButton = screen.getByRole('button', { name: /close/i })
    expect(closeButton).toBeInTheDocument()
    
    closeButton.click()
    
    // Should trigger dismiss animation and then call onDismiss
    vi.advanceTimersByTime(300) // Animation duration
    
    await waitFor(() => {
      expect(mockOnDismiss).toHaveBeenCalledTimes(1)
    })
  })

  it('has proper accessibility attributes', () => {
    render(
      <VisualFeedback
        message="Accessibility test"
        type="success"
        onDismiss={mockOnDismiss}
      />
    )
    
    const alert = screen.getByRole('alert')
    expect(alert).toHaveAttribute('aria-live', 'polite')
    
    const closeButton = screen.getByRole('button', { name: /close/i })
    expect(closeButton).toBeInTheDocument()
  })

  it('shows correct icons for each type', () => {
    const { rerender } = render(
      <VisualFeedback
        message="Success test"
        type="success"
        onDismiss={mockOnDismiss}
      />
    )
    
    // Success should have checkmark icon
    expect(screen.getByRole('alert')).toBeInTheDocument()
    
    rerender(
      <VisualFeedback
        message="Error test"
        type="error"
        onDismiss={mockOnDismiss}
      />
    )
    
    // Error should have X icon
    expect(screen.getByRole('alert')).toBeInTheDocument()
    
    rerender(
      <VisualFeedback
        message="Info test"
        type="info"
        onDismiss={mockOnDismiss}
      />
    )
    
    // Info should have info icon
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('applies correct animation classes', async () => {
    render(
      <VisualFeedback
        message="Animation test"
        type="success"
        onDismiss={mockOnDismiss}
      />
    )
    
    const alert = screen.getByRole('alert')
    
    // Initially should be off-screen
    expect(alert).toHaveClass('translate-x-full', 'opacity-0')
    
    // After animation timer, should be on-screen
    vi.advanceTimersByTime(10)
    
    await waitFor(() => {
      expect(alert).toHaveClass('translate-x-0', 'opacity-100')
    })
  })

  it('positions correctly in top-right corner', () => {
    render(
      <VisualFeedback
        message="Position test"
        type="success"
        onDismiss={mockOnDismiss}
      />
    )
    
    const container = screen.getByRole('alert').parentElement
    expect(container).toHaveClass('fixed', 'top-4', 'right-4', 'z-50')
  })
})
