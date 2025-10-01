import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import Navigation from './Navigation'

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

describe('Navigation', () => {
  it('renders brand identity with logo and name', () => {
    render(<Navigation />)
    
    expect(screen.getByText('CustomMugs3D')).toBeInTheDocument()
    const brandLink = screen.getByRole('link', { name: /CustomMugs3D/i })
    expect(brandLink).toHaveAttribute('href', '/')
  })

  it('renders desktop navigation links', () => {
    render(<Navigation />)
    
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Gallery' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'How It Works' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Contact' })).toBeInTheDocument()
  })

  it('has correct href attributes for navigation links', () => {
    render(<Navigation />)
    
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Gallery' })).toHaveAttribute('href', '/gallery')
    expect(screen.getByRole('link', { name: 'How It Works' })).toHaveAttribute('href', '/how-it-works')
    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/contact')
  })

  it('renders mobile menu button', () => {
    render(<Navigation />)
    
    const menuButton = screen.getByRole('button', { name: /Toggle navigation menu/i })
    expect(menuButton).toBeInTheDocument()
  })

  it('shows mobile menu when menu button is clicked', () => {
    render(<Navigation />)
    
    const menuButton = screen.getByRole('button', { name: /Toggle navigation menu/i })
    
    // Mobile menu should not be visible initially
    expect(screen.queryByText('Home')).toBeInTheDocument() // Desktop version
    
    // Click to open mobile menu
    fireEvent.click(menuButton)
    
    // Should now have both desktop and mobile versions
    const homeLinks = screen.getAllByText('Home')
    expect(homeLinks).toHaveLength(2) // Desktop + Mobile
  })

  it('toggles mobile menu open and closed', () => {
    render(<Navigation />)
    
    const menuButton = screen.getByRole('button', { name: /Toggle navigation menu/i })
    
    // Open mobile menu
    fireEvent.click(menuButton)
    let homeLinks = screen.getAllByText('Home')
    expect(homeLinks).toHaveLength(2) // Desktop + Mobile
    
    // Close mobile menu
    fireEvent.click(menuButton)
    homeLinks = screen.getAllByText('Home')
    expect(homeLinks).toHaveLength(1) // Only desktop
  })

  it('applies sticky positioning and shadow', () => {
    render(<Navigation />)
    
    const nav = screen.getByRole('navigation')
    expect(nav).toHaveClass('sticky', 'top-0', 'shadow-sm')
  })

  it('has proper z-index for stacking', () => {
    render(<Navigation />)
    
    const nav = screen.getByRole('navigation')
    expect(nav).toHaveClass('z-50')
  })
})
