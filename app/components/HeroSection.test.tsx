import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import HeroSection from './HeroSection'

describe('HeroSection', () => {
  it('renders hero section with compelling headline', () => {
    render(<HeroSection />)
    
    expect(screen.getByText(/Design Your Perfect Mug in/)).toBeInTheDocument()
    expect(screen.getByText(/3D Reality/)).toBeInTheDocument()
  })

  it('displays value proposition text', () => {
    render(<HeroSection />)
    
    expect(screen.getByText(/Experience interactive 3D customization/)).toBeInTheDocument()
    expect(screen.getByText(/professional-quality sublimated mugs/)).toBeInTheDocument()
  })

  it('shows key benefits with icons', () => {
    render(<HeroSection />)
    
    expect(screen.getByText('3D Interactive Design')).toBeInTheDocument()
    expect(screen.getByText('Professional Quality')).toBeInTheDocument()
    expect(screen.getByText('Instant Preview')).toBeInTheDocument()
  })

  it('renders CTA button with proper accessibility', () => {
    render(<HeroSection />)
    
    const ctaButton = screen.getByRole('button', { name: /Start designing your custom mug in 3D/i })
    expect(ctaButton).toBeInTheDocument()
    expect(ctaButton).toHaveTextContent('Start Designing Now')
  })

  it('calls onDesignNowClick when CTA is clicked', () => {
    const mockClick = vi.fn()
    render(<HeroSection onDesignNowClick={mockClick} />)
    
    const ctaButton = screen.getByRole('button', { name: /Start designing your custom mug in 3D/i })
    fireEvent.click(ctaButton)
    
    expect(mockClick).toHaveBeenCalledTimes(1)
  })

  it('shows placeholder alert when no onClick handler provided', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    render(<HeroSection />)
    
    const ctaButton = screen.getByRole('button', { name: /Start designing your custom mug in 3D/i })
    fireEvent.click(ctaButton)
    
    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('3D Designer coming soon'))
    alertSpy.mockRestore()
  })

  it('displays free design messaging', () => {
    render(<HeroSection />)
    
    expect(screen.getByText('Free to design • No account required to preview')).toBeInTheDocument()
  })
})
