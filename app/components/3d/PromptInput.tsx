'use client'

import React, { useState, useCallback, useEffect } from 'react'

interface PromptInputProps {
  value: string
  onChange: (value: string) => void
  onGenerate: () => void
  disabled?: boolean
  className?: string
}

const PROMPT_EXAMPLES = [
  { id: 'watercolor-flowers', text: 'Watercolor flowers on white ceramic' },
  { id: 'geometric-patterns', text: 'Abstract geometric patterns in multiple colors' },
  { id: 'minimalist-line', text: 'Minimalist single color accent line' },
  { id: 'floral-design', text: 'Hand-painted floral design, soft colors' },
  { id: 'corporate-branding', text: 'Corporate branding style with clean logo area' },
  { id: 'vintage-retro', text: 'Vintage retro design with distressed texture' },
  { id: 'marble-pattern', text: 'Modern marble pattern in blues and whites' },
  { id: 'bold-abstract', text: 'Bold abstract art with vibrant colors' }
]

const MAX_PROMPT_LENGTH = 500
const MIN_PROMPT_LENGTH = 3
const FIRST_TIME_KEY = 'bmad_ai_prompt_first_time'

export default function PromptInput({
  value,
  onChange,
  onGenerate,
  disabled = false,
  className = ''
}: PromptInputProps) {
  const [isFirstTime, setIsFirstTime] = useState(false)

  // Check if this is the user's first time
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSeenPrompts = localStorage.getItem(FIRST_TIME_KEY)
      if (!hasSeenPrompts) {
        setIsFirstTime(true)
        localStorage.setItem(FIRST_TIME_KEY, 'true')
      }
    }
  }, [])

  const characterCount = value.length
  const isValid = characterCount >= MIN_PROMPT_LENGTH && characterCount <= MAX_PROMPT_LENGTH
  const canGenerate = isValid && !disabled

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    if (newValue.length <= MAX_PROMPT_LENGTH) {
      onChange(newValue)
    }
  }, [onChange])

  const handleExampleClick = useCallback((exampleText: string, exampleId: string) => {
    onChange(exampleText)

    // Track analytics event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'prompt_example_used', {
        event_category: 'ai_generation',
        example_id: exampleId
      })
    }
  }, [onChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Allow Cmd/Ctrl + Enter to submit
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canGenerate) {
      e.preventDefault()
      onGenerate()
    }
  }, [canGenerate, onGenerate])

  const handleGenerateClick = useCallback(() => {
    if (canGenerate) {
      // Track analytics event
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'ai_prompt_entered', {
          event_category: 'ai_generation',
          prompt_length: characterCount,
          characters_remaining: MAX_PROMPT_LENGTH - characterCount
        })
      }
      onGenerate()
    }
  }, [canGenerate, onGenerate, characterCount])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Prompt Examples - Only show for first-time users */}
      {isFirstTime && (
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-700">
            Try one of these examples:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {PROMPT_EXAMPLES.map((example) => (
              <button
                key={example.id}
                onClick={() => handleExampleClick(example.text, example.id)}
                disabled={disabled}
                className={`
                  px-3 py-2 text-xs text-left rounded-lg border transition-all
                  ${disabled
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                    : 'bg-white text-gray-700 hover:bg-blue-50 hover:border-blue-300 border-gray-300'
                  }
                `}
              >
                {example.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Prompt Input */}
      <div className="space-y-2">
        <label htmlFor="mug-prompt" className="block text-sm font-medium text-gray-900">
          Describe Your Mug Design
        </label>
        <p className="text-xs text-gray-600">
          Tell us what you want to see on your mug, and we'll create a professional design for you
        </p>
        <div className="relative">
          <textarea
            id="mug-prompt"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="e.g., watercolor flowers with soft pink petals on white background, mountain landscape at sunset with orange sky..."
            disabled={disabled}
            className={`
              w-full px-4 py-3 border rounded-lg resize-none transition-all
              ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
              ${!isValid && characterCount > 0 ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}
              focus:outline-none focus:ring-2
            `}
            rows={4}
          />

          {/* Character Counter */}
          <div className={`
            absolute bottom-3 right-3 text-xs font-medium px-2 py-1 rounded bg-white/90
            ${characterCount > MAX_PROMPT_LENGTH
              ? 'text-red-600'
              : characterCount < MIN_PROMPT_LENGTH && characterCount > 0
              ? 'text-orange-600'
              : 'text-gray-500'
            }
          `}>
            {characterCount}/{MAX_PROMPT_LENGTH} characters
          </div>
        </div>

        {/* Validation Message */}
        {characterCount > 0 && characterCount < MIN_PROMPT_LENGTH && (
          <p className="text-xs text-orange-600">
            Please enter at least {MIN_PROMPT_LENGTH} characters
          </p>
        )}
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerateClick}
        disabled={!canGenerate}
        className={`
          w-full px-4 py-3 text-sm font-medium rounded-lg transition-all
          ${!canGenerate
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm hover:shadow-md'
          }
        `}
      >
        Generate Mug Design
      </button>

      {/* Helper Text */}
      <p className="text-xs text-gray-500">
        Tip: Be specific about colors, style, and mood for best results. Press Cmd/Ctrl + Enter to generate.
      </p>
    </div>
  )
}
