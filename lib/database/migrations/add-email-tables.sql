-- Migration: Add Email Delivery and Preference Tables
-- Story 3.4: Automated Lead Notifications and Confirmations
-- Created: 2025-09-29
-- Purpose: GDPR compliance audit trail and email delivery monitoring

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create email_deliveries table for tracking email delivery status
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_email_deliveries_lead_id FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);

-- Create email_preferences table for GDPR compliance
CREATE TABLE IF NOT EXISTS email_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    unsubscribe_token VARCHAR(64) NOT NULL UNIQUE CHECK (char_length(unsubscribe_token) = 64),
    is_subscribed BOOLEAN DEFAULT TRUE,
    preferences JSONB DEFAULT '{"lead_confirmations": true, "marketing": true, "newsletter": false}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_email_deliveries_lead_id ON email_deliveries(lead_id);
CREATE INDEX IF NOT EXISTS idx_email_deliveries_status ON email_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_email_deliveries_created_at ON email_deliveries(created_at);
CREATE INDEX IF NOT EXISTS idx_email_deliveries_email_type ON email_deliveries(email_type);
CREATE INDEX IF NOT EXISTS idx_email_deliveries_recipient ON email_deliveries(recipient);

CREATE INDEX IF NOT EXISTS idx_email_preferences_email ON email_preferences(email);
CREATE INDEX IF NOT EXISTS idx_email_preferences_token ON email_preferences(unsubscribe_token);
CREATE INDEX IF NOT EXISTS idx_email_preferences_subscribed ON email_preferences(is_subscribed);

-- Row Level Security (RLS) - Enable for both tables
ALTER TABLE email_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for API access (allow all operations for service role)
CREATE POLICY "Allow service role access to email_deliveries" ON email_deliveries
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role access to email_preferences" ON email_preferences
    FOR ALL USING (auth.role() = 'service_role');

-- Create trigger to automatically update updated_at timestamp for email_preferences
CREATE OR REPLACE FUNCTION update_email_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_email_preferences_updated_at BEFORE UPDATE ON email_preferences
    FOR EACH ROW EXECUTE FUNCTION update_email_preferences_timestamp();

-- Add comments for documentation
COMMENT ON TABLE email_deliveries IS 'Tracks all email delivery attempts for audit trail and monitoring';
COMMENT ON TABLE email_preferences IS 'Stores user email preferences for GDPR compliance (unsubscribe, preferences)';

COMMENT ON COLUMN email_deliveries.retry_count IS 'Number of retry attempts (max 5 per email delivery logic)';
COMMENT ON COLUMN email_deliveries.status IS 'pending: queued, sent: delivered successfully, failed: all retries exhausted, bounced: recipient invalid';
COMMENT ON COLUMN email_preferences.unsubscribe_token IS 'SHA256 token for secure unsubscribe (64 hex characters)';
COMMENT ON COLUMN email_preferences.preferences IS 'JSON object storing granular email preferences (lead_confirmations, marketing, newsletter)';