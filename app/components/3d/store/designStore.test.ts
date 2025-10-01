import { describe, it, expect, beforeEach } from 'vitest'
import { useDesignStore } from './designStore'

describe('DesignStore Text Actions', () => {
  beforeEach(() => {
    // Reset store to default state before each test
    useDesignStore.getState().resetToDefault()
  })

  it('should set custom text', () => {
    const { setCustomText, currentDesign } = useDesignStore.getState()
    
    setCustomText('Hello World')
    
    expect(useDesignStore.getState().currentDesign.customText).toBe('Hello World')
    expect(useDesignStore.getState().currentDesign.lastModified).not.toBe(currentDesign.lastModified)
  })

  it('should set text font', () => {
    const { setTextFont, currentDesign } = useDesignStore.getState()
    
    setTextFont('Times, serif')
    
    expect(useDesignStore.getState().currentDesign.textFont).toBe('Times, serif')
    expect(useDesignStore.getState().currentDesign.lastModified).not.toBe(currentDesign.lastModified)
  })

  it('should set text position', () => {
    const { setTextPosition, currentDesign } = useDesignStore.getState()
    const position = { x: 1.5, y: -0.5, z: 0.2 }
    
    setTextPosition(position)
    
    expect(JSON.parse(useDesignStore.getState().currentDesign.textPosition!)).toEqual(position)
    expect(useDesignStore.getState().currentDesign.lastModified).not.toBe(currentDesign.lastModified)
  })

  it('should set text size', () => {
    const { setTextSize, currentDesign } = useDesignStore.getState()
    
    setTextSize(1.5)
    
    expect(useDesignStore.getState().currentDesign.textSize).toBe(1.5)
    expect(useDesignStore.getState().currentDesign.lastModified).not.toBe(currentDesign.lastModified)
  })

  it('should set text color', () => {
    const { setTextColor, currentDesign } = useDesignStore.getState()
    
    setTextColor('#ff0000')
    
    expect(useDesignStore.getState().currentDesign.textColor).toBe('#ff0000')
    expect(useDesignStore.getState().currentDesign.lastModified).not.toBe(currentDesign.lastModified)
  })

  it('should reset to default values including text properties', () => {
    const store = useDesignStore.getState()
    
    // Modify text properties
    store.setCustomText('Test Text')
    store.setTextFont('Times, serif')
    store.setTextPosition({ x: 1, y: 1, z: 1 })
    store.setTextSize(2.0)
    store.setTextColor('#ff0000')
    
    // Reset
    store.resetToDefault()
    
    const newState = useDesignStore.getState()
    expect(newState.currentDesign.customText).toBeUndefined()
    expect(newState.currentDesign.textFont).toBe('Arial, sans-serif')
    expect(JSON.parse(newState.currentDesign.textPosition!)).toEqual({ x: 0, y: 0, z: 0 })
    expect(newState.currentDesign.textSize).toBe(1.0)
    expect(newState.currentDesign.textColor).toBe('#000000')
  })

  it('should update design with multiple text properties', () => {
    const { updateDesign, currentDesign } = useDesignStore.getState()
    
    updateDesign({
      customText: 'Updated Text',
      textFont: 'Impact, fantasy',
      textSize: 1.8,
      textColor: '#0066cc'
    })
    
    const newState = useDesignStore.getState()
    expect(newState.currentDesign.customText).toBe('Updated Text')
    expect(newState.currentDesign.textFont).toBe('Impact, fantasy')
    expect(newState.currentDesign.textSize).toBe(1.8)
    expect(newState.currentDesign.textColor).toBe('#0066cc')
    expect(newState.currentDesign.lastModified).not.toBe(currentDesign.lastModified)
  })

  it('should handle text position as JSON string correctly', () => {
    const { setTextPosition } = useDesignStore.getState()
    const position = { x: -0.5, y: 0.75, z: -0.25 }
    
    setTextPosition(position)
    
    const storedPosition = JSON.parse(useDesignStore.getState().currentDesign.textPosition!)
    expect(storedPosition).toEqual(position)
    expect(typeof useDesignStore.getState().currentDesign.textPosition).toBe('string')
  })

  it('should preserve other design properties when updating text', () => {
    const store = useDesignStore.getState()
    const originalColor = store.currentDesign.mugColor
    const originalId = store.currentDesign.id
    
    store.setCustomText('Test Text')
    
    const newState = useDesignStore.getState()
    expect(newState.currentDesign.mugColor).toBe(originalColor)
    expect(newState.currentDesign.id).toBe(originalId)
    expect(newState.currentDesign.customText).toBe('Test Text')
  })

  it('should handle clearing custom text', () => {
    const { setCustomText } = useDesignStore.getState()
    
    setCustomText('Initial Text')
    expect(useDesignStore.getState().currentDesign.customText).toBe('Initial Text')
    
    setCustomText('')
    expect(useDesignStore.getState().currentDesign.customText).toBe('')
  })

  it('should handle edge cases for text size', () => {
    const { setTextSize } = useDesignStore.getState()
    
    setTextSize(0.1)
    expect(useDesignStore.getState().currentDesign.textSize).toBe(0.1)
    
    setTextSize(5.0)
    expect(useDesignStore.getState().currentDesign.textSize).toBe(5.0)
  })
})
