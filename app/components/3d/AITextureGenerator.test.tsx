import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import AITextureGenerator from './AITextureGenerator'
import { useDesignStore } from './store/designStore'

// Mock the design store
vi.mock('./store/designStore', () => ({
  useDesignStore: vi.fn(),
}))

describe('AITextureGenerator', () => {
  const mockGenerateFromText = vi.fn()
  const mockClearGenerationError = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useDesignStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isGenerating: false,
      generationError: null,
      generateFromText: mockGenerateFromText,
      clearGenerationError: mockClearGenerationError,
      getState: () => ({
        generationError: null,
        currentDesign: {
          uploadedImageUrl: null,
        },
      }),
    })
  })

  it('should render prompt input field with character counter', () => {
    render(<AITextureGenerator />)

    expect(screen.getByLabelText(/AI Texture Generator/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/watercolor flowers/i)).toBeInTheDocument()
    expect(screen.getByText(/0\/500/)).toBeInTheDocument()
  })

  it('should update character counter as user types', () => {
    render(<AITextureGenerator />)

    const textarea = screen.getByPlaceholderText(/watercolor flowers/i)
    fireEvent.change(textarea, { target: { value: 'test prompt' } })

    expect(screen.getByText(/11\/500/)).toBeInTheDocument()
  })

  it('should disable Generate button when prompt is empty', () => {
    render(<AITextureGenerator />)

    const button = screen.getByRole('button', { name: /Generate Design/i })
    expect(button).toBeDisabled()
  })

  it('should disable Generate button when prompt is too short', () => {
    render(<AITextureGenerator />)

    const textarea = screen.getByPlaceholderText(/watercolor flowers/i)
    fireEvent.change(textarea, { target: { value: 'ab' } })

    const button = screen.getByRole('button', { name: /Generate Design/i })
    expect(button).toBeDisabled()
  })

  it('should enable Generate button when prompt is valid', () => {
    render(<AITextureGenerator />)

    const textarea = screen.getByPlaceholderText(/watercolor flowers/i)
    fireEvent.change(textarea, { target: { value: 'test prompt' } })

    const button = screen.getByRole('button', { name: /Generate Design/i })
    expect(button).not.toBeDisabled()
  })

  it('should prevent input beyond 500 characters', () => {
    render(<AITextureGenerator />)

    const textarea = screen.getByPlaceholderText(/watercolor flowers/i) as HTMLTextAreaElement
    const longText = 'a'.repeat(501)
    fireEvent.change(textarea, { target: { value: longText } })

    expect(textarea.value.length).toBe(500)
  })

  it('should show loading spinner when isGenerating is true', () => {
    ;(useDesignStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isGenerating: true,
      generationError: null,
      generateFromText: mockGenerateFromText,
      clearGenerationError: mockClearGenerationError,
    })

    render(<AITextureGenerator />)

    expect(screen.getByText(/Generating.../i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Generating.../i })).toBeDisabled()
  })

  it('should display error message when generationError is set', () => {
    const errorMessage = 'Network error. Please check your connection.'
    ;(useDesignStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isGenerating: false,
      generationError: errorMessage,
      generateFromText: mockGenerateFromText,
      clearGenerationError: mockClearGenerationError,
    })

    render(<AITextureGenerator />)

    expect(screen.getByText(errorMessage)).toBeInTheDocument()
  })

  it('should call generateFromText when Generate button is clicked', async () => {
    mockGenerateFromText.mockResolvedValue(undefined)

    render(<AITextureGenerator />)

    const textarea = screen.getByPlaceholderText(/watercolor flowers/i)
    fireEvent.change(textarea, { target: { value: 'test prompt' } })

    const button = screen.getByRole('button', { name: /Generate Design/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockGenerateFromText).toHaveBeenCalledWith('test prompt')
    })
  })

  it('should call clearGenerationError when user starts typing after error', () => {
    const errorMessage = 'Some error'
    ;(useDesignStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isGenerating: false,
      generationError: errorMessage,
      generateFromText: mockGenerateFromText,
      clearGenerationError: mockClearGenerationError,
    })

    render(<AITextureGenerator />)

    const textarea = screen.getByPlaceholderText(/watercolor flowers/i)
    fireEvent.change(textarea, { target: { value: 'new prompt' } })

    expect(mockClearGenerationError).toHaveBeenCalled()
  })

  it('should call clearGenerationError when error dismiss button is clicked', () => {
    const errorMessage = 'Some error'
    ;(useDesignStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isGenerating: false,
      generationError: errorMessage,
      generateFromText: mockGenerateFromText,
      clearGenerationError: mockClearGenerationError,
    })

    render(<AITextureGenerator />)

    const dismissButton = screen.getByLabelText(/Dismiss error/i)
    fireEvent.click(dismissButton)

    expect(mockClearGenerationError).toHaveBeenCalled()
  })

  it('should call onGenerationComplete callback on successful generation', async () => {
    const onGenerationComplete = vi.fn()
    const imageUrl = 'data:image/png;base64,test'

    // Mock getState to return successful state
    useDesignStore.getState = vi.fn(() => ({
      generationError: null,
      currentDesign: {
        uploadedImageUrl: imageUrl,
      },
    })) as any

    mockGenerateFromText.mockResolvedValue(undefined)

    render(<AITextureGenerator onGenerationComplete={onGenerationComplete} />)

    const textarea = screen.getByPlaceholderText(/watercolor flowers/i)
    fireEvent.change(textarea, { target: { value: 'test prompt' } })

    const button = screen.getByRole('button', { name: /Generate Design/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(onGenerationComplete).toHaveBeenCalledWith(imageUrl)
    })
  })

  it('should call onGenerationError callback on failed generation', async () => {
    const onGenerationError = vi.fn()
    const errorMessage = 'Generation failed'

    mockGenerateFromText.mockRejectedValue(new Error(errorMessage))

    render(<AITextureGenerator onGenerationError={onGenerationError} />)

    const textarea = screen.getByPlaceholderText(/watercolor flowers/i)
    fireEvent.change(textarea, { target: { value: 'test prompt' } })

    const button = screen.getByRole('button', { name: /Generate Design/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(onGenerationError).toHaveBeenCalledWith(errorMessage)
    })
  })

  it('should support Cmd/Ctrl + Enter to submit', async () => {
    mockGenerateFromText.mockResolvedValue(undefined)

    render(<AITextureGenerator />)

    const textarea = screen.getByPlaceholderText(/watercolor flowers/i)
    fireEvent.change(textarea, { target: { value: 'test prompt' } })

    // Simulate Cmd+Enter
    fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true })

    await waitFor(() => {
      expect(mockGenerateFromText).toHaveBeenCalledWith('test prompt')
    })
  })
})

