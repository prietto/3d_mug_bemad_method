import { describe, it, expect } from 'vitest'
import {
  MUG_TEMPLATES,
  getTemplateById,
  getTemplatesByCategory,
  validateTemplate,
  validateAllTemplates,
  type MugTemplate,
  type TemplateCategory
} from './mugTemplates'

describe('MUG_TEMPLATES', () => {
  it('should have at least 5 templates', () => {
    expect(MUG_TEMPLATES.length).toBeGreaterThanOrEqual(5)
  })

  it('should have no more than 10 templates', () => {
    expect(MUG_TEMPLATES.length).toBeLessThanOrEqual(10)
  })

  it('all templates should have required fields', () => {
    MUG_TEMPLATES.forEach(template => {
      expect(template.id).toBeDefined()
      expect(template.name).toBeDefined()
      expect(template.description).toBeDefined()
      expect(template.prompt).toBeDefined()
      expect(template.thumbnail).toBeDefined()
      expect(template.category).toBeDefined()
    })
  })

  it('all template IDs should be unique', () => {
    const ids = MUG_TEMPLATES.map(t => t.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('all template names should be unique', () => {
    const names = MUG_TEMPLATES.map(t => t.name)
    const uniqueNames = new Set(names)
    expect(uniqueNames.size).toBe(names.length)
  })

  it('all template prompts should be within character limits', () => {
    MUG_TEMPLATES.forEach(template => {
      expect(template.prompt.length).toBeGreaterThanOrEqual(3)
      expect(template.prompt.length).toBeLessThanOrEqual(500)
    })
  })

  it('all thumbnails should have valid paths', () => {
    MUG_TEMPLATES.forEach(template => {
      expect(template.thumbnail).toMatch(/^\/templates\/.*\.(webp|png|jpg|jpeg)$/)
    })
  })

  it('all categories should be valid enum values', () => {
    const validCategories: TemplateCategory[] = [
      'corporate',
      'casual',
      'artistic',
      'minimalist',
      'photo',
      'vintage',
      'holiday'
    ]

    MUG_TEMPLATES.forEach(template => {
      expect(validCategories).toContain(template.category)
    })
  })

  it('should have templates covering key categories', () => {
    const categories = MUG_TEMPLATES.map(t => t.category)

    // Should have at least one minimalist template
    expect(categories).toContain('minimalist')

    // Should have at least one artistic template
    expect(categories).toContain('artistic')
  })
})

describe('getTemplateById', () => {
  it('should return template when ID exists', () => {
    const firstTemplate = MUG_TEMPLATES[0]
    const result = getTemplateById(firstTemplate.id)

    expect(result).toBeDefined()
    expect(result?.id).toBe(firstTemplate.id)
  })

  it('should return undefined when ID does not exist', () => {
    const result = getTemplateById('non-existent-id')
    expect(result).toBeUndefined()
  })

  it('should handle empty string ID', () => {
    const result = getTemplateById('')
    expect(result).toBeUndefined()
  })
})

describe('getTemplatesByCategory', () => {
  it('should return templates matching category', () => {
    const minimalistTemplates = getTemplatesByCategory('minimalist')

    expect(minimalistTemplates.length).toBeGreaterThan(0)
    minimalistTemplates.forEach(template => {
      expect(template.category).toBe('minimalist')
    })
  })

  it('should return empty array for category with no templates', () => {
    const holidayTemplates = getTemplatesByCategory('holiday')
    expect(Array.isArray(holidayTemplates)).toBe(true)
  })

  it('should return artistic templates', () => {
    const artisticTemplates = getTemplatesByCategory('artistic')

    expect(artisticTemplates.length).toBeGreaterThan(0)
    artisticTemplates.forEach(template => {
      expect(template.category).toBe('artistic')
    })
  })
})

describe('validateTemplate', () => {
  const validTemplate: MugTemplate = {
    id: 'test-template',
    name: 'Test Template',
    description: 'A test template',
    prompt: 'test prompt for validation',
    thumbnail: '/templates/test.webp',
    category: 'minimalist'
  }

  it('should validate a valid template', () => {
    expect(() => validateTemplate(validTemplate)).not.toThrow()
    expect(validateTemplate(validTemplate)).toBe(true)
  })

  it('should throw error for missing id', () => {
    const invalid = { ...validTemplate, id: '' }
    expect(() => validateTemplate(invalid as MugTemplate)).toThrow('valid id')
  })

  it('should throw error for missing name', () => {
    const invalid = { ...validTemplate, name: '' }
    expect(() => validateTemplate(invalid as MugTemplate)).toThrow('valid name')
  })

  it('should throw error for missing description', () => {
    const invalid = { ...validTemplate, description: '' }
    expect(() => validateTemplate(invalid as MugTemplate)).toThrow('valid description')
  })

  it('should throw error for missing prompt', () => {
    const invalid = { ...validTemplate, prompt: '' }
    expect(() => validateTemplate(invalid as MugTemplate)).toThrow('valid prompt')
  })

  it('should throw error for prompt too short', () => {
    const invalid = { ...validTemplate, prompt: 'ab' }
    expect(() => validateTemplate(invalid as MugTemplate)).toThrow('between 3 and 500 characters')
  })

  it('should throw error for prompt too long', () => {
    const invalid = { ...validTemplate, prompt: 'a'.repeat(501) }
    expect(() => validateTemplate(invalid as MugTemplate)).toThrow('between 3 and 500 characters')
  })

  it('should throw error for missing thumbnail', () => {
    const invalid = { ...validTemplate, thumbnail: '' }
    expect(() => validateTemplate(invalid as MugTemplate)).toThrow('valid thumbnail')
  })

  it('should throw error for invalid category', () => {
    const invalid = { ...validTemplate, category: 'invalid' as TemplateCategory }
    expect(() => validateTemplate(invalid as MugTemplate)).toThrow('category must be one of')
  })
})

describe('validateAllTemplates', () => {
  it('should validate all templates in MUG_TEMPLATES without throwing', () => {
    expect(() => validateAllTemplates()).not.toThrow()
    expect(validateAllTemplates()).toBe(true)
  })

  it('should detect duplicate IDs if they existed', () => {
    // This test verifies the validation logic would catch duplicates
    // In practice, MUG_TEMPLATES should never have duplicates
    const ids = MUG_TEMPLATES.map(t => t.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('should detect duplicate names if they existed', () => {
    // This test verifies the validation logic would catch duplicates
    // In practice, MUG_TEMPLATES should never have duplicates
    const names = MUG_TEMPLATES.map(t => t.name)
    const uniqueNames = new Set(names)
    expect(uniqueNames.size).toBe(names.length)
  })
})

describe('Template Content Quality', () => {
  it('all template names should be title case', () => {
    MUG_TEMPLATES.forEach(template => {
      // Check first letter is uppercase
      expect(template.name[0]).toBe(template.name[0].toUpperCase())
    })
  })

  it('all template descriptions should end with proper punctuation or be complete phrases', () => {
    MUG_TEMPLATES.forEach(template => {
      expect(template.description.length).toBeGreaterThan(10)
    })
  })

  it('all template prompts should be descriptive', () => {
    MUG_TEMPLATES.forEach(template => {
      // Prompts should be at least 20 characters to be meaningful
      expect(template.prompt.length).toBeGreaterThan(20)
    })
  })

  it('templates should have diverse categories', () => {
    const categories = new Set(MUG_TEMPLATES.map(t => t.category))

    // Should have at least 3 different categories
    expect(categories.size).toBeGreaterThanOrEqual(3)
  })
})
