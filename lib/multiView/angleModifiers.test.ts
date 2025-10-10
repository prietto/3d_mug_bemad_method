import { describe, it, expect } from 'vitest'
import {
  VIEW_DEFINITIONS,
  getAllViewDefinitions,
  getViewDefinition,
  buildAnglePrompt,
  getAdditionalAngles,
  isValidAngle,
  TOTAL_VIEWS_COUNT,
  ADDITIONAL_VIEWS_COUNT,
  type ViewAngle
} from './angleModifiers'

describe('VIEW_DEFINITIONS', () => {
  it('should have exactly 3 view definitions', () => {
    const views = Object.keys(VIEW_DEFINITIONS)
    expect(views.length).toBe(3)
  })

  it('should have front, side, and handle views', () => {
    expect(VIEW_DEFINITIONS.front).toBeDefined()
    expect(VIEW_DEFINITIONS.side).toBeDefined()
    expect(VIEW_DEFINITIONS.handle).toBeDefined()
  })

  it('all view definitions should have required fields', () => {
    Object.values(VIEW_DEFINITIONS).forEach(view => {
      expect(view.angle).toBeDefined()
      expect(view.name).toBeDefined()
      expect(view.description).toBeDefined()
      expect(view.promptModifier).toBeDefined() // Can be empty string
      expect(view.order).toBeDefined()
      expect(typeof view.order).toBe('number')
    })
  })

  it('all view angles should be unique', () => {
    const angles = Object.values(VIEW_DEFINITIONS).map(v => v.angle)
    const uniqueAngles = new Set(angles)
    expect(uniqueAngles.size).toBe(angles.length)
  })

  it('all view orders should be unique', () => {
    const orders = Object.values(VIEW_DEFINITIONS).map(v => v.order)
    const uniqueOrders = new Set(orders)
    expect(uniqueOrders.size).toBe(orders.length)
  })

  it('view orders should be sequential starting from 1', () => {
    const orders = Object.values(VIEW_DEFINITIONS).map(v => v.order).sort()
    expect(orders).toEqual([1, 2, 3])
  })

  it('front view should have empty prompt modifier', () => {
    expect(VIEW_DEFINITIONS.front.promptModifier).toBe('')
  })

  it('side view should have descriptive prompt modifier', () => {
    const modifier = VIEW_DEFINITIONS.side.promptModifier
    expect(modifier.length).toBeGreaterThan(10)
    expect(modifier).toContain('side')
    expect(modifier).toContain('profile')
  })

  it('handle view should have descriptive prompt modifier', () => {
    const modifier = VIEW_DEFINITIONS.handle.promptModifier
    expect(modifier.length).toBeGreaterThan(10)
    expect(modifier).toContain('handle')
    expect(modifier).toContain('close-up')
  })
})

describe('getAllViewDefinitions', () => {
  it('should return all 3 view definitions', () => {
    const views = getAllViewDefinitions()
    expect(views.length).toBe(3)
  })

  it('should return views sorted by order', () => {
    const views = getAllViewDefinitions()

    expect(views[0].order).toBe(1)
    expect(views[1].order).toBe(2)
    expect(views[2].order).toBe(3)
  })

  it('should return views in correct order: front, side, handle', () => {
    const views = getAllViewDefinitions()

    expect(views[0].angle).toBe('front')
    expect(views[1].angle).toBe('side')
    expect(views[2].angle).toBe('handle')
  })
})

describe('getViewDefinition', () => {
  it('should return view definition for front', () => {
    const view = getViewDefinition('front')

    expect(view).toBeDefined()
    expect(view?.angle).toBe('front')
  })

  it('should return view definition for side', () => {
    const view = getViewDefinition('side')

    expect(view).toBeDefined()
    expect(view?.angle).toBe('side')
  })

  it('should return view definition for handle', () => {
    const view = getViewDefinition('handle')

    expect(view).toBeDefined()
    expect(view?.angle).toBe('handle')
  })

  it('should return undefined for invalid angle', () => {
    const view = getViewDefinition('invalid' as ViewAngle)
    expect(view).toBeUndefined()
  })
})

