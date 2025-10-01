/**
 * 3D Performance Monitoring Utilities
 * Story 3.5: Performance Monitoring and System Health
 * 
 * Addresses PERF-001: 3D Performance Degradation on Mobile Devices
 * - Device capability detection with memory/GPU thresholds
 * - Progressive 3D quality settings based on device capabilities
 * - Automatic fallback to static images for low-end devices
 * - FPS monitoring with automatic quality adjustment
 * - Battery impact measurement on mobile devices
 */

export interface DeviceCapability {
  /** GPU renderer information */
  renderer: string;
  /** Estimated GPU tier (1-4, where 4 is high-end) */
  gpuTier: number;
  /** Available memory in GB */
  memoryGB: number;
  /** Is mobile device */
  isMobile: boolean;
  /** WebGL version supported */
  webglVersion: number;
  /** Maximum texture size supported */
  maxTextureSize: number;
  /** Device pixel ratio */
  devicePixelRatio: number;
}

export interface PerformanceQualitySettings {
  /** Texture resolution multiplier (0.25 to 1.0) */
  textureQuality: number;
  /** Shadow quality (0-2) */
  shadowQuality: number;
  /** Anti-aliasing enabled */
  antiAliasing: boolean;
  /** Use static fallback instead of 3D */
  useStaticFallback: boolean;
  /** Target FPS */
  targetFPS: number;
}

export interface PerformanceMetrics {
  /** Current FPS */
  fps: number;
  /** Frame time in milliseconds */
  frameTime: number;
  /** Memory usage in MB */
  memoryUsage: number;
  /** GPU utilization percentage (estimated) */
  gpuUtilization: number;
  /** Timestamp */
  timestamp: number;
  /** Battery impact (0-1, mobile only) */
  batteryImpact?: number;
}

/**
 * Device capability detector with fallback mechanisms
 */
export class DeviceCapabilityDetector {
  private canvas?: HTMLCanvasElement;
  private gl?: WebGLRenderingContext | WebGL2RenderingContext;
  private debugInfo?: WEBGL_debug_renderer_info;

  constructor() {
    this.initWebGL();
  }

  private initWebGL(): void {
    try {
      this.canvas = document.createElement('canvas');
      this.gl = this.canvas.getContext('webgl2') || this.canvas.getContext('webgl') || undefined;
      
      if (this.gl) {
        this.debugInfo = this.gl.getExtension('WEBGL_debug_renderer_info') || undefined;
      }
    } catch (error) {
      console.warn('WebGL initialization failed:', error);
    }
  }

  /**
   * Detect device capabilities with comprehensive fallback handling
   */
  public detectCapabilities(): DeviceCapability {
    const capability: DeviceCapability = {
      renderer: 'unknown',
      gpuTier: 1,
      memoryGB: 2, // Conservative default
      isMobile: this.isMobileDevice(),
      webglVersion: 1,
      maxTextureSize: 512, // Conservative default
      devicePixelRatio: window.devicePixelRatio || 1
    };

    if (!this.gl) {
      // No WebGL support - use static fallback
      capability.gpuTier = 0;
      return capability;
    }

    try {
      // Get GPU information
      if (this.debugInfo) {
        capability.renderer = this.gl.getParameter(this.debugInfo.UNMASKED_RENDERER_WEBGL) || 'unknown';
      }

      // Determine WebGL version
      capability.webglVersion = this.gl instanceof WebGL2RenderingContext ? 2 : 1;

      // Get maximum texture size
      capability.maxTextureSize = this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE) || 512;

      // Estimate GPU tier based on renderer and capabilities
      capability.gpuTier = this.estimateGPUTier(capability.renderer, capability.maxTextureSize);

      // Estimate memory (conservative approach)
      capability.memoryGB = this.estimateMemory(capability);

    } catch (error) {
      console.warn('Device capability detection failed:', error);
    }

