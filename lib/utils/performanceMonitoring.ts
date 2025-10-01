/**
 * Database Performance Monitoring Utilities
 * Story 3.2: Lead Data Storage and Management
 * 
 * Provides utilities for monitoring database query performance,
 * connection pooling optimization, and performance analytics.
 */

import { createServerClient } from '@/lib/supabase'

/**
 * Performance metrics for database operations
 */
export interface QueryPerformanceMetrics {
  /** Query identifier */
  queryName: string;
  /** Execution time in milliseconds */
  executionTimeMs: number;
  /** Number of rows affected/returned */
  rowsAffected?: number;
  /** Query timestamp */
  timestamp: Date;
  /** Additional context data */
  context?: Record<string, any>;
}

/**
 * Database performance monitoring configuration
 */
export interface PerformanceConfig {
  /** Minimum execution time to log (ms) */
  logThresholdMs: number;
  /** Enable detailed query logging */
  enableDetailedLogging: boolean;
  /** Maximum number of performance logs to retain */
  maxLogRetention: number;
}

/**
 * Default performance monitoring configuration
 */
export const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  logThresholdMs: 100, // Log queries taking > 100ms
  enableDetailedLogging: process.env.NODE_ENV === 'development',
  maxLogRetention: 10000
};

/**
 * Performance timer for measuring query execution time
 */
export class QueryPerformanceTimer {
  private startTime: number;
  private queryName: string;
  private context: Record<string, any>;

  constructor(queryName: string, context: Record<string, any> = {}) {
    this.queryName = queryName;
    this.context = context;
    this.startTime = performance.now();
  }

  /**
   * End timing and optionally log performance metrics
   * @param rowsAffected - Number of rows affected by the query
   * @param config - Performance monitoring configuration
   * @returns Execution time in milliseconds
   */
  async end(
    rowsAffected?: number, 
    config: PerformanceConfig = DEFAULT_PERFORMANCE_CONFIG
  ): Promise<number> {
    const executionTime = Math.round(performance.now() - this.startTime);
    
    // Log performance if above threshold
    if (executionTime >= config.logThresholdMs) {
      await this.logPerformance({
        queryName: this.queryName,
        executionTimeMs: executionTime,
        rowsAffected,
        timestamp: new Date(),
        context: this.context
      }, config);
    }
    
    return executionTime;
  }

  /**
   * Log performance metrics to database or console
   */
  private async logPerformance(
    metrics: QueryPerformanceMetrics, 
    config: PerformanceConfig
  ): Promise<void> {
    try {
      if (config.enableDetailedLogging) {
        console.info('Query Performance:', {
          query: metrics.queryName,
          executionTime: `${metrics.executionTimeMs}ms`,
          rowsAffected: metrics.rowsAffected,
          context: metrics.context
        });
      }

      // Log to database performance table
      const supabase = createServerClient();
      await supabase
        .from('query_performance_log')
        .insert([
          {
            query_name: metrics.queryName,
            execution_time_ms: metrics.executionTimeMs,
            rows_affected: metrics.rowsAffected,
            logged_at: metrics.timestamp.toISOString()
          }
        ]);
        
    } catch (error) {
      // Don't fail the main operation if logging fails
      console.warn('Failed to log query performance:', error);
    }
  }
}

/**
 * Decorator function for monitoring database query performance
 * @param queryName - Identifier for the query
 * @param config - Performance monitoring configuration
 */
export function withPerformanceMonitoring(
  queryName: string,
  config: PerformanceConfig = DEFAULT_PERFORMANCE_CONFIG
) {
  return function <T extends (...args: any[]) => Promise<any>>(
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const method = descriptor.value!;

    descriptor.value = async function (this: any, ...args: any[]) {
      const timer = new QueryPerformanceTimer(queryName, {
        method: propertyName,
        args: args.length
      });

      try {
        const result = await method.apply(this, args);
        
        // Extract row count from result if available
        const rowCount = result?.data?.length || result?.count || undefined;
        await timer.end(rowCount, config);
        
        return result;
      } catch (error) {
        await timer.end(0, config);
        throw error;
      }
    } as T;

    return descriptor;
  };
}

/**
 * Monitor and analyze database connection health
 */