describe('buildAnglePrompt', () => {
  const basePrompt = 'professional product photograph of ceramic mug with red design'

  it('should return base prompt unchanged for front view', () => {
    const result = buildAnglePrompt(basePrompt, 'front')
    expect(result).toBe(basePrompt)
  })

  it('should append side modifier for side view', () => {
    const result = buildAnglePrompt(basePrompt, 'side')

    expect(result).toContain(basePrompt)
    expect(result).toContain('side profile')
    expect(result.startsWith(basePrompt)).toBe(true)
  })

  it('should append handle modifier for handle view', () => {
    const result = buildAnglePrompt(basePrompt, 'handle')

    expect(result).toContain(basePrompt)
    expect(result).toContain('close-up')
    expect(result).toContain('handle')
    expect(result.startsWith(basePrompt)).toBe(true)
  })

  it('should throw error for invalid angle', () => {
    expect(() => {
      buildAnglePrompt(basePrompt, 'invalid' as ViewAngle)
    }).toThrow('Invalid view angle')
  })

  it('should handle empty base prompt', () => {
    const result = buildAnglePrompt('', 'side')
    expect(result).toBe(VIEW_DEFINITIONS.side.promptModifier)
  })

  it('should produce different prompts for different angles', () => {
    const frontPrompt = buildAnglePrompt(basePrompt, 'front')
    const sidePrompt = buildAnglePrompt(basePrompt, 'side')
    const handlePrompt = buildAnglePrompt(basePrompt, 'handle')

    expect(frontPrompt).not.toBe(sidePrompt)
    expect(frontPrompt).not.toBe(handlePrompt)
    expect(sidePrompt).not.toBe(handlePrompt)
  })
})

describe('getAdditionalAngles', () => {
  it('should return side and handle angles', () => {
    const angles = getAdditionalAngles()

    expect(angles).toEqual(['side', 'handle'])
  })

  it('should not include front angle', () => {
    const angles = getAdditionalAngles()

    expect(angles).not.toContain('front')
  })

  it('should return exactly 2 angles', () => {
    const angles = getAdditionalAngles()

    expect(angles.length).toBe(2)
  })
})

describe('isValidAngle', () => {
  it('should return true for front', () => {
    expect(isValidAngle('front')).toBe(true)
  })

  it('should return true for side', () => {
    expect(isValidAngle('side')).toBe(true)
  })

  it('should return true for handle', () => {
    expect(isValidAngle('handle')).toBe(true)
  })

  it('should return false for invalid angle', () => {
    expect(isValidAngle('invalid')).toBe(false)
  })

  it('should return false for empty string', () => {
    expect(isValidAngle('')).toBe(false)
  })

  it('should return false for null/undefined', () => {
    expect(isValidAngle(null as any)).toBe(false)
    expect(isValidAngle(undefined as any)).toBe(false)
  })
})

describe('Constants', () => {
  it('TOTAL_VIEWS_COUNT should be 3', () => {
    expect(TOTAL_VIEWS_COUNT).toBe(3)
  })

  it('ADDITIONAL_VIEWS_COUNT should be 2', () => {
    expect(ADDITIONAL_VIEWS_COUNT).toBe(2)
  })

  it('ADDITIONAL_VIEWS_COUNT should equal TOTAL_VIEWS_COUNT minus 1', () => {
    expect(ADDITIONAL_VIEWS_COUNT).toBe(TOTAL_VIEWS_COUNT - 1)
  })

  it('getAdditionalAngles length should match ADDITIONAL_VIEWS_COUNT', () => {
    const angles = getAdditionalAngles()
    expect(angles.length).toBe(ADDITIONAL_VIEWS_COUNT)
  })

  it('getAllViewDefinitions length should match TOTAL_VIEWS_COUNT', () => {
    const views = getAllViewDefinitions()
    expect(views.length).toBe(TOTAL_VIEWS_COUNT)
  })
})
