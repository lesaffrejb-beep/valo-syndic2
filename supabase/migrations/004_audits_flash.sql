-- ============================================================================
-- VALO-SYNDIC — Table Audits Flash
-- ============================================================================
-- MODULE: Audit Flash Autonome
-- OBJECTIF: Transformer une adresse brute en analyse financiere irrefutable.
--
-- DOCTRINE:
-- 1. Tolerance Zero au Bullshit: Distinction stricte entre donnee sourcee
--    (prouvee par API) et donnee declarative (saisie humaine).
-- 2. Loi du Plan B: Si l'API est muette, le systeme ne plante pas.
--    Il passe en DRAFT et exige une validation humaine.
-- 3. Statut rigide: DRAFT -> READY -> COMPLETED (pas de retour en arriere).
--
-- Date creation: 2026-02-09
-- ============================================================================

-- ============================================================================
-- 1. TYPE ENUM: Statut du pipeline Audit Flash
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE audit_flash_status AS ENUM ('DRAFT', 'READY', 'COMPLETED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE data_origin AS ENUM ('api', 'manual', 'estimated', 'fallback');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 2. TABLE: audits_flash
-- Le Bunker de Donnees
-- ============================================================================

CREATE TABLE IF NOT EXISTS audits_flash (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- =====================================================================
    -- IDENTITE (Input brut)
    -- =====================================================================
    raw_address TEXT NOT NULL,              -- L'adresse brute saisie par l'utilisateur
    normalized_address TEXT,                -- Adresse normalisee par BAN
    postal_code VARCHAR(10),
    city VARCHAR(255),
    city_code VARCHAR(10),                  -- Code INSEE
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- =====================================================================
    -- STATUT DU PIPELINE (Machine a etats rigide)
    -- =====================================================================
    status audit_flash_status NOT NULL DEFAULT 'DRAFT',
    missing_fields TEXT[] DEFAULT '{}',     -- Liste des champs manquants pour passer a READY

    -- =====================================================================
    -- LES 4 GOLDEN DATAS
    -- Chaque donnee est accompagnee de sa source (sourcee vs declarative)
    -- =====================================================================

    -- GOLDEN DATA 1: Surface Habitable (m2)
    surface_habitable DECIMAL(10, 2),
    surface_origin data_origin,
    surface_source TEXT,                    -- Ex: "API Cadastre IGN" ou "Saisie manuelle JB"
    surface_confidence DECIMAL(3, 2),       -- 0.00 a 1.00

    -- GOLDEN DATA 2: Annee de Construction
    construction_year INTEGER,
    construction_year_origin data_origin,
    construction_year_source TEXT,
    construction_year_confidence DECIMAL(3, 2),

    -- GOLDEN DATA 3: Classe DPE Actuelle (A-G)
    dpe_current VARCHAR(1) CHECK (dpe_current IN ('A','B','C','D','E','F','G')),
    dpe_origin data_origin,
    dpe_source TEXT,
    dpe_numero VARCHAR(50),                 -- N ADEME du DPE pour tracabilite
    dpe_date_etablissement DATE,
    dpe_consommation DECIMAL(8, 2),         -- kWh/m2/an
    dpe_ges VARCHAR(1),                     -- Classe GES

    -- GOLDEN DATA 4: Prix m2 quartier
    price_per_sqm DECIMAL(10, 2),
    price_origin data_origin,
    price_source TEXT,
    price_transaction_count INTEGER,        -- Nombre de ventes analysees (credibilite)
    price_date_range JSONB,                 -- {"from": "2022-01", "to": "2024-12"}

    -- =====================================================================
    -- DONNEES COMPLEMENTAIRES (enrichissement)
    -- =====================================================================
    number_of_units INTEGER,                -- Nb lots (si copro identifiee via RNIC)
    heating_system VARCHAR(50),             -- Type chauffage
    cadastre_parcel_id VARCHAR(50),         -- Reference cadastrale
    cadastre_surface_terrain DECIMAL(10, 2),-- Surface terrain (cadastre != surface hab)

    -- =====================================================================
    -- RESULTATS DU MOTEUR VALOSYNDIC (calcules quand status = READY)
    -- =====================================================================
    computation_result JSONB,               -- Le resultat complet du calcul
    -- Structure attendue:
    -- {
    --   "simulation": {
    --     "works_cost_ht": number,
    --     "works_cost_ttc": number,
    --     "mpr_amount": number,
    --     "cee_amount": number,
    --     "remaining_cost": number,
    --     "eco_ptz_amount": number,
    --     "monthly_payment": number
    --   },
    --   "valuation": {
    --     "current_value": number,
    --     "projected_value": number,
    --     "green_value_gain": number,
    --     "green_value_percent": number,
    --     "net_roi": number
    --   },
    --   "inaction_cost": {
    --     "projected_cost_3y": number,
    --     "inflation_cost": number,
    --     "value_depreciation": number,
    --     "total": number
    --   },
    --   "compliance": {
    --     "is_prohibited": boolean,
    --     "prohibition_date": string | null,
    --     "urgency_level": string
    --   }
    -- }

    -- =====================================================================
    -- TRACABILITE DES SOURCES API (audit trail)
    -- =====================================================================
    api_responses JSONB DEFAULT '{}',       -- Reponses brutes des APIs (debug)
    -- Structure:
    -- {
    --   "ban": { "status": "success"|"error", "fetched_at": "ISO", "data": {...} },
    --   "cadastre": { "status": "success"|"error", "fetched_at": "ISO", "data": {...} },
    --   "dvf": { "status": "success"|"error", "fetched_at": "ISO", "data": {...} },
    --   "ademe": { "status": "success"|"error", "fetched_at": "ISO", "data": {...} },
    --   "rnic": { "status": "success"|"error", "fetched_at": "ISO", "data": {...} }
    -- }

    enrichment_sources JSONB DEFAULT '[]',  -- Liste des sources utilisees
    -- Structure: EnrichmentSource[] du types.ts existant

    -- =====================================================================
    -- METADATA
    -- =====================================================================
    user_id UUID,                           -- Qui a lance l'audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,  -- Quand le calcul a ete finalise
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- ============================================================================
-- 3. INDEX
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_audits_flash_status ON audits_flash(status);
CREATE INDEX IF NOT EXISTS idx_audits_flash_user ON audits_flash(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audits_flash_postal_code ON audits_flash(postal_code);
CREATE INDEX IF NOT EXISTS idx_audits_flash_created ON audits_flash(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audits_flash_address ON audits_flash USING gin(to_tsvector('french', raw_address));

-- ============================================================================
-- 4. TRIGGER: updated_at auto
-- ============================================================================

-- Reutilise la fonction update_updated_at_column() existante (migration 001)
DROP TRIGGER IF EXISTS update_audits_flash_updated_at ON audits_flash;
CREATE TRIGGER update_audits_flash_updated_at
    BEFORE UPDATE ON audits_flash
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE audits_flash ENABLE ROW LEVEL SECURITY;

-- Lecture: chaque utilisateur ne voit que ses audits
CREATE POLICY "Users read own audits_flash"
    ON audits_flash FOR SELECT
    USING (
        auth.uid() = user_id
        OR auth.jwt() ->> 'role' = 'admin'
    );

-- Insertion: utilisateur authentifie uniquement
CREATE POLICY "Authenticated users can create audits_flash"
    ON audits_flash FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Mise a jour: proprietaire ou admin
CREATE POLICY "Users update own audits_flash"
    ON audits_flash FOR UPDATE
    USING (
        auth.uid() = user_id
        OR auth.jwt() ->> 'role' = 'admin'
    );

-- Suppression: admin uniquement
CREATE POLICY "Admin delete audits_flash"
    ON audits_flash FOR DELETE
    USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================================================
-- 6. FONCTION: Transition de statut (machine a etats)
-- ============================================================================

CREATE OR REPLACE FUNCTION transition_audit_flash_status(
    p_audit_id UUID,
    p_new_status audit_flash_status
)
RETURNS audits_flash AS $$
DECLARE
    v_audit audits_flash;
    v_current_status audit_flash_status;
BEGIN
    SELECT * INTO v_audit FROM audits_flash WHERE id = p_audit_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Audit flash % introuvable', p_audit_id;
    END IF;

    v_current_status := v_audit.status;

    -- Transitions autorisees: DRAFT -> READY, READY -> COMPLETED, DRAFT -> COMPLETED
    IF v_current_status = 'DRAFT' AND p_new_status IN ('READY', 'COMPLETED') THEN
        -- OK
    ELSIF v_current_status = 'READY' AND p_new_status = 'COMPLETED' THEN
        -- OK
    ELSE
        RAISE EXCEPTION 'Transition interdite: % -> %', v_current_status, p_new_status;
    END IF;

    -- Validation: READY requiert les 4 Golden Datas
    IF p_new_status IN ('READY', 'COMPLETED') THEN
        IF v_audit.surface_habitable IS NULL OR v_audit.surface_habitable <= 0 THEN
            RAISE EXCEPTION 'Surface habitable manquante ou invalide';
        END IF;
        IF v_audit.construction_year IS NULL THEN
            RAISE EXCEPTION 'Annee de construction manquante';
        END IF;
        IF v_audit.dpe_current IS NULL THEN
            RAISE EXCEPTION 'Classe DPE manquante';
        END IF;
        IF v_audit.price_per_sqm IS NULL OR v_audit.price_per_sqm <= 0 THEN
            RAISE EXCEPTION 'Prix au m2 manquant ou invalide';
        END IF;
    END IF;

    -- Validation: COMPLETED requiert un resultat de calcul
    IF p_new_status = 'COMPLETED' AND v_audit.computation_result IS NULL THEN
        RAISE EXCEPTION 'Resultat de calcul manquant pour passer en COMPLETED';
    END IF;

    -- Appliquer la transition
    UPDATE audits_flash SET
        status = p_new_status,
        completed_at = CASE WHEN p_new_status = 'COMPLETED' THEN NOW() ELSE completed_at END,
        updated_at = NOW()
    WHERE id = p_audit_id
    RETURNING * INTO v_audit;

    RETURN v_audit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. VUE: Resume des audits
-- ============================================================================

CREATE OR REPLACE VIEW audits_flash_summary AS
SELECT
    id,
    raw_address,
    normalized_address,
    postal_code,
    city,
    status,
    missing_fields,
    dpe_current,
    surface_habitable,
    construction_year,
    price_per_sqm,
    -- Resume des origines
    surface_origin,
    construction_year_origin,
    dpe_origin,
    price_origin,
    -- Resultat cle
    computation_result -> 'simulation' ->> 'remaining_cost' AS remaining_cost,
    computation_result -> 'valuation' ->> 'green_value_gain' AS green_value_gain,
    computation_result -> 'valuation' ->> 'net_roi' AS net_roi,
    -- Dates
    created_at,
    completed_at
FROM audits_flash
ORDER BY created_at DESC;

-- ============================================================================
-- 8. COMMENTAIRES
-- ============================================================================

COMMENT ON TABLE audits_flash IS 'Audits Flash: analyse financiere automatisee a partir d une adresse. Doctrine: zero bullshit, Plan B obligatoire.';
COMMENT ON COLUMN audits_flash.status IS 'Machine a etats: DRAFT (donnees manquantes) -> READY (calculable) -> COMPLETED (audit genere)';
COMMENT ON COLUMN audits_flash.surface_origin IS 'Origine: api (prouvee), manual (declarative), estimated (calculee), fallback (approximation)';
COMMENT ON COLUMN audits_flash.missing_fields IS 'Liste des champs Golden Data manquants pour passer en READY';
COMMENT ON COLUMN audits_flash.computation_result IS 'Resultat complet du moteur ValoSyndic (JSONB structure)';
COMMENT ON COLUMN audits_flash.api_responses IS 'Reponses brutes des APIs pour audit trail et debug';

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================

-- Verification:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'audits_flash';
-- SELECT * FROM audits_flash_summary;
