import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useDesignStore } from './designStore'

describe('DesignStore Text Actions', () => {
  beforeEach(() => {
    // Reset store to default state before each test
    useDesignStore.getState().resetToDefault()
  })

  it('should set custom text', () => {
    const { setCustomText, currentDesign } = useDesignStore.getState()
    
    setCustomText('Hello World')
    
    expect(useDesignStore.getState().currentDesign.customText).toBe('Hello World')
    expect(useDesignStore.getState().currentDesign.lastModified).not.toBe(currentDesign.lastModified)
  })

  it('should set text font', () => {
    const { setTextFont, currentDesign } = useDesignStore.getState()
    
    setTextFont('Times, serif')
    
    expect(useDesignStore.getState().currentDesign.textFont).toBe('Times, serif')
    expect(useDesignStore.getState().currentDesign.lastModified).not.toBe(currentDesign.lastModified)
  })

  it('should set text position', () => {
    const { setTextPosition, currentDesign } = useDesignStore.getState()
    const position = { x: 1.5, y: -0.5, z: 0.2 }
    
    setTextPosition(position)
    
    expect(JSON.parse(useDesignStore.getState().currentDesign.textPosition!)).toEqual(position)
    expect(useDesignStore.getState().currentDesign.lastModified).not.toBe(currentDesign.lastModified)
  })

  it('should set text size', () => {
    const { setTextSize, currentDesign } = useDesignStore.getState()
    
    setTextSize(1.5)
    
    expect(useDesignStore.getState().currentDesign.textSize).toBe(1.5)
    expect(useDesignStore.getState().currentDesign.lastModified).not.toBe(currentDesign.lastModified)
  })

  it('should set text color', () => {
    const { setTextColor, currentDesign } = useDesignStore.getState()
    
    setTextColor('#ff0000')
    
    expect(useDesignStore.getState().currentDesign.textColor).toBe('#ff0000')
    expect(useDesignStore.getState().currentDesign.lastModified).not.toBe(currentDesign.lastModified)
  })

  it('should reset to default values including text properties', () => {
    const store = useDesignStore.getState()
    
    // Modify text properties
    store.setCustomText('Test Text')
    store.setTextFont('Times, serif')
    store.setTextPosition({ x: 1, y: 1, z: 1 })
    store.setTextSize(2.0)
    store.setTextColor('#ff0000')
    
    // Reset
    store.resetToDefault()
    
    const newState = useDesignStore.getState()
    expect(newState.currentDesign.customText).toBeUndefined()
    expect(newState.currentDesign.textFont).toBe('Arial, sans-serif')
    expect(JSON.parse(newState.currentDesign.textPosition!)).toEqual({ x: 0, y: 0, z: 0 })
    expect(newState.currentDesign.textSize).toBe(1.0)
    expect(newState.currentDesign.textColor).toBe('#000000')
  })

  it('should update design with multiple text properties', () => {
    const { updateDesign, currentDesign } = useDesignStore.getState()
    
    updateDesign({
      customText: 'Updated Text',
      textFont: 'Impact, fantasy',
      textSize: 1.8,
      textColor: '#0066cc'
    })
    
    const newState = useDesignStore.getState()
    expect(newState.currentDesign.customText).toBe('Updated Text')
    expect(newState.currentDesign.textFont).toBe('Impact, fantasy')
    expect(newState.currentDesign.textSize).toBe(1.8)
    expect(newState.currentDesign.textColor).toBe('#0066cc')
    expect(newState.currentDesign.lastModified).not.toBe(currentDesign.lastModified)
  })

  it('should handle text position as JSON string correctly', () => {
    const { setTextPosition } = useDesignStore.getState()
    const position = { x: -0.5, y: 0.75, z: -0.25 }
    
    setTextPosition(position)
    
    const storedPosition = JSON.parse(useDesignStore.getState().currentDesign.textPosition!)
    expect(storedPosition).toEqual(position)
    expect(typeof useDesignStore.getState().currentDesign.textPosition).toBe('string')
  })

  it('should preserve other design properties when updating text', () => {
    const store = useDesignStore.getState()
    const originalColor = store.currentDesign.mugColor
    const originalId = store.currentDesign.id
    
    store.setCustomText('Test Text')
    
    const newState = useDesignStore.getState()
    expect(newState.currentDesign.mugColor).toBe(originalColor)
    expect(newState.currentDesign.id).toBe(originalId)
    expect(newState.currentDesign.customText).toBe('Test Text')
  })

  it('should handle clearing custom text', () => {
    const { setCustomText } = useDesignStore.getState()
    
    setCustomText('Initial Text')
    expect(useDesignStore.getState().currentDesign.customText).toBe('Initial Text')
    
    setCustomText('')
    expect(useDesignStore.getState().currentDesign.customText).toBe('')
  })

  it('should handle edge cases for text size', () => {
    const { setTextSize } = useDesignStore.getState()
    
    setTextSize(0.1)
    expect(useDesignStore.getState().currentDesign.textSize).toBe(0.1)
    
    setTextSize(5.0)
    expect(useDesignStore.getState().currentDesign.textSize).toBe(5.0)
  })
})

