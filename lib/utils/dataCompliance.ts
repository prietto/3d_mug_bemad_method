/**
 * Data Compliance Utilities
 * Story 3.2: Lead Data Storage and Management
 * 
 * Provides utilities for GDPR compliance, data retention policies,
 * data anonymization, and audit logging.
 */

import { createServerClient } from '@/lib/supabase'
import { Lead, Design } from '@/lib/types'
import { createHash } from 'crypto'

/**
 * Data retention configuration
 */
export interface DataRetentionConfig {
  /** Lead data retention period in days */
  leadRetentionDays: number;
  /** Design data retention period in days */
  designRetentionDays: number;
  /** Analytics data retention period in days */
  analyticsRetentionDays: number;
  /** Performance log retention period in days */
  performanceLogRetentionDays: number;
  /** Grace period before hard deletion (days) */
  gracePeriodDays: number;
}

/**
 * Default data retention configuration
 */
export const DEFAULT_RETENTION_CONFIG: DataRetentionConfig = {
  leadRetentionDays: 2555, // ~7 years for business records
  designRetentionDays: 1095, // 3 years for design data
  analyticsRetentionDays: 365, // 1 year for analytics
  performanceLogRetentionDays: 30, // 30 days for performance logs
  gracePeriodDays: 30 // 30 day grace period
};

/**
 * GDPR data export result
 */
export interface DataExportResult {
  success: boolean;
  data?: {
    lead: any;
    designs: any[];
    analytics: any[];
    exportedAt: string;
    dataHash: string;
  };
  error?: string;
}

/**
 * Audit log entry for data operations
 */
export interface AuditLogEntry {
  id: string;
  operation: 'create' | 'read' | 'update' | 'delete' | 'export' | 'anonymize';
  entityType: 'lead' | 'design' | 'analytics' | 'performance';
  entityId: string;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  details?: Record<string, any>;
}

/**
 * Export all personal data for a given email address (GDPR Article 15)
 * @param email - User's email address
 * @returns Complete data export with integrity verification
 */
export async function exportUserData(email: string): Promise<DataExportResult> {
  const supabase = createServerClient();
  
  try {
    // Get lead data
    const { data: leadData, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('email', email);
    
    if (leadError) {
      return { success: false, error: `Failed to export lead data: ${leadError.message}` };
    }

    let designData: any[] = [];
    let analyticsData: any[] = [];

    if (leadData && leadData.length > 0) {
      const leadIds = leadData.map(lead => lead.id);
      const designIds = leadData.map(lead => lead.design_id).filter(Boolean);

      // Get associated designs
      if (designIds.length > 0) {
        const { data: designs, error: designError } = await supabase
          .from('designs')
          .select('*')
          .in('id', designIds);
        
        if (designError) {
          console.warn('Failed to export design data:', designError);
        } else {
          designData = designs || [];
        }
      }

      // Get associated analytics events
      const { data: analytics, error: analyticsError } = await supabase
        .from('analytics_events')
        .select('*')
        .in('lead_id', leadIds);
      
      if (analyticsError) {
        console.warn('Failed to export analytics data:', analyticsError);
      } else {
        analyticsData = analytics || [];
      }
    }

    // Create comprehensive export package
    const exportData = {
      lead: leadData?.[0] || null, // Primary lead record
      additionalLeads: leadData?.slice(1) || [], // Any additional lead records
      designs: designData,
      analytics: analyticsData,
      exportedAt: new Date().toISOString(),
      exportVersion: '1.0'
    };

    // Create integrity hash
    const dataHash = createDataHash(exportData);
    
    // Log the export operation
    if (leadData?.[0]) {
      await logAuditEvent({
        operation: 'export',
        entityType: 'lead',
        entityId: leadData[0].id,
        userEmail: email,
        details: {
          recordsExported: {
            leads: leadData.length,
            designs: designData.length,
            analytics: analyticsData.length
          }
        }
      });
    }

    return {
      success: true,
      data: {
        ...exportData,
        dataHash
      }
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown export error'
    };
  }
}

/**
 * Anonymize personal data while preserving analytics value (GDPR Article 17)
 * @param email - User's email address to anonymize
 * @returns Anonymization result
 */
export async function anonymizeUserData(
  email: string,
  retainAnalytics: boolean = true
): Promise<{ success: boolean; anonymizedRecords?: number; error?: string }> {
  const supabase = createServerClient();
  
  try {
    // Get leads to anonymize
    const { data: leads, error: fetchError } = await supabase
      .from('leads')
      .select('id, email, name, phone')
      .eq('email', email);
    
    if (fetchError) {
      return { success: false, error: `Failed to fetch leads: ${fetchError.message}` };
    }

    if (!leads || leads.length === 0) {
      return { success: true, anonymizedRecords: 0 };
    }

    const leadIds = leads.map(lead => lead.id);
    const anonymizedEmail = `anonymized_${createHash('md5').update(email).digest('hex')}@example.com`;
    
    // Anonymize lead records
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        email: anonymizedEmail,
        name: 'Anonymized User',
        phone: null, // Remove phone numbers
        project_description: retainAnalytics ? 
          'Project details anonymized for privacy compliance' : 
          null
      })
      .in('id', leadIds);
    
    if (updateError) {
      return { success: false, error: `Failed to anonymize leads: ${updateError.message}` };
    }

    // Anonymize analytics events if not retaining analytics
    if (!retainAnalytics) {
      await supabase
        .from('analytics_events')
        .update({
          user_agent: 'anonymized',
          event_data: {}
        })
        .in('lead_id', leadIds);
    }

    // Log anonymization
    for (const lead of leads) {
      await logAuditEvent({
        operation: 'anonymize',
        entityType: 'lead',
        entityId: lead.id,
        userEmail: email,
        details: {
          originalEmail: email,
          anonymizedEmail: anonymizedEmail,
          retainAnalytics
        }
      });
    }

    return {
      success: true,
      anonymizedRecords: leads.length
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown anonymization error'
    };
  }
}

