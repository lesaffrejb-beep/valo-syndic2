-- ============================================================================
-- VALO-SYNDIC — Market Stats (Hive Mind)
-- Version: 1.0.0
-- Date: 2026-01-30
-- ============================================================================
-- Anonymous market intelligence collection
-- No personal data, no user tracking - purely statistical

CREATE TABLE IF NOT EXISTS market_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    
    -- Anonymous market data
    postal_code TEXT,
    city TEXT,
    current_dpe TEXT CHECK (current_dpe IN ('A', 'B', 'C', 'D', 'E', 'F', 'G')),
    target_dpe TEXT CHECK (target_dpe IN ('A', 'B', 'C', 'D', 'E', 'F', 'G')),
    cost_per_sqm NUMERIC,
    number_of_units INTEGER,
    
    -- No user_id, no email - fully anonymous
    
    -- Optional metadata
    work_cost_ht NUMERIC,
    subsidy_rate NUMERIC
);

-- Indexes for aggregation queries (future analytics)
CREATE INDEX IF NOT EXISTS idx_market_stats_postal ON market_stats(postal_code);
CREATE INDEX IF NOT EXISTS idx_market_stats_dpe ON market_stats(current_dpe, target_dpe);
CREATE INDEX IF NOT EXISTS idx_market_stats_city ON market_stats(city);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE market_stats ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (anyone can contribute data)
CREATE POLICY "Market stats: anonymous insert"
    ON market_stats FOR INSERT
    WITH CHECK (true);

-- No public reads (data is for internal analytics only)
-- Future: Could expose aggregated stats via API
CREATE POLICY "Market stats: no public read"
    ON market_stats FOR SELECT
    USING (false);

-- ============================================================================
-- HELPER FUNCTIONS (FUTURE)
-- ============================================================================

-- Function to get average cost per sqm by postal code and DPE transition
CREATE OR REPLACE FUNCTION get_market_avg_cost(
    p_postal_code TEXT,
    p_current_dpe TEXT,
    p_target_dpe TEXT
)
RETURNS NUMERIC AS $$
DECLARE
    avg_cost NUMERIC;
BEGIN
    SELECT AVG(cost_per_sqm) INTO avg_cost
    FROM market_stats
    WHERE postal_code = p_postal_code
      AND current_dpe = p_current_dpe
      AND target_dpe = p_target_dpe
      AND created_at > now() - INTERVAL '12 months' -- Only recent data
      AND cost_per_sqm > 0; -- Exclude null/zero values
    
    RETURN avg_cost;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
