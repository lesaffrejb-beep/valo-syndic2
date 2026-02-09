-- ============================================================================
-- VALO-SYNDIC — RESET & INIT COMPLET
-- ============================================================================
--
-- COPIER-COLLER ce fichier ENTIER dans l'editeur SQL de Supabase.
-- Il est IDEMPOTENT : tu peux le relancer autant de fois que tu veux.
--
-- CE QU'IL FAIT :
--   1. GARDE reference_dpe (tes ~4000 DPE du 49, on y touche PAS)
--   2. GARDE coproperty_data (tes copros RNIC, on y touche PAS)
--   3. NETTOIE market_data et global_settings (duplicats, schema inconsistant)
--   4. CREE audits_flash (LA nouvelle table pour l'Audit Flash)
--   5. INSERE les donnees de base pour que les calculs marchent
--
-- CE QU'IL NE TOUCHE PAS :
--   - reference_dpe (les donnees ADEME Dept 49 restent intactes)
--   - coproperty_data (les copros RNIC restent intactes)
--   - analytics_dpe_distribution (la vue materialize reste intacte)
--   - analytics_benchmark_construction (la vue materialize reste intacte)
--   - Le cron job refresh_dpe_daily (reste programme)
--
-- Date: 2026-02-09
-- ============================================================================


-- ============================================================================
-- PHASE 0 : FONCTION UTILITAIRE
-- (elle existe peut-etre deja, on la recree proprement)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- PHASE 1 : NETTOYAGE DE market_data
-- Probleme actuel : la table existe avec (key TEXT PK, data JSONB)
-- On la drop et recree avec un schema plus propre
-- ============================================================================

DROP TABLE IF EXISTS market_data CASCADE;

CREATE TABLE market_data (
    key TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    source TEXT,
    reference_date DATE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Securite
ALTER TABLE market_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "market_data : lecture publique" ON market_data;
DROP POLICY IF EXISTS "market_data : ecriture admin" ON market_data;

CREATE POLICY "market_data_read" ON market_data FOR SELECT USING (true);
CREATE POLICY "market_data_admin" ON market_data FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');


-- ============================================================================
-- PHASE 2 : NETTOYAGE DE global_settings
-- Probleme actuel : table existe avec schema inconsistant
-- On la drop et recree
-- ============================================================================

DROP TABLE IF EXISTS global_settings CASCADE;

CREATE TABLE global_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'general',
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_settings_key ON global_settings(key);
CREATE INDEX idx_settings_category ON global_settings(category);

DROP TRIGGER IF EXISTS trg_settings_updated ON global_settings;
CREATE TRIGGER trg_settings_updated
    BEFORE UPDATE ON global_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_read" ON global_settings FOR SELECT USING (is_active = true);
CREATE POLICY "settings_admin" ON global_settings FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Fonction utilitaire
CREATE OR REPLACE FUNCTION get_setting(p_key TEXT)
RETURNS JSONB AS $$
    SELECT value FROM global_settings WHERE key = p_key AND is_active = true LIMIT 1;
$$ LANGUAGE sql STABLE;


-- ============================================================================
-- PHASE 3 : CREATION DE audits_flash (NOUVELLE TABLE)
-- ============================================================================

-- Nettoyer si elle existe deja (relance du script)
DROP VIEW IF EXISTS audits_flash_summary CASCADE;
DROP TABLE IF EXISTS audits_flash CASCADE;
DROP TYPE IF EXISTS audit_flash_status CASCADE;
DROP TYPE IF EXISTS data_origin CASCADE;

CREATE TYPE audit_flash_status AS ENUM ('DRAFT', 'READY', 'COMPLETED');
CREATE TYPE data_origin AS ENUM ('api', 'manual', 'estimated', 'fallback');

CREATE TABLE audits_flash (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- INPUT
    raw_address TEXT NOT NULL,
    normalized_address TEXT,
    postal_code VARCHAR(10),
    city VARCHAR(255),
    city_code VARCHAR(10),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- STATUT
    status audit_flash_status NOT NULL DEFAULT 'DRAFT',
    missing_fields TEXT[] DEFAULT '{}',

    -- GOLDEN DATA 1 : Surface habitable (m2)
    surface_habitable DECIMAL(10, 2),
    surface_origin data_origin,
    surface_source TEXT,
    surface_confidence DECIMAL(3, 2),

    -- GOLDEN DATA 2 : Annee de construction
    construction_year INTEGER,
    construction_year_origin data_origin,
    construction_year_source TEXT,
    construction_year_confidence DECIMAL(3, 2),

    -- GOLDEN DATA 3 : DPE
    dpe_current VARCHAR(1) CHECK (dpe_current IN ('A','B','C','D','E','F','G')),
    dpe_origin data_origin,
    dpe_source TEXT,
    dpe_numero VARCHAR(50),
    dpe_date DATE,
    dpe_conso DECIMAL(8, 2),
    dpe_ges VARCHAR(1),

    -- GOLDEN DATA 4 : Prix m2
    price_per_sqm DECIMAL(10, 2),
    price_origin data_origin,
    price_source TEXT,
    price_transaction_count INTEGER,
    price_date_range JSONB,

    -- ENRICHISSEMENT
    number_of_units INTEGER,
    heating_system VARCHAR(50),
    cadastre_parcel_id VARCHAR(50),
    cadastre_surface_terrain DECIMAL(10, 2),
    target_dpe VARCHAR(1) DEFAULT 'C',

    -- RESULTATS (JSONB)
    computation JSONB,

    -- AUDIT TRAIL
    api_responses JSONB DEFAULT '{}',
    enrichment_sources JSONB DEFAULT '[]',

    -- META
    user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_af_status ON audits_flash(status);
CREATE INDEX idx_af_postal ON audits_flash(postal_code);
CREATE INDEX idx_af_created ON audits_flash(created_at DESC);

DROP TRIGGER IF EXISTS trg_af_updated ON audits_flash;
CREATE TRIGGER trg_af_updated
    BEFORE UPDATE ON audits_flash
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE audits_flash ENABLE ROW LEVEL SECURITY;

-- Pour le dev : acces ouvert (durcir en prod)
CREATE POLICY "af_read"   ON audits_flash FOR SELECT USING (true);
CREATE POLICY "af_insert" ON audits_flash FOR INSERT WITH CHECK (true);
CREATE POLICY "af_update" ON audits_flash FOR UPDATE USING (true);

-- Vue resume
CREATE OR REPLACE VIEW audits_flash_summary AS
SELECT
    id, raw_address, normalized_address, postal_code, city,
    status, missing_fields, dpe_current, surface_habitable,
    construction_year, price_per_sqm, number_of_units,
    surface_origin, construction_year_origin, dpe_origin, price_origin,
    computation -> 'simulation' ->> 'remainingCost' AS remaining_cost,
    computation -> 'valuation' ->> 'greenValueGain' AS green_value_gain,
    computation -> 'valuation' ->> 'netROI' AS net_roi,
    computation -> 'simulation' ->> 'monthlyPayment' AS monthly_payment,
    created_at, completed_at
FROM audits_flash
ORDER BY created_at DESC;


-- ============================================================================
-- PHASE 4 : SEED DATA
-- ============================================================================

-- Donnees market_data
INSERT INTO market_data (key, data, source, reference_date) VALUES
('bt01', '{"currentValue": 133.3, "annualChangePercent": 1.37, "referenceMonth": "2025-11"}',
    'INSEE Serie 001710986', '2025-11-01'),
('market_trend', '{"national": -0.004, "idf": -0.013, "province": 0.001}',
    'Notaires de France T4 2025', '2025-12-01'),
('passoires', '{"shareOfSales": 0.15, "trendVs2023": -0.02}',
    'Notaires DP 08.12.2025', '2025-12-01'),
('regulation', '{"isLdF2026Voted": false, "isMprCoproSuspended": true, "suspensionDate": "2026-01-01"}',
    'Loi speciale 26/12/2025', '2026-01-01')
ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, source = EXCLUDED.source, updated_at = NOW();

-- Donnees global_settings
INSERT INTO global_settings (key, value, category, description) VALUES
-- Aides
('mpr_rate_standard',       '0.30',   'aids',      'Taux MPR si gain 35-50%'),
('mpr_rate_high_perf',      '0.45',   'aids',      'Taux MPR si gain > 50%'),
('mpr_ceiling_per_lot',     '25000',  'aids',      'Plafond assiette MPR par logement'),
('mpr_min_energy_gain',     '0.35',   'aids',      'Gain energetique min pour MPR'),
('cee_rate',                '0.08',   'aids',      'CEE = 8% des travaux HT'),
('cee_max_per_lot',         '5000',   'aids',      'Plafond CEE par lot'),
('eco_ptz_max_per_lot',     '50000',  'aids',      'Plafond Eco-PTZ par lot'),
('eco_ptz_duration_months', '240',    'aids',      'Duree Eco-PTZ (20 ans)'),
-- Technique
('reno_cost_per_sqm',       '180',    'technical', 'Cout moyen reno ITE+VMC (EUR/m2)'),
('tva_renovation',          '0.055',  'technical', 'TVA renovation energetique 5.5%'),
-- Inflation
('bt01_inflation_rate',     '0.02',   'inflation', 'Inflation BTP annuelle'),
-- Marche
('green_value_high',        '0.12',   'market',    'Plus-value verte si gain > 50%'),
('green_value_standard',    '0.08',   'market',    'Plus-value verte si gain 35-50%'),
('base_price_per_sqm',      '3500',   'pricing',   'Prix m2 fallback Angers/Nantes'),
-- Regulation
('mpr_copro_active',        'false',  'regulation','MPR Copro suspendue faute LdF 2026')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();


-- ============================================================================
-- VERIFICATION : Decommenter et executer pour verifier
-- ============================================================================
-- SELECT 'reference_dpe' as tbl, count(*) FROM reference_dpe
-- UNION ALL SELECT 'coproperty_data', count(*) FROM coproperty_data
-- UNION ALL SELECT 'market_data', count(*) FROM market_data
-- UNION ALL SELECT 'global_settings', count(*) FROM global_settings
-- UNION ALL SELECT 'audits_flash', count(*) FROM audits_flash;
