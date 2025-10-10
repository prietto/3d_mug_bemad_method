-- Migration: AI Generation Rate Limiting Tables
-- Story: 8.3 - Multi-Layer Rate Limiting & Production Readiness
-- Created: 2025-01-06

-- Table: ai_generation_limits (IP Tracking - Layer 2)
-- Purpose: Track per-IP generation counts with daily reset
CREATE TABLE IF NOT EXISTS ai_generation_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  generation_count INTEGER DEFAULT 1 CHECK (generation_count >= 0),
  last_generation_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date_key TEXT NOT NULL, -- Format: YYYY-MM-DD for daily reset
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_ip_date UNIQUE(ip_address, date_key)
);

-- Index for fast IP + date lookups (Layer 2 checks)
CREATE INDEX IF NOT EXISTS idx_ai_limits_ip_date
ON ai_generation_limits(ip_address, date_key);

-- Table: ai_generation_global_counter (Global Daily Counter - Layer 3)
-- Purpose: Track total daily generations across all users
CREATE TABLE IF NOT EXISTS ai_generation_global_counter (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_key TEXT NOT NULL UNIQUE, -- Format: YYYY-MM-DD
  total_generations INTEGER DEFAULT 0 CHECK (total_generations >= 0),
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast date lookups (Layer 3 checks)
CREATE INDEX IF NOT EXISTS idx_global_counter_date
ON ai_generation_global_counter(date_key);

-- Enable Row Level Security (RLS) for both tables
-- No public access - API route uses service role key only
ALTER TABLE ai_generation_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generation_global_counter ENABLE ROW LEVEL SECURITY;

-- Database Function: Increment IP generation counter (atomic operation)
-- Purpose: Safely increment IP counter or create new record for Layer 2
CREATE OR REPLACE FUNCTION increment_ip_generation(
  p_ip_address TEXT,
  p_date_key TEXT
)
RETURNS TABLE(new_count INTEGER) AS $$
DECLARE
  v_new_count INTEGER;
BEGIN
  INSERT INTO ai_generation_limits (ip_address, date_key, generation_count, last_generation_at)
  VALUES (p_ip_address, p_date_key, 1, NOW())
  ON CONFLICT (ip_address, date_key)
  DO UPDATE SET
    generation_count = ai_generation_limits.generation_count + 1,
    last_generation_at = NOW()
  RETURNING generation_count INTO v_new_count;

  RETURN QUERY SELECT v_new_count;
END;
$$ LANGUAGE plpgsql;

-- Database Function: Increment global generation counter (atomic operation)
-- Purpose: Safely increment global counter or create new record for Layer 3
CREATE OR REPLACE FUNCTION increment_global_generation(
  p_date_key TEXT
)
RETURNS TABLE(new_total INTEGER) AS $$
DECLARE
  v_new_total INTEGER;
BEGIN
  INSERT INTO ai_generation_global_counter (date_key, total_generations, last_updated_at)
  VALUES (p_date_key, 1, NOW())
  ON CONFLICT (date_key)
  DO UPDATE SET
    total_generations = ai_generation_global_counter.total_generations + 1,
    last_updated_at = NOW()
  RETURNING total_generations INTO v_new_total;

  RETURN QUERY SELECT v_new_total;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE ai_generation_limits IS 'Tracks per-IP AI generation counts with daily reset (Layer 2)';
COMMENT ON TABLE ai_generation_global_counter IS 'Tracks total daily AI generations across all users (Layer 3)';
COMMENT ON FUNCTION increment_ip_generation IS 'Atomically increments IP generation counter for Layer 2 rate limiting';
COMMENT ON FUNCTION increment_global_generation IS 'Atomically increments global generation counter for Layer 3 rate limiting';

-- Optional: Seed initial global counter for today (helps with initial queries)
INSERT INTO ai_generation_global_counter (date_key, total_generations)
VALUES (TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD'), 0)
ON CONFLICT (date_key) DO NOTHING;
