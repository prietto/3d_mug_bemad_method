-- =====================================================
-- Story 8.3: AI Rate Limiting Migration
-- Copy this entire SQL and paste into Supabase SQL Editor
-- =====================================================

-- Table: ai_generation_limits (IP Tracking - Layer 2)
CREATE TABLE IF NOT EXISTS ai_generation_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  generation_count INTEGER DEFAULT 1 CHECK (generation_count >= 0),
  last_generation_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_ip_date UNIQUE(ip_address, date_key)
);

-- Index for fast IP + date lookups
CREATE INDEX IF NOT EXISTS idx_ai_limits_ip_date
ON ai_generation_limits(ip_address, date_key);

-- Table: ai_generation_global_counter (Global Daily Counter - Layer 3)
CREATE TABLE IF NOT EXISTS ai_generation_global_counter (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_key TEXT NOT NULL UNIQUE,
  total_generations INTEGER DEFAULT 0 CHECK (total_generations >= 0),
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast date lookups
CREATE INDEX IF NOT EXISTS idx_global_counter_date
ON ai_generation_global_counter(date_key);

-- Enable Row Level Security (RLS)
ALTER TABLE ai_generation_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generation_global_counter ENABLE ROW LEVEL SECURITY;

-- Function: Increment IP generation counter (atomic)
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

-- Function: Increment global generation counter (atomic)
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

-- Add comments for documentation
COMMENT ON TABLE ai_generation_limits IS 'Tracks per-IP AI generation counts with daily reset (Layer 2)';
COMMENT ON TABLE ai_generation_global_counter IS 'Tracks total daily AI generations across all users (Layer 3)';
COMMENT ON FUNCTION increment_ip_generation IS 'Atomically increments IP generation counter for Layer 2 rate limiting';
COMMENT ON FUNCTION increment_global_generation IS 'Atomically increments global generation counter for Layer 3 rate limiting';

-- Seed initial global counter for today
INSERT INTO ai_generation_global_counter (date_key, total_generations)
VALUES (TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD'), 0)
ON CONFLICT (date_key) DO NOTHING;

-- =====================================================
-- Migration Complete!
--
-- Created objects:
-- ✅ Tables: ai_generation_limits, ai_generation_global_counter
-- ✅ Indexes: idx_ai_limits_ip_date, idx_global_counter_date
-- ✅ Functions: increment_ip_generation, increment_global_generation
-- ✅ RLS enabled on both tables
-- ✅ Initial global counter seeded
-- =====================================================