-- ============================================================================
-- VALO-SYNDIC — Table Copropriété (RNIC)
-- ============================================================================
-- 🎯 AUDIT CONNECTIVITÉ - Phase 3:
-- Stockage des données du Registre National des Copropriétés (RNIC)
-- pour permettre l'enrichissement automatique des données copropriété.
--
-- SOURCE: data.gouv.fr - Registre National des Copropriétés
-- URL: https://www.data.gouv.fr/fr/datasets/registre-national-des-coproprietes/
--
-- MISE À JOUR: Import manuel du CSV ou via script Python
--
-- Date création: 2026-02-02
-- ============================================================================

-- ============================================================================
-- 1. TABLE: coproperty_data
-- Données des copropriétés (import RNIC)
-- ============================================================================

CREATE TABLE IF NOT EXISTS coproperty_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identifiants RNIC (si disponibles)
    rnic_id VARCHAR(50),
    
    -- Adresse
    address TEXT NOT NULL,
    postal_code VARCHAR(10) NOT NULL,
    city VARCHAR(255) NOT NULL,
    city_code VARCHAR(10) NOT NULL, -- Code INSEE
    
    -- Coordonnées géographiques (pour recherche proximité)
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Identification
    name VARCHAR(255), -- Nom de la résidence/copro
    reference_cadastrale VARCHAR(50),
    
    -- Données clés RNIC
    number_of_units INTEGER NOT NULL DEFAULT 0, -- Nombre total de lots
    commercial_lots INTEGER DEFAULT 0, -- Locaux commerciaux
    residential_lots INTEGER DEFAULT 0, -- Lots d'habitation
    parking_lots INTEGER DEFAULT 0, -- Stationnements
    
    -- Syndic
    syndic_name VARCHAR(255),
    syndic_siret VARCHAR(14),
    syndic_address TEXT,
    
    -- Caractéristiques du bâtiment
    construction_year INTEGER,
    total_surface DECIMAL(10, 2), -- Surface totale en m²
    number_of_floors INTEGER,
    has_elevator BOOLEAN DEFAULT false,
    has_parking BOOLEAN DEFAULT false,
    
    -- Données énergétiques (si disponibles dans RNIC)
    dpe_class VARCHAR(1), -- A-G
    energy_consumption DECIMAL(8, 2), -- kWh/m²/an
    
    -- Métadonnées
    is_verified BOOLEAN DEFAULT false, -- Données vérifiées manuellement
    confidence_score DECIMAL(3, 2), -- Score de confiance (0-1)
    
    -- Source
    data_source VARCHAR(50) DEFAULT 'rnic', -- rnic, user, estimated
    source_url TEXT,
    
    -- Timestamps
    imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Contrainte unique sur l'adresse normalisée + code postal
    UNIQUE(address, postal_code)
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_coproperty_address ON coproperty_data USING gin(to_tsvector('french', address));
CREATE INDEX IF NOT EXISTS idx_coproperty_postal_code ON coproperty_data(postal_code);
CREATE INDEX IF NOT EXISTS idx_coproperty_city_code ON coproperty_data(city_code);
CREATE INDEX IF NOT EXISTS idx_coproperty_rnic_id ON coproperty_data(rnic_id) WHERE rnic_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_coproperty_syndic ON coproperty_data(syndic_siret) WHERE syndic_siret IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_coproperty_location ON coproperty_data USING gist (
    point(longitude, latitude)
) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Commentaires
COMMENT ON TABLE coproperty_data IS 'Données des copropriétés importées du RNIC (AUDIT CONNECTIVITÉ Phase 3)';
COMMENT ON COLUMN coproperty_data.number_of_units IS 'Nombre total de lots (clé métier pour les calculs)';
COMMENT ON COLUMN coproperty_data.is_verified IS 'Indique si les données ont été vérifiées manuellement';

-- ============================================================================
-- 2. TRIGGER: updated_at
-- ============================================================================

DROP TRIGGER IF EXISTS update_coproperty_data_updated_at ON coproperty_data;
CREATE TRIGGER update_coproperty_data_updated_at
    BEFORE UPDATE ON coproperty_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE coproperty_data ENABLE ROW LEVEL SECURITY;

-- Lecture publique (tous peuvent rechercher des copropriétés)
CREATE POLICY "Allow public read access on coproperty_data"
    ON coproperty_data FOR SELECT
    USING (true);

-- Écriture réservée aux admins
CREATE POLICY "Allow admin write access on coproperty_data"
    ON coproperty_data FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- ============================================================================
-- 4. FONCTIONS UTILITAIRES
-- ============================================================================

