import { render, screen } from '@testing-library/react'
import MinimalHeader from './MinimalHeader'

describe('MinimalHeader', () => {
  it('renders with tagline only', () => {
    render(<MinimalHeader tagline="Design Your Perfect Mug" />)

    expect(screen.getByText('Design Your Perfect Mug')).toBeInTheDocument()
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('renders with logo and tagline', () => {
    render(<MinimalHeader logo="/logo.png" tagline="Design Your Perfect Mug" />)

    const logo = screen.getByAltText('Company Logo')
    expect(logo).toBeInTheDocument()
    expect(logo).toHaveAttribute('src', '/logo.png')
    expect(screen.getByText('Design Your Perfect Mug')).toBeInTheDocument()
  })

  it('has maximum height of 80px', () => {
    const { container } = render(<MinimalHeader tagline="Design Your Perfect Mug" />)

    const header = container.querySelector('header')
    expect(header).toHaveStyle({ maxHeight: '80px' })
  })

  it('uses proper semantic HTML with role banner', () => {
    render(<MinimalHeader tagline="Design Your Perfect Mug" />)

    const header = screen.getByRole('banner')
    expect(header.tagName).toBe('HEADER')
  })

  it('applies responsive text sizing classes', () => {
    render(<MinimalHeader tagline="Design Your Perfect Mug" />)

    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveClass('text-lg', 'sm:text-xl', 'lg:text-2xl')
  })

  it('centers content horizontally', () => {
    render(<MinimalHeader tagline="Design Your Perfect Mug" />)

    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveClass('text-center')
  })
})