describe('DesignStore AI Generation Actions', () => {
  beforeEach(() => {
    // Reset store to default state before each test
    useDesignStore.getState().resetToDefault()
    vi.clearAllMocks()
  })

  it('should set isGenerating to true when generateFromText is called', async () => {
    // Mock successful API response
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          imageUrl: 'data:image/png;base64,testdata',
          success: true,
        }),
      })
    ) as unknown as typeof fetch

    const { generateFromText } = useDesignStore.getState()
    const promise = generateFromText('test prompt')

    // Check that isGenerating is true during the call
    expect(useDesignStore.getState().isGenerating).toBe(true)

    await promise

    // Check that isGenerating is false after completion
    expect(useDesignStore.getState().isGenerating).toBe(false)
  })

  it('should update uploadedImageUrl on successful generation', async () => {
    const mockImageUrl = 'data:image/png;base64,testdata'
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          imageUrl: mockImageUrl,
          success: true,
        }),
      })
    ) as unknown as typeof fetch

    const { generateFromText } = useDesignStore.getState()
    await generateFromText('watercolor flowers')

    const state = useDesignStore.getState()
    expect(state.currentDesign.uploadedImageUrl).toBe(mockImageUrl)
    expect(state.isGenerating).toBe(false)
    expect(state.generationError).toBe(null)
  })

  it('should set generationError on API failure', async () => {
    const errorMessage = 'Network error. Please check your connection.'
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: async () => ({
          error: errorMessage,
          success: false,
        }),
      })
    ) as unknown as typeof fetch

    const { generateFromText } = useDesignStore.getState()
    await generateFromText('test prompt')

    const state = useDesignStore.getState()
    expect(state.generationError).toBe(errorMessage)
    expect(state.isGenerating).toBe(false)
    expect(state.currentDesign.uploadedImageUrl).toBeUndefined()
  })

  it('should update lastModified when AI image is generated', async () => {
    const mockImageUrl = 'data:image/png;base64,testdata'
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          imageUrl: mockImageUrl,
          success: true,
        }),
      })
    ) as unknown as typeof fetch

    const { generateFromText, currentDesign } = useDesignStore.getState()
    const originalLastModified = currentDesign.lastModified

    // Wait a bit to ensure timestamp changes
    await new Promise((resolve) => setTimeout(resolve, 10))
    await generateFromText('test prompt')

    const newState = useDesignStore.getState()
    expect(newState.currentDesign.lastModified).not.toBe(originalLastModified)
  })

  it('should clear generationError when clearGenerationError is called', () => {
    const { clearGenerationError } = useDesignStore.getState()

    // Manually set error for testing
    useDesignStore.setState({ generationError: 'Some error' })
    expect(useDesignStore.getState().generationError).toBe('Some error')

    clearGenerationError()
    expect(useDesignStore.getState().generationError).toBe(null)
  })

  it('should clear previous errors when generateFromText is called', async () => {
    // Set an initial error
    useDesignStore.setState({ generationError: 'Previous error' })

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          imageUrl: 'data:image/png;base64,testdata',
          success: true,
        }),
      })
    ) as unknown as typeof fetch

    const { generateFromText } = useDesignStore.getState()
    const promise = generateFromText('test prompt')

    // Check that error is cleared immediately
    expect(useDesignStore.getState().generationError).toBe(null)

    await promise
  })

  it('should handle network errors gracefully', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Network failure'))) as unknown as typeof fetch

    const { generateFromText } = useDesignStore.getState()
    await generateFromText('test prompt')

    const state = useDesignStore.getState()
    expect(state.generationError).toBeTruthy()
    expect(state.isGenerating).toBe(false)
  })

  it('should not update uploadedImageUrl when generation fails', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: async () => ({
          error: 'Generation failed',
          success: false,
        }),
      })
    ) as unknown as typeof fetch

    const { generateFromText, currentDesign } = useDesignStore.getState()
    const originalImageUrl = currentDesign.uploadedImageUrl

    await generateFromText('test prompt')

    expect(useDesignStore.getState().currentDesign.uploadedImageUrl).toBe(originalImageUrl)
  })

  it('should make POST request to /api/generate-texture with correct payload', async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          imageUrl: 'data:image/png;base64,testdata',
          success: true,
        }),
      })
    ) as unknown as typeof fetch

    global.fetch = mockFetch

    const { generateFromText } = useDesignStore.getState()
    await generateFromText('abstract geometric patterns')

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/generate-texture',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'abstract geometric patterns',
          mode: 'text-to-image',
        }),
      })
    )
  })
})

