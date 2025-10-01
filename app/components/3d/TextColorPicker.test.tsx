import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import TextColorPicker from './TextColorPicker'

describe('TextColorPicker', () => {
  const mockOnColorChange = vi.fn()
  
  beforeEach(() => {
    mockOnColorChange.mockClear()
  })

  it('renders with default colors', () => {
    render(
      <TextColorPicker 
        selectedColor="#000000" 
        mugColor="#ffffff" 
        onColorChange={mockOnColorChange} 
      />
    )
    
    expect(screen.getByText('Text Color')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /select auto text color/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /select black text color/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /select white text color/i })).toBeInTheDocument()
  })

  it('highlights selected color', () => {
    render(
      <TextColorPicker 
        selectedColor="#dc2626" 
        mugColor="#ffffff" 
        onColorChange={mockOnColorChange} 
      />
    )
    
    const selectedButton = screen.getByRole('button', { name: /select red text color/i })
    const unselectedButton = screen.getByRole('button', { name: /select blue text color/i })
    
    expect(selectedButton).toHaveClass('border-blue-500', 'bg-blue-50')
    expect(selectedButton).toHaveAttribute('aria-pressed', 'true')
    
    expect(unselectedButton).toHaveClass('border-gray-200', 'bg-white')
    expect(unselectedButton).toHaveAttribute('aria-pressed', 'false')
  })

  it('shows checkmark on selected color', () => {
    render(
      <TextColorPicker 
        selectedColor="#2563eb" 
        mugColor="#ffffff" 
        onColorChange={mockOnColorChange} 
      />
    )
    
    const selectedButton = screen.getByRole('button', { name: /select blue text color/i })
    const checkmark = selectedButton.querySelector('svg')
    
    expect(checkmark).toBeInTheDocument()
    expect(checkmark).toHaveClass('w-2', 'h-2', 'text-white')
  })

  it('calls onColorChange when color is selected', () => {
    render(
      <TextColorPicker 
        selectedColor="#000000" 
        mugColor="#ffffff" 
        onColorChange={mockOnColorChange} 
      />
    )
    
    const redButton = screen.getByRole('button', { name: /select red text color/i })
    fireEvent.click(redButton)
    
    expect(mockOnColorChange).toHaveBeenCalledWith('#dc2626')
  })

  it('handles auto color selection correctly', () => {
    render(
      <TextColorPicker 
        selectedColor="#000000" 
        mugColor="#ffffff" 
        onColorChange={mockOnColorChange} 
      />
    )
    
    const autoButton = screen.getByRole('button', { name: /select auto text color/i })
    fireEvent.click(autoButton)
    
    expect(mockOnColorChange).toHaveBeenCalledWith('#000000')
  })

  it('treats black as auto mode', () => {
    render(
      <TextColorPicker 
        selectedColor="#000000" 
        mugColor="#ffffff" 
        onColorChange={mockOnColorChange} 
      />
    )
    
    const autoButton = screen.getByRole('button', { name: /select auto text color/i })
    expect(autoButton).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/Auto Contrast/)).toBeInTheDocument()
  })

  it('displays auto contrast explanation', () => {
    render(
      <TextColorPicker 
        selectedColor="#000000" 
        mugColor="#ffffff" 
        onColorChange={mockOnColorChange} 
      />
    )
    
    expect(screen.getByText('Auto Contrast:')).toBeInTheDocument()
    expect(screen.getByText(/Text color automatically adjusts/)).toBeInTheDocument()
  })

  it('shows mug color in auto contrast preview', () => {
    render(
      <TextColorPicker 
        selectedColor="#000000" 
        mugColor="#ff0000" 
        onColorChange={mockOnColorChange} 
      />
    )
    
    const autoButton = screen.getByRole('button', { name: /select auto text color/i })
    const preview = autoButton.querySelector('div[style*="backgroundColor"]')
    
    expect(preview).toHaveStyle({ backgroundColor: '#ff0000' })
  })

  it('has proper accessibility attributes', () => {
    render(
      <TextColorPicker 
        selectedColor="#000000" 
        mugColor="#ffffff" 
        onColorChange={mockOnColorChange} 
      />
    )
    
    const buttons = screen.getAllByRole('button')
    
    buttons.forEach(button => {
      expect(button).toHaveAttribute('aria-label')
      expect(button).toHaveAttribute('aria-pressed')
    })
  })

  it('has minimum touch target sizes', () => {
    render(
      <TextColorPicker 
        selectedColor="#000000" 
        mugColor="#ffffff" 
        onColorChange={mockOnColorChange} 
      />
    )
    
    const buttons = screen.getAllByRole('button')
    
    buttons.forEach(button => {
      expect(button).toHaveClass('min-h-[60px]', 'min-w-[44px]')
    })
  })

  it('applies custom className', () => {
    const { container } = render(
      <TextColorPicker 
        selectedColor="#000000" 
        mugColor="#ffffff" 
        onColorChange={mockOnColorChange}
        className="custom-class"
      />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('handles white color selection with proper border', () => {
    render(
      <TextColorPicker 
        selectedColor="#ffffff" 
        mugColor="#000000" 
        onColorChange={mockOnColorChange} 
      />
    )
    
    const whiteButton = screen.getByRole('button', { name: /select white text color/i })
    const colorSwatch = whiteButton.querySelector('div[style*="backgroundColor"]')
    
    expect(colorSwatch).toHaveClass('border-gray-300')
  })

  it('displays all expected color options', () => {
    render(
      <TextColorPicker 
        selectedColor="#000000" 
        mugColor="#ffffff" 
        onColorChange={mockOnColorChange} 
      />
    )
    
    const expectedColors = [
      'Auto', 'Black', 'White', 'Red', 'Blue', 'Green', 'Purple', 'Orange', 'Yellow'
    ]
    
    expectedColors.forEach(colorName => {
      expect(screen.getByText(colorName)).toBeInTheDocument()
    })
  })

  it('handles multiple color selections correctly', () => {
    render(
      <TextColorPicker 
        selectedColor="#000000" 
        mugColor="#ffffff" 
        onColorChange={mockOnColorChange} 
      />
    )
    
    const blueButton = screen.getByRole('button', { name: /select blue text color/i })
    const greenButton = screen.getByRole('button', { name: /select green text color/i })
    
    fireEvent.click(blueButton)
    expect(mockOnColorChange).toHaveBeenCalledWith('#2563eb')
    
    mockOnColorChange.mockClear()
    
    fireEvent.click(greenButton)
    expect(mockOnColorChange).toHaveBeenCalledWith('#16a34a')
  })
})