    return capability;
  }

  private isMobileDevice(): boolean {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           Boolean(navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
  }

  private estimateGPUTier(renderer: string, maxTextureSize: number): number {
    const rendererLower = renderer.toLowerCase();
    
    // High-end desktop GPUs
    if (rendererLower.includes('rtx') || 
        rendererLower.includes('radeon rx') ||
        rendererLower.includes('geforce gtx 1') ||
        maxTextureSize >= 8192) {
      return 4;
    }
    
    // Mid-range desktop or high-end mobile
    if (rendererLower.includes('gtx') || 
        rendererLower.includes('radeon') ||
        rendererLower.includes('adreno 6') ||
        rendererLower.includes('mali-g') ||
        maxTextureSize >= 4096) {
      return 3;
    }
    
    // Low-mid range or older mobile
    if (rendererLower.includes('intel') || 
        rendererLower.includes('adreno') ||
        rendererLower.includes('mali') ||
        maxTextureSize >= 2048) {
      return 2;
    }
    
    // Very low-end or integrated
    return 1;
  }

  private estimateMemory(capability: DeviceCapability): number {
    // Conservative memory estimation based on device characteristics
    if (capability.isMobile) {
      if (capability.gpuTier >= 3) return 6; // High-end mobile
      if (capability.gpuTier >= 2) return 4; // Mid-range mobile
      return 2; // Low-end mobile
    } else {
      if (capability.gpuTier >= 4) return 16; // High-end desktop
      if (capability.gpuTier >= 3) return 8;  // Mid-range desktop
      if (capability.gpuTier >= 2) return 4;  // Low-mid desktop
      return 2; // Very low-end
    }
  }

  public cleanup(): void {
    if (this.canvas) {
      this.canvas.remove();
    }
  }
}

/**
 * Performance quality manager with automatic adjustment
 */
export class PerformanceQualityManager {
  private capability: DeviceCapability;
  private currentSettings: PerformanceQualitySettings;
  private performanceHistory: PerformanceMetrics[] = [];
  private adjustmentCooldown = 0;

  constructor(capability: DeviceCapability) {
    this.capability = capability;
    this.currentSettings = this.getInitialQualitySettings(capability);
  }

  private getInitialQualitySettings(capability: DeviceCapability): PerformanceQualitySettings {
    // Use static fallback for very low-end devices
    if (capability.gpuTier === 0 || (capability.isMobile && capability.gpuTier === 1)) {
      return {
        textureQuality: 0.25,
        shadowQuality: 0,
        antiAliasing: false,
        useStaticFallback: true,
        targetFPS: 15
      };
    }

    // Progressive quality based on GPU tier
    const baseSettings: PerformanceQualitySettings = {
      textureQuality: Math.max(0.25, capability.gpuTier * 0.25),
      shadowQuality: Math.max(0, capability.gpuTier - 1),
      antiAliasing: capability.gpuTier >= 3,
      useStaticFallback: false,
      targetFPS: capability.isMobile ? 30 : 60
    };

    // Adjust for mobile constraints
    if (capability.isMobile) {
      baseSettings.textureQuality *= 0.8;
      baseSettings.shadowQuality = Math.min(1, baseSettings.shadowQuality);
      baseSettings.antiAliasing = capability.gpuTier >= 4;
    }

    return baseSettings;
  }

  /**
   * Get current quality settings
   */
  public getQualitySettings(): PerformanceQualitySettings {
    return { ...this.currentSettings };
  }

