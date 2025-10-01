-- Database Performance Optimization Migration
-- Story 3.2: Lead Data Storage and Management
-- 
-- This migration adds performance monitoring and optimizations
-- for high-volume lead processing and complex analytics queries.

-- Add query performance monitoring function
CREATE OR REPLACE FUNCTION log_query_performance(
    query_name TEXT,
    execution_time_ms INTEGER,
    rows_affected INTEGER DEFAULT NULL
) RETURNS void AS $$
BEGIN
    INSERT INTO query_performance_log (
        query_name,
        execution_time_ms,
        rows_affected,
        logged_at
    ) VALUES (
        query_name,
        execution_time_ms,
        rows_affected,
        NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- Create query performance logging table
CREATE TABLE IF NOT EXISTS query_performance_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_name VARCHAR(100) NOT NULL,
    execution_time_ms INTEGER NOT NULL,
    rows_affected INTEGER,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add performance monitoring indexes
CREATE INDEX IF NOT EXISTS idx_query_perf_name_time ON query_performance_log(query_name, logged_at);
CREATE INDEX IF NOT EXISTS idx_query_perf_execution_time ON query_performance_log(execution_time_ms);

-- Optimize existing lead queries with additional indexes
-- These support the most common query patterns identified in Story 3.2

-- Index for lead pipeline queries (status + created_at combinations)
CREATE INDEX IF NOT EXISTS idx_leads_status_created_desc ON leads(status, created_at DESC);

-- Index for marketing analytics (source + engagement + device type)
CREATE INDEX IF NOT EXISTS idx_leads_marketing_analytics ON leads(source, engagement_level, device_type, created_at);

-- Index for duplicate detection queries (email + recent time window)
CREATE INDEX IF NOT EXISTS idx_leads_email_recent ON leads(email, created_at DESC) 
    WHERE created_at >= NOW() - INTERVAL '7 days';

-- Index for session-based duplicate detection
CREATE INDEX IF NOT EXISTS idx_leads_session_recent ON leads(session_id, created_at DESC)
    WHERE created_at >= NOW() - INTERVAL '1 hour' AND session_id IS NOT NULL;

-- Index for fingerprint-based duplicate detection  
CREATE INDEX IF NOT EXISTS idx_leads_fingerprint_recent ON leads(ip_address_hash, user_agent, created_at DESC)
    WHERE created_at >= NOW() - INTERVAL '1 hour' AND ip_address_hash IS NOT NULL;

-- Index for design quality analysis
CREATE INDEX IF NOT EXISTS idx_leads_design_quality ON leads(design_id, engagement_level, created_at)
    WHERE design_id IS NOT NULL;

-- Partial indexes for high-value leads
CREATE INDEX IF NOT EXISTS idx_leads_high_engagement ON leads(created_at DESC, email, phone)
    WHERE engagement_level = 'high';

-- Index for lead conversion funnel analysis
CREATE INDEX IF NOT EXISTS idx_leads_conversion_funnel ON leads(status, source, device_type, created_at);

-- Optimize designs table for lead-design joins
CREATE INDEX IF NOT EXISTS idx_designs_complete_recent ON designs(is_complete, created_at DESC, id)
    WHERE is_complete = true;

-- Index for design quality scoring
CREATE INDEX IF NOT EXISTS idx_designs_quality_metrics ON designs(
    is_complete,
    (CASE WHEN uploaded_image_base64 IS NOT NULL OR uploaded_image_url IS NOT NULL THEN 1 ELSE 0 END),
    (CASE WHEN custom_text IS NOT NULL AND custom_text != '' THEN 1 ELSE 0 END),
    created_at
);

-- Analytics events optimization for session tracking
CREATE INDEX IF NOT EXISTS idx_analytics_lead_session ON analytics_events(lead_id, session_id, timestamp)
    WHERE lead_id IS NOT NULL;

-- Add database statistics update trigger
CREATE OR REPLACE FUNCTION update_table_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update statistics after significant changes
    IF TG_OP = 'INSERT' THEN
        -- Schedule statistics update for high-volume inserts
        PERFORM pg_stat_reset_single_table_counters(TG_RELID);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Add performance monitoring for lead operations
CREATE OR REPLACE FUNCTION leads_performance_trigger()
RETURNS TRIGGER AS $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    duration_ms INTEGER;
BEGIN
    start_time := clock_timestamp();
    
    -- The actual operation happens here (INSERT/UPDATE/DELETE)
    
    end_time := clock_timestamp();
    duration_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    
    -- Log performance for operations taking > 100ms
    IF duration_ms > 100 THEN
        PERFORM log_query_performance(
            TG_OP || '_leads',
            duration_ms,
            1
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Add performance monitoring triggers (commented out to avoid overhead in development)
-- Uncomment these in production for monitoring
-- CREATE TRIGGER leads_perf_monitor AFTER INSERT OR UPDATE OR DELETE ON leads
--     FOR EACH ROW EXECUTE FUNCTION leads_performance_trigger();

-- Add connection pooling optimization settings (PostgreSQL configuration)
-- These should be set in postgresql.conf or via Supabase dashboard:
/*
-- Connection pooling settings for high-traffic periods
max_connections = 200
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB

-- Query optimization settings
random_page_cost = 1.1  -- Optimized for SSD storage
effective_io_concurrency = 200
max_worker_processes = 8
max_parallel_workers_per_gather = 4
*/

-- Create materialized view for lead analytics dashboard
CREATE MATERIALIZED VIEW IF NOT EXISTS lead_analytics_summary AS
SELECT 
    DATE_TRUNC('hour', created_at) as hour_bucket,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN engagement_level = 'high' THEN 1 END) as high_engagement,
    COUNT(CASE WHEN engagement_level = 'medium' THEN 1 END) as medium_engagement,
    COUNT(CASE WHEN engagement_level = 'low' THEN 1 END) as low_engagement,
    COUNT(CASE WHEN design_id IS NOT NULL THEN 1 END) as with_design,
    COUNT(DISTINCT CASE WHEN device_type = 'mobile' THEN session_id END) as mobile_sessions,
    COUNT(DISTINCT CASE WHEN device_type = 'desktop' THEN session_id END) as desktop_sessions,
    COUNT(DISTINCT CASE WHEN device_type = 'tablet' THEN session_id END) as tablet_sessions,
    AVG(engagement_duration) as avg_engagement_duration,
    COUNT(DISTINCT referral_source) as unique_sources
FROM leads 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour_bucket DESC;

-- Index for materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_analytics_hour ON lead_analytics_summary(hour_bucket);

-- Refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_lead_analytics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY lead_analytics_summary;
END;
$$ LANGUAGE plpgsql;

-- Add automatic cleanup for old performance logs (retention policy)
CREATE OR REPLACE FUNCTION cleanup_performance_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM query_performance_log 
    WHERE logged_at < NOW() - INTERVAL '7 days';
    
    -- Log cleanup operation
    INSERT INTO query_performance_log (query_name, execution_time_ms, rows_affected, logged_at)
    VALUES ('cleanup_performance_logs', 0, ROW_COUNT, NOW());
END;
$$ LANGUAGE plpgsql;

-- Performance monitoring queries for developers
-- Use these to monitor database performance:

-- Top slow queries
/*
SELECT 
    query_name,
    AVG(execution_time_ms) as avg_time_ms,
    MAX(execution_time_ms) as max_time_ms,
    COUNT(*) as execution_count
FROM query_performance_log 
WHERE logged_at >= NOW() - INTERVAL '24 hours'
GROUP BY query_name
ORDER BY avg_time_ms DESC;
*/

-- Lead creation performance over time
/*
SELECT 
    DATE_TRUNC('hour', logged_at) as hour,
    AVG(execution_time_ms) as avg_creation_time
FROM query_performance_log 
WHERE query_name = 'INSERT_leads' 
    AND logged_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', logged_at)
ORDER BY hour DESC;
*/

-- Database size monitoring
/*
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
*/
