-- Migration: 004 - Multi-View Support for Story 9.3
-- Description: Add support for storing multiple view angles (front, side, handle) of mug designs
-- Date: 2025-10-09

-- Add multi_view_urls column to store array of view objects
-- Structure: [{ angle: 'front', url: 'data:image/...', generatedAt: '2025-01-08T12:00:00Z' }, ...]
ALTER TABLE designs
ADD COLUMN IF NOT EXISTS multi_view_urls JSONB DEFAULT NULL;

-- Add timestamp for when multi-views were generated
-- Useful for cache invalidation and analytics
ALTER TABLE designs
ADD COLUMN IF NOT EXISTS multi_view_generated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add index for querying designs with multi-views
-- Useful for analytics and feature adoption tracking
CREATE INDEX IF NOT EXISTS idx_designs_has_multi_view
ON designs ((multi_view_urls IS NOT NULL));

-- Add partial index for designs with recent multi-views (last 30 days)
-- Optimizes queries for active multi-view designs
CREATE INDEX IF NOT EXISTS idx_designs_recent_multi_view
ON designs (multi_view_generated_at DESC)
WHERE multi_view_generated_at > NOW() - INTERVAL '30 days';

-- Add comment for documentation
COMMENT ON COLUMN designs.multi_view_urls IS
'JSONB array storing multiple camera angles of the mug design. Structure: [{ angle: ViewAngle, url: string, generatedAt: ISO timestamp }]';

COMMENT ON COLUMN designs.multi_view_generated_at IS
'Timestamp when multi-view images were generated. Used for cache invalidation and analytics.';
