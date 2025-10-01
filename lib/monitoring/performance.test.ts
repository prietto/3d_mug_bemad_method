/**
 * 3D Performance Monitoring Tests - TEST-001 WebGL Mocking Fix
 * Story 3.5: Performance Monitoring and System Health
 * 
 * Tests for PERF-001: 3D Performance Degradation on Mobile Devices mitigation
 */

import { beforeEach, vi, afterEach } from 'vitest';
import {
  DeviceCapabilityDetector,
  PerformanceQualityManager,
  FPSMonitor,
  Performance3DManager
} from './performance';

// Mock WebGL2RenderingContext for instanceof checks
class MockWebGL2RenderingContext {
  getParameter = vi.fn();
  getExtension = vi.fn();
  
  // WebGL constants
  MAX_TEXTURE_SIZE = 34024;
  UNMASKED_RENDERER_WEBGL = 37446;
  UNMASKED_VENDOR_WEBGL = 37445;
}

// Make it available globally for instanceof checks
Object.defineProperty(global, 'WebGL2RenderingContext', {
  value: MockWebGL2RenderingContext,
  writable: true
});

// Mock WebGL and DOM APIs
const mockWebGLContext = new MockWebGL2RenderingContext();

const mockDebugInfo = {
  UNMASKED_RENDERER_WEBGL: 37446,
  UNMASKED_VENDOR_WEBGL: 37445
};

const mockCanvas = {
  getContext: vi.fn(() => mockWebGLContext),
  remove: vi.fn()
};

// Mock global objects
Object.defineProperty(global, 'document', {
  value: {
    createElement: vi.fn(() => mockCanvas)
  },
  writable: true
});

Object.defineProperty(global, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    maxTouchPoints: 0
  },
  writable: true
});

Object.defineProperty(global, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    memory: {
      usedJSHeapSize: 50 * 1024 * 1024 // 50MB
    }
  },
  writable: true
});

describe('DeviceCapabilityDetector', () => {
  let detector: DeviceCapabilityDetector;

  beforeEach(() => {
    vi.clearAllMocks();
    detector = new DeviceCapabilityDetector();
  });

  afterEach(() => {
    detector.cleanup();
  });

  it('should detect capabilities for high-end desktop GPU', () => {
    // Mock high-end GPU with WebGL2
    mockWebGLContext.getParameter.mockImplementation((param: number) => {
      if (param === mockDebugInfo.UNMASKED_RENDERER_WEBGL) {
        return 'NVIDIA GeForce RTX 4080';
      }
      if (param === mockWebGLContext.MAX_TEXTURE_SIZE) {
        return 8192;
      }
      return null;
    });

    mockWebGLContext.getExtension.mockReturnValue(mockDebugInfo);
    
    // Create fresh detector to pick up mocks
    detector.cleanup();
    detector = new DeviceCapabilityDetector();

    const capability = detector.detectCapabilities();

    expect(capability.gpuTier).toBe(4);
    expect(capability.renderer).toBe('NVIDIA GeForce RTX 4080');
    expect(capability.maxTextureSize).toBe(8192);
  });

  it('should detect capabilities for mobile device', () => {
    // Mock mobile user agent
    Object.defineProperty(global.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      configurable: true
    });

    mockWebGLContext.getParameter.mockImplementation((param: number) => {
      if (param === mockDebugInfo.UNMASKED_RENDERER_WEBGL) {
        return 'Apple A14 GPU';
      }
      if (param === mockWebGLContext.MAX_TEXTURE_SIZE) {
        return 4096;
      }
      return null;
    });

    detector.cleanup();
    detector = new DeviceCapabilityDetector();
    const capability = detector.detectCapabilities();

    expect(capability.isMobile).toBe(true);
    expect(capability.gpuTier).toBeGreaterThanOrEqual(1);
  });

  it('should handle WebGL initialization failure', () => {
    // Mock WebGL failure
    const originalGetContext = mockCanvas.getContext;
    mockCanvas.getContext = vi.fn().mockReturnValue(null);

    detector.cleanup();
    detector = new DeviceCapabilityDetector();
    const capability = detector.detectCapabilities();

    expect(capability.gpuTier).toBe(0);
    expect(capability.renderer).toBe('unknown');

    // Restore mock
    mockCanvas.getContext = originalGetContext;
  });

  it('should detect low-end integrated graphics', () => {
    mockWebGLContext.getParameter.mockImplementation((param: number) => {
      if (param === mockDebugInfo.UNMASKED_RENDERER_WEBGL) {
        return 'Intel(R) HD Graphics 620';
      }
      if (param === mockWebGLContext.MAX_TEXTURE_SIZE) {
        return 2048;
      }
      return null;
    });

    detector.cleanup();
    detector = new DeviceCapabilityDetector();

    const capability = detector.detectCapabilities();

    expect(capability.gpuTier).toBe(2);
    expect(capability.renderer).toBe('Intel(R) HD Graphics 620');
  });
});

