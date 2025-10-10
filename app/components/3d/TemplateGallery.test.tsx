import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TemplateGallery from './TemplateGallery'
import { MUG_TEMPLATES } from '@/lib/templates/mugTemplates'

describe('TemplateGallery', () => {
  const mockOnSelectTemplate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock gtag
    ;(window as any).gtag = vi.fn()
  })

  it('renders with header and description', () => {
    render(<TemplateGallery onSelectTemplate={mockOnSelectTemplate} />)

    expect(screen.getByText(/Start from a Template/i)).toBeInTheDocument()
    expect(screen.getByText(/Choose a style and customize/i)).toBeInTheDocument()
  })

  it('renders all templates from MUG_TEMPLATES', () => {
    render(<TemplateGallery onSelectTemplate={mockOnSelectTemplate} />)

    MUG_TEMPLATES.forEach(template => {
      expect(screen.getByText(template.name)).toBeInTheDocument()
      expect(screen.getByText(template.description)).toBeInTheDocument()
    })
  })

  it('displays thumbnail image for each template', () => {
    render(<TemplateGallery onSelectTemplate={mockOnSelectTemplate} />)

    const images = screen.getAllByRole('img')
    expect(images.length).toBe(MUG_TEMPLATES.length)

    MUG_TEMPLATES.forEach(template => {
      const img = screen.getByAltText(template.description)
      expect(img).toBeInTheDocument()
    })
  })

  it('displays Customize button for each template', () => {
    render(<TemplateGallery onSelectTemplate={mockOnSelectTemplate} />)

    const customizeButtons = screen.getAllByRole('button', { name: /Customize/i })
    expect(customizeButtons.length).toBe(MUG_TEMPLATES.length)
  })

  it('displays category badge for each template', () => {
    render(<TemplateGallery onSelectTemplate={mockOnSelectTemplate} />)

    // Get all unique categories
    const uniqueCategories = Array.from(new Set(MUG_TEMPLATES.map(t => t.category)))

    uniqueCategories.forEach(category => {
      const categoryBadges = screen.getAllByText(category)
      const expectedCount = MUG_TEMPLATES.filter(t => t.category === category).length

      expect(categoryBadges.length).toBe(expectedCount)
    })
  })

  it('calls onSelectTemplate when template card is clicked', () => {
    render(<TemplateGallery onSelectTemplate={mockOnSelectTemplate} />)

    const firstTemplate = MUG_TEMPLATES[0]
    const templateCard = screen.getByRole('button', { name: `Select ${firstTemplate.name} template` })

    fireEvent.click(templateCard)

    expect(mockOnSelectTemplate).toHaveBeenCalledWith(firstTemplate.id, firstTemplate.prompt)
  })

  it('calls onSelectTemplate when Customize button is clicked', () => {
    render(<TemplateGallery onSelectTemplate={mockOnSelectTemplate} />)

    const firstTemplate = MUG_TEMPLATES[0]
    const customizeButtons = screen.getAllByRole('button', { name: /Customize/i })

    fireEvent.click(customizeButtons[0])

    expect(mockOnSelectTemplate).toHaveBeenCalledWith(firstTemplate.id, firstTemplate.prompt)
  })

  it('shows visual indication for selected template', () => {
    const selectedId = MUG_TEMPLATES[0].id
    render(<TemplateGallery onSelectTemplate={mockOnSelectTemplate} selectedTemplateId={selectedId} />)

    const selectedCard = screen.getByRole('button', { name: `Select ${MUG_TEMPLATES[0].name} template` })

    expect(selectedCard).toHaveClass('border-blue-500')
    expect(selectedCard).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows checkmark icon on selected template', () => {
    const selectedId = MUG_TEMPLATES[0].id
    render(<TemplateGallery onSelectTemplate={mockOnSelectTemplate} selectedTemplateId={selectedId} />)

    // Check for checkmark SVG
    const selectedCard = screen.getByRole('button', { name: `Select ${MUG_TEMPLATES[0].name} template` })
    expect(selectedCard.querySelector('svg')).toBeInTheDocument()
  })

  it('changes Customize button text to Selected for selected template', () => {
    const selectedId = MUG_TEMPLATES[0].id
    render(<TemplateGallery onSelectTemplate={mockOnSelectTemplate} selectedTemplateId={selectedId} />)

    expect(screen.getByRole('button', { name: `Customize ${MUG_TEMPLATES[0].name} template` })).toHaveTextContent('Selected')
  })

  it('disables all templates when disabled prop is true', () => {
    render(<TemplateGallery onSelectTemplate={mockOnSelectTemplate} disabled={true} />)

    const templateCards = screen.getAllByRole('button', { name: /Select .* template/i })

    templateCards.forEach(card => {
      expect(card).toHaveAttribute('tabindex', '-1')
    })

    const customizeButtons = screen.getAllByRole('button', { name: /Customize/i })
    customizeButtons.forEach(button => {
      expect(button).toBeDisabled()
    })
  })

  it('does not call onSelectTemplate when disabled', () => {
    render(<TemplateGallery onSelectTemplate={mockOnSelectTemplate} disabled={true} />)

    const firstCard = screen.getAllByRole('button', { name: /Select .* template/i })[0]
    fireEvent.click(firstCard)

    expect(mockOnSelectTemplate).not.toHaveBeenCalled()
  })

  it('supports keyboard navigation with Enter key', () => {
    render(<TemplateGallery onSelectTemplate={mockOnSelectTemplate} />)

    const firstTemplate = MUG_TEMPLATES[0]
    const templateCard = screen.getByRole('button', { name: `Select ${firstTemplate.name} template` })

    fireEvent.keyDown(templateCard, { key: 'Enter' })

    expect(mockOnSelectTemplate).toHaveBeenCalledWith(firstTemplate.id, firstTemplate.prompt)
  })

  it('supports keyboard navigation with Space key', () => {
    render(<TemplateGallery onSelectTemplate={mockOnSelectTemplate} />)

    const firstTemplate = MUG_TEMPLATES[0]
    const templateCard = screen.getByRole('button', { name: `Select ${firstTemplate.name} template` })

    fireEvent.keyDown(templateCard, { key: ' ' })

    expect(mockOnSelectTemplate).toHaveBeenCalledWith(firstTemplate.id, firstTemplate.prompt)
  })

  it('tracks analytics event when template is selected', () => {
    render(<TemplateGallery onSelectTemplate={mockOnSelectTemplate} />)

    const firstTemplate = MUG_TEMPLATES[0]
    const templateCard = screen.getByRole('button', { name: `Select ${firstTemplate.name} template` })

    fireEvent.click(templateCard)

    expect((window as any).gtag).toHaveBeenCalledWith('event', 'template_selected', {
      event_category: 'ai_generation',
      template_id: firstTemplate.id,
      template_name: firstTemplate.name,
      template_category: firstTemplate.category
    })
  })

  it('displays helper tip text', () => {
    render(<TemplateGallery onSelectTemplate={mockOnSelectTemplate} />)

    expect(screen.getByText(/you can edit the prompt before generating/i)).toBeInTheDocument()
  })

  it('hides helper tip when disabled', () => {
    render(<TemplateGallery onSelectTemplate={mockOnSelectTemplate} disabled={true} />)

    expect(screen.queryByText(/you can edit the prompt before generating/i)).not.toBeInTheDocument()
  })

  it('applies custom className', () => {
    const customClass = 'custom-test-class'
    const { container } = render(
      <TemplateGallery onSelectTemplate={mockOnSelectTemplate} className={customClass} />
    )

    expect(container.firstChild).toHaveClass(customClass)
  })

  it('renders templates in a responsive grid', () => {
    const { container } = render(<TemplateGallery onSelectTemplate={mockOnSelectTemplate} />)

    const grid = container.querySelector('.grid')
    expect(grid).toHaveClass('grid-cols-1')
    expect(grid).toHaveClass('sm:grid-cols-2')
    expect(grid).toHaveClass('lg:grid-cols-3')
  })

  it('handles multiple template selections correctly', () => {
    const { rerender } = render(
      <TemplateGallery onSelectTemplate={mockOnSelectTemplate} selectedTemplateId={MUG_TEMPLATES[0].id} />
    )

    // First template should be selected
    expect(screen.getByRole('button', { name: `Customize ${MUG_TEMPLATES[0].name} template` })).toHaveTextContent('Selected')

    // Select second template
    rerender(
      <TemplateGallery onSelectTemplate={mockOnSelectTemplate} selectedTemplateId={MUG_TEMPLATES[1].id} />
    )

    // First template should no longer be selected
    expect(screen.getByRole('button', { name: `Customize ${MUG_TEMPLATES[0].name} template` })).toHaveTextContent('Customize')

    // Second template should be selected
    expect(screen.getByRole('button', { name: `Customize ${MUG_TEMPLATES[1].name} template` })).toHaveTextContent('Selected')
  })
})
