-- ============================================================================
-- VALO-SYNDIC — Table Global Settings
-- ============================================================================
-- 🎯 AUDIT CONNECTIVITÉ - Phase 2:
-- Externalisation des constantes métier pour mise à jour sans redéploiement
-- 
-- Objectif: Permettre la modification des taux et paramètres clés
-- directement dans Supabase, sans toucher au code source.
--
-- Date création: 2026-02-02
-- ============================================================================

-- ============================================================================
-- 1. TABLE: global_settings
-- Stocke les paramètres métier dynamiques
-- ============================================================================

CREATE TABLE IF NOT EXISTS global_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Clé unique du paramètre (ex: bt01_inflation_rate)
    key VARCHAR(100) NOT NULL UNIQUE,
    
    -- Valeur stockée en JSON (flexible: number, string, boolean, object)
    value JSONB NOT NULL,
    
    -- Type de données pour validation côté client
    data_type VARCHAR(20) NOT NULL DEFAULT 'string' 
        CHECK (data_type IN ('string', 'number', 'boolean', 'json', 'date')),
    
    -- Catégorie pour organisation
    category VARCHAR(50) NOT NULL DEFAULT 'general'
        CHECK (category IN (
            'inflation',      -- Indices BT01, etc.
            'pricing',        -- Prix de référence
            'regulation',     -- Paramètres réglementaires
            'aids',           -- Aides et subventions
            'technical',      -- Paramètres techniques
            'market',         -- Données marché
            'general'         -- Divers
        )),
    
    -- Description pour les administrateurs
    description TEXT,
    
    -- Source de la donnée (pour traçabilité)
    source VARCHAR(255),
    source_url TEXT,
    
    -- Date de référence de la valeur
    reference_date DATE,
    
    -- Métadonnées
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by VARCHAR(100) DEFAULT 'system'
);

-- Index
CREATE INDEX IF NOT EXISTS idx_global_settings_key ON global_settings(key);
CREATE INDEX IF NOT EXISTS idx_global_settings_category ON global_settings(category);
CREATE INDEX IF NOT EXISTS idx_global_settings_active ON global_settings(is_active);

-- Commentaires
COMMENT ON TABLE global_settings IS 'Paramètres métier dynamiques (AUDIT CONNECTIVITÉ Phase 2)';
COMMENT ON COLUMN global_settings.key IS 'Clé unique snake_case (ex: bt01_inflation_rate)';
COMMENT ON COLUMN global_settings.value IS 'Valeur au format JSON';
COMMENT ON COLUMN global_settings.data_type IS 'Type pour validation côté client';

-- ============================================================================
-- 2. TRIGGER: updated_at
-- ============================================================================

DROP TRIGGER IF EXISTS update_global_settings_updated_at ON global_settings;
CREATE TRIGGER update_global_settings_updated_at
    BEFORE UPDATE ON global_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;

-- Lecture publique (tous les clients peuvent lire les paramètres)
CREATE POLICY "Allow public read access on global_settings"
    ON global_settings FOR SELECT
    USING (is_active = true);

-- Écriture réservée aux admins (via service_role ou JWT role=admin)
CREATE POLICY "Allow admin write access on global_settings"
    ON global_settings FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- ============================================================================
-- 4. DONNÉES INITIALES
-- ============================================================================

-- Paramètres d'inflation (BT01)
INSERT INTO global_settings (key, value, data_type, category, description, source, source_url, reference_date) VALUES
('bt01_inflation_rate', '{"value": 0.02, "display": "2.0%", "raw_value": 133.3, "raw_previous": 131.5}', 'json', 'inflation', 'Taux d\'inflation annuelle travaux BTP (BT01)', 'INSEE', 'https://www.insee.fr/fr/statistiques/serie/001710986', '2025-11-01'),
('bt01_monthly_change', '{"value": 0.0114, "display": "+1.14%"}', 'json', 'inflation', 'Variation mensuelle BT01', 'INSEE', 'https://www.insee.fr/fr/statistiques/serie/001710986', '2025-11-01')
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    source = EXCLUDED.source,
    reference_date = EXCLUDED.reference_date,
    updated_at = NOW();

-- Paramètres de prix de référence
INSERT INTO global_settings (key, value, data_type, category, description) VALUES
('base_price_per_sqm', '{"value": 3500, "currency": "EUR", "region": "Angers/Nantes"}', 'json', 'pricing', 'Prix de base au m² pour estimations'),
('estimated_reno_cost_per_sqm', '{"value": 1350, "currency": "EUR", "description": "Rénovation globale"}', 'json', 'pricing', 'Coût moyen travaux rénovation énergétique')
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = NOW();

-- Paramètres réglementaires
INSERT INTO global_settings (key, value, data_type, category, description) VALUES
('mpr_copro_active', 'false', 'boolean', 'regulation', 'MaPrimeRénov Copropriété active'),
('eco_ptz_rate', '{"value": 0, "description": "Taux d\'intérêt Eco-PTZ"}', 'json', 'regulation', 'Taux Eco-PTZ copropriété'),
('tva_renovation_rate', '{"value": 0.055, "display": "5.5%"}', 'json', 'regulation', 'TVA rénovation énergétique')
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = NOW();

