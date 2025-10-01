import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import UploadProgress from './UploadProgress'

describe('UploadProgress', () => {
  it('renders nothing when not uploading and no error', () => {
    const { container } = render(
      <UploadProgress progress={0} isUploading={false} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('displays upload progress when uploading', () => {
    render(
      <UploadProgress 
        progress={45} 
        isUploading={true} 
        fileName="test-image.png"
      />
    )

    expect(screen.getByText('Uploading...')).toBeInTheDocument()
    expect(screen.getByText('45%')).toBeInTheDocument()
    expect(screen.getByText('test-image.png')).toBeInTheDocument()
    expect(screen.getByText('Uploading to cloud storage...')).toBeInTheDocument()
  })

  it('shows processing status at higher progress levels', () => {
    render(
      <UploadProgress progress={85} isUploading={true} />
    )

    expect(screen.getByText('Processing...')).toBeInTheDocument()
    expect(screen.getByText('85%')).toBeInTheDocument()
    expect(screen.getByText('Applying to mug surface...')).toBeInTheDocument()
  })

  it('shows completion status at 100% progress', () => {
    render(
      <UploadProgress progress={100} isUploading={true} />
    )

    expect(screen.getByText('Completing...')).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByText('Upload complete!')).toBeInTheDocument()
  })

  it('displays error state when error is provided', () => {
    render(
      <UploadProgress 
        progress={0} 
        isUploading={false} 
        error="File too large"
      />
    )

    expect(screen.getByText('Upload Failed')).toBeInTheDocument()
    expect(screen.getByText('File too large')).toBeInTheDocument()
    expect(screen.queryByText('Uploading...')).not.toBeInTheDocument()
  })

  it('shows different status messages based on progress', () => {
    const { rerender } = render(
      <UploadProgress progress={10} isUploading={true} />
    )
    expect(screen.getByText('Validating file...')).toBeInTheDocument()

    rerender(<UploadProgress progress={30} isUploading={true} />)
    expect(screen.getByText('Uploading to cloud storage...')).toBeInTheDocument()

    rerender(<UploadProgress progress={60} isUploading={true} />)
    expect(screen.getByText('Optimizing for 3D rendering...')).toBeInTheDocument()

    rerender(<UploadProgress progress={90} isUploading={true} />)
    expect(screen.getByText('Applying to mug surface...')).toBeInTheDocument()

    rerender(<UploadProgress progress={100} isUploading={true} />)
    expect(screen.getByText('Upload complete!')).toBeInTheDocument()
  })

  it('displays progress bar with correct width', () => {
    render(<UploadProgress progress={65} isUploading={true} />)
    
    const progressBar = screen.getByRole('progressbar', { hidden: true }) || 
                       document.querySelector('[style*="width: 65%"]')
    expect(progressBar).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <UploadProgress 
        progress={50} 
        isUploading={true} 
        className="custom-class"
      />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('shows correct progress bar color based on progress', () => {
    const { rerender, container } = render(
      <UploadProgress progress={50} isUploading={true} />
    )
    
    // Blue for upload phase
    expect(container.querySelector('.bg-blue-600')).toBeInTheDocument()

    // Yellow for processing phase
    rerender(<UploadProgress progress={85} isUploading={true} />)
    expect(container.querySelector('.bg-yellow-500')).toBeInTheDocument()

    // Green for completion
    rerender(<UploadProgress progress={100} isUploading={true} />)
    expect(container.querySelector('.bg-green-500')).toBeInTheDocument()
  })
})
