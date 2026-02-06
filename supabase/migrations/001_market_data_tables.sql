-- ============================================================================
-- VALO-SYNDIC — Tables Supabase pour Données Marché
-- ============================================================================
-- Ce fichier contient les migrations SQL pour créer les tables nécessaires
-- à l'intégration Supabase pour les données marché dynamiques.
--
-- INSTRUCTIONS:
-- 1. Créer un projet Supabase (https://supabase.com)
-- 2. Aller dans SQL Editor
-- 3. Coller et exécuter ce script
-- 4. Configurer les variables d'environnement dans .env.local:
--    NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
--    NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
--
-- Date création: 31/01/2026
-- ============================================================================

-- ============================================================================
-- 1. TABLE: market_data
-- Stocke les données marché actualisées (BT01, tendances, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS market_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    source VARCHAR(255),
    source_url TEXT,
    reference_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by VARCHAR(100) DEFAULT 'system'
);

-- Index pour recherche rapide par clé
CREATE INDEX IF NOT EXISTS idx_market_data_key ON market_data(key);

-- Commentaires
COMMENT ON TABLE market_data IS 'Données marché actualisées pour le simulateur Valo-Syndic';
COMMENT ON COLUMN market_data.key IS 'Clé unique (ex: bt01, market_trend_national, passoires_share)';
COMMENT ON COLUMN market_data.value IS 'Valeur JSON (ex: {"rate": 0.0137, "month": "2025-11"})';

-- ============================================================================
-- 2. TABLE: regulation_status
-- Statut réglementaire (MPR active/suspendue, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS regulation_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    regulation_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    status_reason TEXT,
    effective_date DATE,
    legal_reference VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_regulation_name ON regulation_status(regulation_name);

-- Commentaires
COMMENT ON TABLE regulation_status IS 'Statut des réglementations (MPR Copro, CEE, etc.)';

-- ============================================================================
-- 3. TABLE: local_aids
-- Aides locales par collectivité
-- ============================================================================

CREATE TABLE IF NOT EXISTS local_aids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collectivity_name VARCHAR(255) NOT NULL,
    collectivity_type VARCHAR(50), -- 'metropole', 'region', 'departement', 'commune'
    code_insee VARCHAR(10),
    program_name VARCHAR(255),
    max_amount_per_lot INTEGER,
    max_amount_per_copro INTEGER,
    conditions TEXT,
    contact_info TEXT,
    website_url TEXT,
    is_active BOOLEAN DEFAULT true,
    valid_from DATE,
    valid_until DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_local_aids_collectivity ON local_aids(collectivity_name);
CREATE INDEX IF NOT EXISTS idx_local_aids_code_insee ON local_aids(code_insee);

-- Commentaires
COMMENT ON TABLE local_aids IS 'Aides locales par collectivité territoriale';

-- ============================================================================
-- 4. TABLE: price_references
-- Prix de référence par ville (fallback si pas de DVF)
-- ============================================================================

CREATE TABLE IF NOT EXISTS price_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_name VARCHAR(255) NOT NULL,
    code_insee VARCHAR(10),
    department_code VARCHAR(3),
    price_per_sqm_apt INTEGER NOT NULL,
    price_per_sqm_house INTEGER,
    data_source VARCHAR(100),
    reference_date DATE,
    confidence_level VARCHAR(20) DEFAULT 'medium', -- 'high', 'medium', 'low'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE UNIQUE INDEX IF NOT EXISTS idx_price_refs_city ON price_references(city_name);
CREATE INDEX IF NOT EXISTS idx_price_refs_insee ON price_references(code_insee);

-- Commentaires
COMMENT ON TABLE price_references IS 'Prix de référence au m² par ville (fallback si API DVF indisponible)';

-- ============================================================================
-- 5. TABLE: audit_log
-- Log des modifications pour traçabilité
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_value JSONB,
    new_value JSONB,
    changed_by VARCHAR(100),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address VARCHAR(45),
    user_agent TEXT
);

-- Index
CREATE INDEX IF NOT EXISTS idx_audit_log_table ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_date ON audit_log(changed_at);

-- ============================================================================
-- 6. DONNÉES INITIALES
-- ============================================================================

-- Données BT01
INSERT INTO market_data (key, value, source, source_url, reference_date) VALUES
('bt01', '{"currentValue": 133.3, "previousYearValue": 131.5, "annualChangePercent": 1.37}', 'INSEE', 'https://www.insee.fr/fr/statistiques/serie/001710986', '2025-11-01'),
('market_trend_national', '{"threeMonths": -0.004, "oneYear": -0.008, "interpretation": "Marché stable à légèrement baissier"}', 'Notaires de France', 'https://www.notaires.fr/fr/immobilier-fiscalite/prix-et-tendances-de-limmobilier', '2025-12-08'),
('market_trend_idf', '{"threeMonths": -0.008, "oneYear": -0.013, "interpretation": "Marché en baisse modérée"}', 'Notaires de France', NULL, '2025-12-08'),
('passoires_share', '{"share2024": 0.15, "share2023": 0.17, "trend": "stable"}', 'Notaires de France', NULL, '2025-12-08')
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    source = EXCLUDED.source,
    reference_date = EXCLUDED.reference_date,
    updated_at = NOW();

-- Statut réglementaire MPR Copro
INSERT INTO regulation_status (regulation_name, is_active, status_reason, effective_date, legal_reference) VALUES
('mpr_copro', false, 'Attente Loi de Finances 2026', '2026-01-01', 'Loi n°2025-1316 du 26 décembre 2025')
ON CONFLICT DO NOTHING;

-- Aides locales (exemples)
INSERT INTO local_aids (collectivity_name, collectivity_type, program_name, max_amount_per_copro, conditions, is_active) VALUES
('Angers Loire Métropole', 'metropole', 'Mieux Chez Moi', 5000, 'Copro dans périmètre OPAH', true),
('Nantes Métropole', 'metropole', 'Rénov''Habitat', NULL, 'Gain énergétique ≥ 40%', true)
ON CONFLICT DO NOTHING;

-- Prix de référence par ville
INSERT INTO price_references (city_name, department_code, price_per_sqm_apt, price_per_sqm_house, data_source, confidence_level) VALUES
('Angers', '49', 2800, 2500, 'Estimation Valo-Syndic', 'medium'),
('Nantes', '44', 3200, 3000, 'Estimation Valo-Syndic', 'medium'),
('Rennes', '35', 3500, 3200, 'Estimation Valo-Syndic', 'medium'),
('Tours', '37', 2600, 2400, 'Estimation Valo-Syndic', 'medium'),
('Le Mans', '72', 1800, 1600, 'Estimation Valo-Syndic', 'medium')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 7. FONCTIONS ET TRIGGERS
-- ============================================================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_market_data_updated_at ON market_data;
CREATE TRIGGER update_market_data_updated_at
    BEFORE UPDATE ON market_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_regulation_status_updated_at ON regulation_status;
CREATE TRIGGER update_regulation_status_updated_at
    BEFORE UPDATE ON regulation_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_local_aids_updated_at ON local_aids;
CREATE TRIGGER update_local_aids_updated_at
    BEFORE UPDATE ON local_aids
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_price_references_updated_at ON price_references;
CREATE TRIGGER update_price_references_updated_at
    BEFORE UPDATE ON price_references
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Activer RLS sur toutes les tables
ALTER TABLE market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulation_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE local_aids ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_references ENABLE ROW LEVEL SECURITY;

-- Politique de lecture publique (tous peuvent lire)
CREATE POLICY "Allow public read access on market_data"
    ON market_data FOR SELECT
    USING (true);

CREATE POLICY "Allow public read access on regulation_status"
    ON regulation_status FOR SELECT
    USING (true);

CREATE POLICY "Allow public read access on local_aids"
    ON local_aids FOR SELECT
    USING (true);

CREATE POLICY "Allow public read access on price_references"
    ON price_references FOR SELECT
    USING (true);

-- Note: L'écriture nécessite une authentification via le dashboard Supabase
-- ou une clé de service (service_role key)

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================

-- Pour vérifier l'installation:
-- SELECT * FROM market_data;
-- SELECT * FROM regulation_status;
-- SELECT * FROM local_aids;
-- SELECT * FROM price_references;
