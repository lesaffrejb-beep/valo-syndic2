/**
 * Script d'import BDNB (Base de Données Nationale des Bâtiments) pour le 49
 *
 * USAGE:
 *   node scripts/data-import/import-bdnb.js
 *
 * Ce script:
 * 1. Télécharge les données BDNB pour le Maine-et-Loire
 * 2. Extrait les infos essentielles (année construction, matériaux)
 * 3. Génère un fichier JSON indexé par ID parcelle cadastrale
 *
 * Source: https://bdnb.io / CSTB
 *
 * ⚠️ À lancer en LOCAL uniquement
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const zlib = require('zlib');

// === CONFIGURATION ===

// BDNB est disponible par département sur data.gouv.fr
// Format: CSV compressé .gz
const BDNB_URL = 'https://bdnb-data.s3.fr-par.scw.cloud/bdnb_v2/49-maine-et-loire/batiment_groupe.csv.gz';

// Alternative: API BDNB (limitée)
const BDNB_API = 'https://api.bdnb.io/v2/batiment_groupe';

// Fichier de sortie
const OUTPUT_FILE = path.join(__dirname, '../../public/data/bdnb-49.json');

// Colonnes à extraire
const COLUMNS_TO_KEEP = [
    'batiment_groupe_id',       // ID unique du groupe de bâtiments
    'code_postal',              // Code postal
    'libelle_commune',          // Nom de la commune
    'annee_construction',       // Année de construction
    'mat_mur_txt',              // Matériau des murs (texte)
    'mat_toit_txt',             // Matériau du toit
    'nb_log',                   // Nombre de logements
    'hauteur_mean',             // Hauteur moyenne
    's_geom_groupe',            // Surface au sol
    'l_parcelle',               // Liste des parcelles cadastrales
    'dpe_mix_arrete_initial',   // Mix DPE initial
];

// === FONCTIONS ===

function downloadAndDecompress(url, destPath) {
    return new Promise((resolve, reject) => {
        console.log(`📥 Téléchargement BDNB depuis: ${url}`);

        const tempGz = destPath + '.gz';
        const file = fs.createWriteStream(tempGz);
        let downloadedBytes = 0;

        https.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                file.close();
                fs.unlinkSync(tempGz);
                return downloadAndDecompress(response.headers.location, destPath).then(resolve).catch(reject);
            }

            if (response.statusCode !== 200) {
                // BDNB peut ne pas être disponible en téléchargement direct
                // Dans ce cas, on génère un fichier vide avec instructions
                console.log(`\n⚠️  Les données BDNB ne sont pas disponibles en téléchargement direct.`);
                console.log(`   Tu dois les télécharger manuellement depuis:`);
                console.log(`   → https://bdnb.io/\n`);

                // Créer un fichier placeholder
                const placeholder = {
                    metadata: {
                        source: 'BDNB - CSTB',
                        url: 'https://bdnb.io/',
                        department: '49 - Maine-et-Loire',
                        generatedAt: new Date().toISOString(),
                        status: 'MANUAL_IMPORT_REQUIRED',
                        instructions: [
                            '1. Aller sur https://bdnb.io/',
                            '2. Créer un compte (gratuit)',
                            '3. Télécharger les données du Maine-et-Loire',
                            '4. Placer le fichier dans scripts/data-import/',
                            '5. Relancer ce script'
                        ]
                    },
                    data: []
                };
                fs.writeFileSync(destPath + '.json', JSON.stringify(placeholder, null, 2));
                resolve(0);
                return;
            }

            response.on('data', (chunk) => {
                downloadedBytes += chunk.length;
                process.stdout.write(`\r   ${(downloadedBytes / 1024 / 1024).toFixed(1)} Mo...`);
            });

            response.pipe(file);

            file.on('finish', () => {
                file.close();
                console.log(`\n✅ Téléchargement terminé, décompression...`);

                // Décompresser
                const gunzip = zlib.createGunzip();
                const source = fs.createReadStream(tempGz);
                const dest = fs.createWriteStream(destPath);

                source.pipe(gunzip).pipe(dest).on('finish', () => {
                    fs.unlinkSync(tempGz);
                    console.log(`✅ Décompression terminée`);
                    resolve(destPath);
                }).on('error', (err) => {
                    reject(err);
                });
            });

        }).on('error', (err) => {
            file.close();
            reject(err);
        });
    });
}

async function parseAndIndex(csvPath, outputPath) {
    return new Promise((resolve, reject) => {
        console.log(`\n🔍 Indexation des bâtiments...`);

        // Index par parcelle cadastrale pour recherche rapide
        const byParcel = {};
        // Index par code postal pour fallback
        const byPostalCode = {};

        let headers = [];
        let lineCount = 0;

        const fileStream = fs.createReadStream(csvPath, { encoding: 'utf-8' });
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        rl.on('line', (line) => {
            lineCount++;

            const values = parseCSVLine(line);

            if (lineCount === 1) {
                headers = values.map(h => h.toLowerCase().trim());
                return;
            }

            const row = {};
            headers.forEach((header, i) => {
                row[header] = values[i] || '';
            });

            // Filtrer seulement les codes postaux 49xxx
            const cp = row['code_postal'] || '';
            if (!cp.startsWith('49')) return;

            // Extraire les données utiles
            const building = {};
            COLUMNS_TO_KEEP.forEach(col => {
                const key = col.toLowerCase();
                if (row[key] !== undefined && row[key] !== '') {
                    building[col] = row[key];
                }
            });

            // Convertir les numériques
            if (building.annee_construction) {
                building.annee_construction = parseInt(building.annee_construction, 10) || null;
            }
            if (building.nb_log) {
                building.nb_log = parseInt(building.nb_log, 10) || null;
            }
            if (building.s_geom_groupe) {
                building.s_geom_groupe = parseFloat(building.s_geom_groupe) || null;
            }

            // Indexer par parcelles cadastrales
            const parcelles = (building.l_parcelle || '').split('|').filter(Boolean);
            parcelles.forEach(parcel => {
                if (!byParcel[parcel]) {
                    byParcel[parcel] = [];
                }
                byParcel[parcel].push(building);
            });

            // Indexer par code postal
            if (!byPostalCode[cp]) {
                byPostalCode[cp] = [];
            }
            byPostalCode[cp].push(building);

            if (lineCount % 5000 === 0) {
                process.stdout.write(`\r   ${lineCount} lignes traitées...`);
            }
        });

        rl.on('close', () => {
            const parcelCount = Object.keys(byParcel).length;
            const buildingCount = Object.values(byPostalCode).flat().length;

            console.log(`\n✅ Indexation terminée: ${buildingCount} bâtiments, ${parcelCount} parcelles`);

            // Sauvegarder
            const output = {
                metadata: {
                    source: 'BDNB - CSTB',
                    url: 'https://bdnb.io/',
                    department: '49 - Maine-et-Loire',
                    generatedAt: new Date().toISOString(),
                    buildingCount,
                    parcelCount,
                },
                byParcel,
                byPostalCode,
            };

            fs.writeFileSync(outputPath, JSON.stringify(output));
            const sizeKb = (fs.statSync(outputPath).size / 1024).toFixed(0);
            console.log(`\n📁 Fichier généré: ${outputPath}`);
            console.log(`   Taille: ${sizeKb} Ko`);

            resolve(buildingCount);
        });

        rl.on('error', reject);
    });
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current.trim());
    return result;
}

// === MAIN ===

async function main() {
    console.log('===========================================');
    console.log('   IMPORT BDNB - Maine-et-Loire (49)');
    console.log('===========================================\n');

    const tempFile = path.join(__dirname, 'temp-bdnb.csv');

    try {
        // Vérifier si déjà existant
        if (fs.existsSync(OUTPUT_FILE)) {
            const stats = fs.statSync(OUTPUT_FILE);
            const ageHours = (Date.now() - stats.mtime.getTime()) / 1000 / 60 / 60;
            if (ageHours < 24 * 7) { // 1 semaine
                console.log(`⚠️  Le fichier existe déjà (généré il y a ${(ageHours / 24).toFixed(1)} jours)`);
                console.log('   Pour forcer, supprime public/data/bdnb-49.json');
                return;
            }
        }

        // Télécharger
        await downloadAndDecompress(BDNB_URL, tempFile);

        // Si le fichier CSV a été créé, parser
        if (fs.existsSync(tempFile)) {
            const outputDir = path.dirname(OUTPUT_FILE);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            await parseAndIndex(tempFile, OUTPUT_FILE);

            console.log('\n✅ Import terminé avec succès!\n');
        }

    } catch (error) {
        console.error('\n❌ Erreur:', error.message);

        // Créer un fichier placeholder même en cas d'erreur
        const placeholder = {
            metadata: {
                source: 'BDNB - CSTB',
                status: 'IMPORT_FAILED',
                error: error.message,
                generatedAt: new Date().toISOString(),
            },
            byParcel: {},
            byPostalCode: {},
        };
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(placeholder, null, 2));
        console.log(`\n📁 Fichier placeholder créé: ${OUTPUT_FILE}`);

    } finally {
        if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
        }
    }
}

main();