describe('AITextureGenerator Mode Toggle', () => {
  const mockGenerateFromText = vi.fn()
  const mockGenerateFromImage = vi.fn()
  const mockSetGenerationMode = vi.fn()
  const mockSetBaseImageForEnhancement = vi.fn()
  const mockApplyPreviewToMug = vi.fn()
  const mockSetPreviewImage = vi.fn()
  const mockClearGenerationError = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useDesignStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isGenerating: false,
      generationError: null,
      generationMode: 'text-to-image',
      baseImageForEnhancement: undefined,
      previewImageUrl: undefined,
      generateFromText: mockGenerateFromText,
      generateFromImage: mockGenerateFromImage,
      setGenerationMode: mockSetGenerationMode,
      setBaseImageForEnhancement: mockSetBaseImageForEnhancement,
      applyPreviewToMug: mockApplyPreviewToMug,
      setPreviewImage: mockSetPreviewImage,
      clearGenerationError: mockClearGenerationError,
    })
  })

  it('should render mode toggle with three options', () => {
    render(<AITextureGenerator />)

    expect(screen.getByRole('button', { name: /Manual Upload/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Text-to-Image/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Image-to-Image/i })).toBeInTheDocument()
  })

  it('should highlight active mode', () => {
    render(<AITextureGenerator />)

    const textToImageButton = screen.getByRole('button', { name: /Text-to-Image/i })
    expect(textToImageButton).toHaveClass('bg-white', 'text-blue-600')
  })

  it('should call setGenerationMode when mode is changed', () => {
    render(<AITextureGenerator />)

    const imageToImageButton = screen.getByRole('button', { name: /Image-to-Image/i })
    fireEvent.click(imageToImageButton)

    expect(mockSetGenerationMode).toHaveBeenCalledWith('image-to-image')
  })

  it('should show manual mode message when manual is selected', () => {
    ;(useDesignStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isGenerating: false,
      generationError: null,
      generationMode: 'manual',
      baseImageForEnhancement: undefined,
      previewImageUrl: undefined,
      generateFromText: mockGenerateFromText,
      generateFromImage: mockGenerateFromImage,
      setGenerationMode: mockSetGenerationMode,
      setBaseImageForEnhancement: mockSetBaseImageForEnhancement,
      applyPreviewToMug: mockApplyPreviewToMug,
      setPreviewImage: mockSetPreviewImage,
      clearGenerationError: mockClearGenerationError,
    })

    render(<AITextureGenerator />)

    expect(screen.getByText(/Use the image upload component/i)).toBeInTheDocument()
  })

  it('should show base image upload when image-to-image mode is selected', () => {
    ;(useDesignStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isGenerating: false,
      generationError: null,
      generationMode: 'image-to-image',
      baseImageForEnhancement: undefined,
      previewImageUrl: undefined,
      generateFromText: mockGenerateFromText,
      generateFromImage: mockGenerateFromImage,
      setGenerationMode: mockSetGenerationMode,
      setBaseImageForEnhancement: mockSetBaseImageForEnhancement,
      applyPreviewToMug: mockApplyPreviewToMug,
      setPreviewImage: mockSetPreviewImage,
      clearGenerationError: mockClearGenerationError,
    })

    render(<AITextureGenerator />)

    expect(screen.getByText(/Base Image/i)).toBeInTheDocument()
    expect(screen.getByText(/Click to upload base image/i)).toBeInTheDocument()
  })

  it('should show different placeholder text for image-to-image mode', () => {
    ;(useDesignStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isGenerating: false,
      generationError: null,
      generationMode: 'image-to-image',
      baseImageForEnhancement: 'data:image/jpeg;base64,testImage',
      previewImageUrl: undefined,
      generateFromText: mockGenerateFromText,
      generateFromImage: mockGenerateFromImage,
      setGenerationMode: mockSetGenerationMode,
      setBaseImageForEnhancement: mockSetBaseImageForEnhancement,
      applyPreviewToMug: mockApplyPreviewToMug,
      setPreviewImage: mockSetPreviewImage,
      clearGenerationError: mockClearGenerationError,
    })

    render(<AITextureGenerator />)

    expect(screen.getByPlaceholderText(/make this image more vibrant/i)).toBeInTheDocument()
  })

  it('should show preview section when preview image is available', () => {
    ;(useDesignStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isGenerating: false,
      generationError: null,
      generationMode: 'image-to-image',
      baseImageForEnhancement: 'data:image/jpeg;base64,testImage',
      previewImageUrl: 'data:image/png;base64,previewImage',
      generateFromText: mockGenerateFromText,
      generateFromImage: mockGenerateFromImage,
      setGenerationMode: mockSetGenerationMode,
      setBaseImageForEnhancement: mockSetBaseImageForEnhancement,
      applyPreviewToMug: mockApplyPreviewToMug,
      setPreviewImage: mockSetPreviewImage,
      clearGenerationError: mockClearGenerationError,
    })

    render(<AITextureGenerator />)

    expect(screen.getByText(/Enhanced Preview/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Apply to Mug/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Regenerate/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument()
  })

  it('should call applyPreviewToMug when Apply to Mug is clicked', () => {
    ;(useDesignStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isGenerating: false,
      generationError: null,
      generationMode: 'image-to-image',
      baseImageForEnhancement: 'data:image/jpeg;base64,testImage',
      previewImageUrl: 'data:image/png;base64,previewImage',
      generateFromText: mockGenerateFromText,
      generateFromImage: mockGenerateFromImage,
      setGenerationMode: mockSetGenerationMode,
      setBaseImageForEnhancement: mockSetBaseImageForEnhancement,
      applyPreviewToMug: mockApplyPreviewToMug,
      setPreviewImage: mockSetPreviewImage,
      clearGenerationError: mockClearGenerationError,
    })

    render(<AITextureGenerator />)

    const applyButton = screen.getByRole('button', { name: /Apply to Mug/i })
    fireEvent.click(applyButton)

    expect(mockApplyPreviewToMug).toHaveBeenCalled()
  })
})