-- Fonction de recherche par similarité d'adresse
CREATE OR REPLACE FUNCTION search_coproperty_by_address(
    search_address TEXT,
    search_postal_code VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    address TEXT,
    postal_code VARCHAR,
    city VARCHAR,
    number_of_units INTEGER,
    syndic_name VARCHAR,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cd.id,
        cd.address,
        cd.postal_code,
        cd.city,
        cd.number_of_units,
        cd.syndic_name,
        similarity(cd.address, search_address) as similarity
    FROM coproperty_data cd
    WHERE 
        (search_postal_code IS NULL OR cd.postal_code = search_postal_code)
        AND (
            cd.address ILIKE '%' || search_address || '%'
            OR similarity(cd.address, search_address) > 0.3
        )
    ORDER BY similarity DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Fonction de recherche par proximité géographique
CREATE OR REPLACE FUNCTION search_coproperty_nearby(
    lat DECIMAL,
    lon DECIMAL,
    radius_meters INTEGER DEFAULT 500
)
RETURNS TABLE (
    id UUID,
    address TEXT,
    postal_code VARCHAR,
    city VARCHAR,
    number_of_units INTEGER,
    distance_meters FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cd.id,
        cd.address,
        cd.postal_code,
        cd.city,
        cd.number_of_units,
        ST_Distance(
            ST_SetSRID(ST_MakePoint(cd.longitude, cd.latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography
        ) as distance_meters
    FROM coproperty_data cd
    WHERE 
        cd.latitude IS NOT NULL 
        AND cd.longitude IS NOT NULL
        AND ST_DWithin(
            ST_SetSRID(ST_MakePoint(cd.longitude, cd.latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography,
            radius_meters
        )
    ORDER BY distance_meters
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les stats d'un code postal
CREATE OR REPLACE FUNCTION get_coproperty_stats_by_postal_code(
    p_postal_code VARCHAR
)
RETURNS TABLE (
    total_coproperties BIGINT,
    total_units BIGINT,
    avg_units_per_copro DECIMAL,
    most_common_syndic VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_coproperties,
        COALESCE(SUM(number_of_units), 0)::BIGINT as total_units,
        COALESCE(AVG(number_of_units), 0)::DECIMAL(10,2) as avg_units_per_copro,
        (
            SELECT syndic_name 
            FROM coproperty_data 
            WHERE postal_code = p_postal_code 
                AND syndic_name IS NOT NULL
            GROUP BY syndic_name 
            ORDER BY COUNT(*) DESC 
            LIMIT 1
        ) as most_common_syndic
    FROM coproperty_data
    WHERE postal_code = p_postal_code;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. VUES
-- ============================================================================

-- Vue des copropriétés avec données complètes
CREATE OR REPLACE VIEW coproperties_complete AS
SELECT 
    id,
    address,
    postal_code,
    city,
    name,
    number_of_units,
    residential_lots,
    commercial_lots,
    parking_lots,
    syndic_name,
    construction_year,
    is_verified,
    confidence_score,
    CASE 
        WHEN is_verified THEN 'Vérifié'
        WHEN confidence_score > 0.8 THEN 'Fiable'
        WHEN confidence_score > 0.5 THEN 'Moyen'
        ELSE 'À vérifier'
    END as reliability_status
FROM coproperty_data
WHERE number_of_units > 0;

-- Vue des syndics présents dans la base
CREATE OR REPLACE VIEW syndics_list AS
SELECT 
    syndic_name,
    syndic_siret,
    COUNT(*) as coproperty_count,
    SUM(number_of_units) as total_managed_units,
    array_agg(DISTINCT city) as cities
FROM coproperty_data
WHERE syndic_name IS NOT NULL
GROUP BY syndic_name, syndic_siret
ORDER BY coproperty_count DESC;

-- ============================================================================
-- 6. DONNÉES DE TEST / EXEMPLES (À supprimer en production)
-- ============================================================================

-- Exemple de copropriété pour tests
INSERT INTO coproperty_data (
    address, 
    postal_code, 
    city, 
    city_code,
    name,
    number_of_units, 
    residential_lots,
    commercial_lots,
    syndic_name,
    construction_year,
    is_verified,
    confidence_score
) VALUES 
(
    '25 Rue des Lices',
    '49100',
    'Angers',
    '49007',
    'Résidence Les Lices',
    45,
    42,
    3,
    'Citya Immobilier',
    1985,
    true,
    0.95
),
(
    '12 Avenue du Général de Gaulle',
    '49100',
    'Angers',
    '49007',
    'Le Parc Royal',
    120,
    115,
    5,
    'Nexity',
    1972,
    true,
    0.90
)
ON CONFLICT (address, postal_code) DO UPDATE SET
    number_of_units = EXCLUDED.number_of_units,
    syndic_name = EXCLUDED.syndic_name,
    updated_at = NOW();

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================

-- Pour vérifier l'installation:
-- SELECT * FROM coproperty_data;
-- SELECT * FROM coproperties_complete;
-- SELECT * FROM syndics_list;
-- SELECT * FROM search_coproperty_by_address('Lices', '49100');
