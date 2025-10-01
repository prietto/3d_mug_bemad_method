import React, { ReactNode } from 'react'

interface SplitScreenLayoutProps {
  leftComponent: ReactNode
  rightComponent: ReactNode
  leftWidthPercent?: number
}

export default function SplitScreenLayout({
  leftComponent,
  rightComponent,
  leftWidthPercent = 60,
}: SplitScreenLayoutProps) {
  // Use predefined Tailwind classes for default 60/40 split
  // For custom widths, use flex-basis which works better than width percentages
  const isDefault = leftWidthPercent === 60

  const leftStyle: React.CSSProperties = !isDefault
    ? { flexBasis: `${leftWidthPercent}%` }
    : {}

  const rightStyle: React.CSSProperties = !isDefault
    ? { flexBasis: `${100 - leftWidthPercent}%` }
    : {}

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-screen transition-all duration-300 ease-in-out">
      {/* Left Panel - 3D Designer */}
      <section
        className={`w-full ${isDefault ? 'lg:w-3/5' : ''} min-h-[600px] lg:h-screen transition-all duration-300 ease-in-out`}
        style={leftStyle}
        aria-label="3D Mug Designer"
      >
        {leftComponent}
      </section>

      {/* Right Panel - Lead Form */}
      <section
        className={`w-full ${isDefault ? 'lg:w-2/5' : ''} transition-all duration-300 ease-in-out`}
        style={rightStyle}
        aria-label="Contact Form"
      >
        {rightComponent}
      </section>
    </div>
  )
}