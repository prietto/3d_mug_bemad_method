import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Canvas } from '@react-three/fiber'
import ResetButton from './ResetButton'
import { useDesignStore } from './store/designStore'

// Mock the design store
vi.mock('./store/designStore', () => ({
  useDesignStore: vi.fn()
}))

// Mock ResetConfirmationDialog
vi.mock('./ResetConfirmationDialog', () => ({
  default: ({ isOpen, onConfirm, onCancel, resetType }: any) => (
    isOpen ? (
      <div data-testid="reset-confirmation-dialog">
        <div>Reset {resetType}</div>
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    ) : null
  )
}))

// Mock VisualFeedback
vi.mock('./VisualFeedback', () => ({
  default: ({ message, type, onDismiss }: any) => (
    <div data-testid="visual-feedback" data-type={type}>
      {message}
      <button onClick={onDismiss}>Dismiss</button>
    </div>
  )
}))

// Mock Three.js for testing
vi.mock('three', () => ({
  Vector3: vi.fn().mockImplementation((x = 0, y = 0, z = 0) => ({
    x, y, z,
    clone: vi.fn().mockReturnThis(),
    lerpVectors: vi.fn()
  }))
}))

// Mock @react-three/fiber
vi.mock('@react-three/fiber', () => ({
  useThree: () => ({
    camera: {
      position: {
        clone: vi.fn().mockReturnValue({ x: 3, y: 2, z: 5 }),
        lerpVectors: vi.fn()
      }
    }
  })
}))

