-- ============================================================================
-- VALO-SYNDIC — TABLE RÉFÉRENTIEL DPE
-- Version: 1.0.0
-- Date: 2026-01-30
-- ============================================================================
-- Cette table stocke les DPE de référence issus de l'ADEME pour le département 49
-- Utilisé pour le benchmarking et les statistiques de marché
-- ============================================================================

CREATE TABLE IF NOT EXISTS reference_dpe (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Données principales du DPE
    numero_dpe TEXT UNIQUE NOT NULL,  -- N°_DPE de l'ADEME (identifiant unique)
    code_postal TEXT NOT NULL,
    ville TEXT,
    annee_construction INTEGER,
    
    -- Étiquettes énergétiques
    etiquette_dpe TEXT CHECK (etiquette_dpe IN ('A', 'B', 'C', 'D', 'E', 'F', 'G') OR etiquette_dpe IS NULL),
    etiquette_ges TEXT CHECK (etiquette_ges IN ('A', 'B', 'C', 'D', 'E', 'F', 'G') OR etiquette_ges IS NULL),
    
    -- Données de consommation
    conso_kwh_m2_an NUMERIC(10, 2),  -- Consommation 5 usages énergie finale (kWh/m²/an)
    surface_habitable NUMERIC(10, 2),  -- Surface habitable en m²
    
    -- Métadonnées
    date_etablissement DATE  -- Date d'établissement du DPE
);

-- ============================================================================
-- INDEXES pour performance
-- ============================================================================

-- Index pour recherche par code postal (cas d'usage principal)
CREATE INDEX IF NOT EXISTS idx_reference_dpe_code_postal ON reference_dpe(code_postal);

-- Index pour recherche par ville
CREATE INDEX IF NOT EXISTS idx_reference_dpe_ville ON reference_dpe(ville);

-- Index pour filtrage par étiquette DPE
CREATE INDEX IF NOT EXISTS idx_reference_dpe_etiquette_dpe ON reference_dpe(etiquette_dpe);

-- Index pour filtrage par année de construction
CREATE INDEX IF NOT EXISTS idx_reference_dpe_annee_construction ON reference_dpe(annee_construction);

-- Index composite pour recherches courantes (benchmarking)
CREATE INDEX IF NOT EXISTS idx_reference_dpe_benchmark ON reference_dpe(code_postal, etiquette_dpe, annee_construction);

-- ============================================================================
-- TRIGGER pour updated_at
-- ============================================================================

-- Custom trigger function that only updates on UPDATE operations
CREATE OR REPLACE FUNCTION update_reference_dpe_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update updated_at on UPDATE operations, not INSERT
    IF TG_OP = 'UPDATE' THEN
        NEW.updated_at = now();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reference_dpe_updated_at
    BEFORE UPDATE ON reference_dpe
    FOR EACH ROW
    EXECUTE FUNCTION update_reference_dpe_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Activer RLS
ALTER TABLE reference_dpe ENABLE ROW LEVEL SECURITY;

-- Politique : Lecture publique (données de référence)
CREATE POLICY "reference_dpe : lecture publique"
    ON reference_dpe FOR SELECT
    USING (true);

-- Politique : Modification admin uniquement
CREATE POLICY "reference_dpe : modification admin"
    ON reference_dpe FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

COMMENT ON TABLE reference_dpe IS 'Référentiel DPE ADEME pour benchmarking et statistiques de marché (Dept. 49)';
COMMENT ON COLUMN reference_dpe.numero_dpe IS 'Identifiant unique du DPE ADEME';
COMMENT ON COLUMN reference_dpe.conso_kwh_m2_an IS 'Consommation 5 usages énergie finale (kWh/m²/an)';
COMMENT ON COLUMN reference_dpe.etiquette_dpe IS 'Classe énergétique (A=excellent, G=mauvais)';
COMMENT ON COLUMN reference_dpe.etiquette_ges IS 'Classe d\'émissions de GES (A=excellent, G=mauvais)';
