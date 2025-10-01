import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import CTAButton from './CTAButton'

describe('CTAButton', () => {
  it('renders button with children text', () => {
    render(<CTAButton>Click Me</CTAButton>)
    
    expect(screen.getByRole('button', { name: 'Click Me' })).toBeInTheDocument()
  })

  it('applies primary variant styling by default', () => {
    render(<CTAButton>Primary Button</CTAButton>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-blue-600', 'text-white')
  })

  it('applies secondary variant styling when specified', () => {
    render(<CTAButton variant="secondary">Secondary Button</CTAButton>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-white', 'text-blue-600', 'border-2', 'border-blue-600')
  })

  it('applies large size styling by default', () => {
    render(<CTAButton>Large Button</CTAButton>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('px-8', 'py-4', 'text-lg')
  })

  it('applies medium size styling when specified', () => {
    render(<CTAButton size="md">Medium Button</CTAButton>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('px-6', 'py-3', 'text-base')
  })

  it('applies small size styling when specified', () => {
    render(<CTAButton size="sm">Small Button</CTAButton>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('px-4', 'py-2', 'text-sm')
  })

  it('calls onClick handler when clicked', () => {
    const mockClick = vi.fn()
    render(<CTAButton onClick={mockClick}>Clickable Button</CTAButton>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(mockClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is true', () => {
    render(<CTAButton disabled>Disabled Button</CTAButton>)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed')
  })

  it('uses custom aria-label when provided', () => {
    render(<CTAButton ariaLabel="Custom aria label">Button</CTAButton>)
    
    expect(screen.getByRole('button', { name: 'Custom aria label' })).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<CTAButton className="custom-class">Button</CTAButton>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  it('renders arrow icon for primary variant', () => {
    render(<CTAButton variant="primary">Primary Button</CTAButton>)
    
    const button = screen.getByRole('button')
    const svg = button.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('does not render arrow icon for secondary variant', () => {
    render(<CTAButton variant="secondary">Secondary Button</CTAButton>)
    
    const button = screen.getByRole('button')
    const svg = button.querySelector('svg')
    expect(svg).not.toBeInTheDocument()
  })
})
