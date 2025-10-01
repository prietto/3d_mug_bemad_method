import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ImageUpload from './ImageUpload'
import { useDesignStore } from './store/designStore'

// Mock the design store
vi.mock('./store/designStore', () => ({
  useDesignStore: vi.fn()
}))

// Mock FileReader for base64 conversion
const mockFileReader = {
  readAsDataURL: vi.fn(),
  result: null as string | null,
  onload: null as any,
  onerror: null as any
}

Object.defineProperty(global, 'FileReader', {
  writable: true,
  value: vi.fn().mockImplementation(() => mockFileReader)
})

describe('ImageUpload', () => {
  const mockUpdateDesign = vi.fn()
  const mockOnUploadStart = vi.fn()
  const mockOnUploadComplete = vi.fn()
  const mockOnUploadError = vi.fn()

  const defaultDesign = {
    id: 'test-id',
    mugColor: '#ffffff',
    uploadedImageBase64: undefined,
    customText: undefined,
    textFont: 'Arial',
    textPosition: JSON.stringify({ x: 0, y: 0, z: 0 }),
    createdAt: '2025-09-26T00:00:00.000Z',
    lastModified: '2025-09-26T00:00:00.000Z',
    isComplete: false
  }

  const defaultStore = {
    currentDesign: defaultDesign,
    updateDesign: mockUpdateDesign,
    isLoading: false,
    error: null,
    performance: { fps: 60, lastFrameTime: 0 },
    camera: { position: [3, 2, 5], target: [0, 0, 0] },
    interaction: { isDragging: false, isZooming: false, lastPointerPosition: null },
    setLoading: vi.fn(),
    setError: vi.fn(),
    updatePerformance: vi.fn(),
    updateCamera: vi.fn(),
    setInteraction: vi.fn(),
    resetToDefault: vi.fn(),
    resetCameraToDefault: vi.fn(),
    exportDesignPreview: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useDesignStore).mockReturnValue(defaultStore as any)
  })

  it('renders upload interface when no image is uploaded', () => {
    render(<ImageUpload />)
    
    expect(screen.getByText('Upload your design')).toBeInTheDocument()
    expect(screen.getByText('Drag and drop or click to browse')).toBeInTheDocument()
    expect(screen.getByText('PNG or JPG up to 5MB')).toBeInTheDocument()
  })

  it('renders image preview when image is uploaded', () => {
    vi.mocked(useDesignStore).mockReturnValue({
      ...defaultStore,
      currentDesign: {
        ...defaultDesign,
        uploadedImageBase64: 'data:image/png;base64,test-image-data'
      }
    } as any)

    render(<ImageUpload />)
    
    expect(screen.getByText('Uploaded Image')).toBeInTheDocument()
    expect(screen.getByAltText('Uploaded design')).toBeInTheDocument()
    expect(screen.getByText('Remove')).toBeInTheDocument()
    expect(screen.getByText('Replace Image')).toBeInTheDocument()
  })

  it('handles file selection via button click', async () => {
    render(<ImageUpload onUploadComplete={mockOnUploadComplete} />)
    
    // Create a mock file
    const file = new File(['test'], 'test.png', { type: 'image/png' })
    
    // Get the hidden input and simulate file selection
    const input = screen.getByRole('button', { name: /upload your design/i }).parentElement?.querySelector('input[type="file"]') as HTMLInputElement
    
    // Mock FileReader behavior
    mockFileReader.readAsDataURL.mockImplementation(() => {
      mockFileReader.result = 'data:image/png;base64,test-image-data'
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: 'data:image/png;base64,test-image-data' } } as any)
      }
    })

    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false
    })

    fireEvent.change(input)

    await waitFor(() => {
      expect(mockUpdateDesign).toHaveBeenCalledWith({
        uploadedImageBase64: 'data:image/png;base64,test-image-data',
        lastModified: expect.any(String)
      })
    })
  })

  it('validates file type and shows error for invalid types', async () => {
    render(<ImageUpload onUploadError={mockOnUploadError} />)
    
    const file = new File(['test'], 'test.gif', { type: 'image/gif' })
    const input = screen.getByRole('button', { name: /upload your design/i }).parentElement?.querySelector('input[type="file"]') as HTMLInputElement
    
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false
    })

    fireEvent.change(input)

    await waitFor(() => {
      expect(mockOnUploadError).toHaveBeenCalledWith('Please upload a PNG or JPG image file.')
    })
  })

  it('validates file size and shows error for files too large', async () => {
    render(<ImageUpload onUploadError={mockOnUploadError} />)
    
    // Create a file larger than 5MB
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.png', { type: 'image/png' })
    const input = screen.getByRole('button', { name: /upload your design/i }).parentElement?.querySelector('input[type="file"]') as HTMLInputElement
    
    Object.defineProperty(input, 'files', {
      value: [largeFile],
      writable: false
    })

    fireEvent.change(input)

    await waitFor(() => {
      expect(mockOnUploadError).toHaveBeenCalledWith('File size must be less than 5MB.')
    })
  })

  it('handles drag and drop functionality', async () => {
    render(<ImageUpload onUploadComplete={mockOnUploadComplete} />)
    
    const dropZone = screen.getByText('Upload your design').closest('div')!
    const file = new File(['test'], 'test.png', { type: 'image/png' })

    // Mock FileReader behavior
    mockFileReader.readAsDataURL.mockImplementation(() => {
      mockFileReader.result = 'data:image/png;base64,test-image-data'
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: 'data:image/png;base64,test-image-data' } } as any)
      }
    })

    // Simulate drag over
    fireEvent.dragOver(dropZone)
    expect(screen.getByText('Drop your image here')).toBeInTheDocument()

    // Simulate drop
    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [file]
      }
    })

    await waitFor(() => {
      expect(mockUpdateDesign).toHaveBeenCalledWith({
        uploadedImageBase64: 'data:image/png;base64,test-image-data',
        lastModified: expect.any(String)
      })
    })
  })

  it('handles image removal', () => {
    vi.mocked(useDesignStore).mockReturnValue({
      ...defaultStore,
      currentDesign: {
        ...defaultDesign,
        uploadedImageBase64: 'data:image/png;base64,test-image-data'
      }
    } as any)

    render(<ImageUpload />)
    
    const removeButton = screen.getByText('Remove')
    fireEvent.click(removeButton)

    expect(mockUpdateDesign).toHaveBeenCalledWith({
      uploadedImageBase64: undefined,
      lastModified: expect.any(String)
    })
  })

  it('shows upload progress during file processing', async () => {
    render(<ImageUpload />)
    
    const file = new File(['test'], 'test.png', { type: 'image/png' })
    const input = screen.getByRole('button', { name: /upload your design/i }).parentElement?.querySelector('input[type="file"]') as HTMLInputElement
    
    // Delay the FileReader result to see loading state
    mockFileReader.readAsDataURL.mockImplementation(() => {
      setTimeout(() => {
        mockFileReader.result = 'data:image/png;base64,test-image-data'
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: 'data:image/png;base64,test-image-data' } } as any)
        }
      }, 100)
    })

    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false
    })

    fireEvent.change(input)

    // Should show uploading state
    await waitFor(() => {
      expect(screen.getByText('Uploading...')).toBeInTheDocument()
    })
  })

  it('calls callback functions at appropriate times', async () => {
    render(
      <ImageUpload 
        onUploadStart={mockOnUploadStart}
        onUploadComplete={mockOnUploadComplete}
        onUploadError={mockOnUploadError}
      />
    )
    
    const file = new File(['test'], 'test.png', { type: 'image/png' })
    const input = screen.getByRole('button', { name: /upload your design/i }).parentElement?.querySelector('input[type="file"]') as HTMLInputElement
    
    mockFileReader.readAsDataURL.mockImplementation(() => {
      mockFileReader.result = 'data:image/png;base64,test-image-data'
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: 'data:image/png;base64,test-image-data' } } as any)
      }
    })

    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false
    })

    fireEvent.change(input)

    await waitFor(() => {
      expect(mockOnUploadStart).toHaveBeenCalled()
      expect(mockOnUploadComplete).toHaveBeenCalledWith('data:image/png;base64,test-image-data')
    })
  })
})
