'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Design, CreateLeadRequest } from '../../lib/types'
import ConsentCheckbox from './ConsentCheckbox'
import DesignPreview from './DesignPreview'
import { getSessionId, trackFormVisibleOnLoad, trackTimeToFirstFormInteraction } from '@/lib/utils/analytics'

interface LeadCaptureFormProps {
  design: Design
  onSubmit: (data: CreateLeadRequest) => Promise<void>
  className?: string
}

interface FormData {
  name: string
  email: string
  phone: string
  projectDescription: string
  consent: boolean
}

interface FormErrors {
  name?: string
  email?: string
  phone?: string
  projectDescription?: string
  consent?: string
  submit?: string
}

export default function LeadCaptureForm({
  design,
  onSubmit,
  className = ''
}: LeadCaptureFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    projectDescription: '',
    consent: false
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Track form load time and first interaction for analytics
  const formLoadTimeRef = useRef<number>(Date.now())
  const hasTrackedFirstInteraction = useRef<boolean>(false)

  // Track form visible on load for analytics
  useEffect(() => {
    const sessionId = getSessionId()
    trackFormVisibleOnLoad({
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      device_type: window.innerWidth >= 1024 ? 'desktop' : 'mobile',
      timestamp: formLoadTimeRef.current,
    }, sessionId)
  }, [])

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true // Phone is optional
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))
  }

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    if (!formData.projectDescription.trim()) {
      newErrors.projectDescription = 'Please describe your project'
    } else if (formData.projectDescription.trim().length < 10) {
      newErrors.projectDescription = 'Please provide more details about your project (minimum 10 characters)'
    }

    if (!formData.consent) {
      newErrors.consent = 'You must agree to the privacy policy to continue'
    }

    return newErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationErrors = validateForm()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      // Calculate engagement level based on design state
      let engagementLevel: 'low' | 'medium' | 'high' = 'low'
      const hasImage = Boolean(design.uploadedImageUrl || design.uploadedImageBase64)
      const hasText = Boolean(design.customText)
      const hasColor = design.mugColor !== '#ffffff'
      
      if (hasImage && hasText && hasColor) {
        engagementLevel = 'high'
      } else if ((hasImage || hasText) && hasColor) {
        engagementLevel = 'medium'
      }

      const leadData: CreateLeadRequest = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        projectDescription: formData.projectDescription.trim(),
        designId: design.id,
        source: 'landing_page_3d_designer',
        engagementLevel
      }

      await onSubmit(leadData)
      setSubmitSuccess(true)
      
      // Keep success message visible, form will stay always visible
      setTimeout(() => {
        setSubmitSuccess(false)
        // Reset form data for new submission
        setFormData({
          name: '',
          email: '',
          phone: '',
          projectDescription: '',
          consent: false
        })
      }, 5000)
      
    } catch (error) {
      console.error('Form submission error:', error)
      setErrors({ 
        submit: error instanceof Error ? error.message : 'Failed to submit form. Please try again.' 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // Track first form interaction for analytics
    if (!hasTrackedFirstInteraction.current) {
      hasTrackedFirstInteraction.current = true
      const timeToInteraction = Date.now() - formLoadTimeRef.current
      const sessionId = getSessionId()
      trackTimeToFirstFormInteraction(
        timeToInteraction,
        'focus',
        e.target.id,
        sessionId
      )
    }

    // Smooth scroll to input on mobile when focused
    if (window.innerWidth < 1024) {
      setTimeout(() => {
        e.target.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
      }, 300) // Wait for mobile keyboard animation
    }
  }



  return (
    <div className={`bg-white h-full flex flex-col border-t-4 border-blue-600 lg:border-t-0 lg:border-l-4 ${className}`}>
      {/* Success message - inline */}
      {submitSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-900">Thank You!</h3>
              <p className="text-green-700 mt-1">
                We've received your information and will contact you within 24 hours with a quote for your custom mug design.
              </p>
              <p className="text-sm text-green-600 mt-2">
                Check your email for confirmation and next steps.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Get Your Quote</h2>
        <p className="text-gray-600">
          Love your design? Let&apos;s make it real! Fill out the form below and we&apos;ll get back to you within 24 hours.
        </p>
      </div>

      {/* Design Preview */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Your Design Preview</h3>
        <DesignPreview design={design} compact />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 flex-grow">
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-600 text-sm">{errors.submit}</p>
          </div>
        )}

        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            onFocus={handleInputFocus}
            className={`
              w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              min-h-[44px] text-base
              ${errors.name ? 'border-red-500' : 'border-gray-300'}
            `}
            placeholder="Enter your full name"
            disabled={isSubmitting}
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            onFocus={handleInputFocus}
            className={`
              w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              min-h-[44px] text-base
              ${errors.email ? 'border-red-500' : 'border-gray-300'}
            `}
            placeholder="your.email@example.com"
            disabled={isSubmitting}
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        {/* Phone Field */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            onFocus={handleInputFocus}
            className={`
              w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              min-h-[44px] text-base
              ${errors.phone ? 'border-red-500' : 'border-gray-300'}
            `}
            placeholder="+1 (555) 123-4567"
            disabled={isSubmitting}
          />
          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
          )}
        </div>

        {/* Project Description */}
        <div>
          <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700 mb-1">
            Project Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="projectDescription"
            value={formData.projectDescription}
            onChange={(e) => handleInputChange('projectDescription', e.target.value)}
            onFocus={handleInputFocus}
            rows={3}
            className={`
              w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              min-h-[88px] text-base resize-none
              ${errors.projectDescription ? 'border-red-500' : 'border-gray-300'}
            `}
            placeholder="Tell us about your project - quantity needed, timeline, special requirements..."
            disabled={isSubmitting}
          />
          {errors.projectDescription && (
            <p className="text-red-500 text-sm mt-1">{errors.projectDescription}</p>
          )}
        </div>

        {/* GDPR Consent */}
        <ConsentCheckbox
          required
          privacyPolicyUrl="/privacy-policy"
          termsOfServiceUrl="/terms-of-service"
          onConsentChange={(accepted) => handleInputChange('consent', accepted)}
          error={errors.consent}
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`
            w-full py-3 px-4 rounded-md font-medium text-white text-base
            min-h-[44px] transition-all duration-200
            ${isSubmitting 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }
          `}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Submitting...</span>
            </div>
          ) : (
            'Get My Quote'
          )}
        </button>

        <p className="text-xs text-gray-500 text-center">
          We&apos;ll respond within 24 hours with your custom quote
        </p>
      </form>
    </div>
  )
}
