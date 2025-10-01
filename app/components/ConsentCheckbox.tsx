'use client'

import React from 'react'

interface ConsentCheckboxProps {
  required?: boolean
  privacyPolicyUrl: string
  termsOfServiceUrl?: string
  onConsentChange: (accepted: boolean) => void
  error?: string
  className?: string
}

export default function ConsentCheckbox({
  required = true,
  privacyPolicyUrl,
  termsOfServiceUrl = '/terms-of-service',
  onConsentChange,
  error,
  className = ''
}: ConsentCheckboxProps) {
  const [isChecked, setIsChecked] = React.useState(false)

  const handleChange = (checked: boolean) => {
    setIsChecked(checked)
    onConsentChange(checked)
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-start space-x-3">
        <label className="flex items-start space-x-3 cursor-pointer">
          <div className="flex-shrink-0 mt-1">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => handleChange(e.target.checked)}
              className={`
                h-5 w-5 rounded border-2 border-gray-300 
                text-blue-600 focus:ring-blue-500 focus:ring-2 focus:ring-offset-2
                ${error ? 'border-red-500' : ''}
              `}
              required={required}
            />
          </div>
          <div className="text-sm text-gray-600 leading-relaxed">
            <span>
              I consent to receive marketing communications and agree to the{' '}
              <a
                href={privacyPolicyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800 transition-colors"
              >
                Privacy Policy
              </a>
              {termsOfServiceUrl && (
                <>
                  {' '}and{' '}
                  <a
                    href={termsOfServiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-800 transition-colors"
                  >
                    Terms of Service
                  </a>
                </>
              )}
              .
            </span>
            {required && (
              <span className="text-red-500 ml-1" aria-label="Required">
                *
              </span>
            )}
          </div>
        </label>
      </div>
      
      <div className="text-xs text-gray-500 ml-8">
        You can unsubscribe at any time by clicking the unsubscribe link in our emails 
        or by contacting us directly. Your data will be processed according to our privacy policy.
      </div>
      
      {error && (
        <div className="text-red-500 text-sm ml-8" role="alert">
          {error}
        </div>
      )}
    </div>
  )
}
