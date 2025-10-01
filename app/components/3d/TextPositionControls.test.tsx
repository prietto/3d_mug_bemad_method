import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import TextPositionControls, { TextPosition } from './TextPositionControls'

describe('TextPositionControls', () => {
  const mockOnPositionChange = vi.fn()
  const defaultPosition: TextPosition = { x: 0, y: 0, z: 0 }
  
  beforeEach(() => {
    mockOnPositionChange.mockClear()
  })

  it('renders with default position', () => {
    render(<TextPositionControls position={defaultPosition} onPositionChange={mockOnPositionChange} />)
    
    expect(screen.getByText('Text Position')).toBeInTheDocument()
    expect(screen.getByText('X: 0.00')).toBeInTheDocument()
    expect(screen.getByText('Y: 0.00')).toBeInTheDocument()
    expect(screen.getByText('0.00')).toBeInTheDocument() // Z position
    expect(screen.getByText('Position: (0.00, 0.00, 0.00)')).toBeInTheDocument()
  })

  it('displays current position values correctly', () => {
    const position: TextPosition = { x: 1.25, y: -0.5, z: 0.75 }
    render(<TextPositionControls position={position} onPositionChange={mockOnPositionChange} />)
    
    expect(screen.getByText('X: 1.25')).toBeInTheDocument()
    expect(screen.getByText('Y: -0.50')).toBeInTheDocument()
    expect(screen.getByText('0.75')).toBeInTheDocument()
    expect(screen.getByText('Position: (1.25, -0.50, 0.75)')).toBeInTheDocument()
  })

  it('has proper accessibility labels', () => {
    render(<TextPositionControls position={defaultPosition} onPositionChange={mockOnPositionChange} />)
    
    expect(screen.getByRole('button', { name: /move text up/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /move text down/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /move text left/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /move text right/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /move text forward/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /move text backward/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reset text position/i })).toBeInTheDocument()
  })

  it('handles Y-axis movement correctly', () => {
    render(<TextPositionControls position={defaultPosition} onPositionChange={mockOnPositionChange} />)
    
    const upButton = screen.getByRole('button', { name: /move text up/i })
    const downButton = screen.getByRole('button', { name: /move text down/i })
    
    fireEvent.click(upButton)
    expect(mockOnPositionChange).toHaveBeenCalledWith({ x: 0, y: 0.1, z: 0 })
    
    mockOnPositionChange.mockClear()
    fireEvent.click(downButton)
    expect(mockOnPositionChange).toHaveBeenCalledWith({ x: 0, y: -0.1, z: 0 })
  })

  it('handles X-axis movement correctly', () => {
    render(<TextPositionControls position={defaultPosition} onPositionChange={mockOnPositionChange} />)
    
    const leftButton = screen.getByRole('button', { name: /move text left/i })
    const rightButton = screen.getByRole('button', { name: /move text right/i })
    
    fireEvent.click(leftButton)
    expect(mockOnPositionChange).toHaveBeenCalledWith({ x: -0.1, y: 0, z: 0 })
    
    mockOnPositionChange.mockClear()
    fireEvent.click(rightButton)
    expect(mockOnPositionChange).toHaveBeenCalledWith({ x: 0.1, y: 0, z: 0 })
  })

  it('handles Z-axis movement correctly', () => {
    render(<TextPositionControls position={defaultPosition} onPositionChange={mockOnPositionChange} />)
    
    const forwardButton = screen.getByRole('button', { name: /move text forward/i })
    const backwardButton = screen.getByRole('button', { name: /move text backward/i })
    
    fireEvent.click(forwardButton)
    expect(mockOnPositionChange).toHaveBeenCalledWith({ x: 0, y: 0, z: 0.1 })
    
    mockOnPositionChange.mockClear()
    fireEvent.click(backwardButton)
    expect(mockOnPositionChange).toHaveBeenCalledWith({ x: 0, y: 0, z: -0.1 })
  })

  it('uses custom step value', () => {
    render(<TextPositionControls position={defaultPosition} onPositionChange={mockOnPositionChange} step={0.5} />)
    
    const upButton = screen.getByRole('button', { name: /move text up/i })
    fireEvent.click(upButton)
    
    expect(mockOnPositionChange).toHaveBeenCalledWith({ x: 0, y: 0.5, z: 0 })
  })

  it('resets position to origin when reset button is clicked', () => {
    const position: TextPosition = { x: 1.5, y: -2.3, z: 0.8 }
    render(<TextPositionControls position={position} onPositionChange={mockOnPositionChange} />)
    
    const resetButton = screen.getByRole('button', { name: /reset text position/i })
    fireEvent.click(resetButton)
    
    expect(mockOnPositionChange).toHaveBeenCalledWith({ x: 0, y: 0, z: 0 })
  })

  it('rounds position values to 2 decimal places', () => {
    const position: TextPosition = { x: 0.333333, y: 0, z: 0 }
    render(<TextPositionControls position={position} onPositionChange={mockOnPositionChange} />)
    
    const rightButton = screen.getByRole('button', { name: /move text right/i })
    fireEvent.click(rightButton)
    
    expect(mockOnPositionChange).toHaveBeenCalledWith({ x: 0.43, y: 0, z: 0 })
  })

  it('has minimum touch target sizes', () => {
    render(<TextPositionControls position={defaultPosition} onPositionChange={mockOnPositionChange} />)
    
    const arrowButtons = [
      screen.getByRole('button', { name: /move text up/i }),
      screen.getByRole('button', { name: /move text down/i }),
      screen.getByRole('button', { name: /move text left/i }),
      screen.getByRole('button', { name: /move text right/i })
    ]
    
    arrowButtons.forEach(button => {
      expect(button).toHaveClass('min-w-[44px]', 'min-h-[44px]')
    })
  })

  it('applies custom className', () => {
    const { container } = render(
      <TextPositionControls 
        position={defaultPosition} 
        onPositionChange={mockOnPositionChange}
        className="custom-class"
      />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('handles multiple rapid clicks correctly', () => {
    render(<TextPositionControls position={defaultPosition} onPositionChange={mockOnPositionChange} />)
    
    const upButton = screen.getByRole('button', { name: /move text up/i })
    
    fireEvent.click(upButton)
    fireEvent.click(upButton)
    fireEvent.click(upButton)
    
    expect(mockOnPositionChange).toHaveBeenCalledTimes(3)
    expect(mockOnPositionChange).toHaveBeenNthCalledWith(1, { x: 0, y: 0.1, z: 0 })
    expect(mockOnPositionChange).toHaveBeenNthCalledWith(2, { x: 0, y: 0.1, z: 0 })
    expect(mockOnPositionChange).toHaveBeenNthCalledWith(3, { x: 0, y: 0.1, z: 0 })
  })

  it('updates from non-zero position correctly', () => {
    const position: TextPosition = { x: 0.5, y: -0.3, z: 0.2 }
    render(<TextPositionControls position={position} onPositionChange={mockOnPositionChange} />)
    
    const upButton = screen.getByRole('button', { name: /move text up/i })
    fireEvent.click(upButton)
    
    expect(mockOnPositionChange).toHaveBeenCalledWith({ x: 0.5, y: -0.2, z: 0.2 })
  })

  it('displays reset button with proper styling', () => {
    render(<TextPositionControls position={defaultPosition} onPositionChange={mockOnPositionChange} />)
    
    const resetButton = screen.getByRole('button', { name: /reset text position/i })
    expect(resetButton).toHaveClass('min-h-[32px]')
    expect(screen.getByText('Reset')).toBeInTheDocument()
  })

  it('shows depth controls with proper layout', () => {
    render(<TextPositionControls position={defaultPosition} onPositionChange={mockOnPositionChange} />)
    
    expect(screen.getByText('Depth')).toBeInTheDocument()
    
    const depthButtons = [
      screen.getByRole('button', { name: /move text forward/i }),
      screen.getByRole('button', { name: /move text backward/i })
    ]
    
    depthButtons.forEach(button => {
      expect(button).toHaveClass('min-h-[32px]')
    })
  })
})
