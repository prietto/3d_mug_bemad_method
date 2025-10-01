import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ResetConfirmationDialog from './ResetConfirmationDialog'

describe('ResetConfirmationDialog', () => {
  const mockOnConfirm = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when isOpen is false', () => {
    render(
      <ResetConfirmationDialog
        isOpen={false}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        resetType="all"
      />
    )
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders dialog when isOpen is true', () => {
    render(
      <ResetConfirmationDialog
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        resetType="all"
      />
    )
    
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Reset All Design')).toBeInTheDocument()
  })

  it('displays correct content for all reset type', () => {
    render(
      <ResetConfirmationDialog
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        resetType="all"
      />
    )
    
    expect(screen.getByText('Reset All Design')).toBeInTheDocument()
    expect(screen.getByText(/Are you sure you want to reset all customizations/)).toBeInTheDocument()
  })

  it('displays correct content for image reset type', () => {
    render(
      <ResetConfirmationDialog
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        resetType="image"
      />
    )
    
    expect(screen.getByText('Reset Image')).toBeInTheDocument()
    expect(screen.getByText(/Are you sure you want to remove the uploaded image/)).toBeInTheDocument()
  })

  it('displays correct content for color reset type', () => {
    render(
      <ResetConfirmationDialog
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        resetType="color"
      />
    )
    
    expect(screen.getByText('Reset Color')).toBeInTheDocument()
    expect(screen.getByText(/Are you sure you want to reset the mug color to white/)).toBeInTheDocument()
  })

  it('displays correct content for text reset type', () => {
    render(
      <ResetConfirmationDialog
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        resetType="text"
      />
    )
    
    expect(screen.getByText('Reset Text')).toBeInTheDocument()
    expect(screen.getByText(/Are you sure you want to remove all text customizations/)).toBeInTheDocument()
  })

  it('calls onCancel when Cancel button is clicked', () => {
    render(
      <ResetConfirmationDialog
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        resetType="all"
      />
    )
    
    fireEvent.click(screen.getByText('Cancel'))
    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })

  it('calls onConfirm when Reset button is clicked', () => {
    render(
      <ResetConfirmationDialog
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        resetType="all"
      />
    )
    
    fireEvent.click(screen.getByText('Reset'))
    expect(mockOnConfirm).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel when backdrop is clicked', () => {
    render(
      <ResetConfirmationDialog
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        resetType="all"
      />
    )
    
    // Click the backdrop (the div with bg-black/25)
    const backdrop = document.querySelector('.bg-black\\/25')
    expect(backdrop).toBeInTheDocument()
    fireEvent.click(backdrop!)
    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel when Escape key is pressed', () => {
    render(
      <ResetConfirmationDialog
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        resetType="all"
      />
    )
    
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })

  it('has proper accessibility attributes', () => {
    render(
      <ResetConfirmationDialog
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        resetType="all"
      />
    )
    
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'dialog-title')
    
    const title = screen.getByText('Reset All Design')
    expect(title).toHaveAttribute('id', 'dialog-title')
  })

  it('has minimum touch target sizes for mobile accessibility', () => {
    render(
      <ResetConfirmationDialog
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        resetType="all"
      />
    )
    
    const cancelButton = screen.getByText('Cancel')
    const resetButton = screen.getByText('Reset')
    
    // Check that buttons have min-h-[44px] class for touch targets
    expect(cancelButton).toHaveClass('min-h-[44px]')
    expect(resetButton).toHaveClass('min-h-[44px]')
  })

  it('manages body scroll properly', () => {
    const { rerender } = render(
      <ResetConfirmationDialog
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        resetType="all"
      />
    )
    
    expect(document.body.style.overflow).toBe('hidden')
    
    rerender(
      <ResetConfirmationDialog
        isOpen={false}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        resetType="all"
      />
    )
    
    expect(document.body.style.overflow).toBe('unset')
  })
})
