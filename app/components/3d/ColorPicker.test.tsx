import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ColorPicker from './ColorPicker'

describe('ColorPicker', () => {
  const defaultColors = ['#ffffff', '#000000', '#3b82f6', '#ef4444', '#10b981']
  const mockOnColorChange = vi.fn()

  beforeEach(() => {
    mockOnColorChange.mockClear()
  })

  it('renders with default colors', () => {
    render(
      <ColorPicker 
        selectedColor="#ffffff" 
        onColorChange={mockOnColorChange} 
      />
    )
    
    expect(screen.getByText('Mug Color')).toBeInTheDocument()
    expect(screen.getByText('Selected: White')).toBeInTheDocument()
    
    // Check that all default colors are rendered
    defaultColors.forEach(color => {
      const button = screen.getByLabelText(`Select ${getColorName(color)} mug color`)
      expect(button).toBeInTheDocument()
      expect(button).toHaveStyle({ backgroundColor: color })
    })
  })

  it('renders with custom colors', () => {
    const customColors = ['#ff0000', '#00ff00']
    render(
      <ColorPicker 
        selectedColor="#ff0000" 
        onColorChange={mockOnColorChange}
        colors={customColors}
      />
    )
    
    // Should only render custom colors
    expect(screen.getByLabelText('Select #ff0000 mug color')).toBeInTheDocument()
    expect(screen.getByLabelText('Select #00ff00 mug color')).toBeInTheDocument()
    expect(screen.queryByLabelText('Select White mug color')).not.toBeInTheDocument()
  })

  it('shows selection indicator for selected color', () => {
    render(
      <ColorPicker 
        selectedColor="#3b82f6" 
        onColorChange={mockOnColorChange} 
      />
    )
    
    const selectedButton = screen.getByLabelText('Select Blue mug color')
    expect(selectedButton).toHaveClass('border-blue-600', 'shadow-lg', 'ring-2', 'ring-blue-500')
    
    // Check that non-selected buttons don't have selection styling
    const nonSelectedButton = screen.getByLabelText('Select White mug color')
    expect(nonSelectedButton).toHaveClass('border-gray-300')
    expect(nonSelectedButton).not.toHaveClass('border-blue-600')
  })

  it('calls onColorChange when color is clicked', () => {
    render(
      <ColorPicker 
        selectedColor="#ffffff" 
        onColorChange={mockOnColorChange} 
      />
    )
    
    const blueButton = screen.getByLabelText('Select Blue mug color')
    fireEvent.click(blueButton)
    
    expect(mockOnColorChange).toHaveBeenCalledTimes(1)
    expect(mockOnColorChange).toHaveBeenCalledWith('#3b82f6')
  })

  it('handles keyboard navigation with focus', () => {
    render(
      <ColorPicker 
        selectedColor="#ffffff" 
        onColorChange={mockOnColorChange} 
      />
    )
    
    const firstButton = screen.getByLabelText('Select White mug color')
    firstButton.focus()
    
    expect(firstButton).toHaveFocus()
    expect(firstButton).toHaveClass('focus:ring-2', 'focus:ring-blue-500')
  })

  it('applies custom className', () => {
    const { container } = render(
      <ColorPicker 
        selectedColor="#ffffff" 
        onColorChange={mockOnColorChange}
        className="custom-class"
      />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('has proper touch targets (44px minimum)', () => {
    render(
      <ColorPicker 
        selectedColor="#ffffff" 
        onColorChange={mockOnColorChange} 
      />
    )
    
    const buttons = screen.getAllByRole('button')
    // Check that color buttons have at least 44px (3rem = 48px)
    buttons.forEach(button => {
      if (button.getAttribute('aria-label')?.includes('Select')) {
        expect(button).toHaveClass('w-12', 'h-12') // 48px x 48px
      }
    })
  })

  it('displays correct color names', () => {
    render(
      <ColorPicker 
        selectedColor="#ef4444" 
        onColorChange={mockOnColorChange} 
      />
    )
    
    expect(screen.getByText('Selected: Red')).toBeInTheDocument()
  })

  it('handles unknown color codes gracefully', () => {
    render(
      <ColorPicker 
        selectedColor="#123456" 
        onColorChange={mockOnColorChange}
        colors={['#123456']}
      />
    )
    
    expect(screen.getByText('Selected: #123456')).toBeInTheDocument()
  })
})

// Helper function to get color names (duplicated from component for testing)
function getColorName(color: string): string {
  const colorNames: Record<string, string> = {
    '#ffffff': 'White',
    '#000000': 'Black', 
    '#3b82f6': 'Blue',
    '#ef4444': 'Red',
    '#10b981': 'Green'
  }
  return colorNames[color] || color
}
