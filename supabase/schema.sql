-- WARNING: RLS Policies are currently permissive for development. Lock down before production.
-- ============================================================================
-- VALO-SYNDIC — Schema Supabase
-- Version: 1.0.0
-- Date: 2026-01-27
-- ============================================================================

-- 1. TABLE SIMULATIONS
-- Stocke les simulations de diagnostic flash
-- ============================================================================

CREATE TABLE IF NOT EXISTS simulations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Métadonnées
    project_name TEXT,
    city TEXT,
    postal_code TEXT,
    
    -- Données de simulation (JSON complet)
    json_data JSONB NOT NULL,
    
    -- Utilisateur (optionnel pour mode public)
    user_email TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Statut
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'shared', 'archived'))
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_simulations_user_id ON simulations(user_id);
CREATE INDEX IF NOT EXISTS idx_simulations_city ON simulations(city);
CREATE INDEX IF NOT EXISTS idx_simulations_created_at ON simulations(created_at DESC);

-- Trigger mise à jour timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_simulations_updated_at
    BEFORE UPDATE ON simulations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 2. TABLE LEADS
-- Capture des contacts pour follow-up commercial
-- ============================================================================

CREATE TABLE IF NOT EXISTS leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    
    -- Contact
    email TEXT NOT NULL,
    phone TEXT,
    name TEXT,
    company TEXT,
    
    -- Qualification
    role TEXT CHECK (role IN ('syndic', 'conseil', 'proprietaire', 'autre')),
    source TEXT CHECK (source IN ('pdf_download', 'qr_vote', 'contact_form', 'demo_request')),
    
    -- Données contextuelles
    simulation_id UUID REFERENCES simulations(id) ON DELETE SET NULL,
    metadata JSONB,
    
    -- Statut CRM
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
    notes TEXT
);

-- Index pour recherche
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);

-- ============================================================================
-- 3. TABLE VOTES (pour QR Code en AG)
-- ============================================================================

CREATE TABLE IF NOT EXISTS votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    
    -- Référence simulation
    simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE NOT NULL,
    
    -- Vote anonyme
    vote TEXT CHECK (vote IN ('pour', 'contre', 'abstention')) NOT NULL,
    
    -- Métadonnées (optionnel)
    user_agent TEXT,
    ip_hash TEXT -- Hash pour éviter doublons, pas l'IP réelle
);

-- Index unique pour anti-spam (1 vote par IP/simulation)
CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_unique_ip ON votes(simulation_id, ip_hash);

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Activer RLS
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Politique SIMULATIONS : lecture publique, écriture authentifiée
CREATE POLICY "Simulations : lecture publique"
    ON simulations FOR SELECT
    USING (true);

CREATE POLICY "Simulations : création authentifiée"
    ON simulations FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Simulations : modification propre"
    ON simulations FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Simulations : suppression propre"
    ON simulations FOR DELETE
    USING (auth.uid() = user_id);

-- Politique LEADS : accès admin uniquement
CREATE POLICY "Leads : lecture admin"
    ON leads FOR SELECT
    USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Leads : création publique"
    ON leads FOR INSERT
    WITH CHECK (true);

-- Politique VOTES : création publique, lecture agrégée uniquement
CREATE POLICY "Votes : création publique"
    ON votes FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Votes : pas de lecture directe"
    ON votes FOR SELECT
    USING (false);

-- ============================================================================
-- 5. FONCTIONS UTILITAIRES
-- ============================================================================

-- Fonction pour obtenir les résultats de vote (agrégés)
CREATE OR REPLACE FUNCTION get_vote_results(sim_id UUID)
RETURNS TABLE (vote TEXT, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT v.vote, COUNT(*) as count
    FROM votes v
    WHERE v.simulation_id = sim_id
    GROUP BY v.vote;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction de nettoyage des vieilles simulations (90 jours)
CREATE OR REPLACE FUNCTION cleanup_old_simulations()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM simulations
    WHERE status = 'draft'
      AND created_at < now() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
