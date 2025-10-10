'use client'

import React, { useCallback, useEffect } from 'react'
import Image from 'next/image'
import { type ViewAngle, VIEW_DEFINITIONS } from '@/lib/multiView/angleModifiers'

export interface MultiViewImage {
  angle: ViewAngle
  url: string
  generatedAt?: string
}

interface ImageCarouselProps {
  views: MultiViewImage[]
  currentIndex: number
  onNavigate: (index: number) => void
  className?: string
}

/**
 * ImageCarousel - Multi-view navigation component
 *
 * Displays multiple camera angles of a mug design with carousel navigation.
 * Supports arrow buttons, thumbnails, keyboard navigation, and dot indicators.
 */
export default function ImageCarousel({
  views,
  currentIndex,
  onNavigate,
  className = ''
}: ImageCarouselProps) {
  const currentView = views[currentIndex]
  const viewDef = currentView ? VIEW_DEFINITIONS[currentView.angle] : null

  const canGoPrevious = currentIndex > 0
  const canGoNext = currentIndex < views.length - 1

  const handlePrevious = useCallback(() => {
    if (canGoPrevious) {
      const newIndex = currentIndex - 1
      onNavigate(newIndex)

      // Track analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'multi_view_navigation', {
          event_category: 'ai_generation',
          from_angle: views[currentIndex].angle,
          to_angle: views[newIndex].angle,
          navigation_method: 'arrow'
        })
      }
    }
  }, [canGoPrevious, currentIndex, onNavigate, views])

  const handleNext = useCallback(() => {
    if (canGoNext) {
      const newIndex = currentIndex + 1
      onNavigate(newIndex)

      // Track analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'multi_view_navigation', {
          event_category: 'ai_generation',
          from_angle: views[currentIndex].angle,
          to_angle: views[newIndex].angle,
          navigation_method: 'arrow'
        })
      }
    }
  }, [canGoNext, currentIndex, onNavigate, views])

  const handleThumbnailClick = useCallback((index: number) => {
    if (index !== currentIndex) {
      onNavigate(index)

      // Track analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'multi_view_navigation', {
          event_category: 'ai_generation',
          from_angle: views[currentIndex].angle,
          to_angle: views[index].angle,
          navigation_method: 'thumbnail'
        })
      }
    }
  }, [currentIndex, onNavigate, views])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handlePrevious()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        handleNext()
      } else if (e.key === 'Home') {
        e.preventDefault()
        if (currentIndex !== 0) {
          onNavigate(0)

          // Track analytics
          if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'multi_view_navigation', {
              event_category: 'ai_generation',
              from_angle: views[currentIndex].angle,
              to_angle: views[0].angle,
              navigation_method: 'keyboard'
            })
          }
        }
      } else if (e.key === 'End') {
        e.preventDefault()
        const lastIndex = views.length - 1
        if (currentIndex !== lastIndex) {
          onNavigate(lastIndex)

          // Track analytics
          if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'multi_view_navigation', {
              event_category: 'ai_generation',
              from_angle: views[currentIndex].angle,
              to_angle: views[lastIndex].angle,
              navigation_method: 'keyboard'
            })
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, handleNext, handlePrevious, onNavigate, views])

  if (views.length === 0) {
    return null
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Image Display */}
      <div className="relative">
        {/* Navigation Arrows */}
        <button
          onClick={handlePrevious}
          disabled={!canGoPrevious}
          aria-label="Previous view"
          className={`
            absolute left-2 top-1/2 -translate-y-1/2 z-10
            bg-white/90 hover:bg-white rounded-full p-2 shadow-lg
            transition-all duration-200
            ${!canGoPrevious ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}
          `}
        >
          <svg className="w-6 h-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={handleNext}
          disabled={!canGoNext}
          aria-label="Next view"
          className={`
            absolute right-2 top-1/2 -translate-y-1/2 z-10
            bg-white/90 hover:bg-white rounded-full p-2 shadow-lg
            transition-all duration-200
            ${!canGoNext ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}
          `}
        >
          <svg className="w-6 h-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Main Image */}
        <div className="relative h-96 w-full bg-gray-100 rounded-lg overflow-hidden">
          <Image
            src={currentView.url}
            alt={viewDef?.description || 'Mug view'}
            fill
            className="object-contain"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
          />
        </div>

        {/* View Label */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-white/90 text-gray-900 shadow-lg backdrop-blur-sm">
            {viewDef?.name || currentView.angle}
          </span>
        </div>
      </div>

      {/* Thumbnail Strip */}
      <div className="flex justify-center gap-3">
        {views.map((view, index) => {
          const thumbViewDef = VIEW_DEFINITIONS[view.angle]
          const isActive = index === currentIndex

          return (
            <button
              key={view.angle}
              onClick={() => handleThumbnailClick(index)}
              className={`
                relative w-24 h-24 rounded-lg overflow-hidden
                transition-all duration-200 border-2
                ${isActive
                  ? 'border-blue-500 ring-2 ring-blue-200 scale-105'
                  : 'border-gray-300 hover:border-blue-300 hover:scale-105'
                }
              `}
              aria-label={`View ${thumbViewDef.name}`}
              aria-current={isActive}
            >
              <Image
                src={view.url}
                alt={thumbViewDef.description}
                fill
                className="object-cover"
                sizes="96px"
              />
              {isActive && (
                <div className="absolute inset-0 bg-blue-500/20" />
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1 px-2 text-center">
                {thumbViewDef.name}
              </div>
            </button>
          )
        })}
      </div>

      {/* Dot Indicators */}
      <div className="flex justify-center gap-2">
        {views.map((view, index) => (
          <button
            key={view.angle}
            onClick={() => handleThumbnailClick(index)}
            aria-label={`Go to ${VIEW_DEFINITIONS[view.angle].name}`}
            className={`
              w-2 h-2 rounded-full transition-all duration-200
              ${index === currentIndex
                ? 'bg-blue-500 w-8'
                : 'bg-gray-300 hover:bg-gray-400'
              }
            `}
          />
        ))}
      </div>

      {/* Keyboard Hint */}
      <p className="text-xs text-gray-500 text-center">
        Use arrow keys or click thumbnails to navigate • {currentIndex + 1} of {views.length}
      </p>
    </div>
  )
}
