import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import TextSizeControls from './TextSizeControls'

describe('TextSizeControls', () => {
  const mockOnSizeChange = vi.fn()
  
  beforeEach(() => {
    mockOnSizeChange.mockClear()
  })

  it('renders with default props', () => {
    render(<TextSizeControls size={1.0} onSizeChange={mockOnSizeChange} />)
    
    expect(screen.getByText('Text Size')).toBeInTheDocument()
    expect(screen.getByText('1.0×')).toBeInTheDocument()
    expect(screen.getAllByText('Medium')[0]).toBeInTheDocument()
    expect(screen.getByText('Sample Text')).toBeInTheDocument()
  })

  it('displays size labels correctly', () => {
    const { rerender } = render(<TextSizeControls size={0.5} onSizeChange={mockOnSizeChange} />)
    expect(screen.getAllByText('Small')[0]).toBeInTheDocument()

    rerender(<TextSizeControls size={1.0} onSizeChange={mockOnSizeChange} />)
    expect(screen.getAllByText('Medium')[0]).toBeInTheDocument()

    rerender(<TextSizeControls size={1.5} onSizeChange={mockOnSizeChange} />)
    expect(screen.getByText('Large')).toBeInTheDocument()

    rerender(<TextSizeControls size={2.5} onSizeChange={mockOnSizeChange} />)
    expect(screen.getByText('Extra Large')).toBeInTheDocument()
  })

  it('handles increase button click', () => {
    render(<TextSizeControls size={1.0} onSizeChange={mockOnSizeChange} />)
    
    const increaseButton = screen.getByRole('button', { name: /increase text size/i })
    fireEvent.click(increaseButton)
    
    expect(mockOnSizeChange).toHaveBeenCalledWith(1.1)
  })

  it('handles decrease button click', () => {
    render(<TextSizeControls size={1.0} onSizeChange={mockOnSizeChange} />)
    
    const decreaseButton = screen.getByRole('button', { name: /decrease text size/i })
    fireEvent.click(decreaseButton)
    
    expect(mockOnSizeChange).toHaveBeenCalledWith(0.9)
  })

  it('disables decrease button at minimum size', () => {
    render(<TextSizeControls size={0.5} onSizeChange={mockOnSizeChange} min={0.5} />)
    
    const decreaseButton = screen.getByRole('button', { name: /decrease text size/i })
    expect(decreaseButton).toBeDisabled()
    expect(decreaseButton).toHaveClass('cursor-not-allowed')
  })

  it('disables increase button at maximum size', () => {
    render(<TextSizeControls size={3.0} onSizeChange={mockOnSizeChange} max={3.0} />)
    
    const increaseButton = screen.getByRole('button', { name: /increase text size/i })
    expect(increaseButton).toBeDisabled()
    expect(increaseButton).toHaveClass('cursor-not-allowed')
  })

  it('handles slider changes', () => {
    render(<TextSizeControls size={1.0} onSizeChange={mockOnSizeChange} />)
    
    const slider = screen.getByRole('slider', { name: /text size slider/i })
    fireEvent.change(slider, { target: { value: '1.5' } })
    
    expect(mockOnSizeChange).toHaveBeenCalledWith(1.5)
  })

  it('uses custom min, max, and step values', () => {
    render(
      <TextSizeControls 
        size={2.0} 
        onSizeChange={mockOnSizeChange} 
        min={1.0}
        max={4.0}
        step={0.5}
      />
    )
    
    const slider = screen.getByRole('slider')
    expect(slider).toHaveAttribute('min', '1')
    expect(slider).toHaveAttribute('max', '4')
    expect(slider).toHaveAttribute('step', '0.5')
    
    const increaseButton = screen.getByRole('button', { name: /increase text size/i })
    fireEvent.click(increaseButton)
    
    expect(mockOnSizeChange).toHaveBeenCalledWith(2.5)
  })

  it('respects minimum boundary when decreasing', () => {
    render(<TextSizeControls size={0.6} onSizeChange={mockOnSizeChange} min={0.5} />)
    
    const decreaseButton = screen.getByRole('button', { name: /decrease text size/i })
    fireEvent.click(decreaseButton)
    
    expect(mockOnSizeChange).toHaveBeenCalledWith(0.5)
  })

  it('respects maximum boundary when increasing', () => {
    render(<TextSizeControls size={2.9} onSizeChange={mockOnSizeChange} max={3.0} />)
    
    const increaseButton = screen.getByRole('button', { name: /increase text size/i })
    fireEvent.click(increaseButton)
    
    expect(mockOnSizeChange).toHaveBeenCalledWith(3.0)
  })

  it('has proper accessibility attributes on slider', () => {
    render(<TextSizeControls size={1.5} onSizeChange={mockOnSizeChange} />)
    
    const slider = screen.getByRole('slider')
    expect(slider).toHaveAttribute('aria-label', 'Text size slider')
    expect(slider).toHaveAttribute('aria-valuemin', '0.5')
    expect(slider).toHaveAttribute('aria-valuemax', '3')
    expect(slider).toHaveAttribute('aria-valuenow', '1.5')
    expect(slider).toHaveAttribute('aria-valuetext', '1.5 times normal size, Large')
  })

  it('has proper accessibility attributes on buttons', () => {
    render(<TextSizeControls size={1.0} onSizeChange={mockOnSizeChange} />)
    
    const increaseButton = screen.getByRole('button', { name: /increase text size/i })
    const decreaseButton = screen.getByRole('button', { name: /decrease text size/i })
    
    expect(increaseButton).toHaveAttribute('aria-label', 'Increase text size')
    expect(decreaseButton).toHaveAttribute('aria-label', 'Decrease text size')
    expect(increaseButton).toHaveAttribute('aria-disabled', 'false')
    expect(decreaseButton).toHaveAttribute('aria-disabled', 'false')
  })

  it('rounds size values to one decimal place', () => {
    render(<TextSizeControls size={1.33333} onSizeChange={mockOnSizeChange} />)
    
    const increaseButton = screen.getByRole('button', { name: /increase text size/i })
    fireEvent.click(increaseButton)
    
    expect(mockOnSizeChange).toHaveBeenCalledWith(1.4)
  })

  it('applies custom className', () => {
    const { container } = render(
      <TextSizeControls 
        size={1.0} 
        onSizeChange={mockOnSizeChange} 
        className="custom-class"
      />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('shows preview text with appropriate size', () => {
    render(<TextSizeControls size={2.0} onSizeChange={mockOnSizeChange} />)
    
    const preview = screen.getByText('Sample Text')
    expect(preview).toBeInTheDocument()
    // Preview should scale with the size value
  })

  it('handles multiple rapid button clicks', () => {
    render(<TextSizeControls size={1.0} onSizeChange={mockOnSizeChange} />)
    
    const increaseButton = screen.getByRole('button', { name: /increase text size/i })
    
    fireEvent.click(increaseButton)
    fireEvent.click(increaseButton)
    fireEvent.click(increaseButton)
    
    expect(mockOnSizeChange).toHaveBeenCalledTimes(3)
    expect(mockOnSizeChange).toHaveBeenNthCalledWith(1, 1.1)
    expect(mockOnSizeChange).toHaveBeenNthCalledWith(2, 1.1)
    expect(mockOnSizeChange).toHaveBeenNthCalledWith(3, 1.1)
  })

  it('shows correct scale reference labels', () => {
    render(<TextSizeControls size={1.0} onSizeChange={mockOnSizeChange} />)
    
    expect(screen.getAllByText('Small')[1]).toBeInTheDocument()
    expect(screen.getAllByText('Medium')[1]).toBeInTheDocument()
    expect(screen.getByText('Large')).toBeInTheDocument()
    expect(screen.getByText('XL')).toBeInTheDocument()
  })

  it('displays current size value prominently', () => {
    render(<TextSizeControls size={1.7} onSizeChange={mockOnSizeChange} />)
    
    const sizeDisplay = screen.getByText('1.7×')
    expect(sizeDisplay).toHaveClass('text-2xl', 'font-bold')
  })

  it('handles edge case slider values', () => {
    render(<TextSizeControls size={1.0} onSizeChange={mockOnSizeChange} />)
    
    const slider = screen.getByRole('slider')
    
    // Test minimum value
    fireEvent.change(slider, { target: { value: '0.5' } })
    expect(mockOnSizeChange).toHaveBeenCalledWith(0.5)
    
    mockOnSizeChange.mockClear()
    
    // Test maximum value
    fireEvent.change(slider, { target: { value: '3.0' } })
    expect(mockOnSizeChange).toHaveBeenCalledWith(3.0)
  })

  it('maintains button styling based on state', () => {
    const { rerender } = render(<TextSizeControls size={0.5} onSizeChange={mockOnSizeChange} min={0.5} />)
    
    const decreaseButton = screen.getByRole('button', { name: /decrease text size/i })
    expect(decreaseButton).toHaveClass('cursor-not-allowed', 'text-gray-400')
    
    rerender(<TextSizeControls size={1.0} onSizeChange={mockOnSizeChange} min={0.5} />)
    expect(decreaseButton).not.toHaveClass('cursor-not-allowed')
    expect(decreaseButton).toHaveClass('hover:border-gray-400')
  })
})