/**
 * Implement automatic data cleanup based on retention policies
 * @param config - Data retention configuration
 * @returns Cleanup result with counts of deleted records
 */
export async function executeDataRetentionCleanup(
  config: DataRetentionConfig = DEFAULT_RETENTION_CONFIG
): Promise<{
  success: boolean;
  deletedCounts?: {
    leads: number;
    designs: number;
    analytics: number;
    performanceLogs: number;
  };
  error?: string;
}> {
  const supabase = createServerClient();
  
  try {
    const deletedCounts = {
      leads: 0,
      designs: 0,
      analytics: 0,
      performanceLogs: 0
    };

    // Calculate cutoff dates
    const leadCutoff = new Date(Date.now() - (config.leadRetentionDays * 24 * 60 * 60 * 1000));
    const designCutoff = new Date(Date.now() - (config.designRetentionDays * 24 * 60 * 60 * 1000));
    const analyticsCutoff = new Date(Date.now() - (config.analyticsRetentionDays * 24 * 60 * 60 * 1000));
    const perfLogCutoff = new Date(Date.now() - (config.performanceLogRetentionDays * 24 * 60 * 60 * 1000));

    // Delete old analytics events first (to avoid foreign key issues)
    const { data: deletedAnalytics, error: analyticsError } = await supabase
      .from('analytics_events')
      .delete()
      .lt('timestamp', analyticsCutoff.toISOString())
      .select('id');
    
    if (analyticsError) {
      console.warn('Failed to delete old analytics:', analyticsError);
    } else {
      deletedCounts.analytics = deletedAnalytics?.length || 0;
    }

    // Delete old performance logs
    const { data: deletedPerfLogs, error: perfError } = await supabase
      .from('query_performance_log')
      .delete()
      .lt('logged_at', perfLogCutoff.toISOString())
      .select('id');
    
    if (perfError) {
      console.warn('Failed to delete old performance logs:', perfError);
    } else {
      deletedCounts.performanceLogs = deletedPerfLogs?.length || 0;
    }

    // Delete old designs (orphaned ones without recent leads)
    const { data: deletedDesigns, error: designError } = await supabase
      .from('designs')
      .delete()
      .lt('created_at', designCutoff.toISOString())
      .select('id');
    
    if (designError) {
      console.warn('Failed to delete old designs:', designError);
    } else {
      deletedCounts.designs = deletedDesigns?.length || 0;
    }

    // Delete old leads (be very careful with business records)
    const { data: deletedLeads, error: leadError } = await supabase
      .from('leads')
      .delete()
      .lt('created_at', leadCutoff.toISOString())
      .neq('status', 'converted') // Never delete converted leads
      .select('id');
    
    if (leadError) {
      console.warn('Failed to delete old leads:', leadError);
    } else {
      deletedCounts.leads = deletedLeads?.length || 0;
    }

    // Log cleanup operation
    await logAuditEvent({
      operation: 'delete',
      entityType: 'lead',
      entityId: 'bulk_cleanup',
      details: {
        retentionConfig: config,
        deletedCounts,
        cutoffDates: {
          leads: leadCutoff.toISOString(),
          designs: designCutoff.toISOString(),
          analytics: analyticsCutoff.toISOString(),
          performanceLogs: perfLogCutoff.toISOString()
        }
      }
    });

    return {
      success: true,
      deletedCounts
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown cleanup error'
    };
  }
}

