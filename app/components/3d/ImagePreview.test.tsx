import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ImagePreview from './ImagePreview'

describe('ImagePreview', () => {
  const mockImageUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD'
  const mockOnApply = vi.fn()
  const mockOnRegenerate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with image preview', () => {
    render(<ImagePreview imageUrl={mockImageUrl} onApply={mockOnApply} />)

    const image = screen.getByAltText(/Generated mug design preview/i)
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', mockImageUrl)
  })

  it('displays title and description', () => {
    render(<ImagePreview imageUrl={mockImageUrl} onApply={mockOnApply} />)

    expect(screen.getByText(/Your Generated Mug Design/i)).toBeInTheDocument()
    expect(screen.getByText(/Preview your AI-generated mug design/i)).toBeInTheDocument()
  })

  it('shows ready status badge', () => {
    render(<ImagePreview imageUrl={mockImageUrl} onApply={mockOnApply} />)

    expect(screen.getByText(/Ready/i)).toBeInTheDocument()
  })

  it('calls onApply when Apply to Design button is clicked', () => {
    render(<ImagePreview imageUrl={mockImageUrl} onApply={mockOnApply} />)

    const applyButton = screen.getByRole('button', { name: /Apply to Design/i })
    fireEvent.click(applyButton)

    expect(mockOnApply).toHaveBeenCalledTimes(1)
  })

  it('shows Regenerate button when onRegenerate is provided', () => {
    render(<ImagePreview imageUrl={mockImageUrl} onApply={mockOnApply} onRegenerate={mockOnRegenerate} />)

    const regenerateButton = screen.getByRole('button', { name: /Regenerate/i })
    expect(regenerateButton).toBeInTheDocument()
  })

  it('does not show Regenerate button when onRegenerate is not provided', () => {
    render(<ImagePreview imageUrl={mockImageUrl} onApply={mockOnApply} />)

    const regenerateButton = screen.queryByRole('button', { name: /Regenerate/i })
    expect(regenerateButton).not.toBeInTheDocument()
  })

  it('calls onRegenerate when Regenerate button is clicked', () => {
    render(<ImagePreview imageUrl={mockImageUrl} onApply={mockOnApply} onRegenerate={mockOnRegenerate} />)

    const regenerateButton = screen.getByRole('button', { name: /Regenerate/i })
    fireEvent.click(regenerateButton)

    expect(mockOnRegenerate).toHaveBeenCalledTimes(1)
  })

  it('disables buttons when isRegenerating is true', () => {
    render(
      <ImagePreview
        imageUrl={mockImageUrl}
        onApply={mockOnApply}
        onRegenerate={mockOnRegenerate}
        isRegenerating={true}
      />
    )

    const applyButton = screen.getByRole('button', { name: /Apply to Design/i })
    const regenerateButton = screen.getByRole('button', { name: /Regenerating.../i })

    expect(applyButton).toBeDisabled()
    expect(regenerateButton).toBeDisabled()
  })

  it('shows loading state in Regenerate button when isRegenerating', () => {
    render(
      <ImagePreview
        imageUrl={mockImageUrl}
        onApply={mockOnApply}
        onRegenerate={mockOnRegenerate}
        isRegenerating={true}
      />
    )

    const regenerateButton = screen.getByRole('button', { name: /Regenerating.../i })
    expect(regenerateButton).toBeInTheDocument()
    expect(regenerateButton).toBeDisabled()
  })

  it('does not call onApply when button is disabled', () => {
    render(
      <ImagePreview
        imageUrl={mockImageUrl}
        onApply={mockOnApply}
        onRegenerate={mockOnRegenerate}
        isRegenerating={true}
      />
    )

    const applyButton = screen.getByRole('button', { name: /Apply to Design/i })
    fireEvent.click(applyButton)

    expect(mockOnApply).not.toHaveBeenCalled()
  })

  it('applies custom className', () => {
    const customClass = 'custom-test-class'
    const { container } = render(
      <ImagePreview imageUrl={mockImageUrl} onApply={mockOnApply} className={customClass} />
    )

    expect(container.firstChild).toHaveClass(customClass)
  })

  it('displays help text', () => {
    render(<ImagePreview imageUrl={mockImageUrl} onApply={mockOnApply} />)

    expect(screen.getByText(/Not happy with the result/i)).toBeInTheDocument()
  })
})
