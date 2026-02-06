-- Ajout des colonnes manquantes pour l'import DPE 
-- (Adresse complète, Type de bâtiment, Energie, Coût estimé)

ALTER TABLE reference_dpe 
ADD COLUMN IF NOT EXISTS adresse_ban TEXT,
ADD COLUMN IF NOT EXISTS type_batiment TEXT,
ADD COLUMN IF NOT EXISTS type_energie TEXT,
ADD COLUMN IF NOT EXISTS cout_total_ttc NUMERIC;

-- Création des index pour optimiser les filtres futurs
CREATE INDEX IF NOT EXISTS idx_dpe_energie ON reference_dpe(type_energie);
CREATE INDEX IF NOT EXISTS idx_dpe_batiment ON reference_dpe(type_batiment);
