'use client'

import React, { useState, useRef, useCallback } from 'react'
import { useDesignStore } from './store/designStore'
import { UploadFileResponse } from '../../../lib/types'
import UploadProgress from './UploadProgress'

interface ImageUploadProps {
  className?: string
  onUploadStart?: () => void
  onUploadComplete?: (imageUrl: string) => void
  onUploadError?: (error: string) => void
}

export default function ImageUpload({
  className = "",
  onUploadStart,
  onUploadComplete,
  onUploadError
}: ImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [currentFileName, setCurrentFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { currentDesign, updateDesign, trackImageUpload } = useDesignStore()

  // File validation constants
  const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg']
  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB in bytes

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Please upload a PNG or JPG image file.'
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 5MB.'
    }

    return null
  }, [])

  const processImageFile = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const result = e.target?.result as string
        if (result) {
          resolve(result)
        } else {
          reject(new Error('Failed to read file'))
        }
      }
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }
      
      reader.readAsDataURL(file)
    })
  }, [])

  const handleFileUpload = useCallback(async (file: File) => {
    // Clear previous errors
    setUploadError(null)
    setCurrentFileName(file.name)
    
    // Validate file
    const validationError = validateFile(file)
    if (validationError) {
      setUploadError(validationError)
      onUploadError?.(validationError)
      return
    }

    try {
      setIsUploading(true)
      setUploadProgress(0)
      onUploadStart?.()

      // Start upload progress simulation
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 80) {
            clearInterval(progressInterval)
            return 80
          }
          return prev + 10
        })
      }, 200)

      // Process the image file for immediate preview
      const imageBase64 = await processImageFile(file)
      
      // Prepare form data for upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('designId', currentDesign.id)

      // Upload to server
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Upload failed with status ${response.status}`)
      }

      const uploadResult: UploadFileResponse = await response.json()
      
      // Update progress to complete
      setUploadProgress(100)

      // Update the design store with both base64 (for immediate display) and URL (for 3D texture)
      updateDesign({
        uploadedImageBase64: imageBase64,
        uploadedImageUrl: uploadResult.url,
        lastModified: new Date().toISOString()
      })

      // Complete the upload
      onUploadComplete?.(uploadResult.url)
      
      // Reset progress after a brief delay
      setTimeout(() => {
        setUploadProgress(0)
        setIsUploading(false)
        setCurrentFileName(null)
      }, 1000)

    } catch (error) {
      setIsUploading(false)
      setUploadProgress(0)
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image. Please try again.'
      setUploadError(errorMessage)
      onUploadError?.(errorMessage)
      
      // Clear error after 5 seconds
      setTimeout(() => {
        setUploadError(null)
        setCurrentFileName(null)
      }, 5000)
    }
  }, [validateFile, processImageFile, updateDesign, onUploadStart, onUploadComplete, onUploadError, currentDesign.id])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }, [handleFileUpload])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
    // Reset input to allow selecting the same file again
    e.target.value = ''
  }, [handleFileUpload])

  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleRemoveImage = useCallback(async () => {
    try {
      // If there's an uploaded URL, try to delete it from storage
      if (currentDesign.uploadedImageUrl) {
        // Extract file ID from URL for deletion
        const urlParts = currentDesign.uploadedImageUrl.split('/')
        const fileId = urlParts[urlParts.length - 1]
        
        // Attempt to delete from storage (non-blocking)
        fetch(`/api/upload?fileId=${encodeURIComponent(fileId)}`, {
          method: 'DELETE'
        }).catch(error => {
          console.warn('Failed to delete file from storage:', error)
        })
      }

      // Update design store
      updateDesign({
        uploadedImageBase64: undefined,
        uploadedImageUrl: undefined,
        lastModified: new Date().toISOString()
      })
    } catch (error) {
      console.warn('Error during image removal:', error)
      // Still remove from store even if cloud deletion fails
      updateDesign({
        uploadedImageBase64: undefined,
        uploadedImageUrl: undefined,
        lastModified: new Date().toISOString()
      })
    }
  }, [updateDesign, currentDesign.uploadedImageUrl])

  const hasUploadedImage = !!currentDesign.uploadedImageBase64

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Progress Indicator */}
      <UploadProgress
        progress={uploadProgress}
        isUploading={isUploading}
        fileName={currentFileName || undefined}
        error={uploadError || undefined}
      />
      {/* Upload Area */}
      {!hasUploadedImage && (
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center transition-all
            ${isDragOver 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400 bg-gray-50'
            }
            ${isUploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleButtonClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />

          {!isUploading ? (
            <>
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              
              <div className="mt-4">
                <p className="text-lg font-medium text-gray-900">
                  {isDragOver ? 'Drop your image here' : 'Upload your design'}
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  Drag and drop or{' '}
                  <span className="text-blue-600 hover:text-blue-700 font-medium">
                    click to browse
                  </span>
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  PNG or JPG up to 5MB
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <div>
                <p className="text-lg font-medium text-gray-900">Uploading...</p>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="mt-1 text-sm text-gray-600">{uploadProgress}% complete</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Image Preview and Controls */}
      {hasUploadedImage && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">Uploaded Image</h4>
            <button
              onClick={handleRemoveImage}
              className="text-sm text-red-600 hover:text-red-700 transition-colors"
              disabled={isUploading}
            >
              Remove
            </button>
          </div>
          
          <div className="relative">
            <img
              src={currentDesign.uploadedImageBase64}
              alt="Uploaded design"
              className="w-full h-32 object-cover rounded-lg border border-gray-200"
            />
            <div className="absolute inset-0 bg-black/10 rounded-lg"></div>
          </div>

          <button
            onClick={handleButtonClick}
            className="w-full px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isUploading}
          >
            Replace Image
          </button>
        </div>
      )}
    </div>
  )
}
