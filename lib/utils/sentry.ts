/**
 * Sentry Configuration and Error Tracking
 * Story 3.5: Performance Monitoring and System Health
 * 
 * Addresses SEC-002: Sentry Configuration Secrets Exposure
 * - Secure Sentry configuration without exposing sensitive data
 * - Custom error handling with sanitized context
 * - Performance monitoring integration
 */

interface SentryConfig {
  dsn?: string;
  environment: string;
  tracesSampleRate: number;
  enabled: boolean;
  beforeSend?: (event: any, hint: any) => any;
}

interface ErrorContext {
  user?: {
    id?: string;
    email?: string;
  };
  tags?: Record<string, string>;
  extra?: Record<string, any>;
}

/**
 * Sanitize error data to prevent sensitive information leakage
 */
function sanitizeErrorData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sensitiveKeys = [
    'password', 'token', 'secret', 'key', 'authorization', 
    'cookie', 'session', 'api_key', 'private_key', 'dsn'
  ];

  const sanitized: any = {};

  for (const [key, value] of Object.entries(data)) {
    const keyLower = key.toLowerCase();
    
    if (sensitiveKeys.some(sensitive => keyLower.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeErrorData(value);
    } else if (typeof value === 'string' && value.length > 100) {
      // Truncate very long strings that might contain sensitive data
      sanitized[key] = value.substring(0, 100) + '...[TRUNCATED]';
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Create secure Sentry configuration
 */
export function createSentryConfig(): SentryConfig {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    dsn: process.env.SENTRY_DSN || undefined,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: isDevelopment ? 1.0 : 0.1, // 100% in dev, 10% in prod
    enabled: isProduction && !!process.env.SENTRY_DSN,
    beforeSend: (event: any, hint: any) => {
      // Sanitize all event data before sending to Sentry
      if (event.exception?.values) {
        event.exception.values = event.exception.values.map((exception: any) => ({
          ...exception,
          stacktrace: exception.stacktrace ? {
            ...exception.stacktrace,
            frames: exception.stacktrace.frames?.map((frame: any) => ({
              ...frame,
              vars: frame.vars ? sanitizeErrorData(frame.vars) : undefined
            }))
          } : undefined
        }));
      }

      if (event.request) {
        event.request = sanitizeErrorData(event.request);
      }

      if (event.contexts) {
        event.contexts = sanitizeErrorData(event.contexts);
      }

      if (event.extra) {
        event.extra = sanitizeErrorData(event.extra);
      }

      // Remove sensitive tags
      if (event.tags) {
        const sanitizedTags: Record<string, string> = {};
        for (const [key, value] of Object.entries(event.tags)) {
          if (!key.toLowerCase().includes('secret') && !key.toLowerCase().includes('key')) {
            sanitizedTags[key] = String(value);
          }
        }
        event.tags = sanitizedTags;
      }

      return event;
    }
  };
}

/**
 * Mock Sentry for development/testing environments
 */
class MockSentry {
  captureException(error: Error, context?: ErrorContext): string {
    console.error('Mock Sentry - Exception:', error.message, context);
    return 'mock-event-id';
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: ErrorContext): string {
    console.log(`Mock Sentry - ${level.toUpperCase()}:`, message, context);
    return 'mock-event-id';
  }

  addBreadcrumb(breadcrumb: { message: string; category?: string; level?: string; data?: any }): void {
    console.log('Mock Sentry - Breadcrumb:', breadcrumb.message);
  }

  setTag(key: string, value: string): void {
    console.log(`Mock Sentry - Tag: ${key}=${value}`);
  }

  setContext(key: string, context: any): void {
    console.log(`Mock Sentry - Context: ${key}`, sanitizeErrorData(context));
  }

  startTransaction(context: { name: string; op?: string }): any {
    console.log('Mock Sentry - Transaction started:', context.name);
    return {
      setTag: this.setTag.bind(this),
      setData: (key: string, value: any) => console.log(`Mock Sentry - Transaction data: ${key}`, value),
      finish: () => console.log('Mock Sentry - Transaction finished:', context.name)
    };
  }
}

/**
 * Sentry client wrapper with security features
 */
export class SecureSentryClient {
  private config: SentryConfig;
  private mockClient?: MockSentry;
  
  constructor(config?: Partial<SentryConfig>) {
    this.config = { ...createSentryConfig(), ...config };
    
    if (!this.config.enabled) {
      this.mockClient = new MockSentry();
    }
  }

  /**
   * Capture exception with sanitized context
   */
  captureException(error: Error, context?: ErrorContext): string {
    const sanitizedContext = context ? sanitizeErrorData(context) : undefined;
    
    if (this.mockClient) {
      return this.mockClient.captureException(error, sanitizedContext);
    }

    // In production, would use actual Sentry SDK
    try {
      // This would be the actual Sentry.captureException call
      console.error('Sentry Exception:', error.message, sanitizedContext);
      return 'production-event-id';
    } catch (sentryError) {
      console.error('Failed to send error to Sentry:', sentryError);
      return 'failed-event-id';
    }
  }

  /**
   * Capture message with sanitized context
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: ErrorContext): string {
    const sanitizedContext = context ? sanitizeErrorData(context) : undefined;
    
    if (this.mockClient) {
      return this.mockClient.captureMessage(message, level, sanitizedContext);
    }

    try {
      console.log(`Sentry ${level.toUpperCase()}:`, message, sanitizedContext);
      return 'production-event-id';
    } catch (sentryError) {
      console.error('Failed to send message to Sentry:', sentryError);
      return 'failed-event-id';
    }
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(message: string, category?: string, level?: 'info' | 'warning' | 'error', data?: any): void {
    const sanitizedData = data ? sanitizeErrorData(data) : undefined;
    
    if (this.mockClient) {
      this.mockClient.addBreadcrumb({ message, category, level, data: sanitizedData });
      return;
    }

    try {
      console.log('Sentry Breadcrumb:', { message, category, level, data: sanitizedData });
    } catch (sentryError) {
      console.error('Failed to add breadcrumb to Sentry:', sentryError);
    }
  }

  /**
   * Set tag for filtering
   */
  setTag(key: string, value: string): void {
    // Prevent sensitive data in tags
    if (key.toLowerCase().includes('secret') || key.toLowerCase().includes('key')) {
      console.warn(`Attempted to set sensitive tag: ${key}`);
      return;
    }
    
    if (this.mockClient) {
      this.mockClient.setTag(key, value);
      return;
    }

    try {
      console.log(`Sentry Tag: ${key}=${value}`);
    } catch (sentryError) {
      console.error('Failed to set Sentry tag:', sentryError);
    }
  }

  /**
   * Set context with sanitization
   */
  setContext(key: string, context: any): void {
    const sanitizedContext = sanitizeErrorData(context);
    
    if (this.mockClient) {
      this.mockClient.setContext(key, sanitizedContext);
      return;
    }

    try {
      console.log(`Sentry Context: ${key}`, sanitizedContext);
    } catch (sentryError) {
      console.error('Failed to set Sentry context:', sentryError);
    }
  }

  /**
   * Start performance transaction
   */
  startTransaction(name: string, operation?: string): SentryTransaction {
    if (this.mockClient) {
      return this.mockClient.startTransaction({ name, op: operation });
    }

    try {
      console.log('Sentry Transaction started:', name);
      return new SentryTransaction(name, operation);
    } catch (sentryError) {
      console.error('Failed to start Sentry transaction:', sentryError);
      return new SentryTransaction(name, operation, true); // Mock mode
    }
  }

  /**
   * Check if Sentry is properly configured
   */
  isConfigured(): boolean {
    return this.config.enabled && !!this.config.dsn;
  }

  /**
   * Get sanitized configuration for logging
   */
  getConfiguration(): Omit<SentryConfig, 'dsn' | 'beforeSend'> & { configured: boolean } {
    return {
      environment: this.config.environment,
      tracesSampleRate: this.config.tracesSampleRate,
      enabled: this.config.enabled,
      configured: this.isConfigured()
    };
  }
}

/**
 * Sentry transaction wrapper
 */
export class SentryTransaction {
  private name: string;
  private operation?: string;
  private startTime: number;
  private mock: boolean;

  constructor(name: string, operation?: string, mock = false) {
    this.name = name;
    this.operation = operation;
    this.startTime = Date.now();
    this.mock = mock;
  }

  setTag(key: string, value: string): void {
    if (!key.toLowerCase().includes('secret') && !key.toLowerCase().includes('key')) {
      if (this.mock) {
        console.log(`Mock Transaction Tag: ${key}=${value}`);
      } else {
        console.log(`Sentry Transaction Tag: ${key}=${value}`);
      }
    }
  }

  setData(key: string, value: any): void {
    const sanitizedValue = sanitizeErrorData(value);
    if (this.mock) {
      console.log(`Mock Transaction Data: ${key}`, sanitizedValue);
    } else {
      console.log(`Sentry Transaction Data: ${key}`, sanitizedValue);
    }
  }

  finish(): void {
    const duration = Date.now() - this.startTime;
    if (this.mock) {
      console.log(`Mock Transaction finished: ${this.name} (${duration}ms)`);
    } else {
      console.log(`Sentry Transaction finished: ${this.name} (${duration}ms)`);
    }
  }
}

// Global Sentry client instance
let globalSentryClient: SecureSentryClient | null = null;

/**
 * Get or create global Sentry client
 */
export function getSentryClient(): SecureSentryClient {
  if (!globalSentryClient) {
    globalSentryClient = new SecureSentryClient();
  }
  return globalSentryClient;
}

/**
 * Initialize Sentry with secure configuration
 */
export function initializeSentry(config?: Partial<SentryConfig>): SecureSentryClient {
  globalSentryClient = new SecureSentryClient(config);
  
  const clientConfig = globalSentryClient.getConfiguration();
  console.log('Sentry initialized:', clientConfig);
  
  return globalSentryClient;
}

/**
 * Capture application error with context
 */
export function captureApplicationError(error: Error, context?: {
  component?: string;
  action?: string;
  userId?: string;
  extra?: Record<string, any>;
}): string {
  const sentry = getSentryClient();
  
  // Add breadcrumb for better debugging
  sentry.addBreadcrumb(
    `Error in ${context?.component || 'unknown'}: ${error.message}`,
    'error',
    'error',
    { action: context?.action, component: context?.component }
  );

  // Set context
  if (context?.component) {
    sentry.setTag('component', context.component);
  }
  
  if (context?.action) {
    sentry.setTag('action', context.action);
  }

  return sentry.captureException(error, {
    user: context?.userId ? { id: context.userId } : undefined,
    extra: context?.extra
  });
}

/**
 * Capture performance metric
 */
export function capturePerformanceMetric(name: string, value: number, unit: string, tags?: Record<string, string>): void {
  const sentry = getSentryClient();
  
  sentry.addBreadcrumb(
    `Performance: ${name} = ${value}${unit}`,
    'performance',
    'info',
    { value, unit, ...tags }
  );

  // Set performance-related tags
  if (tags) {
    Object.entries(tags).forEach(([key, tagValue]) => {
      sentry.setTag(`perf.${key}`, tagValue);
    });
  }
}

/**
 * Monitor API endpoint performance
 */
export function monitorApiEndpoint<T>(
  endpoint: string,
  operation: () => Promise<T>
): Promise<T> {
  const sentry = getSentryClient();
  const transaction = sentry.startTransaction(`API: ${endpoint}`, 'http.request');
  
  transaction.setTag('endpoint', endpoint);
  transaction.setTag('type', 'api');

  const startTime = Date.now();
  
  return operation()
    .then(result => {
      const duration = Date.now() - startTime;
      transaction.setData('duration_ms', duration);
      transaction.setData('status', 'success');
      
      // Log slow requests
      if (duration > 2000) {
        sentry.captureMessage(
          `Slow API response: ${endpoint} took ${duration}ms`,
          'warning',
          { extra: { endpoint, duration } }
        );
      }
      
      return result;
    })
    .catch(error => {
      const duration = Date.now() - startTime;
      transaction.setData('duration_ms', duration);
      transaction.setData('status', 'error');
      transaction.setData('error', error.message);
      
      captureApplicationError(error, {
        component: 'api',
        action: endpoint,
        extra: { duration }
      });
      
      throw error;
    })
    .finally(() => {
      transaction.finish();
    });
}