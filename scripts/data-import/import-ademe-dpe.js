const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const API_URL = "https://data.ademe.fr/data-fair/api/v1/datasets/dpe-france/lines?q=Angers&size=2000&format=json";
const OUTPUT_DIR = path.join(__dirname, '../../public/data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'dpe-49.json');

// Création du dossier
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log("===========================================");
console.log("   IMPORT ADEME V2026 - ANGERS             ");
console.log("===========================================");

https.get(API_URL, (res) => {
    let data = '';

    res.on('data', chunk => data += chunk);

    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            const results = json.results || json.lines || [];

            if (results.length === 0) {
                console.log("⚠️ Zéro résultat reçu.");
                return;
            }

            console.log(`✅ ${results.length} lignes brutes reçues.`);
            console.log("🔄 Transformation en format VALO-SYNDIC...");

            // MAPPING BASÉ SUR TES DÉCOUVERTES
            const cleanData = results.map(item => {
                // On essaie plusieurs champs pour l'adresse car elle n'était pas dans ta liste
                // Parfois l'API cache les champs vides
                let adresse = item.adresse_ban || item.adresse_brute || item.geo_adresse || "Adresse non fournie";
                
                // Si on a le code INSEE (Angers = 49007), on le note
                if(item.code_insee_commune_actualise === '49007') {
                     if(adresse === "Adresse non fournie") adresse = "Angers (Adresse masquée)";
                }

                return {
                    id: item.numero_dpe,                                // Ta clé trouvée
                    dpe: item.classe_consommation_energie,              // Ta clé trouvée
                    ges: item.classe_estimation_ges,                    // Ta clé trouvée
                    conso: item.consommation_energie,                   // Ta clé trouvée
                    annee: item.annee_construction,                     // Ta clé trouvée (Le Bonus !)
                    surface: item.surface_thermique_lot,                // Ta clé trouvée
                    date: item.date_etablissement_dpe,                  // Ta clé trouvée
                    adresse: adresse
                };
            });

            // On filtre pour ne garder que ceux qui ont une vraie note (A à G)
            const finalData = cleanData.filter(i => i.dpe && i.dpe.length === 1);

            fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalData, null, 2));
            console.log(`🎉 SUCCÈS ! ${finalData.length} DPE importés et nettoyés.`);
            console.log(`📁 Sauvegardé ici : ${OUTPUT_FILE}`);
            
            // Aperçu pour vérifier
            console.log("\n🔎 Aperçu du premier élément :");
            console.log(finalData[0]);

        } catch (e) {
            console.error("❌ Erreur JS :", e.message);
        }
    });
}).on("error", (err) => console.log("❌ Erreur Réseau : " + err.message));