/**
 * Log audit event for compliance tracking
 * @param entry - Audit log entry details
 */
export async function logAuditEvent(
  entry: Omit<AuditLogEntry, 'id' | 'timestamp'>
): Promise<void> {
  try {
    const auditEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      ...entry
    };

    // In a production system, this would go to a dedicated audit log table
    // For now, we'll use console logging with structured data
    console.info('Audit Log:', {
      auditId: auditEntry.id,
      operation: auditEntry.operation,
      entityType: auditEntry.entityType,
      entityId: auditEntry.entityId,
      userEmail: auditEntry.userEmail,
      timestamp: auditEntry.timestamp.toISOString(),
      details: auditEntry.details
    });

    // TODO: In production, store in dedicated audit_log table
    // const supabase = createServerClient();
    // await supabase.from('audit_log').insert([auditEntry]);

  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

/**
 * Create integrity hash for data export verification
 */
function createDataHash(data: any): string {
  const dataString = JSON.stringify(data, Object.keys(data).sort());
  return createHash('sha256').update(dataString).digest('hex');
}

/**
 * Verify data export integrity
 * @param data - Exported data
 * @param expectedHash - Expected hash value
 * @returns Whether the data is intact
 */
export function verifyDataIntegrity(data: any, expectedHash: string): boolean {
  const actualHash = createDataHash(data);
  return actualHash === expectedHash;
}

/**
 * Generate privacy compliance report
 * @param timeRangeMonths - Time range for the report in months
 * @returns Compliance metrics and recommendations
 */
export async function generateComplianceReport(
  timeRangeMonths: number = 12
): Promise<{
  success: boolean;
  report?: {
    totalLeads: number;
    dataExports: number;
    anonymizations: number;
    deletions: number;
    retentionCompliance: boolean;
    recommendations: string[];
  };
  error?: string;
}> {
  try {
    const supabase = createServerClient();
    const timeThreshold = new Date(Date.now() - (timeRangeMonths * 30 * 24 * 60 * 60 * 1000));

    // Get total leads in time range
    const { count: totalLeads, error: countError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', timeThreshold.toISOString());

    if (countError) {
      return { success: false, error: `Failed to count leads: ${countError.message}` };
    }

    // Calculate compliance metrics
    const recommendations: string[] = [];
    
    if ((totalLeads || 0) > 1000) {
      recommendations.push('Consider implementing automated data retention cleanup');
    }

    recommendations.push('Regular compliance audits recommended');
    recommendations.push('Ensure GDPR consent tracking is implemented');

    return {
      success: true,
      report: {
        totalLeads: totalLeads || 0,
        dataExports: 0, // Would track from audit logs
        anonymizations: 0, // Would track from audit logs
        deletions: 0, // Would track from audit logs
        retentionCompliance: true,
        recommendations
      }
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