describe('FPSMonitor', () => {
  let monitor: FPSMonitor;

  beforeEach(() => {
    vi.clearAllMocks();
    monitor = new FPSMonitor();
  });

  it('should calculate FPS correctly', () => {
    let currentTime = 0;
    (performance.now as any).mockImplementation(() => currentTime);

    // Simulate 60 FPS with precise timing
    for (let i = 0; i < 65; i++) { 
      currentTime += 16.666666667; // Precise 60 FPS
      const metrics = monitor.update();
      if (i >= 60) { // After buffer fills
        expect(metrics.fps).toBeCloseTo(60, 0.5);
      }
    }
  });

  it('should detect performance degradation', () => {
    let currentTime = 0;
    (performance.now as any).mockImplementation(() => currentTime);

    // Simulate 30 FPS
    for (let i = 0; i < 65; i++) {
      currentTime += 33.333333333;
      const metrics = monitor.update();
      if (i >= 60) {
        expect(metrics.fps).toBeCloseTo(30, 0.5);
        expect(metrics.gpuUtilization).toBeGreaterThanOrEqual(100);
      }
    }
  });

  it('should estimate memory usage', () => {
    const metrics = monitor.update();
    expect(metrics.memoryUsage).toBeGreaterThan(0);
  });

  it('should calculate battery impact for mobile devices', () => {
    Object.defineProperty(global.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      configurable: true
    });

    const metrics = monitor.update();
    expect(metrics.batteryImpact).toBeGreaterThan(0);
  });

  it('should not calculate battery impact for desktop', () => {
    Object.defineProperty(global.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      configurable: true
    });

    const metrics = monitor.update();
    expect(metrics.batteryImpact).toBeUndefined();
  });
});

describe('Performance3DManager', () => {
  let manager: Performance3DManager;
  let qualityChangeCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    qualityChangeCallback = vi.fn();
    manager = new Performance3DManager(qualityChangeCallback);
    vi.clearAllMocks();
  });

  afterEach(() => {
    manager.dispose();
  });

  it('should initialize with device capability and settings', () => {
    const capability = manager.getDeviceCapability();
    expect(capability).toBeDefined();
    
    const settings = manager.getQualitySettings();
    expect(settings.textureQuality).toBeGreaterThan(0);
  });

  it('should update performance metrics each frame', () => {
    let frameTime = 0;
    (performance.now as any).mockImplementation(() => {
      frameTime += 16.67;
      return frameTime;
    });

    const metrics = manager.updateFrame();

    expect(metrics.fps).toBeDefined();
    expect(metrics.frameTime).toBeDefined();
  });

  it('should trigger quality change callback when performance degrades', () => {
    let frameTime = 0;
    (performance.now as any).mockImplementation(() => {
      frameTime += 50; // 20 FPS
      return frameTime;
    });

    // Update many frames to trigger adjustment
    for (let i = 0; i < 200; i++) {
      manager.updateFrame();
    }

    expect(qualityChangeCallback).toHaveBeenCalled();
  });

  it('should allow manual quality level override', () => {
    manager.forceQualityLevel('static');
    const staticSettings = manager.getQualitySettings();
    expect(staticSettings.useStaticFallback).toBe(true);

    manager.forceQualityLevel('high');
    const highSettings = manager.getQualitySettings();
    expect(highSettings.textureQuality).toBe(1.0);
  });

  it('should provide device capability information', () => {
    const capability = manager.getDeviceCapability();
    expect(typeof capability.gpuTier).toBe('number');
    expect(typeof capability.isMobile).toBe('boolean');
  });

  it('should handle cleanup properly', () => {
    expect(manager.getDeviceCapability()).toBeDefined();
    manager.dispose();
    expect(() => manager.getDeviceCapability()).not.toThrow();
  });
});

// Edge cases for WebGL context handling
describe('Device Capability Edge Cases', () => {
  it('should handle WebGL context creation errors gracefully', () => {
    const mockFailingCanvas = {
      getContext: vi.fn(() => {
        throw new Error('WebGL not supported');
      }),
      remove: vi.fn()
    };

    Object.defineProperty(global, 'document', {
      value: {
        createElement: vi.fn(() => mockFailingCanvas)
      },
      writable: true
    });

    const detector = new DeviceCapabilityDetector();
    const capability = detector.detectCapabilities();

    expect(capability.gpuTier).toBe(0);
    expect(capability.renderer).toBe('unknown');
    
    detector.cleanup();
  });

  it('should handle missing WebGL debug extension', () => {
    mockWebGLContext.getExtension.mockReturnValue(null);
    
    const detector = new DeviceCapabilityDetector();
    const capability = detector.detectCapabilities();

    expect(capability.renderer).toBe('unknown');
    
    detector.cleanup();
  });

  it('should detect touch devices correctly', () => {
    Object.defineProperty(global.navigator, 'maxTouchPoints', {
      value: 5,
      configurable: true
    });

    const detector = new DeviceCapabilityDetector();
    const capability = detector.detectCapabilities();

    expect(capability.isMobile).toBe(true);
    
    detector.cleanup();
  });
});