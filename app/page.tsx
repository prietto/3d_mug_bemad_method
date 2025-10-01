'use client'

import React, { Suspense, useState, useEffect } from 'react'
import Navigation from './components/Navigation'
import MinimalHeader from './components/MinimalHeader'
import SplitScreenLayout from './components/SplitScreenLayout'
import Footer from './components/Footer'
import MugDesigner from './components/MugDesigner'
import LeadCaptureForm from './components/LeadCaptureForm'
import { useAnalyticsIntegration } from '@/lib/hooks/useAnalyticsIntegration'
import { Design, CreateLeadRequest } from '@/lib/types'
import { getSessionId, trackEvent, trackPageLoadPerformance, trackWebVitals } from '@/lib/utils/analytics'

// Loading fallback components
const DesignerLoadingFallback = () => (
  <div className="w-full h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-700 font-medium">Loading 3D Designer...</p>
    </div>
  </div>
)

const FormLoadingFallback = () => (
  <div className="w-full h-screen bg-white flex items-center justify-center p-8">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-700 font-medium">Loading Contact Form...</p>
    </div>
  </div>
)

export default function Home() {
  // Initialize analytics integration
  const { trackLeadCapture } = useAnalyticsIntegration()

  // State for design (needed for LeadCaptureForm)
  const [currentDesign, setCurrentDesign] = useState<Design>({
    id: 'temp-id',
    mugColor: '#ffffff',
    uploadedImageBase64: undefined,
    uploadedImageUrl: undefined,
    customText: undefined,
    textFont: undefined,
    textColor: undefined,
    textSize: undefined,
    textPosition: undefined,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    isComplete: false
  })

  // Track page load performance and Web Vitals
  useEffect(() => {
    const sessionId = getSessionId()

    // Track page load performance with <3 second validation
    // Wait for load event to complete
    if (document.readyState === 'complete') {
      trackPageLoadPerformance(sessionId)
    } else {
      window.addEventListener('load', () => {
        trackPageLoadPerformance(sessionId)
      })
    }

    // Track Core Web Vitals (LCP, FID, CLS)
    trackWebVitals(sessionId)
  }, [])

  const handleLeadSubmit = async (data: CreateLeadRequest) => {
    try {
      // Track lead capture
      trackLeadCapture(data.email, {
        name: data.name,
        hasDesign: !!data.designId,
      })

      // Submit lead data
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to submit lead')
      }

      // Show success message
      alert('Thank you! We will contact you soon.')
    } catch (error) {
      console.error('Error submitting lead:', error)
      throw error
    }
  }



  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <header role="banner">
        <MinimalHeader tagline="Design Your Perfect Mug in 3D Reality" />
      </header>

      <main role="main" className="flex-grow">
        <SplitScreenLayout
          leftComponent={
            <MugDesigner
              showControls={true}
              isConstrainedViewport={true}
              className="h-full"
            />
          }
          rightComponent={
            <LeadCaptureForm
              design={currentDesign}
              onSubmit={handleLeadSubmit}
              className="h-full p-6 lg:p-8"
            />
          }
        />
      </main>

      <Footer />
    </div>
  )
}