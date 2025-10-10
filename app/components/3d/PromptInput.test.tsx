import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PromptInput from './PromptInput'

describe('PromptInput', () => {
  const mockOnChange = vi.fn()
  const mockOnGenerate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Clear localStorage before each test
    localStorage.clear()
    // Mock gtag
    ;(window as any).gtag = vi.fn()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('renders with placeholder text', () => {
    render(<PromptInput value="" onChange={mockOnChange} onGenerate={mockOnGenerate} />)

    const textarea = screen.getByPlaceholderText(/watercolor flowers/i)
    expect(textarea).toBeInTheDocument()
  })

  it('displays character counter', () => {
    render(<PromptInput value="" onChange={mockOnChange} onGenerate={mockOnGenerate} />)

    expect(screen.getByText('0/500 characters')).toBeInTheDocument()
  })

  it('updates character counter as user types', () => {
    const { rerender } = render(<PromptInput value="" onChange={mockOnChange} onGenerate={mockOnGenerate} />)

    const textarea = screen.getByPlaceholderText(/watercolor flowers/i)
    fireEvent.change(textarea, { target: { value: 'Hello World' } })

    // onChange should be called
    expect(mockOnChange).toHaveBeenCalledWith('Hello World')
  })

  it('displays character count for provided value', () => {
    render(<PromptInput value="Hello" onChange={mockOnChange} onGenerate={mockOnGenerate} />)

    expect(screen.getByText('5/500 characters')).toBeInTheDocument()
  })

  it('disables Generate button when prompt is too short', () => {
    render(<PromptInput value="Hi" onChange={mockOnChange} onGenerate={mockOnGenerate} />)

    const button = screen.getByRole('button', { name: /Generate Mug Design/i })
    expect(button).toBeDisabled()
  })

  it('disables Generate button when prompt is empty', () => {
    render(<PromptInput value="" onChange={mockOnChange} onGenerate={mockOnGenerate} />)

    const button = screen.getByRole('button', { name: /Generate Mug Design/i })
    expect(button).toBeDisabled()
  })

  it('enables Generate button when prompt is valid (3-500 chars)', () => {
    render(<PromptInput value="Valid prompt here" onChange={mockOnChange} onGenerate={mockOnGenerate} />)

    const button = screen.getByRole('button', { name: /Generate Mug Design/i })
    expect(button).not.toBeDisabled()
  })

  it('prevents input beyond 500 characters', () => {
    const longText = 'a'.repeat(600)
    render(<PromptInput value="" onChange={mockOnChange} onGenerate={mockOnGenerate} />)

    const textarea = screen.getByPlaceholderText(/watercolor flowers/i)
    fireEvent.change(textarea, { target: { value: longText } })

    // Should not call onChange since it exceeds limit
    expect(mockOnChange).not.toHaveBeenCalled()
  })

  it('calls onGenerate when Generate button is clicked', () => {
    render(<PromptInput value="Valid prompt" onChange={mockOnChange} onGenerate={mockOnGenerate} />)

    const button = screen.getByRole('button', { name: /Generate Mug Design/i })
    fireEvent.click(button)

    expect(mockOnGenerate).toHaveBeenCalledTimes(1)
  })

  it('calls onGenerate when Cmd+Enter is pressed', () => {
    render(<PromptInput value="Valid prompt" onChange={mockOnChange} onGenerate={mockOnGenerate} />)

    const textarea = screen.getByPlaceholderText(/watercolor flowers/i)
    fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true })

    expect(mockOnGenerate).toHaveBeenCalledTimes(1)
  })

  it('calls onGenerate when Ctrl+Enter is pressed', () => {
    render(<PromptInput value="Valid prompt" onChange={mockOnChange} onGenerate={mockOnGenerate} />)

    const textarea = screen.getByPlaceholderText(/watercolor flowers/i)
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true })

    expect(mockOnGenerate).toHaveBeenCalledTimes(1)
  })

  it('does not call onGenerate on Cmd+Enter if prompt is invalid', () => {
    render(<PromptInput value="Hi" onChange={mockOnChange} onGenerate={mockOnGenerate} />)

    const textarea = screen.getByPlaceholderText(/watercolor flowers/i)
    fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true })

    expect(mockOnGenerate).not.toHaveBeenCalled()
  })

  it('shows prompt examples for first-time users', () => {
    render(<PromptInput value="" onChange={mockOnChange} onGenerate={mockOnGenerate} />)

    expect(screen.getByText(/Try one of these examples:/i)).toBeInTheDocument()
    expect(screen.getByText(/Watercolor flowers on white ceramic/i)).toBeInTheDocument()
  })

  it('does not show prompt examples for returning users', () => {
    // Simulate returning user
    localStorage.setItem('bmad_ai_prompt_first_time', 'true')

    render(<PromptInput value="" onChange={mockOnChange} onGenerate={mockOnGenerate} />)

    expect(screen.queryByText(/Try one of these examples:/i)).not.toBeInTheDocument()
  })

  it('pre-fills textarea when example is clicked', () => {
    render(<PromptInput value="" onChange={mockOnChange} onGenerate={mockOnGenerate} />)

    const exampleButton = screen.getByText(/Watercolor flowers on white ceramic/i)
    fireEvent.click(exampleButton)

    expect(mockOnChange).toHaveBeenCalledWith('Watercolor flowers on white ceramic')
  })

  it('tracks analytics event when example is clicked', () => {
    render(<PromptInput value="" onChange={mockOnChange} onGenerate={mockOnGenerate} />)

    const exampleButton = screen.getByText(/Watercolor flowers on white ceramic/i)
    fireEvent.click(exampleButton)

    expect((window as any).gtag).toHaveBeenCalledWith('event', 'prompt_example_used', {
      event_category: 'ai_generation',
      example_id: 'watercolor-flowers'
    })
  })

  it('tracks analytics event when Generate button is clicked', () => {
    render(<PromptInput value="Test prompt here" onChange={mockOnChange} onGenerate={mockOnGenerate} />)

    const button = screen.getByRole('button', { name: /Generate Mug Design/i })
    fireEvent.click(button)

    expect((window as any).gtag).toHaveBeenCalledWith('event', 'ai_prompt_entered', {
      event_category: 'ai_generation',
      prompt_length: 16,
      characters_remaining: 484
    })
  })

  it('disables all inputs when disabled prop is true', () => {
    render(<PromptInput value="Test" onChange={mockOnChange} onGenerate={mockOnGenerate} disabled={true} />)

    const textarea = screen.getByPlaceholderText(/watercolor flowers/i)
    const button = screen.getByRole('button', { name: /Generate Mug Design/i })

    expect(textarea).toBeDisabled()
    expect(button).toBeDisabled()
  })

  it('shows validation message when prompt is too short', () => {
    render(<PromptInput value="Hi" onChange={mockOnChange} onGenerate={mockOnGenerate} />)

    expect(screen.getByText(/Please enter at least 3 characters/i)).toBeInTheDocument()
  })

  it('applies correct styling classes', () => {
    const customClass = 'custom-test-class'
    const { container } = render(
      <PromptInput value="" onChange={mockOnChange} onGenerate={mockOnGenerate} className={customClass} />
    )

    expect(container.firstChild).toHaveClass(customClass)
  })
})