describe('DesignStore Image-to-Image Actions', () => {
  beforeEach(() => {
    useDesignStore.getState().resetToDefault()
    vi.clearAllMocks()
  })

  it('should set base image for enhancement', () => {
    const { setBaseImageForEnhancement } = useDesignStore.getState()
    const baseImageData = 'data:image/jpeg;base64,testImageData'
    
    setBaseImageForEnhancement(baseImageData)
    
    expect(useDesignStore.getState().baseImageForEnhancement).toBe(baseImageData)
  })

  it('should set preview image', () => {
    const { setPreviewImage } = useDesignStore.getState()
    const previewUrl = 'data:image/png;base64,previewImageData'
    
    setPreviewImage(previewUrl)
    
    expect(useDesignStore.getState().previewImageUrl).toBe(previewUrl)
  })

  it('should apply preview to mug', () => {
    const { setPreviewImage, applyPreviewToMug } = useDesignStore.getState()
    const previewUrl = 'data:image/png;base64,previewImageData'
    
    setPreviewImage(previewUrl)
    applyPreviewToMug()
    
    expect(useDesignStore.getState().currentDesign.uploadedImageUrl).toBe(previewUrl)
    expect(useDesignStore.getState().previewImageUrl).toBeUndefined()
  })

  it('should set generation mode and clear appropriate state', () => {
    const { setGenerationMode, setBaseImageForEnhancement, setPreviewImage } = useDesignStore.getState()
    
    // Set up initial state
    setBaseImageForEnhancement('data:image/jpeg;base64,baseImage')
    setPreviewImage('data:image/png;base64,preview')
    
    // Switch to manual mode - should clear both
    setGenerationMode('manual')
    expect(useDesignStore.getState().generationMode).toBe('manual')
    expect(useDesignStore.getState().baseImageForEnhancement).toBeUndefined()
    expect(useDesignStore.getState().previewImageUrl).toBeUndefined()
    
    // Reset state
    setBaseImageForEnhancement('data:image/jpeg;base64,baseImage')
    setPreviewImage('data:image/png;base64,preview')
    
    // Switch to text-to-image - should clear base image but keep preview
    setGenerationMode('text-to-image')
    expect(useDesignStore.getState().generationMode).toBe('text-to-image')
    expect(useDesignStore.getState().baseImageForEnhancement).toBeUndefined()
    expect(useDesignStore.getState().previewImageUrl).toBe('data:image/png;base64,preview')
    
    // Reset state
    setBaseImageForEnhancement('data:image/jpeg;base64,baseImage')
    setPreviewImage('data:image/png;base64,preview')
    
    // Switch to image-to-image - should clear preview but keep base image
    setGenerationMode('image-to-image')
    expect(useDesignStore.getState().generationMode).toBe('image-to-image')
    expect(useDesignStore.getState().baseImageForEnhancement).toBe('data:image/jpeg;base64,baseImage')
    expect(useDesignStore.getState().previewImageUrl).toBeUndefined()
  })

  it('should return error when generateFromImage called without base image', async () => {
    const { generateFromImage } = useDesignStore.getState()
    
    await generateFromImage('', 'test prompt')
    
    expect(useDesignStore.getState().generationError).toBe('Please upload a base image first.')
    expect(useDesignStore.getState().isGenerating).toBe(false)
  })

  it('should successfully generate from image', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        imageUrl: 'data:image/png;base64,enhancedImageData',
        success: true,
        quota: { remaining: 4, limit: 5, ipUsed: 1 }
      })
    }

    global.fetch = vi.fn(() => Promise.resolve(mockResponse)) as unknown as typeof fetch

    const { generateFromImage } = useDesignStore.getState()
    const baseImage = 'data:image/jpeg;base64,baseImageData'
    
    await generateFromImage(baseImage, 'make it more vibrant')
    
    expect(fetch).toHaveBeenCalledWith('/api/generate-texture', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'make it more vibrant',
        mode: 'image-to-image',
        baseImage: baseImage,
      }),
    })
    
    expect(useDesignStore.getState().previewImageUrl).toBe('data:image/png;base64,enhancedImageData')
    expect(useDesignStore.getState().isGenerating).toBe(false)
    expect(useDesignStore.getState().generationError).toBeNull()
  })

  it('should handle generateFromImage API error', async () => {
    const mockResponse = {
      ok: false,
      json: async () => ({
        error: 'Enhancement failed',
        success: false
      })
    }

    global.fetch = vi.fn(() => Promise.resolve(mockResponse)) as unknown as typeof fetch

    const { generateFromImage } = useDesignStore.getState()
    const baseImage = 'data:image/jpeg;base64,baseImageData'
    
    await generateFromImage(baseImage, 'make it more vibrant')
    
    expect(useDesignStore.getState().generationError).toBe('Enhancement failed')
    expect(useDesignStore.getState().isGenerating).toBe(false)
    expect(useDesignStore.getState().previewImageUrl).toBeUndefined()
  })
})

