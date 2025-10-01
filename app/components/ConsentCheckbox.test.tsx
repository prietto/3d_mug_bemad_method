import { vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ConsentCheckbox from './ConsentCheckbox'

describe('ConsentCheckbox', () => {
  const mockOnConsentChange = vi.fn()
  const defaultProps = {
    privacyPolicyUrl: '/privacy-policy',
    onConsentChange: mockOnConsentChange
  }

  beforeEach(() => {
    mockOnConsentChange.mockReset()
  })

  it('renders with required privacy policy link', () => {
    render(<ConsentCheckbox {...defaultProps} />)
    
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy-policy')
  })

  it('renders with optional terms of service link', () => {
    render(<ConsentCheckbox {...defaultProps} termsOfServiceUrl="/terms" />)
    
    expect(screen.getByText('Terms of Service')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute('href', '/terms')
  })

  it('shows required indicator when required prop is true', () => {
    render(<ConsentCheckbox {...defaultProps} required={true} />)
    
    expect(screen.getByLabelText('Required')).toBeInTheDocument()
  })

  it('does not show required indicator when required prop is false', () => {
    render(<ConsentCheckbox {...defaultProps} required={false} />)
    
    expect(screen.queryByLabelText('Required')).not.toBeInTheDocument()
  })

  it('calls onConsentChange when checkbox is clicked', () => {
    render(<ConsentCheckbox {...defaultProps} />)
    
    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)
    
    expect(mockOnConsentChange).toHaveBeenCalledWith(true)
  })

  it('toggles checkbox state correctly', () => {
    render(<ConsentCheckbox {...defaultProps} />)
    
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement
    expect(checkbox.checked).toBe(false)
    
    fireEvent.click(checkbox)
    expect(checkbox.checked).toBe(true)
    
    fireEvent.click(checkbox)
    expect(checkbox.checked).toBe(false)
  })

  it('displays error message when provided', () => {
    const errorMessage = 'You must accept the terms'
    render(<ConsentCheckbox {...defaultProps} error={errorMessage} />)
    
    expect(screen.getByRole('alert')).toHaveTextContent(errorMessage)
  })

  it('applies error styling when error is present', () => {
    render(<ConsentCheckbox {...defaultProps} error="Error message" />)
    
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toHaveClass('border-red-500')
  })

  it('shows unsubscribe information text', () => {
    render(<ConsentCheckbox {...defaultProps} />)
    
    expect(screen.getByText(/You can unsubscribe at any time/)).toBeInTheDocument()
  })

  it('links open in new tab with proper security attributes', () => {
    render(<ConsentCheckbox {...defaultProps} termsOfServiceUrl="/terms" />)
    
    const privacyLink = screen.getByRole('link', { name: 'Privacy Policy' })
    const termsLink = screen.getByRole('link', { name: 'Terms of Service' })
    
    expect(privacyLink).toHaveAttribute('target', '_blank')
    expect(privacyLink).toHaveAttribute('rel', 'noopener noreferrer')
    expect(termsLink).toHaveAttribute('target', '_blank')
    expect(termsLink).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('applies custom className', () => {
    const customClass = 'custom-consent-class'
    render(<ConsentCheckbox {...defaultProps} className={customClass} />)
    
    const container = screen.getByRole('checkbox').closest('.space-y-2')
    expect(container).toHaveClass(customClass)
  })
})
