import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AIMugDesigner from './AIMugDesigner'
import { useDesignStore } from './store/designStore'

// Mock the design store
vi.mock('./store/designStore', () => ({
  useDesignStore: vi.fn()
}))

// Mock child components
vi.mock('./PromptInput', () => ({
  default: ({ value, onChange, onGenerate, disabled }: any) => (
    <div data-testid="prompt-input">
      <textarea
        data-testid="prompt-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      <button
        data-testid="generate-button"
        onClick={onGenerate}
        disabled={disabled}
      >
        Generate
      </button>
    </div>
  )
}))

vi.mock('./ImagePreview', () => ({
  default: ({ imageUrl, onApply, onRegenerate, isRegenerating }: any) => (
    <div data-testid="image-preview">
      <img src={imageUrl} alt="preview" />
      <button data-testid="apply-button" onClick={onApply}>Apply</button>
      <button data-testid="regenerate-button" onClick={onRegenerate} disabled={isRegenerating}>
        Regenerate
      </button>
    </div>
  )
}))

vi.mock('./QuotaDisplay', () => ({
  default: () => <div data-testid="quota-display">Quota Display</div>
}))

describe('AIMugDesigner', () => {
  const mockSetAIPrompt = vi.fn()
  const mockGenerateFromPrompt = vi.fn()
  const mockClearGenerationError = vi.fn()
  const mockUpdateDesign = vi.fn()
  const mockOnDesignComplete = vi.fn()

  const defaultStoreState = {
    aiPrompt: '',
    generatedMugRenderUrl: null,
    isGenerating: false,
    generationError: null,
    setAIPrompt: mockSetAIPrompt,
    generateFromPrompt: mockGenerateFromPrompt,
    clearGenerationError: mockClearGenerationError,
    updateDesign: mockUpdateDesign
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    ;(useDesignStore as any).mockReturnValue(defaultStoreState)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders with header and description', () => {
    render(<AIMugDesigner />)

    expect(screen.getByText(/AI-Powered Mug Design/i)).toBeInTheDocument()
    expect(screen.getByText(/Describe your dream mug design/i)).toBeInTheDocument()
  })

  it('renders QuotaDisplay component', () => {
    render(<AIMugDesigner />)

    expect(screen.getByTestId('quota-display')).toBeInTheDocument()
  })

  it('renders PromptInput component', () => {
    render(<AIMugDesigner />)

    expect(screen.getByTestId('prompt-input')).toBeInTheDocument()
  })

  it('shows manual upload fallback notice when no design generated', () => {
    render(<AIMugDesigner />)

    expect(screen.getByText(/Prefer to upload your own design?/i)).toBeInTheDocument()
  })

  it('updates prompt when user types', () => {
    render(<AIMugDesigner />)

    const textarea = screen.getByTestId('prompt-textarea')
    fireEvent.change(textarea, { target: { value: 'Test prompt' } })

    expect(mockSetAIPrompt).toHaveBeenCalledWith('Test prompt')
  })

  it('calls generateFromPrompt when Generate button is clicked', () => {
    ;(useDesignStore as any).mockReturnValue({
      ...defaultStoreState,
      aiPrompt: 'Valid prompt here'
    })

    render(<AIMugDesigner />)

    const generateButton = screen.getByTestId('generate-button')
    fireEvent.click(generateButton)

    expect(mockGenerateFromPrompt).toHaveBeenCalledWith('Valid prompt here')
  })

  it('shows loading state during generation', () => {
    ;(useDesignStore as any).mockReturnValue({
      ...defaultStoreState,
      isGenerating: true
    })

    render(<AIMugDesigner />)

    expect(screen.getByText(/Generating your design.../i)).toBeInTheDocument()
  })

  it('shows estimated time remaining during generation', () => {
    ;(useDesignStore as any).mockReturnValue({
      ...defaultStoreState,
      isGenerating: true
    })

    render(<AIMugDesigner />)

    expect(screen.getByText(/~3 seconds remaining/i)).toBeInTheDocument()

    // Fast-forward 1 second
    vi.advanceTimersByTime(1000)

    waitFor(() => {
      expect(screen.getByText(/~2 seconds remaining/i)).toBeInTheDocument()
    })
  })

  it('displays error message when generation fails', () => {
    ;(useDesignStore as any).mockReturnValue({
      ...defaultStoreState,
      generationError: 'Test error message'
    })

    render(<AIMugDesigner />)

    expect(screen.getByText(/Generation Failed/i)).toBeInTheDocument()
    expect(screen.getByText(/Test error message/i)).toBeInTheDocument()
  })

  it('clears error when dismiss button is clicked', () => {
    ;(useDesignStore as any).mockReturnValue({
      ...defaultStoreState,
      generationError: 'Test error message'
    })

    render(<AIMugDesigner />)

    const dismissButton = screen.getByLabelText(/Dismiss error/i)
    fireEvent.click(dismissButton)

    expect(mockClearGenerationError).toHaveBeenCalledTimes(1)
  })

  it('shows ImagePreview when mug render is generated', () => {
    const testImageUrl = 'data:image/png;base64,test'
    ;(useDesignStore as any).mockReturnValue({
      ...defaultStoreState,
      generatedMugRenderUrl: testImageUrl
    })

    render(<AIMugDesigner />)

    expect(screen.getByTestId('image-preview')).toBeInTheDocument()
    expect(screen.getByAltText('preview')).toHaveAttribute('src', testImageUrl)
  })

  it('applies design to mug when Apply button is clicked', () => {
    const testImageUrl = 'data:image/png;base64,test'
    ;(useDesignStore as any).mockReturnValue({
      ...defaultStoreState,
      generatedMugRenderUrl: testImageUrl
    })

    render(<AIMugDesigner onDesignComplete={mockOnDesignComplete} />)

    const applyButton = screen.getByTestId('apply-button')
    fireEvent.click(applyButton)

    expect(mockUpdateDesign).toHaveBeenCalledWith({
      uploadedImageUrl: testImageUrl,
      isComplete: true
    })
    expect(mockOnDesignComplete).toHaveBeenCalledWith(testImageUrl)
  })

  it('regenerates design when Regenerate button is clicked', () => {
    const testImageUrl = 'data:image/png;base64,test'
    ;(useDesignStore as any).mockReturnValue({
      ...defaultStoreState,
      aiPrompt: 'Test prompt',
      generatedMugRenderUrl: testImageUrl
    })

    render(<AIMugDesigner />)

    const regenerateButton = screen.getByTestId('regenerate-button')
    fireEvent.click(regenerateButton)

    expect(mockGenerateFromPrompt).toHaveBeenCalledWith('Test prompt')
  })

  it('disables inputs during generation', () => {
    ;(useDesignStore as any).mockReturnValue({
      ...defaultStoreState,
      isGenerating: true
    })

    render(<AIMugDesigner />)

    const textarea = screen.getByTestId('prompt-textarea')
    const generateButton = screen.getByTestId('generate-button')

    expect(textarea).toBeDisabled()
    expect(generateButton).toBeDisabled()
  })

  it('hides manual upload notice when design is generated', () => {
    const testImageUrl = 'data:image/png;base64,test'
    ;(useDesignStore as any).mockReturnValue({
      ...defaultStoreState,
      generatedMugRenderUrl: testImageUrl
    })

    render(<AIMugDesigner />)

    expect(screen.queryByText(/Prefer to upload your own design?/i)).not.toBeInTheDocument()
  })

  it('clears error when user starts typing', () => {
    ;(useDesignStore as any).mockReturnValue({
      ...defaultStoreState,
      generationError: 'Test error'
    })

    render(<AIMugDesigner />)

    const textarea = screen.getByTestId('prompt-textarea')
    fireEvent.change(textarea, { target: { value: 'New prompt' } })

    expect(mockClearGenerationError).toHaveBeenCalled()
  })
})