export async function checkDatabaseHealth(): Promise<{
  isHealthy: boolean;
  metrics: {
    connectionTime: number;
    queryResponseTime: number;
    activeConnections?: number;
  };
  issues: string[];
}> {
  const issues: string[] = [];
  let connectionTime = 0;
  let queryResponseTime = 0;

  try {
    // Test connection time
    const connectionStart = performance.now();
    const supabase = createServerClient();
    connectionTime = performance.now() - connectionStart;

    // Test query response time
    const queryStart = performance.now();
    const { data, error } = await supabase
      .from('leads')
      .select('count')
      .limit(1);
    
    queryResponseTime = performance.now() - queryStart;

    if (error) {
      issues.push(`Database query error: ${error.message}`);
    }

    // Check for performance issues
    if (connectionTime > 1000) {
      issues.push('Slow database connection (>1s)');
    }

    if (queryResponseTime > 500) {
      issues.push('Slow query response time (>500ms)');
    }

    return {
      isHealthy: issues.length === 0,
      metrics: {
        connectionTime,
        queryResponseTime
      },
      issues
    };

  } catch (error) {
    return {
      isHealthy: false,
      metrics: {
        connectionTime,
        queryResponseTime
      },
      issues: [`Database health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
}

/**
 * Get database performance analytics
 */
export async function getDatabasePerformanceAnalytics(
  timeRangeHours: number = 24
): Promise<{
  success: boolean;
  data?: {
    avgQueryTime: number;
    slowQueries: Array<{ queryName: string; avgTime: number; count: number }>;
    totalQueries: number;
    performanceIssues: string[];
  };
  error?: string;
}> {
  try {
    const supabase = createServerClient();
    const timeThreshold = new Date(Date.now() - (timeRangeHours * 60 * 60 * 1000)).toISOString();

    // Get performance metrics
    const { data: performanceData, error } = await supabase
      .from('query_performance_log')
      .select('query_name, execution_time_ms')
      .gte('logged_at', timeThreshold);

    if (error) {
      return { success: false, error: error.message };
    }

    if (!performanceData || performanceData.length === 0) {
      return {
        success: true,
        data: {
          avgQueryTime: 0,
          slowQueries: [],
          totalQueries: 0,
          performanceIssues: ['No performance data available']
        }
      };
    }

    // Calculate analytics
    const totalQueries = performanceData.length;
    const avgQueryTime = performanceData.reduce((sum, log) => sum + log.execution_time_ms, 0) / totalQueries;

    // Group by query name and calculate averages
    const queryGroups = performanceData.reduce((groups, log) => {
      const key = log.query_name;
      if (!groups[key]) {
        groups[key] = { total: 0, count: 0 };
      }
      groups[key].total += log.execution_time_ms;
      groups[key].count += 1;
      return groups;
    }, {} as Record<string, { total: number; count: number }>);

    const slowQueries = Object.entries(queryGroups)
      .map(([queryName, stats]) => ({
        queryName,
        avgTime: Math.round(stats.total / stats.count),
        count: stats.count
      }))
      .filter(query => query.avgTime > 200) // Only queries > 200ms average
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 10); // Top 10 slow queries

    // Identify performance issues
    const performanceIssues: string[] = [];
    if (avgQueryTime > 300) {
      performanceIssues.push(`High average query time: ${Math.round(avgQueryTime)}ms`);
    }
    if (slowQueries.length > 5) {
      performanceIssues.push(`${slowQueries.length} queries with high execution time`);
    }

    return {
      success: true,
      data: {
        avgQueryTime: Math.round(avgQueryTime),
        slowQueries,
        totalQueries,
        performanceIssues
      }
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Clean up old performance logs based on retention policy
 */
export async function cleanupPerformanceLogs(
  retentionDays: number = 7
): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
  try {
    const supabase = createServerClient();
    const cutoffDate = new Date(Date.now() - (retentionDays * 24 * 60 * 60 * 1000)).toISOString();

    const { data, error } = await supabase
      .from('query_performance_log')
      .delete()
      .lt('logged_at', cutoffDate)
      .select('id');

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      deletedCount: data?.length || 0
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Optimize database queries by analyzing performance patterns
 */
export async function getQueryOptimizationRecommendations(): Promise<{
  success: boolean;
  recommendations?: string[];
  error?: string;
}> {
  try {
    const analytics = await getDatabasePerformanceAnalytics(168); // 7 days
    
    if (!analytics.success || !analytics.data) {
      return { success: false, error: 'Unable to get performance data' };
    }

    const recommendations: string[] = [];
    const { avgQueryTime, slowQueries, totalQueries } = analytics.data;

    // Analyze patterns and provide recommendations
    if (avgQueryTime > 500) {
      recommendations.push('Consider adding database indexes for frequently used query patterns');
    }

    if (slowQueries.some(q => q.queryName.includes('SELECT'))) {
      recommendations.push('Review SELECT queries for missing WHERE clause optimizations');
    }

    if (slowQueries.some(q => q.queryName.includes('lead'))) {
      recommendations.push('Consider partitioning the leads table if volume is high');
    }

    if (totalQueries > 10000) {
      recommendations.push('Implement query result caching for frequently accessed data');
    }

    const duplicateQueries = slowQueries.filter(q => q.queryName.includes('duplicate'));
    if (duplicateQueries.length > 0) {
      recommendations.push('Optimize duplicate detection queries with better indexing strategies');
    }

    if (recommendations.length === 0) {
      recommendations.push('Database performance is within acceptable limits');
    }

    return {
      success: true,
      recommendations
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
