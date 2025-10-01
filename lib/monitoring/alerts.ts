/**
 * Alert Management System
 * Story 3.5: Performance Monitoring and System Health
 * 
 * Addresses alert management requirements for monitoring system
 * - Data retention compliance (DATA-001)
 * - Secure alerting without exposing sensitive data (SEC-001)
 * - Integration with existing email system from Story 3.4
 */

export interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  cooldownMinutes: number;
  notificationChannels: string[];
}

export interface AlertEvent {
  id: string;
  ruleId: string;
  severity: AlertRule['severity'];
  message: string;
  timestamp: Date;
  metadata: Record<string, any>;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface AlertNotification {
  to: string;
  subject: string;
  body: string;
  channel: 'email' | 'slack' | 'webhook';
  urgent: boolean;
}

/**
 * Alert manager with data compliance and security features
 */
export class AlertManager {
  private activeAlerts = new Map<string, AlertEvent>();
  private alertHistory: AlertEvent[] = [];
  private lastNotificationTime = new Map<string, Date>();

  // Default alert rules for system monitoring
  private defaultRules: AlertRule[] = [
    {
      id: 'high-error-rate',
      name: 'High Error Rate',
      condition: 'error_rate > threshold',
      threshold: 5, // 5% error rate
      severity: 'critical',
      enabled: true,
      cooldownMinutes: 5,
      notificationChannels: ['email']
    },
    {
      id: 'slow-response-time',
      name: 'Slow API Response Time',
      condition: 'response_time > threshold',
      threshold: 2000, // 2 seconds
      severity: 'high',
      enabled: true,
      cooldownMinutes: 10,
      notificationChannels: ['email']
    },
    {
      id: 'low-3d-performance',
      name: 'Low 3D Performance',
      condition: 'fps < threshold',
      threshold: 20, // 20 FPS
      severity: 'medium',
      enabled: true,
      cooldownMinutes: 15,
      notificationChannels: ['email']
    },
    {
      id: 'database-connection-failure',
      name: 'Database Connection Failure',
      condition: 'db_status == "unhealthy"',
      threshold: 1,
      severity: 'critical',
      enabled: true,
      cooldownMinutes: 1,
      notificationChannels: ['email']
    },
    {
      id: 'lead-capture-failure',
      name: 'Lead Capture Failure Rate',
      condition: 'lead_failure_rate > threshold',
      threshold: 10, // 10% failure rate
      severity: 'high',
      enabled: true,
      cooldownMinutes: 5,
      notificationChannels: ['email']
    }
  ];

  /**
   * Evaluate metrics against alert rules
   */
  public evaluateMetrics(metrics: Record<string, any>): AlertEvent[] {
    const triggeredAlerts: AlertEvent[] = [];

    this.defaultRules.forEach(rule => {
      if (!rule.enabled) return;

      const shouldTrigger = this.evaluateRule(rule, metrics);
      
      if (shouldTrigger && this.canSendNotification(rule.id, rule.cooldownMinutes)) {
        const alert = this.createAlert(rule, metrics);
        triggeredAlerts.push(alert);
        this.recordAlert(alert);
        this.lastNotificationTime.set(rule.id, new Date());
      }
    });

    return triggeredAlerts;
  }

  private evaluateRule(rule: AlertRule, metrics: Record<string, any>): boolean {
    try {
      switch (rule.id) {
        case 'high-error-rate':
          return (metrics.errorRate || 0) > rule.threshold;
          
        case 'slow-response-time':
          return (metrics.avgResponseTime || 0) > rule.threshold;
          
        case 'low-3d-performance':
          return (metrics.fps || 60) < rule.threshold;
          
        case 'database-connection-failure':
          return metrics.dbStatus === 'unhealthy';
          
        case 'lead-capture-failure':
          return (metrics.leadFailureRate || 0) > rule.threshold;
          
        default:
          return false;
      }
    } catch (error) {
      console.warn(`Error evaluating rule ${rule.id}:`, error);
      return false;
    }
  }

  private canSendNotification(ruleId: string, cooldownMinutes: number): boolean {
    const lastNotification = this.lastNotificationTime.get(ruleId);
    if (!lastNotification) return true;

    const cooldownMs = cooldownMinutes * 60 * 1000;
    return Date.now() - lastNotification.getTime() > cooldownMs;
  }

  private createAlert(rule: AlertRule, metrics: Record<string, any>): AlertEvent {
    return {
      id: crypto.randomUUID(),
      ruleId: rule.id,
      severity: rule.severity,
      message: this.formatAlertMessage(rule, metrics),
      timestamp: new Date(),
      metadata: this.sanitizeMetadata(metrics),
      resolved: false
    };
  }

  private formatAlertMessage(rule: AlertRule, metrics: Record<string, any>): string {
    switch (rule.id) {
      case 'high-error-rate':
        return `High error rate detected: ${metrics.errorRate?.toFixed(1)}% (threshold: ${rule.threshold}%)`;
        
      case 'slow-response-time':
        return `Slow API response time: ${metrics.avgResponseTime?.toFixed(0)}ms (threshold: ${rule.threshold}ms)`;
        
      case 'low-3d-performance':
        return `Low 3D performance: ${metrics.fps?.toFixed(1)} FPS (threshold: ${rule.threshold} FPS)`;
        
      case 'database-connection-failure':
        return `Database connection failure detected: ${metrics.dbError || 'Unknown error'}`;
        
      case 'lead-capture-failure':
        return `High lead capture failure rate: ${metrics.leadFailureRate?.toFixed(1)}% (threshold: ${rule.threshold}%)`;
        
      default:
        return `Alert triggered: ${rule.name}`;
    }
  }

