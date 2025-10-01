import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { Design } from '../../../../lib/types'
import { getAnalyticsIntegration } from '../../../../lib/utils/analytics'

interface PerformanceConfig {
  targetFPS: number
  qualityLevel: 'low' | 'medium' | 'high' | 'ultra'
  enableShadows: boolean
  enableReflections: boolean
  lodEnabled: boolean
  textureQuality: number
  isConstrainedViewport: boolean // New property for split-screen mode
  constrainedModeTargetFPS: number // Lower target FPS for constrained mode
  adaptiveQualityEnabled: boolean // Enable adaptive quality based on performance
}

interface AnimationConfig {
  cameraTransitionDuration: number
  autoReturnDelay: number
  easingFunction: string
  dampingFactor: number
}

interface PerformanceMetrics {
  fps: number
  lastFrameTime: number
  averageFPS: number
  frameTimeHistory: number[]
  memoryUsage: number
  isThrottling: boolean
}

interface EngagementData {
  hasUploadedImage: boolean
  hasCustomizedText: boolean
  hasChangedColor: boolean
  interactionCount: number
  timeSpent: number
  engagementScore: number
  sessionStartTime: number
}



interface DesignState {
  currentDesign: Design
  isLoading: boolean
  error: string | null
  performance: PerformanceMetrics
  performanceConfig: PerformanceConfig
  animationConfig: AnimationConfig
  engagement: EngagementData
  camera: {
    position: [number, number, number]
    target: [number, number, number]
    isAnimating: boolean
    autoReturnTimer: number | null
  }
  interaction: {
    isDragging: boolean
    isZooming: boolean
    lastPointerPosition: { x: number; y: number } | null
    lastInteractionTime: number
  }
}

