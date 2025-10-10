import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { Design } from '../../../../lib/types'
import { getAnalyticsIntegration, trackEvent } from '../../../../lib/utils/analytics'
import type { ViewAngle } from '../../../../lib/multiView/angleModifiers'

export interface MultiViewImage {
  angle: ViewAngle
  url: string
  generatedAt: string
}

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

interface RateLimitState {
  sessionUsed: number
  sessionLimit: number
  ipUsed?: number
  ipLimit?: number
  globalReached: boolean
  lastResetDate: string
  retryAfter?: string
}

interface DesignState {
  currentDesign: Design
  isLoading: boolean
  error: string | null
  isGenerating: boolean
  generationError: string | null
  baseImageForEnhancement?: string // base64 image for image-to-image mode
  previewImageUrl?: string // generated image preview before applying
  generationMode: 'manual' | 'text-to-image' | 'image-to-image' // current generation mode
  aiPrompt: string // current AI prompt for full-mug-render mode
  generatedMugRenderUrl: string | null // complete 2D mug render URL
  selectedTemplate: string | null // selected template ID (Story 9.2)
  multiViewUrls: MultiViewImage[] // multi-view generated images (Story 9.3)
  isGeneratingMultiView: boolean // multi-view generation in progress
  multiViewError: string | null // multi-view generation error
  isEditingPrompt: boolean // user is editing prompt (Story 9.4)
  regenerationAttempt: number // count of regeneration attempts (Story 9.4)
  isApplyingDesign: boolean // applying design in progress (Story 9.4)
  rateLimit: RateLimitState
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
  generateFromText: (prompt: string) => Promise<void>
  generateFromImage: (baseImage: string, prompt: string) => Promise<void>
  generateFromPrompt: (prompt: string) => Promise<void>
  setAIPrompt: (prompt: string) => void
  selectTemplate: (templateId: string, prompt: string) => void
  clearTemplate: () => void
  generateMultiView: (designId: string) => Promise<void>
  clearMultiViewError: () => void
  regenerateDesign: () => Promise<void>
  adjustPrompt: () => void
  applyDesign: () => Promise<void>
  setBaseImageForEnhancement: (image: string) => void
  setPreviewImage: (url: string) => void
  applyPreviewToMug: () => void
  setGenerationMode: (mode: 'manual' | 'text-to-image' | 'image-to-image') => void
  clearGenerationError: () => void
  updateRateLimit: (data: Partial<RateLimitState>) => void
  incrementSessionCount: () => void
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
    isGenerating: false,
    generationError: null,
    baseImageForEnhancement: undefined,
    previewImageUrl: undefined,
    generationMode: 'manual' as const,
    aiPrompt: '',
    generatedMugRenderUrl: null,
    selectedTemplate: null,
    multiViewUrls: [],
    isGeneratingMultiView: false,
    multiViewError: null,
    isEditingPrompt: false,
    regenerationAttempt: 0,
    isApplyingDesign: false,
    rateLimit: {
      sessionUsed: 0,
      sessionLimit: 5,
      globalReached: false,
      lastResetDate: new Date().toISOString().split('T')[0]
    },
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

