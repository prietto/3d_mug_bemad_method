import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST, DELETE } from './route'

// Mock Supabase client
const mockUpload = vi.fn()
const mockGetPublicUrl = vi.fn()
const mockRemove = vi.fn()

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
        remove: mockRemove
      }))
    }
  }))
}))

// Mock environment variables
vi.mock('process', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-key'
  }
}))

describe('Upload API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/upload', () => {
    it('successfully uploads a valid image file', async () => {
      // Mock successful upload
      mockUpload.mockResolvedValue({
        data: { path: 'test-123456789.png' },
        error: null
      })

      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://test.supabase.co/storage/v1/object/public/design-images/test-123456789.png' }
      })

      // Create mock form data
      const file = new File(['test image content'], 'test.png', { type: 'image/png' })
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }) // 1MB

      const formData = new FormData()
      formData.append('file', file)
      formData.append('designId', 'test-design-id')

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        url: expect.stringContaining('https://test.supabase.co'),
        fileId: 'test-123456789.png',
        fileName: expect.stringMatching(/test-design-id-\d+\.png/),
        size: 1024 * 1024,
        type: 'image/png'
      })
      
      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringMatching(/test-design-id-\d+\.png/),
        expect.any(Uint8Array),
        {
          contentType: 'image/png',
          cacheControl: '3600',
          upsert: false
        }
      )
    })

    it('rejects files with invalid type', async () => {
      const file = new File(['test content'], 'test.gif', { type: 'image/gif' })
      const formData = new FormData()
      formData.append('file', file)

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(415)
      expect(data.error).toBe('Invalid file type. Only PNG and JPG files are allowed.')
    })

    it('rejects files that are too large', async () => {
      const file = new File(['x'.repeat(6 * 1024 * 1024)], 'large.png', { type: 'image/png' })
      const formData = new FormData()
      formData.append('file', file)

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(413)
      expect(data.error).toBe('File too large. Maximum size is 5MB.')
    })

    it('returns error when no file is provided', async () => {
      const formData = new FormData()
      formData.append('designId', 'test-design-id')

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('No file provided')
    })

    it('handles Supabase upload errors', async () => {
      mockUpload.mockResolvedValue({
        data: null,
        error: { message: 'Storage error' }
      })

      const file = new File(['test content'], 'test.png', { type: 'image/png' })
      const formData = new FormData()
      formData.append('file', file)

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to upload file to storage')
    })
  })

  describe('DELETE /api/upload', () => {
    it('successfully deletes a file', async () => {
      mockRemove.mockResolvedValue({ error: null })

      const request = new NextRequest('http://localhost:3000/api/upload?fileId=test-file.png', {
        method: 'DELETE'
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockRemove).toHaveBeenCalledWith(['test-file.png'])
    })

    it('returns error when fileId is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'DELETE'
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('File ID is required')
    })

    it('handles Supabase delete errors', async () => {
      mockRemove.mockResolvedValue({
        error: { message: 'Delete error' }
      })

      const request = new NextRequest('http://localhost:3000/api/upload?fileId=test-file.png', {
        method: 'DELETE'
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to delete file')
    })
  })
})
