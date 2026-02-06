-- ============================================================================
-- VALO-SYNDIC — Script de Mise à Jour des Données Marché
-- ============================================================================
-- Ce script contient les requêtes pour mettre à jour les données marché.
-- À exécuter mensuellement via le SQL Editor de Supabase.
--
-- PROCÉDURE MENSUELLE:
-- 1. Récupérer les nouvelles données sur les sources officielles
-- 2. Modifier les valeurs ci-dessous
-- 3. Exécuter ce script dans Supabase SQL Editor
--
-- Date dernière exécution: [À REMPLIR]
-- Prochaine exécution prévue: [À REMPLIR]
-- ============================================================================

-- ============================================================================
-- 1. MISE À JOUR BT01 (Indice Bâtiment)
-- Source: https://www.insee.fr/fr/statistiques/serie/001710986
-- ============================================================================

-- TODO: Remplacer les valeurs par les données du mois courant
UPDATE market_data
SET
    value = jsonb_build_object(
        'currentValue', 133.3,           -- <-- METTRE À JOUR
        'previousYearValue', 131.5,      -- <-- METTRE À JOUR (valeur il y a 12 mois)
        'annualChangePercent', 1.37      -- <-- CALCULER: (current - previous) / previous * 100
    ),
    reference_date = '2025-11-01',       -- <-- METTRE À JOUR (format YYYY-MM-01)
    updated_at = NOW(),
    updated_by = 'manual_update'
WHERE key = 'bt01';

-- ============================================================================
-- 2. MISE À JOUR TENDANCE MARCHÉ NATIONAL
-- Source: https://www.notaires.fr/fr/immobilier-fiscalite/prix-et-tendances-de-limmobilier
-- ============================================================================

UPDATE market_data
SET
    value = jsonb_build_object(
        'threeMonths', -0.004,           -- <-- METTRE À JOUR (variation 3 mois en décimal)
        'oneYear', -0.008,               -- <-- METTRE À JOUR (variation 1 an en décimal)
        'interpretation', 'Marché stable à légèrement baissier'  -- <-- ADAPTER
    ),
    reference_date = '2025-12-08',       -- <-- METTRE À JOUR
    updated_at = NOW()
WHERE key = 'market_trend_national';

-- ============================================================================
-- 3. MISE À JOUR TENDANCE MARCHÉ IDF
-- ============================================================================

UPDATE market_data
SET
    value = jsonb_build_object(
        'threeMonths', -0.008,
        'oneYear', -0.013,
        'interpretation', 'Marché en baisse modérée'
    ),
    reference_date = '2025-12-08',
    updated_at = NOW()
WHERE key = 'market_trend_idf';

-- ============================================================================
-- 4. MISE À JOUR PART DES PASSOIRES
-- ============================================================================

UPDATE market_data
SET
    value = jsonb_build_object(
        'share2024', 0.15,               -- <-- METTRE À JOUR
        'share2023', 0.17,
        'trend', 'stable'                -- <-- 'up', 'down', ou 'stable'
    ),
    reference_date = '2025-12-08',
    updated_at = NOW()
WHERE key = 'passoires_share';

-- ============================================================================
-- 5. MISE À JOUR STATUT RÉGLEMENTAIRE MPR COPRO
-- À modifier dès vote de la Loi de Finances 2026
-- ============================================================================

-- Décommenter et exécuter quand MPR Copro est réactivée:
/*
UPDATE regulation_status
SET
    is_active = true,
    status_reason = 'Loi de Finances 2026 votée',
    effective_date = '2026-XX-XX',        -- <-- Date d'effet
    legal_reference = 'Loi n°2026-XXX',   -- <-- Référence légale
    updated_at = NOW()
WHERE regulation_name = 'mpr_copro';
*/

-- ============================================================================
-- 6. AJOUTER UNE NOUVELLE AIDE LOCALE
-- ============================================================================

-- Exemple pour ajouter une nouvelle collectivité:
/*
INSERT INTO local_aids (
    collectivity_name,
    collectivity_type,
    program_name,
    max_amount_per_lot,
    max_amount_per_copro,
    conditions,
    contact_info,
    website_url,
    is_active
) VALUES (
    'Bordeaux Métropole',
    'metropole',
    'Rénov''Energie',
    2000,
    NULL,
    'Gain énergétique ≥ 35%, DPE F/G initial',
    '05 56 XX XX XX',
    'https://www.bordeaux-metropole.fr/renovation',
    true
);
*/

-- ============================================================================
-- 7. AJOUTER/METTRE À JOUR UN PRIX DE RÉFÉRENCE
-- ============================================================================

-- Upsert pour prix de référence:
INSERT INTO price_references (city_name, department_code, price_per_sqm_apt, price_per_sqm_house, data_source, confidence_level, reference_date)
VALUES
    ('Lyon', '69', 4200, 3800, 'DVF 2024', 'high', '2024-12-01')
ON CONFLICT (city_name)
DO UPDATE SET
    price_per_sqm_apt = EXCLUDED.price_per_sqm_apt,
    price_per_sqm_house = EXCLUDED.price_per_sqm_house,
    data_source = EXCLUDED.data_source,
    reference_date = EXCLUDED.reference_date,
    updated_at = NOW();

-- ============================================================================
-- 8. VÉRIFICATION POST-UPDATE
-- ============================================================================

-- Vérifier les mises à jour:
SELECT key, value, reference_date, updated_at FROM market_data ORDER BY updated_at DESC;
SELECT * FROM regulation_status;

-- ============================================================================
-- 9. HISTORIQUE DES UPDATES (À REMPLIR MANUELLEMENT)
-- ============================================================================

/*
HISTORIQUE:
-----------
- 31/01/2026: Création initiale (données Nov 2025)
- XX/XX/XXXX: [Description de la mise à jour]
*/
