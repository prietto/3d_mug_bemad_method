import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import Footer from './Footer'

// Mock Next.js Link component
vi.mock('next/link', () => {
  return {
    default: ({ children, href, ...props }: any) => (
      <a href={href} {...props}>
        {children}
      </a>
    ),
  }
})

describe('Footer', () => {
  it('renders brand identity with logo and description', () => {
    render(<Footer />)
    
    expect(screen.getByText('CustomMugs3D')).toBeInTheDocument()
    expect(screen.getByText(/Create stunning, personalized mugs/)).toBeInTheDocument()
  })

  it('renders quick links section', () => {
    render(<Footer />)
    
    expect(screen.getByText('Quick Links')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Design Gallery' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'How It Works' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Pricing' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'FAQ' })).toBeInTheDocument()
  })

  it('renders support section', () => {
    render(<Footer />)
    
    expect(screen.getByText('Support')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Contact Us' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Shipping Info' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Returns' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Track Order' })).toBeInTheDocument()
  })

  it('renders contact information', () => {
    render(<Footer />)
    
    expect(screen.getByText('Contact Info')).toBeInTheDocument()
    expect(screen.getByText('hello@custommugs3d.com')).toBeInTheDocument()
    expect(screen.getByText('(555) 123-MUGS')).toBeInTheDocument()
    expect(screen.getByText('Mon-Fri 9AM-6PM EST')).toBeInTheDocument()
  })

  it('renders legal section with privacy policy and terms', () => {
    render(<Footer />)
    
    expect(screen.getByText('Legal')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Terms of Service' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Cookie Policy' })).toBeInTheDocument()
  })

  it('has correct href attributes for legal links', () => {
    render(<Footer />)
    
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy-policy')
    expect(screen.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute('href', '/terms-of-service')
  })

  it('renders social media links', () => {
    render(<Footer />)
    
    const socialLinks = screen.getAllByRole('link', { name: /Facebook|Instagram/i })
    expect(socialLinks).toHaveLength(2)
  })

  it('renders copyright notice', () => {
    render(<Footer />)
    
    expect(screen.getByText(/© 2025 CustomMugs3D. All rights reserved./)).toBeInTheDocument()
  })

  it('uses dark theme styling', () => {
    render(<Footer />)
    
    const footer = screen.getByRole('contentinfo')
    expect(footer).toHaveClass('bg-gray-900')
  })
})
