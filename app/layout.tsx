import React from 'react'
import type { Metadata } from 'next'
import GoogleAnalytics from './components/GoogleAnalytics'
import './globals.css'

export const metadata: Metadata = {
  title: 'CustomMugs3D - Design Your Perfect Mug in 3D Reality',
  description: 'Experience interactive 3D customization for professional-quality sublimated mugs. Create stunning, personalized designs with our revolutionary platform that brings your vision to life in real-time.',
  keywords: ['3D mug design', 'custom mugs', 'sublimation printing', 'personalized mugs', 'interactive design', 'custom printing'],
  authors: [{ name: 'CustomMugs3D Team' }],
  creator: 'CustomMugs3D',
  publisher: 'CustomMugs3D',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://custommugs3d.com',
    title: 'CustomMugs3D - Design Your Perfect Mug in 3D Reality',
    description: 'Experience interactive 3D customization for professional-quality sublimated mugs. Create stunning, personalized designs with our revolutionary platform.',
    siteName: 'CustomMugs3D',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CustomMugs3D - Design Your Perfect Mug in 3D Reality',
    description: 'Experience interactive 3D customization for professional-quality sublimated mugs.',
    creator: '@custommugs3d',
  },
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#2563eb',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const gaId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || '';

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        <GoogleAnalytics gaId={gaId} />
        {children}
      </body>
    </html>
  )
}
