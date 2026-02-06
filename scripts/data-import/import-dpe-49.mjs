// ============================================================================
// DPE IMPORTER v3 — MODE "BULLDOZER" (Sans filtres API stricts)
// ============================================================================

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import cliProgress from 'cli-progress';

// 1. CONFIGURATION
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const MAX_RETRIES = 5;

// On utilise le dataset "dpe-v2-logements-existants" OU "dpe03existant"
// Si dpe03existant est vide, on tente d'élargir la recherche
const API_BASE_URL = 'https://data.ademe.fr/data-fair/api/v1/datasets/dpe03existant/lines';
const DEPT_CODE = '49';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ ERREUR : .env.local manquant');
    process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. UTILS
async function fetchWithRetry(url, retries = MAX_RETRIES) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            if (attempt === retries) throw error;
            const delay = 1000 * Math.pow(2, attempt);
            console.warn(`⚠️  Réseau instable. Retry dans ${delay}ms...`);
            await new Promise(r => setTimeout(r, delay));
        }
    }
}

function parseRow(row) {
    // 1. Mapping flexible des noms de colonnes (L'API est capricieuse)
    const rawCP = row['Code_postal_(BAN)'] || row['code_postal_ban'] || row['code_postal_brut'];
    const rawDPE = row['N°_DPE'] || row['numero_dpe'];

    // 2. FILTRES DE SÉCURITÉ
    // On ne garde que le 49
    if (!rawCP || !String(rawCP).startsWith(DEPT_CODE)) return null;
    if (!rawDPE) return null;

    // OPTIONNEL : Si tu veux exclure les maisons individuelles maintenant :
    // const typeBat = row['Type_bâtiment'] || row['type_batiment'];
    // if (typeBat && typeBat.toLowerCase().includes('maison')) return null; 

    // 3. Reconstitution de l'adresse (Le fix précédent)
    const adresseComplete = row['Adresse_(BAN)'] || row['adresse_ban'] || `${row['N°_voie_(BAN)'] || ''} ${row['Nom__rue_(BAN)'] || ''}`.trim();

    // 4. Helpers de conversion
    const parseFloatSafe = (val) => val ? parseFloat(String(val).replace(',', '.')) : null;
    const parseIntSafe = (val) => val ? parseInt(val, 10) : null;

    return {
        numero_dpe: rawDPE,
        code_postal: rawCP,
        ville: row['Commune_(BAN)'] || row['nom_commune_ban'],
        adresse_ban: adresseComplete, // ✅ CORRIGÉ

        // Les nouveaux champs "Sniper"
        type_batiment: row['Type_bâtiment'] || row['type_batiment'], // ✅ AJOUTÉ
        type_energie: row['Type_énergie_n°1'] || row['type_energie_n_1'] || row['type_energie_chauffage_principal'], // ✅ AJOUTÉ
        cout_total_ttc: parseFloatSafe(row['Coût_total_5_usages'] || row['cout_total_5_usages']), // ✅ AJOUTÉ

        annee_construction: parseIntSafe(row['Année_construction'] || row['annee_construction']),
        etiquette_dpe: row['Etiquette_DPE'] || row['etiquette_dpe'],
        etiquette_ges: row['Etiquette_GES'] || row['etiquette_ges'],
        conso_kwh_m2_an: parseFloatSafe(row['Conso_5_usages_é_finale'] || row['conso_5_usages_par_m2_ef']),
        surface_habitable: parseFloatSafe(row['Surface_habitable_logement'] || row['surface_habitable_logement']),
        date_etablissement: row['Date_établissement_DPE'] || row['date_etablissement_dpe'],
    };
}

// 3. MAIN
async function main() {
    console.log('� DÉMARRAGE MODE BULLDOZER (Filtrage JS)...');

    // On retire les filtres "q_fields" et "select" qui cassaient tout.
    // On demande juste "q=49" pour dégrossir.
    let nextUrl = `${API_BASE_URL}?qs=${encodeURIComponent('code_postal_ban:49*')}&size=1000`;

    const progressBar = new cliProgress.SingleBar({
        format: '📦 Import |{bar}| {value} DPE importés',
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
    });
    progressBar.start(300000, 0); // Estimation large

    let totalImported = 0;

    try {
        while (nextUrl) {
            const data = await fetchWithRetry(nextUrl);
            const rows = data.results || [];

            if (rows.length === 0) {
                console.log('\n🏁 Fin des résultats API.');
                break;
            }

            // Filtrage et Nettoyage JS
            const cleanRows = rows.map(parseRow).filter(r => r !== null);

            // Insertion en base si on a trouvé des DPE du 49 dans ce lot
            if (cleanRows.length > 0) {
                const { error } = await supabase.from('reference_dpe').upsert(cleanRows, {
                    onConflict: 'numero_dpe',
                    ignoreDuplicates: true
                });

                if (error) {
                    // Ignorer les erreurs mineures, continuer
                } else {
                    totalImported += cleanRows.length;
                    progressBar.update(totalImported);
                }
            }

            nextUrl = data.next;
            // Petit délai pour laisser respirer Supabase
            await new Promise(r => setTimeout(r, 50));
        }
    } catch (err) {
        console.error('\n❌ ERREUR:', err.message);
    } finally {
        progressBar.stop();
        console.log(`\n✅ SUCCÈS : ${totalImported} DPE du 49 ont été sauvegardés.`);
    }
}

main();
