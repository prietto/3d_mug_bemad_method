
import { render, screen } from '@testing-library/react'
import DesignPreview from './DesignPreview'
import { Design } from '../../lib/types'

describe('DesignPreview', () => {
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

  const defaultDesign: Design = {
    id: 'default-design-id',
    mugColor: '#ffffff',
    createdAt: '2025-01-01T00:00:00.000Z',
    lastModified: '2025-01-01T00:00:00.000Z',
    isComplete: false
  }

  it('renders design preview with custom color', () => {
    render(<DesignPreview design={mockDesign} />)
    
    expect(screen.getByText('Your Custom Design')).toBeInTheDocument()
    expect(screen.getByText('Color: #ff0000')).toBeInTheDocument()
  })

  it('renders custom text when provided', () => {
    render(<DesignPreview design={mockDesign} />)
    
    expect(screen.getByText('Test Text')).toBeInTheDocument()
    expect(screen.getByText('Text: "Test Text"')).toBeInTheDocument()
  })

  it('renders uploaded image when provided', () => {
    render(<DesignPreview design={mockDesign} />)
    
    const image = screen.getByAltText('Custom design')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg')
    expect(screen.getByText('✓ Custom Image Added')).toBeInTheDocument()
  })

  it('renders default mug icon when no customizations', () => {
    render(<DesignPreview design={defaultDesign} />)
    
    expect(screen.getByText('No customizations yet')).toBeInTheDocument()
    // SVG icon should be present
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument()
  })

  it('renders in compact mode', () => {
    render(<DesignPreview design={mockDesign} compact />)
    
    // Should not show the detailed design info in compact mode
    expect(screen.queryByText('Your Custom Design')).not.toBeInTheDocument()
    expect(screen.queryByText('Color: #ff0000')).not.toBeInTheDocument()
    
    // But should still show the design elements
    expect(screen.getByText('Test Text')).toBeInTheDocument()
  })

  it('applies correct size classes for compact mode', () => {
    const { container } = render(<DesignPreview design={mockDesign} compact />)
    
    // Check for compact sizing classes
    const previewContainer = container.querySelector('.w-16.h-16')
    expect(previewContainer).toBeInTheDocument()
  })

  it('applies correct size classes for normal mode', () => {
    const { container } = render(<DesignPreview design={mockDesign} />)
    
    // Check for normal sizing classes
    const previewContainer = container.querySelector('.w-24.h-24')
    expect(previewContainer).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const customClass = 'custom-preview-class'
    const { container } = render(<DesignPreview design={mockDesign} className={customClass} />)
    
    expect(container.firstChild).toHaveClass(customClass)
  })

  it('shows text with correct color and font styling', () => {
    render(<DesignPreview design={mockDesign} />)
    
    const textElement = screen.getByText('Test Text')
    expect(textElement).toHaveStyle({
      color: '#000000',
      fontFamily: 'Arial, sans-serif'
    })
  })

  it('applies white text color when image is present', () => {
    render(<DesignPreview design={mockDesign} />)
    
    const textElement = screen.getByText('Test Text')
    expect(textElement).toHaveStyle({ color: '#ffffff' })
  })

  it('handles design with only text customization', () => {
    const textOnlyDesign: Design = {
      ...defaultDesign,
      customText: 'Just Text',
      textColor: '#ff0000'
    }
    
    render(<DesignPreview design={textOnlyDesign} />)
    
    expect(screen.getByText('Just Text')).toBeInTheDocument()
    expect(screen.getByText('Text: "Just Text"')).toBeInTheDocument()
    expect(screen.queryByText('✓ Custom Image Added')).not.toBeInTheDocument()
  })

  it('handles design with only color customization', () => {
    const colorOnlyDesign: Design = {
      ...defaultDesign,
      mugColor: '#00ff00'
    }
    
    render(<DesignPreview design={colorOnlyDesign} />)
    
    expect(screen.getByText('Color: #00ff00')).toBeInTheDocument()
    expect(screen.queryByText('Text:')).not.toBeInTheDocument()
    expect(screen.queryByText('✓ Custom Image Added')).not.toBeInTheDocument()
  })

  it('truncates long text properly', () => {
    const longTextDesign: Design = {
      ...mockDesign,
      customText: 'This is a very long text that should be truncated in the preview'
    }
    
    render(<DesignPreview design={longTextDesign} />)
    
    const textElement = screen.getByText('This is a very long text that should be truncated in the preview')
    expect(textElement).toHaveClass('truncate')
  })
})