    generateFromText: async (prompt: string) => {
      // Clear any previous errors
      set({ generationError: null, isGenerating: true })

      try {
        const response = await fetch('/api/generate-texture', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt, mode: 'text-to-image' }),
        })

        const data = await response.json()

        if (!response.ok) {
          // Handle rate limit errors with specific state updates
          if (data.code === 'GLOBAL_LIMIT_REACHED') {
            get().updateRateLimit({
              globalReached: true,
              retryAfter: data.retryAfter
            })
          } else if (data.code === 'IP_LIMIT_REACHED') {
            get().updateRateLimit({
              ipUsed: data.limit,
              ipLimit: data.limit,
              retryAfter: data.retryAfter
            })
          }
          throw new Error(data.error || 'Generation failed')
        }

        // Update design with generated image URL
        if (data.imageUrl) {
          get().updateDesign({ uploadedImageUrl: data.imageUrl })
        }

        // Update rate limit state with quota info from API response
        if (data.quota) {
          get().updateRateLimit({
            ipUsed: data.quota.ipUsed,
            ipLimit: data.quota.limit
          })
        }

        // Increment session count
        get().incrementSessionCount()

        set({ isGenerating: false })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.'
        set({ generationError: errorMessage, isGenerating: false })
      }
    },

    clearGenerationError: () => set({ generationError: null }),

    generateFromPrompt: async (prompt: string) => {
      // Clear any previous errors and reset editing state
      set({
        generationError: null,
        isGenerating: true,
        isEditingPrompt: false
      })

      // Track analytics event
      const startTime = Date.now()

      trackEvent('ai_generation_start', {
        event_category: 'ai_generation',
        mode: 'full-mug-render',
        prompt_length: prompt.length
      })

      try {
        const response = await fetch('/api/generate-texture', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt, mode: 'full-mug-render' }),
        })

        const data = await response.json()

        if (!response.ok) {
          // Handle rate limit errors with specific state updates
          if (data.code === 'GLOBAL_LIMIT_REACHED') {
            get().updateRateLimit({
              globalReached: true,
              retryAfter: data.retryAfter
            })
          } else if (data.code === 'IP_LIMIT_REACHED') {
            get().updateRateLimit({
              ipUsed: data.limit,
              ipLimit: data.limit,
              retryAfter: data.retryAfter
            })
          }
          throw new Error(data.error || 'Generation failed')
        }

        // Update state with generated mug render URL
        if (data.imageUrl) {
          set({ generatedMugRenderUrl: data.imageUrl })
        }

        // Update rate limit state with quota info from API response
        if (data.quota) {
          get().updateRateLimit({
            ipUsed: data.quota.ipUsed,
            ipLimit: data.quota.limit
          })
        }

        // Increment session count
        get().incrementSessionCount()

        // Track success event
        const duration = Date.now() - startTime
        trackEvent('ai_generation_success', {
          event_category: 'ai_generation',
          duration_ms: duration,
          mode: 'full-mug-render'
        })

        set({ isGenerating: false })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.'

        // Track error event
        trackEvent('ai_generation_error', {
          event_category: 'ai_generation',
          error_type: error instanceof Error ? error.message : 'unknown',
          mode: 'full-mug-render'
        })

        set({ generationError: errorMessage, isGenerating: false })
      }
    },

    setAIPrompt: (prompt: string) => set({ aiPrompt: prompt }),

    selectTemplate: (templateId: string, prompt: string) => {
      set({
        selectedTemplate: templateId,
        aiPrompt: prompt
      })

      // Track analytics event
      trackEvent('template_selected', {
        event_category: 'ai_generation',
        template_id: templateId
      })
    },

    clearTemplate: () => set({ selectedTemplate: null }),

    generateMultiView: async (designId: string) => {
      const state = get()

      // Validation: must have a generated mug render first
      if (!state.generatedMugRenderUrl || !state.aiPrompt) {
        set({ multiViewError: 'Please generate a mug design first before creating additional views.' })
        return
      }

      // Clear any previous errors
      set({ multiViewError: null, isGeneratingMultiView: true })

      // Track analytics event
      const startTime = Date.now()

      trackEvent('multi_view_requested', {
        event_category: 'ai_generation',
        design_id: designId,
        base_prompt: state.aiPrompt
      })

      try {
        // Generate side and handle views (front is already generated)
        const response = await fetch('/api/generate-multi-view', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            designId,
            basePrompt: state.aiPrompt,
            viewAngles: ['side', 'handle']
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          // Handle rate limit errors
          if (data.code === 'GLOBAL_LIMIT_REACHED') {
            get().updateRateLimit({
              globalReached: true,
              retryAfter: data.retryAfter
            })
          } else if (data.code === 'IP_LIMIT_REACHED') {
            get().updateRateLimit({
              ipUsed: data.limit,
              ipLimit: data.limit,
              retryAfter: data.retryAfter
            })
          }
          throw new Error(data.error || 'Multi-view generation failed')
        }

        // Combine front view (from generatedMugRenderUrl) with new views
        const frontView: MultiViewImage = {
          angle: 'front',
          url: state.generatedMugRenderUrl,
          generatedAt: new Date().toISOString()
        }

        const allViews: MultiViewImage[] = [frontView, ...(data.views || [])]

        // Update state with all views
        set({
          multiViewUrls: allViews,
          isGeneratingMultiView: false
        })

        // Update rate limit counters (2 new views generated)
        get().incrementSessionCount()
        get().incrementSessionCount()

        // Track success event
        const duration = Date.now() - startTime
        trackEvent('multi_view_generated', {
          event_category: 'ai_generation',
          duration_ms: duration,
          views_count: allViews.length,
          partial_success: data.partialSuccess || false
        })

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to generate additional views. Please try again.'

        // Track error event
        trackEvent('multi_view_error', {
          event_category: 'ai_generation',
          error_type: error instanceof Error ? error.message : 'unknown'
        })

        set({ multiViewError: errorMessage, isGeneratingMultiView: false })
      }
    },

    clearMultiViewError: () => set({ multiViewError: null }),

    regenerateDesign: async () => {
      const state = get()
      const currentPrompt = state.aiPrompt

      if (!currentPrompt) {
        set({ generationError: 'No prompt available to regenerate.' })
        return
      }

      // Increment regeneration attempt counter
      set({ regenerationAttempt: (state.regenerationAttempt || 0) + 1 })

      // Track analytics
      trackEvent('design_regenerated', {
        event_category: 'ai_generation',
        attempt_count: state.regenerationAttempt + 1,
        prompt_length: currentPrompt.length,
        has_multi_view: state.multiViewUrls.length > 0
      })

      // Reuse existing generateFromPrompt action
      // This will leverage AI randomness for variation
      await get().generateFromPrompt(currentPrompt)
    },

    adjustPrompt: () => {
      const state = get()

      // Track analytics
      trackEvent('prompt_adjusted', {
        event_category: 'ai_generation',
        has_existing_design: !!state.generatedMugRenderUrl,
        current_prompt_length: state.aiPrompt.length
      })

      // Clear the preview to show prompt input again
      // But keep the prompt text so user can edit it
      set({
        isEditingPrompt: true,
        generatedMugRenderUrl: null,
        multiViewUrls: [],
        regenerationAttempt: 0
      })
    },

    applyDesign: async () => {
      const state = get()

      // Validation
      if (!state.generatedMugRenderUrl) {
        set({ generationError: 'No design to apply. Please generate a design first.' })
        return
      }

      set({ isApplyingDesign: true, generationError: null })

      try {
        // Create design record in database
        const response = await fetch('/api/designs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mugColor: state.currentDesign.mugColor || '#FFFFFF',
            uploadedImageBase64: state.generatedMugRenderUrl,
            customText: state.currentDesign.customText,
            textFont: state.currentDesign.textFont,
            textPosition: state.currentDesign.textPosition,
            textSize: state.currentDesign.textSize,
            textColor: state.currentDesign.textColor
          })
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to save design')
        }

        const designId = data.data?.id || state.currentDesign.id

        // Update local state with saved design
        set({
          currentDesign: {
            ...state.currentDesign,
            id: designId,
            uploadedImageUrl: state.generatedMugRenderUrl,
            isComplete: true,
            lastModified: new Date().toISOString()
          },
          isApplyingDesign: false
        })

        // Track analytics
        trackEvent('design_applied', {
          event_category: 'ai_generation',
          design_id: designId,
          has_multi_view: state.multiViewUrls.length > 0,
          generation_method: state.selectedTemplate ? 'template' : 'manual',
          generation_count: state.regenerationAttempt + 1
        })

        // Design applied successfully - user can now fill lead capture form
        // No navigation needed - form is already visible on the right side

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to apply design. Please try again.'

        // Track error
        trackEvent('design_apply_error', {
          event_category: 'ai_generation',
          error_type: error instanceof Error ? error.message : 'unknown'
        })

        set({
          generationError: errorMessage,
          isApplyingDesign: false
        })
      }
    },

    generateFromImage: async (baseImage: string, prompt: string) => {
      if (!baseImage) {
        set({ generationError: 'Please upload a base image first.' })
        return
      }

      // Clear any previous errors
      set({ generationError: null, isGenerating: true })

      try {
        const response = await fetch('/api/generate-texture', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            prompt, 
            mode: 'image-to-image',
            baseImage 
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          // Handle rate limit errors with specific state updates
          if (data.code === 'GLOBAL_LIMIT_REACHED') {
            get().updateRateLimit({
              globalReached: true,
              retryAfter: data.retryAfter
            })
          } else if (data.code === 'IP_LIMIT_REACHED') {
            get().updateRateLimit({
              ipUsed: data.limit,
              ipLimit: data.limit,
              retryAfter: data.retryAfter
            })
          }
          throw new Error(data.error || 'Enhancement failed')
        }

        // Update preview with generated image URL
        if (data.imageUrl) {
          set({ previewImageUrl: data.imageUrl })
        }

        // Update rate limit state with quota info from API response
        if (data.quota) {
          get().updateRateLimit({
            ipUsed: data.quota.ipUsed,
            ipLimit: data.quota.limit
          })
        }

        // Increment session count
        get().incrementSessionCount()

        set({ isGenerating: false })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Enhancement failed. Try a different prompt.'
        set({ generationError: errorMessage, isGenerating: false })
      }
    },

    setBaseImageForEnhancement: (image: string) => set({ baseImageForEnhancement: image }),

    setPreviewImage: (url: string) => set({ previewImageUrl: url }),

    applyPreviewToMug: () => {
      const state = get()
      if (state.previewImageUrl) {
        get().updateDesign({ uploadedImageUrl: state.previewImageUrl })
        set({ previewImageUrl: undefined })
      }
    },

    setGenerationMode: (mode: 'manual' | 'text-to-image' | 'image-to-image') => {
      set((state) => {
        // Clear mode-specific state when switching modes
        const updates: Partial<DesignState> = { generationMode: mode }
        
        if (mode === 'manual') {
          // Clear both base image and preview when switching to manual
          updates.baseImageForEnhancement = undefined
          updates.previewImageUrl = undefined
        } else if (mode === 'text-to-image') {
          // Clear base image when switching to text-to-image, keep preview if exists
          updates.baseImageForEnhancement = undefined
        } else if (mode === 'image-to-image') {
          // Clear preview when switching to image-to-image, keep base image if exists
          updates.previewImageUrl = undefined
        }
        
        return updates
      })
    },

    updateRateLimit: (data) => set((state) => ({
      rateLimit: { ...state.rateLimit, ...data }
    })),

    incrementSessionCount: () => set((state) => ({
      rateLimit: {
        ...state.rateLimit,
        sessionUsed: state.rateLimit.sessionUsed + 1
      }
    })),

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
