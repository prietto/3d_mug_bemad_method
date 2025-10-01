import React from 'react'
import CTAButton from './CTAButton'

interface HeroSectionProps {
  onDesignNowClick?: () => void
}

export default function HeroSection({ onDesignNowClick }: HeroSectionProps) {
  return (
    <section className="relative bg-gradient-to-br from-slate-50 to-blue-50 py-20 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Compelling Headline */}
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            Design Your Perfect Mug in{' '}
            <span className="text-blue-600">3D Reality</span>
          </h1>
          
          {/* Value Proposition */}
          <p className="mt-8 text-lg leading-8 text-gray-600 sm:text-xl lg:text-2xl max-w-3xl mx-auto">
            Experience interactive 3D customization like never before. Create stunning, 
            professional-quality sublimated mugs with our revolutionary design platform 
            that brings your vision to life in real-time.
          </p>
          
          {/* Key Benefits */}
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">3D Interactive Design</h3>
              <p className="mt-2 text-sm text-gray-600">
                Rotate, zoom, and customize your mug in real-time 3D
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Professional Quality</h3>
              <p className="mt-2 text-sm text-gray-600">
                High-resolution sublimation printing for lasting durability
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Instant Preview</h3>
              <p className="mt-2 text-sm text-gray-600">
                See exactly how your design will look before ordering
              </p>
            </div>
          </div>
          
          {/* Call-to-Action Button */}
          <div className="mt-16">
            <CTAButton 
              onClick={onDesignNowClick || (() => {
                // Placeholder for future 3D designer component
                alert('3D Designer coming soon! This will redirect to the interactive 3D mug customizer.')
              })}
              ariaLabel="Start designing your custom mug in 3D"
              className="transform hover:scale-105"
            >
              Start Designing Now
            </CTAButton>
            <p className="mt-4 text-sm text-gray-500">
              Free to design • No account required to preview
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