  /**
   * Update performance metrics and adjust quality if needed
   */
  public updatePerformance(metrics: PerformanceMetrics): boolean {
    this.performanceHistory.push(metrics);
    
    // Keep only last 60 measurements (approximately 1 second at 60fps)
    if (this.performanceHistory.length > 60) {
      this.performanceHistory = this.performanceHistory.slice(-60);
    }

    // Don't adjust during cooldown
    if (this.adjustmentCooldown > 0) {
      this.adjustmentCooldown--;
      return false;
    }

    // Only adjust if we have enough data
    if (this.performanceHistory.length < 30) {
      return false;
    }

    const recentMetrics = this.performanceHistory.slice(-30);
    const avgFPS = recentMetrics.reduce((sum, m) => sum + m.fps, 0) / recentMetrics.length;
    const targetFPS = this.currentSettings.targetFPS;

    let settingsChanged = false;

    // Decrease quality if performance is poor
    if (avgFPS < targetFPS * 0.8) {
      settingsChanged = this.decreaseQuality();
    } 
    // Increase quality if performance is good and we're not at max
    else if (avgFPS > targetFPS * 0.95 && !this.isMaxQuality()) {
      settingsChanged = this.increaseQuality();
    }

    if (settingsChanged) {
      this.adjustmentCooldown = 180; // 3 seconds at 60fps
    }

    return settingsChanged;
  }

  /**
   * Force specific quality settings (for manual override)
   */
  public forceSettings(level: 'low' | 'medium' | 'high' | 'static'): void {
    switch (level) {
      case 'static':
        this.currentSettings.useStaticFallback = true;
        break;
      case 'low':
        Object.assign(this.currentSettings, {
          textureQuality: 0.25,
          shadowQuality: 0,
          antiAliasing: false,
          useStaticFallback: false,
          targetFPS: this.capability.isMobile ? 20 : 30
        });
        break;
      case 'medium':
        Object.assign(this.currentSettings, {
          textureQuality: 0.5,
          shadowQuality: 1,
          antiAliasing: false,
          useStaticFallback: false,
          targetFPS: this.capability.isMobile ? 30 : 45
        });
        break;
      case 'high':
        Object.assign(this.currentSettings, {
          textureQuality: 1.0,
          shadowQuality: 2,
          antiAliasing: !this.capability.isMobile,
          useStaticFallback: false,
          targetFPS: this.capability.isMobile ? 30 : 60
        });
        break;
    }
  }

  private decreaseQuality(): boolean {
    let changed = false;

    // Progressive quality reduction
    if (this.currentSettings.antiAliasing) {
      this.currentSettings.antiAliasing = false;
      changed = true;
    } else if (this.currentSettings.shadowQuality > 0) {
      this.currentSettings.shadowQuality--;
      changed = true;
    } else if (this.currentSettings.textureQuality > 0.25) {
      this.currentSettings.textureQuality = Math.max(0.25, this.currentSettings.textureQuality - 0.25);
      changed = true;
    } else if (!this.currentSettings.useStaticFallback) {
      // Last resort: switch to static fallback
      this.currentSettings.useStaticFallback = true;
      changed = true;
    }

    return changed;
  }

  private increaseQuality(): boolean {
    if (this.currentSettings.useStaticFallback) {
      return false; // Don't increase from static fallback automatically
    }

    let changed = false;

    // Progressive quality increase
    if (this.currentSettings.textureQuality < 1.0) {
      this.currentSettings.textureQuality = Math.min(1.0, this.currentSettings.textureQuality + 0.25);
      changed = true;
    } else if (this.currentSettings.shadowQuality < 2 && this.capability.gpuTier >= 3) {
      this.currentSettings.shadowQuality++;
      changed = true;
    } else if (!this.currentSettings.antiAliasing && this.capability.gpuTier >= 3) {
      this.currentSettings.antiAliasing = true;
      changed = true;
    }

    return changed;
  }

  private isMaxQuality(): boolean {
    const maxForDevice = this.getInitialQualitySettings(this.capability);
    return this.currentSettings.textureQuality >= maxForDevice.textureQuality &&
           this.currentSettings.shadowQuality >= maxForDevice.shadowQuality &&
           this.currentSettings.antiAliasing >= maxForDevice.antiAliasing;
  }
}

/**
 * FPS monitor for 3D scenes
 */
