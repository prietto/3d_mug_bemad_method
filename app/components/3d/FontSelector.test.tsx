import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import FontSelector, { FontOption } from './FontSelector'

describe('FontSelector', () => {
  const mockOnFontChange = vi.fn()
  
  beforeEach(() => {
    mockOnFontChange.mockClear()
  })

  it('renders with default fonts', () => {
    render(<FontSelector selectedFont="Arial, sans-serif" onFontChange={mockOnFontChange} />)
    
    expect(screen.getByText('Font Style')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /select modern font/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /select classic font/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /select bold font/i })).toBeInTheDocument()
  })

  it('renders with custom fonts', () => {
    const customFonts: FontOption[] = [
      {
        name: 'Custom1',
        value: 'Custom1, serif',
        label: 'Elegant',
        preview: 'Aa'
      },
      {
        name: 'Custom2',
        value: 'Custom2, sans-serif', 
        label: 'Simple',
        preview: 'Aa'
      }
    ]

    render(
      <FontSelector 
        selectedFont="Custom1, serif" 
        onFontChange={mockOnFontChange} 
        fonts={customFonts}
      />
    )
    
    expect(screen.getByRole('button', { name: /select elegant font/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /select simple font/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /select modern font/i })).not.toBeInTheDocument()
  })

  it('highlights selected font', () => {
    render(<FontSelector selectedFont="Times, serif" onFontChange={mockOnFontChange} />)
    
    const selectedButton = screen.getByRole('button', { name: /select classic font/i })
    const unselectedButton = screen.getByRole('button', { name: /select modern font/i })
    
    expect(selectedButton).toHaveClass('border-blue-500', 'bg-blue-50', 'text-blue-700')
    expect(selectedButton).toHaveAttribute('aria-pressed', 'true')
    
    expect(unselectedButton).toHaveClass('border-gray-200', 'bg-white', 'text-gray-700')
    expect(unselectedButton).toHaveAttribute('aria-pressed', 'false')
  })

  it('shows checkmark on selected font', () => {
    render(<FontSelector selectedFont="Impact, fantasy" onFontChange={mockOnFontChange} />)
    
    const selectedButton = screen.getByRole('button', { name: /select bold font/i })
    const checkmark = selectedButton.querySelector('svg')
    
    expect(checkmark).toBeInTheDocument()
    expect(checkmark).toHaveClass('w-2', 'h-2', 'text-white')
  })

  it('calls onFontChange when font is selected', () => {
    render(<FontSelector selectedFont="Arial, sans-serif" onFontChange={mockOnFontChange} />)
    
    const classicButton = screen.getByRole('button', { name: /select classic font/i })
    fireEvent.click(classicButton)
    
    expect(mockOnFontChange).toHaveBeenCalledWith('Times, serif')
  })

  it('displays font previews with correct font family', () => {
    render(<FontSelector selectedFont="Arial, sans-serif" onFontChange={mockOnFontChange} />)
    
    const modernButton = screen.getByRole('button', { name: /select modern font/i })
    const preview = modernButton.querySelector('div[style*="fontFamily"]')
    
    expect(preview).toHaveStyle({ fontFamily: 'Arial, sans-serif' })
    expect(preview).toHaveTextContent('Aa')
  })

  it('has proper accessibility attributes', () => {
    render(<FontSelector selectedFont="Arial, sans-serif" onFontChange={mockOnFontChange} />)
    
    const buttons = screen.getAllByRole('button')
    
    buttons.forEach(button => {
      expect(button).toHaveAttribute('aria-label')
      expect(button).toHaveAttribute('aria-pressed')
    })
  })

  it('has minimum touch target sizes', () => {
    render(<FontSelector selectedFont="Arial, sans-serif" onFontChange={mockOnFontChange} />)
    
    const buttons = screen.getAllByRole('button')
    
    buttons.forEach(button => {
      expect(button).toHaveClass('min-h-[80px]', 'min-w-[44px]')
    })
  })

  it('applies custom className', () => {
    const { container } = render(
      <FontSelector 
        selectedFont="Arial, sans-serif" 
        onFontChange={mockOnFontChange} 
        className="custom-class"
      />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('displays font labels correctly', () => {
    render(<FontSelector selectedFont="Arial, sans-serif" onFontChange={mockOnFontChange} />)
    
    expect(screen.getByText('Modern')).toBeInTheDocument()
    expect(screen.getByText('Classic')).toBeInTheDocument()
    expect(screen.getByText('Bold')).toBeInTheDocument()
  })

  it('handles hover states correctly', () => {
    render(<FontSelector selectedFont="Arial, sans-serif" onFontChange={mockOnFontChange} />)
    
    const unselectedButton = screen.getByRole('button', { name: /select classic font/i })
    
    expect(unselectedButton).toHaveClass('hover:border-gray-300', 'hover:bg-gray-50')
  })

  it('maintains selection state after re-render', () => {
    const { rerender } = render(
      <FontSelector selectedFont="Times, serif" onFontChange={mockOnFontChange} />
    )
    
    let selectedButton = screen.getByRole('button', { name: /select classic font/i })
    expect(selectedButton).toHaveAttribute('aria-pressed', 'true')
    
    rerender(<FontSelector selectedFont="Times, serif" onFontChange={mockOnFontChange} />)
    
    selectedButton = screen.getByRole('button', { name: /select classic font/i })
    expect(selectedButton).toHaveAttribute('aria-pressed', 'true')
  })

  it('handles multiple rapid clicks correctly', () => {
    render(<FontSelector selectedFont="Arial, sans-serif" onFontChange={mockOnFontChange} />)
    
    const classicButton = screen.getByRole('button', { name: /select classic font/i })
    
    fireEvent.click(classicButton)
    fireEvent.click(classicButton)
    fireEvent.click(classicButton)
    
    expect(mockOnFontChange).toHaveBeenCalledTimes(3)
    expect(mockOnFontChange).toHaveBeenCalledWith('Times, serif')
  })
})
