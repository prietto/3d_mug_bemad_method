import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import TextInput from './TextInput'

describe('TextInput', () => {
  const mockOnChange = vi.fn()
  
  beforeEach(() => {
    mockOnChange.mockClear()
  })

  it('renders with default props', () => {
    render(<TextInput value="" onChange={mockOnChange} />)
    
    const input = screen.getByRole('textbox', { name: /custom text input/i })
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('placeholder', 'Add custom text...')
    expect(input).toHaveAttribute('maxLength', '50')
  })

  it('displays character count correctly', () => {
    render(<TextInput value="Hello" onChange={mockOnChange} />)
    
    expect(screen.getByText('45 characters remaining')).toBeInTheDocument()
    expect(screen.getByText('5/50')).toBeInTheDocument()
  })

  it('handles text input and calls onChange', () => {
    render(<TextInput value="" onChange={mockOnChange} />)
    
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Test text' } })
    
    expect(mockOnChange).toHaveBeenCalledWith('Test text')
  })

  it('enforces character limit', () => {
    render(<TextInput value="" onChange={mockOnChange} maxLength={10} />)
    
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'This is a very long text that should be truncated' } })
    
    // Should only call onChange for the first 10 characters
    expect(mockOnChange).toHaveBeenCalledWith('This is a ')
  })

  it('shows clear button when text is present', () => {
    render(<TextInput value="Some text" onChange={mockOnChange} />)
    
    const clearButton = screen.getByRole('button', { name: /clear text/i })
    expect(clearButton).toBeInTheDocument()
  })

  it('does not show clear button when text is empty', () => {
    render(<TextInput value="" onChange={mockOnChange} />)
    
    const clearButton = screen.queryByRole('button', { name: /clear text/i })
    expect(clearButton).not.toBeInTheDocument()
  })

  it('shows confirmation dialog when clear button is clicked', () => {
    render(<TextInput value="Some text" onChange={mockOnChange} />)
    
    const clearButton = screen.getByRole('button', { name: /clear text/i })
    fireEvent.click(clearButton)
    
    expect(screen.getByText('Clear Text?')).toBeInTheDocument()
    expect(screen.getByText(/Are you sure you want to clear all your custom text/)).toBeInTheDocument()
  })

  it('clears text when confirmation is accepted', () => {
    render(<TextInput value="Some text" onChange={mockOnChange} />)
    
    const clearButton = screen.getByRole('button', { name: /clear text/i })
    fireEvent.click(clearButton)
    
    const confirmButton = screen.getByRole('button', { name: /clear text/i })
    fireEvent.click(confirmButton)
    
    expect(mockOnChange).toHaveBeenCalledWith('')
  })

  it('cancels clear when cancel button is clicked', () => {
    render(<TextInput value="Some text" onChange={mockOnChange} />)
    
    const clearButton = screen.getByRole('button', { name: /clear text/i })
    fireEvent.click(clearButton)
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)
    
    expect(mockOnChange).not.toHaveBeenCalled()
    expect(screen.queryByText('Clear Text?')).not.toBeInTheDocument()
  })

  it('shows warning when approaching character limit', () => {
    render(<TextInput value="This is exactly forty characters long!" onChange={mockOnChange} />)
    
    const remainingText = screen.getByText('10 characters remaining')
    expect(remainingText).toHaveClass('text-orange-600')
  })

  it('has proper accessibility attributes', () => {
    render(<TextInput value="test" onChange={mockOnChange} />)
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('aria-label', 'Custom text input')
    expect(input).toHaveAttribute('aria-describedby', 'char-count')
    
    const charCount = screen.getByText(/characters remaining/)
    expect(charCount).toHaveAttribute('id', 'char-count')
  })

  it('applies custom className', () => {
    const { container } = render(
      <TextInput value="" onChange={mockOnChange} className="custom-class" />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('uses custom placeholder text', () => {
    render(<TextInput value="" onChange={mockOnChange} placeholder="Enter your message" />)
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('placeholder', 'Enter your message')
  })

  it('has minimum touch target size for clear button', () => {
    render(<TextInput value="test" onChange={mockOnChange} />)
    
    const clearButton = screen.getByRole('button', { name: /clear text/i })
    expect(clearButton).toHaveClass('min-w-[44px]', 'min-h-[44px]')
  })

  it('has minimum touch target size for dialog buttons', () => {
    render(<TextInput value="test" onChange={mockOnChange} />)
    
    const clearButton = screen.getByRole('button', { name: /clear text/i })
    fireEvent.click(clearButton)
    
    const confirmButton = screen.getByRole('button', { name: 'Clear Text' })
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    
    expect(confirmButton).toHaveClass('min-h-[44px]')
    expect(cancelButton).toHaveClass('min-h-[44px]')
  })
})