export class FPSMonitor {
  private frames: number[] = [];
  private lastTime = performance.now();
  private frameCount = 0;

  /**
   * Update FPS calculation (call once per frame)
   */
  public update(): PerformanceMetrics {
    const now = performance.now();
    const deltaTime = now - this.lastTime;
    this.lastTime = now;

    // Calculate FPS
    this.frames.push(1000 / deltaTime);
    if (this.frames.length > 60) {
      this.frames.shift();
    }

    const fps = this.frames.reduce((sum, f) => sum + f, 0) / this.frames.length;

    // Estimate memory usage (basic heuristic)
    const memoryUsage = this.estimateMemoryUsage();

    // Estimate GPU utilization based on frame time
    const gpuUtilization = Math.min(100, (deltaTime / 16.67) * 100); // 16.67ms = 60fps

    this.frameCount++;

    return {
      fps: Math.round(fps * 100) / 100,
      frameTime: Math.round(deltaTime * 100) / 100,
      memoryUsage,
      gpuUtilization: Math.round(gpuUtilization),
      timestamp: now,
      batteryImpact: this.estimateBatteryImpact(fps, deltaTime)
    };
  }

  private estimateMemoryUsage(): number {
    // Basic memory estimation (in MB)
    if ((performance as any).memory) {
      return Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024);
    }
    
    // Fallback estimation based on frame count
    return Math.min(512, 50 + (this.frameCount * 0.001));
  }

  private estimateBatteryImpact(fps: number, frameTime: number): number | undefined {
    // Only calculate for mobile devices
    if (!/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      return undefined;
    }

    // Battery impact score (0-1, where 1 is high impact)
    const targetFrameTime = 16.67; // 60fps
    const frameTimeImpact = Math.min(1, frameTime / targetFrameTime);
    const fpsImpact = Math.min(1, fps / 60);
    
    return Math.round((frameTimeImpact + fpsImpact) / 2 * 100) / 100;
  }
}

/**
 * Main 3D Performance Manager
 */
export class Performance3DManager {
  private detector: DeviceCapabilityDetector;
  private qualityManager: PerformanceQualityManager;
  private fpsMonitor: FPSMonitor;
  private capability: DeviceCapability;
  private onQualityChange?: (settings: PerformanceQualitySettings) => void;

  constructor(onQualityChange?: (settings: PerformanceQualitySettings) => void) {
    this.detector = new DeviceCapabilityDetector();
    this.capability = this.detector.detectCapabilities();
    this.qualityManager = new PerformanceQualityManager(this.capability);
    this.fpsMonitor = new FPSMonitor();
    this.onQualityChange = onQualityChange;
  }

  /**
   * Initialize performance monitoring
   */
  public initialize(): { capability: DeviceCapability; settings: PerformanceQualitySettings } {
    return {
      capability: this.capability,
      settings: this.qualityManager.getQualitySettings()
    };
  }

  /**
   * Update performance (call once per frame)
   */
  public updateFrame(): PerformanceMetrics {
    const metrics = this.fpsMonitor.update();
    
    const qualityChanged = this.qualityManager.updatePerformance(metrics);
    if (qualityChanged && this.onQualityChange) {
      this.onQualityChange(this.qualityManager.getQualitySettings());
    }

    return metrics;
  }

  /**
   * Get current quality settings
   */
  public getQualitySettings(): PerformanceQualitySettings {
    return this.qualityManager.getQualitySettings();
  }

  /**
   * Get device capabilities
   */
  public getDeviceCapability(): DeviceCapability {
    return this.capability;
  }

  /**
   * Force quality adjustment (for testing or manual override)
   */
  public forceQualityLevel(level: 'low' | 'medium' | 'high' | 'static'): void {
    // Use quality manager's forceSettings method to directly update internal state
    this.qualityManager.forceSettings(level);
  }

  /**
   * Cleanup resources
   */
  public dispose(): void {
    this.detector.cleanup();
  }
}