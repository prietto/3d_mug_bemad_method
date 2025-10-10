'use client'

import React, { useCallback } from 'react'
import Image from 'next/image'
import { MUG_TEMPLATES, type MugTemplate } from '@/lib/templates/mugTemplates'

interface TemplateCardProps {
  template: MugTemplate
  isSelected: boolean
  onSelect: (templateId: string, prompt: string) => void
  disabled?: boolean
}

/**
 * TemplateCard - Individual template card component
 */
function TemplateCard({ template, isSelected, onSelect, disabled = false }: TemplateCardProps) {
  const handleClick = useCallback(() => {
    if (!disabled) {
      onSelect(template.id, template.prompt)
    }
  }, [disabled, onSelect, template.id, template.prompt])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault()
      onSelect(template.id, template.prompt)
    }
  }, [disabled, onSelect, template.id, template.prompt])

  return (
    <div
      className={`
        relative rounded-lg border-2 transition-all duration-200 cursor-pointer
        ${isSelected
          ? 'border-blue-500 shadow-lg ring-2 ring-blue-200'
          : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={`Select ${template.name} template`}
      aria-pressed={isSelected}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 z-10 bg-blue-500 rounded-full p-1">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Thumbnail */}
      <div className="relative h-40 w-full bg-gray-100 rounded-t-lg overflow-hidden">
        <Image
          src={template.thumbnail}
          alt={template.description}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1">
          {template.name}
        </h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {template.description}
        </p>
        <button
          className={`
            w-full px-4 py-2 text-sm font-medium rounded-md transition-colors
            ${isSelected
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
            ${disabled ? 'cursor-not-allowed' : ''}
          `}
          onClick={(e) => {
            e.stopPropagation()
            handleClick()
          }}
          disabled={disabled}
          aria-label={`Customize ${template.name} template`}
        >
          {isSelected ? 'Selected' : 'Customize'}
        </button>
      </div>

      {/* Category badge */}
      <div className="absolute top-2 left-2 z-10">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/90 text-gray-700 backdrop-blur-sm">
          {template.category}
        </span>
      </div>
    </div>
  )
}

interface TemplateGalleryProps {
  onSelectTemplate: (templateId: string, prompt: string) => void
  selectedTemplateId?: string | null
  disabled?: boolean
  className?: string
}

/**
 * TemplateGallery - Displays curated mug design templates
 *
 * Story 9.2: Provides pre-defined templates as starting points for AI generation
 */
export default function TemplateGallery({
  onSelectTemplate,
  selectedTemplateId = null,
  disabled = false,
  className = ''
}: TemplateGalleryProps) {
  const handleSelectTemplate = useCallback((templateId: string, prompt: string) => {
    onSelectTemplate(templateId, prompt)

    // Track analytics event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      const template = MUG_TEMPLATES.find(t => t.id === templateId)
      if (template) {
        (window as any).gtag('event', 'template_selected', {
          event_category: 'ai_generation',
          template_id: templateId,
          template_name: template.name,
          template_category: template.category
        })
      }
    }
  }, [onSelectTemplate])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-900">
          Start from a Template
        </h2>
        <p className="text-sm text-gray-600">
          Choose a style and customize it to match your vision
        </p>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MUG_TEMPLATES.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            isSelected={selectedTemplateId === template.id}
            onSelect={handleSelectTemplate}
            disabled={disabled}
          />
        ))}
      </div>

      {/* Helper text */}
      {!disabled && (
        <p className="text-xs text-gray-500 text-center">
          💡 Tip: After selecting a template, you can edit the prompt before generating
        </p>
      )}
    </div>
  )
}
