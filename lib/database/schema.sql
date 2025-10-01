-- Supabase SQL Schema
-- Run this script in your Supabase SQL editor to create the database schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    project_description TEXT NOT NULL,
    design_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source VARCHAR(100) DEFAULT 'direct',
    engagement_level VARCHAR(20) CHECK (engagement_level IN ('low', 'medium', 'high')) DEFAULT 'medium',
    status VARCHAR(20) CHECK (status IN ('new', 'contacted', 'qualified', 'converted')) DEFAULT 'new',
    -- Session tracking fields (Story 3.2)
    session_id VARCHAR(255),
    user_agent TEXT,
    referral_source VARCHAR(255),
    device_type VARCHAR(20) CHECK (device_type IN ('mobile', 'desktop', 'tablet')),
    browser_type VARCHAR(50),
    ip_address_hash VARCHAR(64),
    engagement_duration INTEGER DEFAULT 0
);

-- Create designs table  
CREATE TABLE IF NOT EXISTS designs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mug_color VARCHAR(50) NOT NULL,
    uploaded_image_base64 TEXT,
    custom_text TEXT,
    text_font VARCHAR(100),
    text_position JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_complete BOOLEAN DEFAULT FALSE
);

-- Create analytics_events table
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(50) CHECK (event_type IN ('page_view', 'mug_rotate', 'color_change', 'image_upload', 'text_add', 'lead_capture')) NOT NULL,
    event_data JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT,
    lead_id UUID REFERENCES leads(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_designs_created_at ON designs(created_at);
CREATE INDEX IF NOT EXISTS idx_designs_is_complete ON designs(is_complete);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);

-- Additional composite indexes for Story 3.2 complex queries
CREATE INDEX IF NOT EXISTS idx_leads_status_created ON leads(status, created_at);
CREATE INDEX IF NOT EXISTS idx_leads_source_engagement ON leads(source, engagement_level);
CREATE INDEX IF NOT EXISTS idx_leads_session_id ON leads(session_id);
CREATE INDEX IF NOT EXISTS idx_leads_device_type ON leads(device_type);
CREATE INDEX IF NOT EXISTS idx_leads_ip_hash_created ON leads(ip_address_hash, created_at);

-- Add foreign key constraint from leads to designs (optional relationship)
ALTER TABLE leads ADD CONSTRAINT fk_leads_design_id 
    FOREIGN KEY (design_id) REFERENCES designs(id);

-- Row Level Security (RLS) - Enable for all tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Create policies for API access (allow all operations for service role)
CREATE POLICY "Allow service role access to leads" ON leads
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role access to designs" ON designs
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role access to analytics_events" ON analytics_events
    FOR ALL USING (auth.role() = 'service_role');

-- Create trigger to automatically update last_modified timestamp
CREATE OR REPLACE FUNCTION update_last_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_modified = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_designs_last_modified BEFORE UPDATE ON designs
    FOR EACH ROW EXECUTE FUNCTION update_last_modified_column();

-- Email Deliveries Table (Story 3.4)
CREATE TABLE IF NOT EXISTS email_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    email_type VARCHAR(50) CHECK (email_type IN ('business_notification', 'user_confirmation')) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'sent', 'failed', 'bounced')) DEFAULT 'pending',
    sent_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,
    retry_count INTEGER DEFAULT 0 CHECK (retry_count >= 0 AND retry_count <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Preferences Table (Story 3.4 - GDPR Compliance)
CREATE TABLE IF NOT EXISTS email_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    unsubscribe_token VARCHAR(64) NOT NULL UNIQUE CHECK (char_length(unsubscribe_token) = 64),
    is_subscribed BOOLEAN DEFAULT TRUE,
    preferences JSONB DEFAULT '{"lead_confirmations": true, "marketing": true, "newsletter": false}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for email tables
CREATE INDEX IF NOT EXISTS idx_email_deliveries_lead_id ON email_deliveries(lead_id);
CREATE INDEX IF NOT EXISTS idx_email_deliveries_status ON email_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_email_deliveries_created_at ON email_deliveries(created_at);
CREATE INDEX IF NOT EXISTS idx_email_deliveries_email_type ON email_deliveries(email_type);
CREATE INDEX IF NOT EXISTS idx_email_deliveries_recipient ON email_deliveries(recipient);
CREATE INDEX IF NOT EXISTS idx_email_preferences_email ON email_preferences(email);
CREATE INDEX IF NOT EXISTS idx_email_preferences_token ON email_preferences(unsubscribe_token);
CREATE INDEX IF NOT EXISTS idx_email_preferences_subscribed ON email_preferences(is_subscribed);

-- RLS for email tables
ALTER TABLE email_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role access to email_deliveries" ON email_deliveries
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role access to email_preferences" ON email_preferences
    FOR ALL USING (auth.role() = 'service_role');

-- Trigger for email_preferences updated_at
CREATE OR REPLACE FUNCTION update_email_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_email_preferences_updated_at BEFORE UPDATE ON email_preferences
    FOR EACH ROW EXECUTE FUNCTION update_email_preferences_timestamp();