-- Paramètres techniques
INSERT INTO global_settings (key, value, data_type, category, description) VALUES
('electricity_conversion_coeff', '{"value": 1.9, "description": "Coefficient conversion énergie primaire"}', 'json', 'technical', 'Coefficient électricité DPE 2026'),
('green_value_appreciation', '{"value": 0.12, "display": "+12%", "description": "Appréciation passage F→C"}', 'json', 'technical', 'Plus-value verte moyenne'),
('green_value_drift', '{"value": 0.015, "display": "+1.5%/an", "description": "Écart annuel"}', 'json', 'technical', 'Double peine - écart valeur verte'),
('construction_inflation_rate', '{"value": 0.02, "display": "2.0%"}', 'json', 'inflation', 'Inflation annuelle travaux BTP')
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = NOW();

-- Aides
INSERT INTO global_settings (key, value, data_type, category, description) VALUES
('mpr_min_energy_gain', '{"value": 0.35, "display": "35%"}', 'json', 'aids', 'Gain énergétique minimum MPR'),
('mpr_standard_rate', '{"value": 0.30, "display": "30%"}', 'json', 'aids', 'Taux standard MPR (gain 35-50%)'),
('mpr_performance_rate', '{"value": 0.45, "display": "45%"}', 'json', 'aids', 'Taux performance MPR (gain >50%)'),
('mpr_exit_passoire_bonus', '{"value": 0.10, "display": "+10%"}', 'json', 'aids', 'Bonus sortie passoire MPR'),
('mpr_ceiling_per_unit', '{"value": 25000, "currency": "EUR"}', 'json', 'aids', 'Plafond assiette subventionnable par logement'),
('amo_cost_per_lot', '{"value": 600, "currency": "EUR", "description": "Forfait moyen"}', 'json', 'aids', 'Coût AMO par lot'),
('amo_aid_rate', '{"value": 0.50, "display": "50%"}', 'json', 'aids', 'Taux de prise en charge AMO')
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = NOW();

-- Frais projet
INSERT INTO global_settings (key, value, data_type, category, description) VALUES
('project_syndic_rate', '{"value": 0.03, "display": "3%"}', 'json', 'technical', 'Honoraires syndic gestion travaux'),
('project_do_rate', '{"value": 0.02, "display": "2%"}', 'json', 'technical', 'Assurance DO'),
('project_contingency_rate', '{"value": 0.05, "display": "5%"}', 'json', 'technical', 'Aléas et imprévus chantier')
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = NOW();

-- Dates clés réglementaires
INSERT INTO global_settings (key, value, data_type, category, description) VALUES
('dpe_prohibition_g', '{"value": "2025-01-01", "status": "active"}', 'json', 'regulation', 'Interdiction location DPE G'),
('dpe_prohibition_f', '{"value": "2028-01-01", "status": "upcoming"}', 'json', 'regulation', 'Interdiction location DPE F'),
('dpe_prohibition_e', '{"value": "2034-01-01", "status": "future"}', 'json', 'regulation', 'Interdiction location DPE E')
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = NOW();

-- ============================================================================
-- 5. FONCTIONS UTILITAIRES
-- ============================================================================

-- Fonction pour récupérer une valeur simple
CREATE OR REPLACE FUNCTION get_setting(p_key VARCHAR)
RETURNS JSONB AS $$
BEGIN
    RETURN (SELECT value FROM global_settings WHERE key = p_key AND is_active = true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour récupérer toutes les valeurs d'une catégorie
CREATE OR REPLACE FUNCTION get_settings_by_category(p_category VARCHAR)
RETURNS TABLE (key VARCHAR, value JSONB, description TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT gs.key, gs.value, gs.description
    FROM global_settings gs
    WHERE gs.category = p_category AND gs.is_active = true
    ORDER BY gs.key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour mettre à jour une valeur (avec audit log)
CREATE OR REPLACE FUNCTION update_setting(
    p_key VARCHAR,
    p_value JSONB,
    p_updated_by VARCHAR DEFAULT 'system'
)
RETURNS BOOLEAN AS $$
DECLARE
    old_value JSONB;
BEGIN
    -- Récupérer l'ancienne valeur
    SELECT value INTO old_value FROM global_settings WHERE key = p_key;
    
    -- Mettre à jour
    UPDATE global_settings
    SET 
        value = p_value,
        updated_by = p_updated_by,
        updated_at = NOW()
    WHERE key = p_key;
    
    -- Logger dans audit_log si la table existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_log') THEN
        INSERT INTO audit_log (table_name, record_id, action, old_value, new_value, changed_by)
        VALUES (
            'global_settings',
            (SELECT id FROM global_settings WHERE key = p_key),
            'UPDATE',
            jsonb_build_object('value', old_value),
            jsonb_build_object('value', p_value),
            p_updated_by
        );
    END IF;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. VUE: Paramètres actifs formatés
-- ============================================================================

CREATE OR REPLACE VIEW active_settings AS
SELECT 
    key,
    value,
    data_type,
    category,
    description,
    source,
    reference_date,
    updated_at,
    updated_by,
    -- Extraction de la valeur numérique si applicable
    CASE 
        WHEN data_type = 'number' THEN (value ->> 'value')::numeric
        WHEN jsonb_typeof(value) = 'number' THEN value::text::numeric
        ELSE NULL
    END as numeric_value
FROM global_settings
WHERE is_active = true
ORDER BY category, key;

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================

-- Pour vérifier l'installation:
-- SELECT * FROM global_settings;
-- SELECT * FROM active_settings WHERE category = 'inflation';
-- SELECT get_setting('bt01_inflation_rate');