  /**
   * Sanitize metadata to remove sensitive information (SEC-001 mitigation)
   */
  private sanitizeMetadata(metrics: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    const allowedKeys = [
      'timestamp', 'fps', 'responseTime', 'errorRate', 
      'leadFailureRate', 'dbStatus', 'memoryUsage',
      'cpuUsage', 'activeUsers', 'requestCount'
    ];

    allowedKeys.forEach(key => {
      if (metrics[key] !== undefined) {
        sanitized[key] = metrics[key];
      }
    });

    return sanitized;
  }

  private recordAlert(alert: AlertEvent): void {
    this.activeAlerts.set(alert.id, alert);
    this.alertHistory.push(alert);
    
    // Implement data retention (DATA-001 compliance)
    this.enforceDataRetention();
  }

  /**
   * Enforce data retention policy for alert history (DATA-001 compliance)
   */
  private enforceDataRetention(): void {
    const retentionDays = 30; // Keep alert history for 30 days
    const cutoffDate = new Date(Date.now() - (retentionDays * 24 * 60 * 60 * 1000));
    
    this.alertHistory = this.alertHistory.filter(
      alert => alert.timestamp > cutoffDate
    );
  }

  /**
   * Generate alert notifications with security considerations
   */
  public generateNotifications(alerts: AlertEvent[]): AlertNotification[] {
    return alerts.map(alert => this.createNotification(alert)).filter(Boolean) as AlertNotification[];
  }

  private createNotification(alert: AlertEvent): AlertNotification | null {
    const rule = this.defaultRules.find(r => r.id === alert.ruleId);
    if (!rule || !rule.notificationChannels.includes('email')) {
      return null;
    }

    // Ensure no sensitive data in notifications (SEC-001 mitigation)
    const sanitizedMessage = this.sanitizeNotificationMessage(alert.message);
    
    return {
      to: process.env.ALERT_EMAIL || 'admin@example.com',
      subject: `[${alert.severity.toUpperCase()}] ${rule.name}`,
      body: this.formatNotificationBody(alert, sanitizedMessage),
      channel: 'email',
      urgent: alert.severity === 'critical'
    };
  }

  private sanitizeNotificationMessage(message: string): string {
    // Remove any potential sensitive information from alert messages
    return message
      .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP]') // Remove IP addresses
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]') // Remove email addresses
      .replace(/\b[A-Za-z0-9]{20,}\b/g, '[TOKEN]'); // Remove potential tokens
  }

  private formatNotificationBody(alert: AlertEvent, message: string): string {
    return `
Alert Details:
- Severity: ${alert.severity}
- Time: ${alert.timestamp.toISOString()}
- Message: ${message}
- Alert ID: ${alert.id}

This is an automated alert from the Custom Ceramic Mug Landing Page monitoring system.
Please investigate and resolve the issue promptly.

System Status Dashboard: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com'}/admin/monitoring
    `.trim();
  }

  /**
   * Resolve an alert
   */
  public resolveAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(): AlertEvent[] {
    return Array.from(this.activeAlerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * Get alert history with privacy compliance
   */
  public getAlertHistory(days: number = 7): AlertEvent[] {
    const cutoffDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
    return this.alertHistory
      .filter(alert => alert.timestamp > cutoffDate)
      .map(alert => ({
        ...alert,
        metadata: this.sanitizeMetadata(alert.metadata) // Ensure metadata is sanitized
      }));
  }

  /**
   * Get alert statistics for monitoring dashboard
   */
  public getAlertStatistics(days: number = 7): {
    totalAlerts: number;
    alertsBySeverity: Record<string, number>;
    alertsByRule: Record<string, number>;
    averageResolutionTime: number;
  } {
    const recentAlerts = this.getAlertHistory(days);
    
    const alertsBySeverity = recentAlerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const alertsByRule = recentAlerts.reduce((acc, alert) => {
      const rule = this.defaultRules.find(r => r.id === alert.ruleId);
      const ruleName = rule?.name || alert.ruleId;
      acc[ruleName] = (acc[ruleName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const resolvedAlerts = recentAlerts.filter(alert => alert.resolved && alert.resolvedAt);
    const averageResolutionTime = resolvedAlerts.length > 0 
      ? resolvedAlerts.reduce((sum, alert) => {
          const resolutionTime = alert.resolvedAt!.getTime() - alert.timestamp.getTime();
          return sum + resolutionTime;
        }, 0) / resolvedAlerts.length / (1000 * 60) // Convert to minutes
      : 0;

    return {
      totalAlerts: recentAlerts.length,
      alertsBySeverity,
      alertsByRule,
      averageResolutionTime: Math.round(averageResolutionTime * 100) / 100
    };
  }

  /**
   * Update alert rules configuration
   */
  public updateAlertRule(ruleId: string, updates: Partial<AlertRule>): boolean {
    const ruleIndex = this.defaultRules.findIndex(rule => rule.id === ruleId);
    if (ruleIndex !== -1) {
      this.defaultRules[ruleIndex] = { ...this.defaultRules[ruleIndex], ...updates };
      return true;
    }
    return false;
  }

  /**
   * Get all alert rules
   */
  public getAlertRules(): AlertRule[] {
    return [...this.defaultRules];
  }
}

// Global instance
let globalAlertManager: AlertManager | null = null;

/**
 * Get or create global alert manager instance
 */
export function getAlertManager(): AlertManager {
  if (!globalAlertManager) {
    globalAlertManager = new AlertManager();
  }
  return globalAlertManager;
}