describe('DesignStore AI Prompt Actions (Story 9.1)', () => {
  beforeEach(() => {
    // Reset store to default state before each test
    useDesignStore.getState().resetToDefault()
    vi.clearAllMocks()
  })

  it('should set AI prompt', () => {
    const { setAIPrompt } = useDesignStore.getState()

    setAIPrompt('Watercolor flowers on white ceramic')

    expect(useDesignStore.getState().aiPrompt).toBe('Watercolor flowers on white ceramic')
  })

  it('should initialize with empty AI prompt', () => {
    const { aiPrompt } = useDesignStore.getState()

    expect(aiPrompt).toBe('')
  })

  it('should initialize with null generatedMugRenderUrl', () => {
    const { generatedMugRenderUrl } = useDesignStore.getState()

    expect(generatedMugRenderUrl).toBeNull()
  })

  it('should generate from prompt successfully (full-mug-render mode)', async () => {
    const mockImageUrl = 'data:image/png;base64,mockFullMugRender'
    const mockResponse = {
      ok: true,
      json: async () => ({
        imageUrl: mockImageUrl,
        success: true,
        quota: {
          remaining: 4,
          limit: 5,
          layer: 1,
          ipUsed: 1
        }
      })
    }

    global.fetch = vi.fn(() => Promise.resolve(mockResponse)) as unknown as typeof fetch

    const { generateFromPrompt } = useDesignStore.getState()

    await generateFromPrompt('Abstract geometric patterns')

    expect(global.fetch).toHaveBeenCalledWith('/api/generate-texture', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'Abstract geometric patterns',
        mode: 'full-mug-render'
      }),
    })

    expect(useDesignStore.getState().generatedMugRenderUrl).toBe(mockImageUrl)
    expect(useDesignStore.getState().isGenerating).toBe(false)
    expect(useDesignStore.getState().generationError).toBeNull()
  })

  it('should set isGenerating to true when generateFromPrompt is called', async () => {
    // Create a promise that never resolves to keep isGenerating true
    global.fetch = vi.fn(() => new Promise(() => {})) as unknown as typeof fetch

    const { generateFromPrompt } = useDesignStore.getState()

    const generatePromise = generateFromPrompt('Test prompt')

    // isGenerating should be true while generating
    expect(useDesignStore.getState().isGenerating).toBe(true)
  })

  it('should update rate limit state after successful generation', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        imageUrl: 'data:image/png;base64,test',
        success: true,
        quota: {
          remaining: 3,
          limit: 5,
          layer: 1,
          ipUsed: 2
        }
      })
    }

    global.fetch = vi.fn(() => Promise.resolve(mockResponse)) as unknown as typeof fetch

    const { generateFromPrompt } = useDesignStore.getState()

    await generateFromPrompt('Test prompt')

    const state = useDesignStore.getState()
    expect(state.rateLimit.sessionUsed).toBe(1)
    expect(state.rateLimit.ipUsed).toBe(2)
    expect(state.rateLimit.ipLimit).toBe(5)
  })

  it('should handle rate limit errors (global limit)', async () => {
    const mockResponse = {
      ok: false,
      json: async () => ({
        error: 'Service temporarily at capacity.',
        code: 'GLOBAL_LIMIT_REACHED',
        retryAfter: '2025-10-10T00:00:00.000Z',
        success: false
      })
    }

    global.fetch = vi.fn(() => Promise.resolve(mockResponse)) as unknown as typeof fetch

    const { generateFromPrompt } = useDesignStore.getState()

    await generateFromPrompt('Test prompt')

    expect(useDesignStore.getState().generationError).toBeTruthy()
    expect(useDesignStore.getState().rateLimit.globalReached).toBe(true)
    expect(useDesignStore.getState().isGenerating).toBe(false)
  })

  it('should handle rate limit errors (IP limit)', async () => {
    const mockResponse = {
      ok: false,
      json: async () => ({
        error: 'Daily limit reached.',
        code: 'IP_LIMIT_REACHED',
        limit: 15,
        retryAfter: '2025-10-10T00:00:00.000Z',
        success: false
      })
    }

    global.fetch = vi.fn(() => Promise.resolve(mockResponse)) as unknown as typeof fetch

    const { generateFromPrompt } = useDesignStore.getState()

    await generateFromPrompt('Test prompt')

    const state = useDesignStore.getState()
    expect(state.generationError).toBeTruthy()
    expect(state.rateLimit.ipUsed).toBe(15)
    expect(state.rateLimit.ipLimit).toBe(15)
    expect(state.isGenerating).toBe(false)
  })

  it('should handle network errors gracefully', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error'))) as unknown as typeof fetch

    const { generateFromPrompt } = useDesignStore.getState()

    await generateFromPrompt('Test prompt')

    expect(useDesignStore.getState().generationError).toBe('Network error')
    expect(useDesignStore.getState().isGenerating).toBe(false)
    expect(useDesignStore.getState().generatedMugRenderUrl).toBeNull()
  })

  it('should handle generic errors', async () => {
    const mockResponse = {
      ok: false,
      json: async () => ({
        error: 'Something went wrong',
        success: false
      })
    }

    global.fetch = vi.fn(() => Promise.resolve(mockResponse)) as unknown as typeof fetch

    const { generateFromPrompt } = useDesignStore.getState()

    await generateFromPrompt('Test prompt')

    expect(useDesignStore.getState().generationError).toBe('Something went wrong')
    expect(useDesignStore.getState().isGenerating).toBe(false)
  })

  it('should clear generation error', () => {
    const store = useDesignStore.getState()

    // Set an error first
    store.generateFromPrompt('').catch(() => {}) // Will fail

    // Clear it
    store.clearGenerationError()

    expect(useDesignStore.getState().generationError).toBeNull()
  })
})