describe('ResetButton', () => {
  const mockResetCameraToDefault = vi.fn()
  const mockResetToDefault = vi.fn()
  const mockResetImage = vi.fn()
  const mockResetColor = vi.fn()
  const mockResetText = vi.fn()
  
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup store mock
    ;(useDesignStore as any).mockReturnValue({
      resetCameraToDefault: mockResetCameraToDefault,
      resetToDefault: mockResetToDefault,
      resetImage: mockResetImage,
      resetColor: mockResetColor,
      resetText: mockResetText,
      camera: {
        target: [0, 0, 0]
      }
    })
    
    // Mock requestAnimationFrame
    global.requestAnimationFrame = vi.fn((cb) => {
      cb(performance.now())
      return 1
    })
    global.cancelAnimationFrame = vi.fn()
  })

  it('renders reset button with default props', () => {
    render(<ResetButton />)
    
    const button = screen.getByRole('button', { name: /reset camera/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('title', 'Reset camera view')
  })

  it('applies correct size classes', () => {
    const { rerender } = render(<ResetButton size="sm" />)
    let button = screen.getByRole('button')
    expect(button).toHaveClass('w-8', 'h-8')

    rerender(<ResetButton size="lg" />)
    button = screen.getByRole('button')
    expect(button).toHaveClass('w-12', 'h-12')
  })

  it('applies correct variant classes', () => {
    const { rerender } = render(<ResetButton variant="primary" />)
    let button = screen.getByRole('button')
    expect(button).toHaveClass('bg-blue-600', 'text-white')

    rerender(<ResetButton variant="ghost" />)
    button = screen.getByRole('button')
    expect(button).toHaveClass('bg-black/20', 'text-white')
  })

  it('handles click and triggers camera reset animation', () => {
    render(<ResetButton />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(global.requestAnimationFrame).toHaveBeenCalled()
    expect(mockResetCameraToDefault).toHaveBeenCalled()
  })

  it('scales down on active state', () => {
    render(<ResetButton />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('active:scale-95')
  })

  it('has proper accessibility attributes', () => {
    render(<ResetButton />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Reset camera to default position')
    expect(button).toHaveAttribute('title', 'Reset camera view')
  })

  it('renders reset icon', () => {
    render(<ResetButton />)
    
    const svg = screen.getByRole('button').querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveClass('w-4', 'h-4')
  })

  it('applies custom className', () => {
    render(<ResetButton className="custom-class" />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  describe('Reset Types', () => {
    it('handles "all" reset type with confirmation', () => {
      render(<ResetButton resetType="all" showConfirmation={true} />)
      
      const button = screen.getByRole('button', { name: /reset all design customizations/i })
      expect(button).toHaveAttribute('title', 'Reset all customizations')
      
      fireEvent.click(button)
      expect(screen.getByTestId('reset-confirmation-dialog')).toBeInTheDocument()
      expect(screen.getByText('Reset all')).toBeInTheDocument()
    })

    it('handles "image" reset type', () => {
      render(<ResetButton resetType="image" />)
      
      const button = screen.getByRole('button', { name: /remove uploaded image/i })
      expect(button).toHaveAttribute('title', 'Remove image')
      
      fireEvent.click(button)
      expect(mockResetImage).toHaveBeenCalled()
      expect(screen.getByTestId('visual-feedback')).toBeInTheDocument()
    })

    it('handles "color" reset type', () => {
      render(<ResetButton resetType="color" />)
      
      const button = screen.getByRole('button', { name: /reset mug color to white/i })
      expect(button).toHaveAttribute('title', 'Reset color')
      
      fireEvent.click(button)
      expect(mockResetColor).toHaveBeenCalled()
      expect(screen.getByTestId('visual-feedback')).toBeInTheDocument()
    })

    it('handles "text" reset type', () => {
      render(<ResetButton resetType="text" />)
      
      const button = screen.getByRole('button', { name: /remove custom text/i })
      expect(button).toHaveAttribute('title', 'Remove text')
      
      fireEvent.click(button)
      expect(mockResetText).toHaveBeenCalled()
      expect(screen.getByTestId('visual-feedback')).toBeInTheDocument()
    })

    it('does not show confirmation dialog for camera reset', () => {
      render(<ResetButton resetType="camera" showConfirmation={true} />)
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      expect(screen.queryByTestId('reset-confirmation-dialog')).not.toBeInTheDocument()
    })
  })

  describe('Confirmation Dialog', () => {
    it('shows confirmation dialog when required', () => {
      render(<ResetButton resetType="all" showConfirmation={true} />)
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      expect(screen.getByTestId('reset-confirmation-dialog')).toBeInTheDocument()
    })

    it('performs reset when confirmed', () => {
      render(<ResetButton resetType="all" showConfirmation={true} />)
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      const confirmButton = screen.getByText('Confirm')
      fireEvent.click(confirmButton)
      
      expect(mockResetToDefault).toHaveBeenCalled()
    })

    it('cancels reset when cancelled', () => {
      render(<ResetButton resetType="all" showConfirmation={true} />)
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      const cancelButton = screen.getByText('Cancel')
      fireEvent.click(cancelButton)
      
      expect(mockResetToDefault).not.toHaveBeenCalled()
      expect(screen.queryByTestId('reset-confirmation-dialog')).not.toBeInTheDocument()
    })
  })

  describe('Visual Feedback', () => {
    it('shows success feedback after reset', () => {
      render(<ResetButton resetType="image" />)
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      const feedback = screen.getByTestId('visual-feedback')
      expect(feedback).toBeInTheDocument()
      expect(feedback).toHaveAttribute('data-type', 'success')
      expect(feedback).toHaveTextContent('Image removed successfully')
    })

    it('dismisses feedback when dismiss button is clicked', () => {
      render(<ResetButton resetType="color" />)
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      const dismissButton = screen.getByText('Dismiss')
      fireEvent.click(dismissButton)
      
      expect(screen.queryByTestId('visual-feedback')).not.toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('shows error feedback when reset fails', () => {
      // Mock resetImage to throw an error
      mockResetImage.mockImplementationOnce(() => {
        throw new Error('Reset failed')
      })
      
      render(<ResetButton resetType="image" />)
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      const feedback = screen.getByTestId('visual-feedback')
      expect(feedback).toHaveAttribute('data-type', 'error')
      expect(feedback).toHaveTextContent('Reset failed. Please try again.')
    })
  })
})
