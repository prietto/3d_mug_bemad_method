import React from 'react'

interface MinimalHeaderProps {
  logo?: string
  tagline: string
}

export default function MinimalHeader({ logo, tagline }: MinimalHeaderProps) {
  return (
    <header
      className="w-full bg-gradient-to-r from-slate-50 to-blue-50 border-b border-gray-200"
      style={{ maxHeight: '80px' }}
      role="banner"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-4 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-4">
          {/* Logo */}
          {logo && (
            <div className="flex-shrink-0">
              <img
                src={logo}
                alt="Company Logo"
                className="h-8 w-auto sm:h-10"
              />
            </div>
          )}

          {/* Tagline */}
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 text-center">
            {tagline}
          </h1>
        </div>
      </div>
    </header>
  )
}