describe('DesignStore Template Actions (Story 9.2)', () => {
  beforeEach(() => {
    // Reset store to default state before each test
    useDesignStore.getState().resetToDefault()
    vi.clearAllMocks()
  })

  it('should initialize with null selectedTemplate', () => {
    const { selectedTemplate } = useDesignStore.getState()

    expect(selectedTemplate).toBeNull()
  })

  it('should select template and update aiPrompt', () => {
    const { selectTemplate } = useDesignStore.getState()

    selectTemplate('classic-white', 'clean white ceramic mug with simple elegant design')

    const state = useDesignStore.getState()
    expect(state.selectedTemplate).toBe('classic-white')
    expect(state.aiPrompt).toBe('clean white ceramic mug with simple elegant design')
  })

  it('should clear selected template', () => {
    const store = useDesignStore.getState()

    // Select a template first
    store.selectTemplate('classic-white', 'test prompt')
    expect(store.selectedTemplate).not.toBeNull()

    // Clear it
    store.clearTemplate()

    expect(useDesignStore.getState().selectedTemplate).toBeNull()
  })

  it('should allow switching between templates', () => {
    const { selectTemplate } = useDesignStore.getState()

    // Select first template
    selectTemplate('classic-white', 'first prompt')
    expect(useDesignStore.getState().selectedTemplate).toBe('classic-white')
    expect(useDesignStore.getState().aiPrompt).toBe('first prompt')

    // Select second template
    selectTemplate('colorful-abstract', 'second prompt')
    expect(useDesignStore.getState().selectedTemplate).toBe('colorful-abstract')
    expect(useDesignStore.getState().aiPrompt).toBe('second prompt')
  })

  it('should update aiPrompt when template is selected', () => {
    const { selectTemplate } = useDesignStore.getState()

    const templatePrompt = 'vibrant ceramic mug with abstract patterns'
    selectTemplate('colorful-abstract', templatePrompt)

    expect(useDesignStore.getState().aiPrompt).toBe(templatePrompt)
  })

  it('should preserve selectedTemplate during generation', () => {
    // Create a promise that never resolves to simulate ongoing generation
    global.fetch = vi.fn(() => new Promise(() => {})) as unknown as typeof fetch

    const { selectTemplate, generateFromPrompt } = useDesignStore.getState()

    selectTemplate('classic-white', 'test prompt')
    const templateId = useDesignStore.getState().selectedTemplate

    // Start generation
    generateFromPrompt('test prompt')

    // Template should still be selected
    expect(useDesignStore.getState().selectedTemplate).toBe(templateId)
    expect(useDesignStore.getState().isGenerating).toBe(true)
  })

  it('should allow user to modify template prompt before generating', () => {
    const { selectTemplate, setAIPrompt } = useDesignStore.getState()

    // Select template
    selectTemplate('classic-white', 'original prompt')
    expect(useDesignStore.getState().aiPrompt).toBe('original prompt')

    // User modifies the prompt
    setAIPrompt('modified prompt')
    expect(useDesignStore.getState().aiPrompt).toBe('modified prompt')

    // Template should still be selected
    expect(useDesignStore.getState().selectedTemplate).toBe('classic-white')
  })

  it('should clear template without clearing prompt', () => {
    const { selectTemplate, clearTemplate } = useDesignStore.getState()

    selectTemplate('classic-white', 'test prompt')
    expect(useDesignStore.getState().selectedTemplate).toBe('classic-white')

    clearTemplate()
    expect(useDesignStore.getState().selectedTemplate).toBeNull()

    // Prompt should remain (user might want to keep it)
    expect(useDesignStore.getState().aiPrompt).toBe('test prompt')
  })
})