interface DesignActions {
  updateDesign: (updates: Partial<Design>) => void
  setMugColor: (color: string) => void
  setCustomText: (text: string) => void
  setTextFont: (font: string) => void
  setTextPosition: (position: { x: number; y: number; z: number }) => void
  setTextSize: (size: number) => void
  setTextColor: (color: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  updatePerformance: (fps: number, frameTime: number, memoryUsage?: number) => void
  updateCamera: (position: [number, number, number], target: [number, number, number], isAnimating?: boolean) => void
  setInteraction: (interaction: Partial<DesignState['interaction']>) => void
  updatePerformanceConfig: (config: Partial<PerformanceConfig>) => void
  setConstrainedViewportMode: (isConstrained: boolean) => void
  updateAnimationConfig: (config: Partial<AnimationConfig>) => void
  startCameraAnimation: () => void
  stopCameraAnimation: () => void
  resetAutoReturnTimer: () => void
  clearAutoReturnTimer: () => void
  resetToDefault: () => void
  resetCameraToDefault: () => void
  resetImage: () => void
  resetColor: () => void
  resetText: () => void
  resetElement: (element: 'image' | 'color' | 'text') => void
  exportDesignPreview: () => string
  // Engagement tracking actions
  trackImageUpload: () => void
  trackTextCustomization: () => void
  trackColorChange: () => void
  trackInteraction: () => void
  calculateEngagementScore: () => number
  updateEngagement: (updates: Partial<EngagementData>) => void

}

const defaultDesign: Design = {
  id: crypto.randomUUID(),
  mugColor: '#3b82f6', // Blue color for better visibility
  uploadedImageBase64: undefined,
  uploadedImageUrl: undefined,
  customText: undefined,
  textFont: 'Arial, sans-serif',
  textPosition: JSON.stringify({ x: 0, y: 0, z: 0 }),
  textSize: 1.0,
  textColor: '#000000',
  createdAt: new Date().toISOString(),
  lastModified: new Date().toISOString(),
  isComplete: false
}

const defaultCamera: [number, number, number] = [3, 2, 5]
const defaultTarget: [number, number, number] = [0, 0, 0]

const defaultPerformanceConfig: PerformanceConfig = {
  targetFPS: 60,
  qualityLevel: 'high',
  enableShadows: true,
  enableReflections: true,
  lodEnabled: true,
  textureQuality: 1.0,
  isConstrainedViewport: false,
  constrainedModeTargetFPS: 30, // Lower target for split-screen mode
  adaptiveQualityEnabled: true
}

const defaultAnimationConfig: AnimationConfig = {
  cameraTransitionDuration: 1000,
  autoReturnDelay: 10000,
  easingFunction: 'easeInOutCubic',
  dampingFactor: 0.08
}

export const useDesignStore = create<DesignState & DesignActions>()(
  subscribeWithSelector((set, get) => ({
    // State
    currentDesign: defaultDesign,
    isLoading: false,
    error: null,
    performance: {
      fps: 60,
      lastFrameTime: 0,
      averageFPS: 60,
      frameTimeHistory: [],
      memoryUsage: 0,
      isThrottling: false
    },
    performanceConfig: defaultPerformanceConfig,
    animationConfig: defaultAnimationConfig,
    engagement: {
      hasUploadedImage: false,
      hasCustomizedText: false,
      hasChangedColor: false,
      interactionCount: 0,
      timeSpent: 0,
      engagementScore: 0,
      sessionStartTime: Date.now()
    },
    camera: {
      position: defaultCamera,
      target: defaultTarget,
      isAnimating: false,
      autoReturnTimer: null
    },
    interaction: {
      isDragging: false,
      isZooming: false,
      lastPointerPosition: null,
      lastInteractionTime: Date.now()
    },

    // Actions
    updateDesign: (updates) => {
      set((state) => ({
        currentDesign: {
          ...state.currentDesign,
          ...updates,
          lastModified: new Date().toISOString()
        }
      }))
      
      // Track engagement if image was uploaded
      if (updates.uploadedImageBase64 || updates.uploadedImageUrl) {
        get().trackImageUpload()
      }
    },

    setMugColor: (color) => {
      set((state) => ({
        currentDesign: {
          ...state.currentDesign,
          mugColor: color,
          lastModified: new Date().toISOString()
        }
      }))
      get().trackColorChange()
    },

    setCustomText: (text) => {
      set((state) => ({
        currentDesign: {
          ...state.currentDesign,
          customText: text,
          lastModified: new Date().toISOString()
        }
      }))
      get().trackTextCustomization()
    },

    setTextFont: (font) => set((state) => ({
      currentDesign: {
        ...state.currentDesign,
        textFont: font,
        lastModified: new Date().toISOString()
      }
    })),

    setTextPosition: (position) => set((state) => ({
      currentDesign: {
        ...state.currentDesign,
        textPosition: JSON.stringify(position),
        lastModified: new Date().toISOString()
      }
    })),

    setTextSize: (size) => set((state) => ({
      currentDesign: {
        ...state.currentDesign,
        textSize: size,
        lastModified: new Date().toISOString()
      }
    })),

    setTextColor: (color) => set((state) => ({
      currentDesign: {
        ...state.currentDesign,
        textColor: color,
        lastModified: new Date().toISOString()
      }
    })),

    setLoading: (loading) => set({ isLoading: loading }),

    setError: (error) => set({ error }),

    updatePerformance: (fps, frameTime, memoryUsage = 0) => set((state) => {
      const frameTimeHistory = [...state.performance.frameTimeHistory, frameTime].slice(-30) // Keep last 30 frames
      const averageFPS = frameTimeHistory.length > 0 
        ? 1000 / (frameTimeHistory.reduce((a, b) => a + b, 0) / frameTimeHistory.length)
        : fps
      const isThrottling = fps < state.performanceConfig.targetFPS * 0.8

      return {
        performance: {
          fps,
          lastFrameTime: frameTime,
          averageFPS,
          frameTimeHistory,
          memoryUsage,
          isThrottling
        }
      }
    }),

    updateCamera: (position, target, isAnimating = false) => set((state) => ({
      camera: { 
        ...state.camera,
        position, 
        target,
        isAnimating
      }
    })),

    setInteraction: (interaction) => set((state) => ({
      interaction: { ...state.interaction, ...interaction, lastInteractionTime: Date.now() }
    })),

    updatePerformanceConfig: (config) => set((state) => ({
      performanceConfig: { ...state.performanceConfig, ...config }
    })),

    updateAnimationConfig: (config) => set((state) => ({
      animationConfig: { ...state.animationConfig, ...config }
    })),

    setConstrainedViewportMode: (isConstrained) => set((state) => {
      const performanceConfig = {
        ...state.performanceConfig,
        isConstrainedViewport: isConstrained,
        enableShadows: isConstrained ? false : state.performanceConfig.enableShadows,
        // Reduce quality level in constrained mode
        qualityLevel: isConstrained && state.performanceConfig.qualityLevel === 'ultra' 
          ? 'high' as const
          : isConstrained && state.performanceConfig.qualityLevel === 'high'
          ? 'medium' as const
          : state.performanceConfig.qualityLevel,
        // Lower texture quality in constrained mode
        textureQuality: isConstrained 
          ? Math.min(state.performanceConfig.textureQuality, 0.8)
          : state.performanceConfig.textureQuality
      }
      return { performanceConfig }
    }),

    startCameraAnimation: () => set((state) => ({
      camera: { ...state.camera, isAnimating: true }
    })),

    stopCameraAnimation: () => set((state) => ({
      camera: { ...state.camera, isAnimating: false }
    })),

    resetAutoReturnTimer: () => set((state) => {
      if (state.camera.autoReturnTimer) {
        clearTimeout(state.camera.autoReturnTimer)
      }
      const timer = window.setTimeout(() => {
        const currentState = get()
        if (!currentState.interaction.isDragging && !currentState.interaction.isZooming) {
          currentState.resetCameraToDefault()
        }
      }, state.animationConfig.autoReturnDelay)
      
      return {
        camera: { ...state.camera, autoReturnTimer: timer }
      }
    }),

    clearAutoReturnTimer: () => set((state) => {
      if (state.camera.autoReturnTimer) {
        clearTimeout(state.camera.autoReturnTimer)
      }
      return {
        camera: { ...state.camera, autoReturnTimer: null }
      }
    }),

    resetToDefault: () => set((state) => {
      if (state.camera.autoReturnTimer) {
        clearTimeout(state.camera.autoReturnTimer)
      }
      return {
        currentDesign: {
          ...defaultDesign,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString()
        },
        camera: {
          position: defaultCamera,
          target: defaultTarget,
          isAnimating: false,
          autoReturnTimer: null
        },
        interaction: {
          isDragging: false,
          isZooming: false,
          lastPointerPosition: null,
          lastInteractionTime: Date.now()
        },
        error: null
      }
    }),

    resetCameraToDefault: () => set((state) => {
      if (state.camera.autoReturnTimer) {
        clearTimeout(state.camera.autoReturnTimer)
      }
      return {
        camera: {
          position: defaultCamera,
          target: defaultTarget,
          isAnimating: false,
          autoReturnTimer: null
        }
      }
    }),

    resetImage: () => set((state) => ({
      currentDesign: {
        ...state.currentDesign,
        uploadedImageBase64: undefined,
        uploadedImageUrl: undefined,
        lastModified: new Date().toISOString()
      }
    })),

    resetColor: () => set((state) => ({
      currentDesign: {
        ...state.currentDesign,
        mugColor: '#3b82f6', // Blue color for better visibility
        lastModified: new Date().toISOString()
      }
    })),

    resetText: () => set((state) => ({
      currentDesign: {
        ...state.currentDesign,
        customText: undefined,
        textFont: 'Arial, sans-serif',
        textPosition: JSON.stringify({ x: 0, y: 0, z: 0 }),
        textSize: 1.0,
        textColor: '#000000',
        lastModified: new Date().toISOString()
      }
    })),

    resetElement: (element) => {
      const actions = get()
      switch (element) {
        case 'image':
          actions.resetImage()
          break
        case 'color':
          actions.resetColor()
          break
        case 'text':
          actions.resetText()
          break
      }
    },

    exportDesignPreview: () => {
      // This will be implemented to generate a static image preview
      // For now, return a placeholder
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    },

    // Engagement tracking actions
    trackImageUpload: () => set((state) => {
      const newEngagement = {
        ...state.engagement,
        hasUploadedImage: true,
        interactionCount: state.engagement.interactionCount + 1,
        timeSpent: Date.now() - state.engagement.sessionStartTime
      }
      const score = get().calculateEngagementScore()
      
      // Analytics integration - track conversion funnel progression
      const analytics = getAnalyticsIntegration()
      const isFirstCustomization = !state.engagement.hasUploadedImage && !state.engagement.hasCustomizedText && !state.engagement.hasChangedColor
      
      if (isFirstCustomization) {
        analytics.trackConversionFunnel('customization', {
          first_customization_type: 'image',
          interaction_count: newEngagement.interactionCount,
          time_to_first_customization: newEngagement.timeSpent
        })
      }
      
      return {
        engagement: { ...newEngagement, engagementScore: score }
      }
    }),

    trackTextCustomization: () => set((state) => {
      const newEngagement = {
        ...state.engagement,
        hasCustomizedText: true,
        interactionCount: state.engagement.interactionCount + 1,
        timeSpent: Date.now() - state.engagement.sessionStartTime
      }
      const score = get().calculateEngagementScore()
      
      // Analytics integration - track conversion funnel progression
      const analytics = getAnalyticsIntegration()
      const isFirstCustomization = !state.engagement.hasUploadedImage && !state.engagement.hasCustomizedText && !state.engagement.hasChangedColor
      
      if (isFirstCustomization) {
        analytics.trackConversionFunnel('customization', {
          first_customization_type: 'text',
          interaction_count: newEngagement.interactionCount,
          time_to_first_customization: newEngagement.timeSpent
        })
      }
      
      return {
        engagement: { ...newEngagement, engagementScore: score }
      }
    }),

    trackColorChange: () => set((state) => {
      const newEngagement = {
        ...state.engagement,
        hasChangedColor: true,
        interactionCount: state.engagement.interactionCount + 1,
        timeSpent: Date.now() - state.engagement.sessionStartTime
      }
      const score = get().calculateEngagementScore()
      
      // Analytics integration - track conversion funnel progression
      const analytics = getAnalyticsIntegration()
      const isFirstCustomization = !state.engagement.hasUploadedImage && !state.engagement.hasCustomizedText && !state.engagement.hasChangedColor
      
      if (isFirstCustomization) {
        analytics.trackConversionFunnel('customization', {
          first_customization_type: 'color',
          interaction_count: newEngagement.interactionCount,
          time_to_first_customization: newEngagement.timeSpent
        })
      }
      
      return {
        engagement: { ...newEngagement, engagementScore: score }
      }
    }),

    trackInteraction: () => set((state) => {
      const newEngagement = {
        ...state.engagement,
        interactionCount: state.engagement.interactionCount + 1,
        timeSpent: Date.now() - state.engagement.sessionStartTime
      }
      const score = get().calculateEngagementScore()
      return {
        engagement: { ...newEngagement, engagementScore: score }
      }
    }),

    calculateEngagementScore: () => {
      const state = get()
      const data = state.engagement
      let score = 0
      if (data.hasUploadedImage) score += 40
      if (data.hasCustomizedText) score += 30
      if (data.hasChangedColor) score += 20
      score += Math.min(data.interactionCount * 2, 20)
      score += Math.min(data.timeSpent / 1000 / 10, 10) // 1 point per 10 seconds, max 10
      return Math.min(score, 100)
    },

    updateEngagement: (updates) => set((state) => ({
      engagement: { ...state.engagement, ...updates }
    })),


  }))
)

// Subscribe to design changes for analytics
useDesignStore.subscribe(
  (state) => state.currentDesign,
  (design, prevDesign) => {
    if (design.lastModified !== prevDesign.lastModified) {
      // TODO: Track design change event for analytics
      console.log('Design updated:', design)
    }
  }
)
