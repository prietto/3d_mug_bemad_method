import { vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import LeadCaptureForm from './LeadCaptureForm'
import { Design } from '../../lib/types'

// Mock the DesignPreview component
vi.mock('./DesignPreview', () => ({
  default: ({ design }: { design: Design }) => (
    <div data-testid="design-preview">Design Preview: {design.id}</div>
  )
}))

// Mock the ConsentCheckbox component
vi.mock('./ConsentCheckbox', () => ({
  default: ({ onConsentChange }: { onConsentChange: (accepted: boolean) => void }) => (
    <div>
      <input
        type="checkbox"
        data-testid="consent-checkbox"
        onChange={(e) => onConsentChange(e.target.checked)}
      />
      <label>I consent to marketing communications</label>
    </div>
  )
}))

describe('LeadCaptureForm', () => {
  const mockDesign: Design = {
    id: 'test-design-id',
    mugColor: '#ff0000',
    uploadedImageUrl: 'https://example.com/image.jpg',
    customText: 'Test Text',
    textFont: 'Arial, sans-serif',
    textPosition: JSON.stringify({ x: 0, y: 0, z: 0 }),
    textSize: 1.0,
    textColor: '#000000',
    createdAt: '2025-01-01T00:00:00.000Z',
    lastModified: '2025-01-01T00:00:00.000Z',
    isComplete: false
  }

  const mockOnSubmit = vi.fn()
  const user = userEvent.setup()

  const defaultProps = {
    design: mockDesign,
    onSubmit: mockOnSubmit
  }

  beforeEach(() => {
    mockOnSubmit.mockReset()
  })

  it('renders form with all required fields', () => {
    render(<LeadCaptureForm {...defaultProps} />)
    
    expect(screen.getByText('Get Your Quote')).toBeInTheDocument()
    expect(screen.getByLabelText(/Full Name/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email Address/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Phone Number/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Project Description/)).toBeInTheDocument()
    expect(screen.getByTestId('consent-checkbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Get My Quote' })).toBeInTheDocument()
  })

  it('renders design preview', () => {
    render(<LeadCaptureForm {...defaultProps} />)
    
    expect(screen.getByTestId('design-preview')).toBeInTheDocument()
    expect(screen.getByText('Design Preview: test-design-id')).toBeInTheDocument()
  })

  it('renders form in always-visible mode without dismiss button', () => {
    render(<LeadCaptureForm {...defaultProps} />)
    
    // Form should be visible
    expect(screen.getByText('Get Your Quote')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Get My Quote' })).toBeInTheDocument()
    
    // No dismiss button should exist
    expect(screen.queryByLabelText('Close form')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument()
  })

  it('tracks form_visible_on_load analytics event', () => {
    // Mock gtag
    const mockGtag = vi.fn()
    ;(global as any).window = { gtag: mockGtag, innerWidth: 1024, innerHeight: 768 }
    
    render(<LeadCaptureForm {...defaultProps} />)
    
    expect(mockGtag).toHaveBeenCalledWith('event', 'form_visible_on_load', {
      event_category: 'Lead Capture',
      event_label: 'Form Visible on Load',
      custom_map: {
        viewport_width: 1024,
        viewport_height: 768,
        device_type: 'desktop'
      }
    })
  })

  it('validates required fields', async () => {
    render(<LeadCaptureForm {...defaultProps} />)
    
    const submitButton = screen.getByRole('button', { name: 'Get My Quote' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument()
      expect(screen.getByText('Email is required')).toBeInTheDocument()
      expect(screen.getByText('Please describe your project')).toBeInTheDocument()
    })
  })

  it('validates email format', async () => {
    render(<LeadCaptureForm {...defaultProps} />)
    
    const emailInput = screen.getByLabelText(/Email Address/)
    const submitButton = screen.getByRole('button', { name: 'Get My Quote' })
    
    await user.type(emailInput, 'invalid-email')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
    })
  })

  it('validates phone format when provided', async () => {
    render(<LeadCaptureForm {...defaultProps} />)
    
    const phoneInput = screen.getByLabelText(/Phone Number/)
    const submitButton = screen.getByRole('button', { name: 'Get My Quote' })
    
    await user.type(phoneInput, 'invalid-phone')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid phone number')).toBeInTheDocument()
    })
  })

  it('validates project description minimum length', async () => {
    render(<LeadCaptureForm {...defaultProps} />)
    
    const descriptionInput = screen.getByLabelText(/Project Description/)
    const submitButton = screen.getByRole('button', { name: 'Get My Quote' })
    
    await user.type(descriptionInput, 'Short')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Please provide more details about your project (minimum 10 characters)')).toBeInTheDocument()
    })
  })

  it('validates consent checkbox', async () => {
    render(<LeadCaptureForm {...defaultProps} />)
    
    const submitButton = screen.getByRole('button', { name: 'Get My Quote' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('You must agree to the privacy policy to continue')).toBeInTheDocument()
    })
  })

  it('clears field errors when user types', async () => {
    render(<LeadCaptureForm {...defaultProps} />)
    
    const nameInput = screen.getByLabelText(/Full Name/)
    const submitButton = screen.getByRole('button', { name: 'Get My Quote' })
    
    // Trigger validation error
    await user.click(submitButton)
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument()
    })
    
    // Type in field to clear error
    await user.type(nameInput, 'John Doe')
    expect(screen.queryByText('Name is required')).not.toBeInTheDocument()
  })

  it('submits form with valid data', async () => {
    mockOnSubmit.mockResolvedValue(undefined)
    render(<LeadCaptureForm {...defaultProps} />)
    
    // Fill out form
    await user.type(screen.getByLabelText(/Full Name/), 'John Doe')
    await user.type(screen.getByLabelText(/Email Address/), 'john@example.com')
    await user.type(screen.getByLabelText(/Phone Number/), '+1234567890')
    await user.type(screen.getByLabelText(/Project Description/), 'I need 100 custom mugs for our company event')
    await user.click(screen.getByTestId('consent-checkbox'))
    
    const submitButton = screen.getByRole('button', { name: 'Get My Quote' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        projectDescription: 'I need 100 custom mugs for our company event',
        designId: 'test-design-id',
        source: 'landing_page_3d_designer',
        engagementLevel: 'high'
      })
    })
  })

  it('calculates engagement level correctly', async () => {
    mockOnSubmit.mockResolvedValue(undefined)
    
    // Design with only color change (low engagement)
    const lowEngagementDesign: Design = {
      ...mockDesign,
      uploadedImageUrl: undefined,
      customText: undefined,
      mugColor: '#ff0000'
    }
    
    render(<LeadCaptureForm {...defaultProps} design={lowEngagementDesign} />)
    
    // Fill out form
    await user.type(screen.getByLabelText(/Full Name/), 'John Doe')
    await user.type(screen.getByLabelText(/Email Address/), 'john@example.com')
    await user.type(screen.getByLabelText(/Project Description/), 'Simple project description')
    await user.click(screen.getByTestId('consent-checkbox'))
    
    await user.click(screen.getByRole('button', { name: 'Get My Quote' }))
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          engagementLevel: 'medium' // Color change counts as medium
        })
      )
    })
  })

  it('shows loading state during submission', async () => {
    let resolveSubmit: () => void
    const submitPromise = new Promise<void>((resolve) => {
      resolveSubmit = resolve
    })
    mockOnSubmit.mockReturnValue(submitPromise)
    
    render(<LeadCaptureForm {...defaultProps} />)
    
    // Fill out form
    await user.type(screen.getByLabelText(/Full Name/), 'John Doe')
    await user.type(screen.getByLabelText(/Email Address/), 'john@example.com')
    await user.type(screen.getByLabelText(/Project Description/), 'Project description')
    await user.click(screen.getByTestId('consent-checkbox'))
    
    const submitButton = screen.getByRole('button', { name: 'Get My Quote' })
    await user.click(submitButton)
    
    // Check loading state
    expect(screen.getByText('Submitting...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
    
    // Resolve submission
    resolveSubmit!()
    await waitFor(() => {
      expect(screen.queryByText('Submitting...')).not.toBeInTheDocument()
    })
  })

  it('shows inline success message after successful submission', async () => {
    mockOnSubmit.mockResolvedValue(undefined)
    render(<LeadCaptureForm {...defaultProps} />)
    
    // Fill out and submit form
    await user.type(screen.getByLabelText(/Full Name/), 'John Doe')
    await user.type(screen.getByLabelText(/Email Address/), 'john@example.com')
    await user.type(screen.getByLabelText(/Project Description/), 'Project description')
    await user.click(screen.getByTestId('consent-checkbox'))
    await user.click(screen.getByRole('button', { name: 'Get My Quote' }))
    
    await waitFor(() => {
      expect(screen.getByText('Thank You!')).toBeInTheDocument()
      expect(screen.getByText(/We've received your information/)).toBeInTheDocument()
    })

    // Form should still be visible (not replaced by modal)
    expect(screen.getByText('Get Your Quote')).toBeInTheDocument()
  })

  it('shows error message when submission fails', async () => {
    const errorMessage = 'Server error occurred'
    mockOnSubmit.mockRejectedValue(new Error(errorMessage))
    render(<LeadCaptureForm {...defaultProps} />)
    
    // Fill out and submit form
    await user.type(screen.getByLabelText(/Full Name/), 'John Doe')
    await user.type(screen.getByLabelText(/Email Address/), 'john@example.com')
    await user.type(screen.getByLabelText(/Project Description/), 'Project description')
    await user.click(screen.getByTestId('consent-checkbox'))
    await user.click(screen.getByRole('button', { name: 'Get My Quote' }))
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  it('handles phone field as optional', async () => {
    mockOnSubmit.mockResolvedValue(undefined)
    render(<LeadCaptureForm {...defaultProps} />)
    
    // Fill out form without phone
    await user.type(screen.getByLabelText(/Full Name/), 'John Doe')
    await user.type(screen.getByLabelText(/Email Address/), 'john@example.com')
    await user.type(screen.getByLabelText(/Project Description/), 'Project description')
    await user.click(screen.getByTestId('consent-checkbox'))
    
    await user.click(screen.getByRole('button', { name: 'Get My Quote' }))
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          phone: undefined
        })
      )
    })
  })
})
